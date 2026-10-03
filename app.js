import { firebaseConfig } from "./firebase-config.js";
import { SEED } from "./seed.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
/* Our stay, from the booking map: Dreta de l'Eixample, just north of Diagonal. Nearest metro: Diagonal (L3, L5). */
const BASE = { lat: 41.3978, lng: 2.1643 };
const AREAS = [
  { id: "born", name: "El Born & Sant Pere", blurb: "About 25 minutes' walk south-east, or L4 from Verdaguer to Jaume I. Market snacks, Picasso, then dinner, all within a few minutes of each other. Best on Thursday or Friday, when the market is open late." },
  { id: "uptown", name: "Gaudí & uptown", blurb: "Right on our doorstep. Bar Mut is a few minutes' walk, Sagrada Família about 15 minutes east, and Park Güell is two stops up the L3 from Diagonal to Lesseps. Sagrada Família and Park Güell need timed tickets." },
  { id: "old", name: "La Rambla & Old Town", blurb: "About 30 minutes' walk down Passeig de Gràcia, or three stops on the L3 from Diagonal to Liceu. Go to the market in the morning." },
  { id: "montjuic", name: "Montjuïc", blurb: "A half-day on the hill to the south-west: L3 from Diagonal to Paral·lel, then the funicular up. The Olympic Stadium is a quick look; Miró and MNAC are next to it. Avoid Sunday afternoon (MNAC shuts at 3pm)." },
  { id: "added", name: "Added by the group", blurb: "New suggestions from any of us. Newest first." }
];
const FIELDS = ["name","type","area","order","note","from","hours","walk","lat","lng","pid","address","link","bookUrl","book","addedBy","createdAt","editedAt","editedBy"];

const $ = id => document.getElementById(id);
let PLACES = [], filter = "all", ME = null, store = null;

/* ---------------- map ---------------- */
const dark = matchMedia("(prefers-color-scheme: dark)");
/* On phones, one finger scrolls the page and two fingers move the map, so the map never traps scrolling. */
const TOUCH = matchMedia("(pointer: coarse)").matches;
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const map = L.map("map", { zoomControl: !TOUCH, dragging: !TOUCH, tap: false, touchZoom: true, bounceAtZoomLimits: false }).setView([41.388, 2.168], 13);
if (TOUCH) {
  const box = $("map"), hint = $("map-hint");
  let hintTimer;
  box.addEventListener("touchstart", e => {
    if (e.touches.length >= 2) { map.dragging.enable(); hint.classList.remove("show"); }
    else { map.dragging.disable(); }
  }, { passive: true });
  box.addEventListener("touchmove", e => {
    if (e.touches.length === 1 && !picking) { hint.classList.add("show"); clearTimeout(hintTimer); hintTimer = setTimeout(() => hint.classList.remove("show"), 1200); }
  }, { passive: true });
  box.addEventListener("touchend", e => { if (e.touches.length === 0) map.dragging.disable(); }, { passive: true });
}
/* "Add to your iPhone" guide: shown on iPhones that aren't already using the home-screen icon. */
const STANDALONE = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
if (IOS && !STANDALONE) {
  $("a2hs").hidden = false;
  const notSafari = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(navigator.userAgent);
  $("g-not-safari").hidden = !notSafari;
  const g = $("a2hs-guide");
  $("a2hs-btn").addEventListener("click", () => { g.hidden = false; document.body.classList.add("noscroll"); $("g-close").focus(); });
  $("g-close").addEventListener("click", () => { g.hidden = true; document.body.classList.remove("noscroll"); });
}
/* A soft, Google-style street map from OpenFreeMap (free, no key). Falls back to the
   standard OpenStreetMap tiles if the phone can't draw vector maps. */
const OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
let base;
try {
  const gl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (_) { return false; } })();
  if (!L.maplibreGL || !window.maplibregl || !gl) throw new Error("no vector maps");
  base = L.maplibreGL({ style: "https://tiles.openfreemap.org/styles/liberty", attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> ' + OSM_ATTR });
} catch (e) {
  base = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: OSM_ATTR + " contributors" });
}
base.addTo(map);

/* Pins in the style of Google / Airbnb maps: a coloured teardrop with an icon, label beside it. */
const GLYPH = {
  eat: '<svg viewBox="0 0 24 24"><path d="M7 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-1.5v6H11V2H9.5v6H9V2zm9.5 0C15 2 14 4 14 7v6h2.5v9H18.5V2z" fill="currentColor"/></svg>',
  see: '<svg viewBox="0 0 24 24"><path d="M12 2 2 7v2h20V7zM4 11v7h3v-7zm6.5 0v7h3v-7zM17 11v7h3v-7zM2 20v2h20v-2z" fill="currentColor"/></svg>',
  air: '<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill="currentColor"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z" fill="currentColor"/></svg>'
};
const icon = (cls, label, sub) => L.divIcon({ className: "", iconSize: [0, 0], html:
  `<div class="pin ${cls}"><div class="d">${GLYPH[cls] || ""}</div>${label ? `<div class="t">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>` : ""}</div>` });
L.marker([BASE.lat, BASE.lng], { icon: icon("home", "Your stay", "8 – 11 Oct"), keyboard: false, zIndexOffset: 1500 }).addTo(map).bindPopup("<b>Your stay</b>Just north of Diagonal. Nearest metro: Diagonal (L3, L5).");

/* The page's fonts and layout can settle after the map is created, so re-measure
   whenever the map's box changes size; otherwise only a sliver of streets is drawn. */
let lastW = 0;
new ResizeObserver(() => {
  const w = $("map").clientWidth; if (!w) return;
  const first = !lastW; lastW = w;
  map.invalidateSize();
  if (first && PLACES.length) fitAll();
}).observe($("map"));
window.addEventListener("load", () => { map.invalidateSize(); if (PLACES.length) fitAll(); });

const AIRPORT = [
  { name: "Airport T1", lat: 41.2887, lng: 2.0726 },
  { name: "Airport T2", lat: 41.3036, lng: 2.0790 }
];
AIRPORT.forEach(a => L.marker([a.lat, a.lng], { icon: icon("air", "✈︎ " + a.name), keyboard: false, zIndexOffset: 400 }).addTo(map).bindPopup("<b>Barcelona " + a.name.replace("Airport ", "Airport, ") + "</b>Aerobús to Plaça Catalunya, then L3 to Diagonal"));
$("air-show").addEventListener("click", () => { $("map-card").scrollIntoView({ behavior: "smooth", block: "start" }); map.fitBounds([[41.2887, 2.0726], [41.3036, 2.0790], [BASE.lat, BASE.lng]], { padding: [40, 40] }); });

const markerLayer = L.layerGroup().addTo(map);
const markers = new Map();
function drawMarkers() {
  markerLayer.clearLayers(); markers.clear();
  PLACES.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: icon(p.type === "eat" ? "eat" : "see", shortName(p)), title: p.name });
    const div = document.createElement("div");
    const b = document.createElement("b"); b.textContent = p.name;
    const sm = document.createElement("span"); sm.textContent = p.type === "eat" ? "Eat & drink" : "See";
    const go = document.createElement("button"); go.type = "button"; go.textContent = "Details"; go.dataset.i = "details";
    go.addEventListener("click", () => { map.closePopup(); focusCard(p.id); });
    div.append(b, sm, document.createElement("br"), go);
    m.bindPopup(div);
    m.addTo(markerLayer); markers.set(p.id, m);
  });
  applyFilter();
}
/* Map labels drop generic prefixes ("Mercat de", "Fundació") so nearby pins don't collide. */
function shortName(p) {
  const n = p.name.replace(/^(Mercat de (la |l')?|Fundació |Museu |Basílica de la )/i, "").replace(/ Barcelona$/i, "");
  return n.length > 20 ? n.slice(0, 18) + "…" : n;
}
function fitAll() {
  const pts = PLACES.map(p => [p.lat, p.lng]).concat([[BASE.lat, BASE.lng]]);
  if (me) pts.push([me.lat, me.lng]);
  if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
}
$("fit-btn").addEventListener("click", fitAll);

/* ---------------- live location ---------------- */
let me = null, watchId = null, meMarker = null, meCircle = null, firstFix = false;
function distM(a, b) {
  const R = 6371000, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLn = (b.lng - a.lng) * t;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/* Straight-line distance x 1.3 for real streets, at about 80 m a minute. */
const walkMin = m => Math.max(1, Math.round(m * 1.3 / 80));
const walkLabel = m => { const w = walkMin(m); return w > 60 ? (m / 1000).toFixed(1) + " km" : w + " min walk"; };
const fmtDist = m => m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1) + " km";

function startLocation() {
  if (!("geolocation" in navigator)) { showNear("This browser can't share its location."); return; }
  $("loc-label").textContent = "Finding you…";
  firstFix = false;
  watchId = navigator.geolocation.watchPosition(pos => {
    me = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
    const ll = [me.lat, me.lng];
    if (!meMarker) {
      meMarker = L.marker(ll, { icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div class="me-dot"></div>' }), zIndexOffset: 1000, keyboard: false }).addTo(map).bindPopup("You are here");
      meCircle = L.circle(ll, { radius: me.acc, color: getComputedStyle(document.documentElement).getPropertyValue("--me").trim() || "#1a73e8", weight: 1, fillOpacity: .08 }).addTo(map);
    } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(me.acc); }
    if (!firstFix) { firstFix = true; map.setView(ll, Math.max(map.getZoom(), 15)); }
    $("loc-btn").setAttribute("aria-pressed", "true"); $("loc-label").textContent = "Stop showing me";
    renderNear(); renderCards();
  }, err => {
    stopLocation();
    showNear(err.code === 1 ? (IOS ? "Location is off for this site. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using the App. Then tap the button again." : "Location is switched off for this site. Allow it in your browser's settings, then try again.") : "Couldn't find your location just now. Try again in a moment.");
  }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
}
function stopLocation() {
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = null; me = null;
  if (meMarker) { map.removeLayer(meMarker); map.removeLayer(meCircle); meMarker = meCircle = null; }
  $("loc-btn").setAttribute("aria-pressed", "false"); $("loc-label").textContent = "Show where I am";
  $("near").hidden = true; renderCards();
}
$("loc-btn").addEventListener("click", () => watchId == null ? startLocation() : stopLocation());
function showNear(text) { $("near").hidden = false; $("near-status").textContent = text; $("near-list").replaceChildren(); }
function renderNear() {
  if (!me) return;
  $("near").hidden = false;
  const far = distM(me, BASE) > 30000;
  $("near-status").textContent = far ? "You're not in Barcelona yet. Distances are from where you are now." : "Updates as you walk. Tap a name to see it.";
  const list = $("near-list"); list.replaceChildren();
  PLACES.map(p => ({ p, m: distM(me, p) })).sort((a, b) => a.m - b.m).slice(0, 6).forEach(({ p, m }) => {
    const li = document.createElement("li");
    const nm = document.createElement("button"); nm.type = "button"; nm.className = "nm"; nm.textContent = p.name;
    nm.addEventListener("click", () => focusPlace(p.id));
    const d = document.createElement("span"); d.className = "dist"; d.textContent = walkLabel(m);
    const meta = document.createElement("span"); meta.className = "meta";
    const k = document.createElement("span"); k.textContent = (p.type === "eat" ? "Eat & drink" : "See") + " · " + fmtDist(m);
    const a = document.createElement("a"); a.href = dirUrl(p, me, "walking"); a.target = "_blank"; a.rel = "noopener"; a.textContent = "Walk there";
    meta.append(k, a);
    if (IOS) { const ap = document.createElement("a"); ap.href = appleUrl(p, me, "w"); ap.target = "_blank"; ap.rel = "noopener"; ap.textContent = "Apple Maps"; meta.appendChild(ap); }
    if (p.hours) { const h = document.createElement("span"); h.textContent = p.hours; meta.appendChild(h); }
    li.append(nm, d, meta); list.appendChild(li);
  });
}

/* ---------------- links ---------------- */
const q = p => encodeURIComponent(p.address ? p.name + ", " + p.address : p.name + " Barcelona");
function mapsUrl(p) {
  if (p.pid) return `https://www.google.com/maps/search/?api=1&query=${q(p)}&query_place_id=${p.pid}`;
  if (p.link && /^https:\/\//.test(p.link)) return p.link;
  if (p.address) return `https://www.google.com/maps/search/?api=1&query=${q(p)}`;
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}
/* Apple Maps directions: dirflg w = walking, r = public transport. */
function appleUrl(p, from, flag) {
  const dest = p.address ? encodeURIComponent(p.name + ", " + p.address) : p.lat + "," + p.lng;
  return `https://maps.apple.com/?saddr=${from.lat},${from.lng}&daddr=${dest}&dirflg=${flag}`;
}
function dirUrl(p, from, mode) {
  const dest = p.pid ? q(p) + "&destination_place_id=" + p.pid : p.address ? q(p) : p.lat + "," + p.lng;
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${dest}&travelmode=${mode}`;
}

/* ---------------- cards ---------------- */
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function renderCards() {
  const root = $("areas"); root.replaceChildren();
  if (!PLACES.length) { const e = document.createElement("div"); e.className = "empty"; e.textContent = "No places yet. Add the first one below."; root.appendChild(e); return; }
  AREAS.forEach(a => {
    let items = PLACES.filter(p => (p.area || "added") === a.id);
    if (!items.length) return;
    items = a.id === "added" ? items.sort((x, y) => (y.createdAt || "").localeCompare(x.createdAt || "")) : items.sort((x, y) => (x.order || 0) - (y.order || 0));
    const sec = document.createElement("section"); sec.className = "area";
    const head = document.createElement("div"); head.className = "area-head";
    const h = document.createElement("h2"); h.textContent = a.name;
    const bl = document.createElement("p"); bl.textContent = a.blurb;
    head.append(h, bl);
    const list = document.createElement("div"); list.className = "places";
    items.forEach(p => list.appendChild(card(p)));
    sec.append(head, list); root.appendChild(sec);
  });
  applyFilter();
}
function card(p) {
  const c = document.createElement("article"); c.className = "place"; c.id = "p-" + p.id;
  const top = document.createElement("div"); top.className = "place-top";
  const h = document.createElement("h3"); h.textContent = p.name;
  const tags = document.createElement("div"); tags.className = "tags";
  const tag = (cls, t) => { const s = document.createElement("span"); s.className = "tag " + cls; s.textContent = t; tags.appendChild(s); };
  tag(p.type === "eat" ? "eat" : "see", p.type === "eat" ? "Eat & drink" : "See");
  if (p.book) tag("book", "Book ahead");
  if (me) tag("near", walkLabel(distM(me, p)) + " away");
  top.append(h, tags); c.appendChild(top);
  if (p.note) { const n = document.createElement("p"); n.className = "note"; n.textContent = p.note; c.appendChild(n); }
  const dl = document.createElement("dl"); dl.className = "facts";
  const fact = (k, v) => { if (!v) return; const dt = document.createElement("dt"); dt.textContent = k; const dd = document.createElement("dd"); dd.textContent = v; dl.append(dt, dd); };
  fact("Address", p.address); fact("Open", p.hours); fact("From our stay", walkLabel(distM(BASE, p))); fact("Tip from", p.from); fact("Added by", p.addedBy);
  if (dl.children.length) c.appendChild(dl);
  const links = document.createElement("div"); links.className = "links";
  const a = (t, href, cls, ic) => { const x = document.createElement("a"); x.className = "btn " + (cls || ""); if (ic) x.dataset.i = ic; x.href = href; x.target = "_blank"; x.rel = "noopener"; x.textContent = t; links.appendChild(x); };
  a("Google Maps", mapsUrl(p), "primary", "maps");
  a("Directions from our stay", dirUrl(p, BASE, "transit"), "", "dir");
  if (IOS) a("Apple Maps", appleUrl(p, BASE, "r"), "", "apple");
  if (p.bookUrl) a("Book", p.bookUrl, "bookbtn", "book");
  const show = document.createElement("button"); show.type = "button"; show.className = "btn-quiet"; show.textContent = "Show on map"; show.dataset.i = "show";
  show.addEventListener("click", () => focusPlace(p.id, true)); links.appendChild(show);
  if (store) {
    const ed = document.createElement("button"); ed.type = "button"; ed.className = "btn-quiet"; ed.textContent = "Edit"; ed.dataset.i = "edit";
    ed.addEventListener("click", () => startEdit(p.id)); links.appendChild(ed);
    const del = document.createElement("button"); del.type = "button"; del.className = "btn-quiet"; del.textContent = "Remove"; del.dataset.i = "del";
    del.addEventListener("click", async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again to remove"; setTimeout(() => { del.classList.remove("confirm"); del.textContent = "Remove"; }, 3000); return; }
      del.disabled = true;
      try { await store.remove(p.id); } catch (e) { del.disabled = false; del.textContent = "Couldn't remove"; }
    });
    links.appendChild(del);
  }
  c.appendChild(links);
  return c;
}
function focusCard(id) {
  const c = $("p-" + id); if (!c) return;
  if (c.hidden) setFilter("all");
  c.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  c.classList.add("flash"); setTimeout(() => c.classList.remove("flash"), 1400);
}
function focusPlace(id, toMap) {
  const m = markers.get(id); if (!m) return;
  if (toMap) $("map-card").scrollIntoView({ behavior: "smooth", block: "start" });
  map.setView(m.getLatLng(), Math.max(map.getZoom(), 16)); m.openPopup();
  if (!toMap) $("map-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- filters ---------------- */
function setFilter(f) { filter = f; document.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === f))); applyFilter(); }
function applyFilter() {
  const show = p => filter === "all" || (filter === "book" ? !!p.book : p.type === filter);
  PLACES.forEach(p => {
    const c = $("p-" + p.id); if (c) c.hidden = !show(p);
    const m = markers.get(p.id); if (m) { const el = m.getElement(); el && el.firstElementChild && el.firstElementChild.classList.toggle("dim", !show(p)); }
  });
  document.querySelectorAll("section.area").forEach(s => { s.hidden = !s.querySelector(".place:not([hidden])"); });
}
document.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => setFilter(b.dataset.f)));

/* ---------------- add / edit ---------------- */
let draft = null, draftMarker = null, draftType = "see", editingId = null, picking = false, pinEdited = false, lastPaste = "";
const msg = $("a-msg"), locEl = $("a-loc");
try { $("a-who").value = localStorage.getItem("bcn-who") || ""; } catch (_) {}
$("a-who").addEventListener("change", () => { try { localStorage.setItem("bcn-who", $("a-who").value.trim()); } catch (_) {} });

function say(t, err) { msg.className = "msg" + (err ? " err" : ""); msg.textContent = t; }
function setType(t) { draftType = t; document.querySelectorAll(".seg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.t === t))); }
document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => setType(b.dataset.t)));

function setDraft(lat, lng, text, pan) {
  draft = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
  if (!draftMarker) {
    draftMarker = L.marker([draft.lat, draft.lng], { icon: icon("draft", ""), draggable: true, zIndexOffset: 900 }).addTo(map);
    draftMarker.on("dragend", () => { const ll = draftMarker.getLatLng(); draft = { lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) }; pinEdited = true; locEl.textContent = "Pin moved."; });
  } else draftMarker.setLatLng([draft.lat, draft.lng]);
  locEl.textContent = text + " You can drag the pin to adjust it."; locEl.classList.add("set");
  if (pan) map.setView([draft.lat, draft.lng], Math.max(map.getZoom(), 16));
}
function clearDraft() { draft = null; if (draftMarker) { map.removeLayer(draftMarker); draftMarker = null; } locEl.textContent = "No pin yet."; locEl.classList.remove("set"); }

function setPicking(on) {
  picking = on; $("map-card").classList.toggle("picking", on); $("pick-banner").hidden = !on;
  $("a-pick").textContent = on ? "Cancel" : "Or tap the map";
  if (on) $("map-card").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("a-pick").addEventListener("click", () => setPicking(!picking));
map.on("click", e => {
  if (!picking) return;
  setDraft(e.latlng.lat, e.latlng.lng, "Pin placed.", false); pinEdited = true; setPicking(false);
  $("add").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* Address search with OpenStreetMap's Nominatim, kept to the Barcelona area. */
async function geocode(text) {
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.search = new URLSearchParams({ format: "jsonv2", limit: "1", q: text, viewbox: "1.95,41.55,2.35,41.25", bounded: "1", "accept-language": "en" });
  const r = await fetch(u, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("lookup failed");
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon, label: j[0].display_name } : null;
}
async function findAddress() {
  const addr = $("a-addr").value.trim(), name = $("a-name").value.trim();
  if (!addr && !name) { say("Type a name or address first.", true); $("a-addr").focus(); return false; }
  $("a-find").disabled = true; say("Finding it…");
  try {
    const tries = [addr && name ? name + ", " + addr : null, addr || null, name ? name + ", Barcelona" : null].filter(Boolean);
    let hit = null;
    for (const t of tries) { hit = await geocode(t); if (hit) break; }
    if (!hit) { say("Couldn't find that address. Check it, or tap the map instead.", true); return false; }
    setDraft(hit.lat, hit.lng, "Found: " + hit.label.split(",").slice(0, 3).join(",") + ".", true);
    pinEdited = false; say("Found it.");
    return true;
  } catch (e) { say("Couldn't look that up just now. Tap the map instead.", true); return false; }
  finally { $("a-find").disabled = false; }
}
$("a-find").addEventListener("click", findAddress);

/* Pasting from Google Maps: a long link carries the name and exact spot; the phone's
   Share text usually carries the name and address, then a short link. */
function coordsFromLink(u) {
  const m = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || u.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}
function nameFromLink(u) {
  const m = u.match(/\/maps\/place\/([^/@?]+)/) || u.match(/[?&](?:q|query)=([^&]+)/);
  if (!m) return "";
  let n = m[1].replace(/\+/g, " ");
  try { n = decodeURIComponent(n); } catch (_) {}
  n = n.split(",")[0].trim();
  return /^-?\d+\.\d+$/.test(n) ? "" : n;
}
function parsePasted(raw) {
  const text = raw.replace(/\r/g, "").trim();
  const urlM = text.match(/https?:\/\/\S+/);
  const url = urlM ? urlM[0].replace(/[).,]+$/, "") : "";
  const rest = (urlM ? text.replace(urlM[0], "") : text).split(/\n| · /).map(x => x.replace(/^["'“”]+|["'“”]+$/g, "").trim()).filter(Boolean);
  let name = url ? nameFromLink(url) : "", address = "";
  if (rest.length) { if (!name) name = rest[0]; address = rest.slice(rest[0] === name ? 1 : 0).join(", "); }
  return { url, name, address, coords: url ? coordsFromLink(url) : null };
}
function handlePaste() {
  const raw = $("a-paste").value.trim(); if (!raw || raw === lastPaste) return;
  const r = parsePasted(raw);
  if (r.url && r.url !== raw) $("a-paste").value = r.url;
  lastPaste = $("a-paste").value.trim();
  const filled = [];
  if (r.name && !$("a-name").value.trim()) { $("a-name").value = r.name; filled.push("name"); }
  if (r.address && !$("a-addr").value.trim()) { $("a-addr").value = r.address; filled.push("address"); }
  if (r.coords) { setDraft(r.coords[0], r.coords[1], "Pinned from the link.", true); pinEdited = true; say(filled.length ? "Filled in the " + filled.join(" and ") + " and pinned it." : "Pinned from the link."); }
  else if (filled.length && !(editingId && draft)) { say("Filled in the " + filled.join(" and ") + ". Finding it on the map…"); findAddress(); }
  else if (/goo\.gl/.test(r.url) && !$("a-name").value.trim()) say("That's just the link. Type the place's name or address and the pin will follow.");
}
let pasteTimer;
$("a-paste").addEventListener("paste", () => setTimeout(handlePaste, 0));
$("a-paste").addEventListener("input", () => { clearTimeout(pasteTimer); pasteTimer = setTimeout(handlePaste, 600); });

function resetForm() {
  $("add-form").reset(); try { $("a-who").value = localStorage.getItem("bcn-who") || ""; } catch (_) {}
  clearDraft(); editingId = null; pinEdited = false; lastPaste = ""; setType("see"); setPicking(false);
  $("add-h").textContent = "Add a place";
  $("add-hint").textContent = "Paste from Google Maps, or type a name and address. It goes on the map for everyone straight away.";
  $("a-save").textContent = "Add to the map"; $("a-cancel").hidden = true;
}
function startEdit(id) {
  const p = PLACES.find(x => x.id === id); if (!p) return;
  resetForm(); editingId = id;
  $("a-name").value = p.name || ""; $("a-note").value = p.note || ""; $("a-addr").value = p.address || "";
  $("a-from").value = p.from || ""; $("a-paste").value = p.link || ""; lastPaste = (p.link || "").trim();
  setType(p.type === "eat" ? "eat" : "see");
  setDraft(p.lat, p.lng, "Current pin.", false);
  $("add-h").textContent = "Edit " + p.name;
  $("add-hint").textContent = "Change anything, then save. Everyone sees the update straight away.";
  $("a-save").textContent = "Save changes"; $("a-cancel").hidden = false; say("");
  $("add").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("a-cancel").addEventListener("click", () => { resetForm(); say(""); });

$("add-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!store) { say("The shared list isn't connected yet.", true); return; }
  const v = id => $(id).value.trim();
  const name = v("a-name"), address = v("a-addr"), who = v("a-who");
  if (!name) { say("Give the place a name.", true); $("a-name").focus(); return; }
  const before = editingId ? PLACES.find(x => x.id === editingId) : null;
  const addrChanged = address && (!before || (before.address || "") !== address);
  if ((!draft || (addrChanged && !pinEdited)) && (address || !draft)) { const ok = await findAddress(); if (!ok && !draft) return; }
  if (!draft) { say("Add an address or tap the map to place the pin.", true); return; }
  try { localStorage.setItem("bcn-who", who); } catch (_) {}
  const link = v("a-paste");
  const body = { name, type: draftType, lat: draft.lat, lng: draft.lng, note: v("a-note"), from: v("a-from"), address, link: /^https:\/\//.test(link) ? link : "" };
  $("a-save").disabled = true; say(editingId ? "Saving…" : "Adding…");
  try {
    if (editingId) {
      if (before && (addrChanged || before.lat !== draft.lat || before.lng !== draft.lng)) body.pid = "";
      body.editedAt = new Date().toISOString(); if (who) body.editedBy = who;
      const id = editingId;
      await store.update(id, body);
      resetForm(); say("Saved."); setTimeout(() => focusCard(id), 300);
    } else {
      Object.assign(body, { area: "added", createdAt: new Date().toISOString() });
      if (who) body.addedBy = who;
      await store.add(body);
      resetForm(); say("Added. It's on the map.");
    }
  } catch (err) { console.error(err); say("Couldn't save just now. Check your connection and try again.", true); }
  finally { $("a-save").disabled = false; }
});

/* ---------------- data ---------------- */
function setPlaces(list) {
  PLACES = list.filter(p => typeof p.lat === "number" && typeof p.lng === "number" && p.name);
  drawMarkers(); renderCards(); renderNear();
}
async function connect() {
  if (!firebaseConfig) {
    $("setup").hidden = false;
    setPlaces(SEED.map(p => ({ ...p })));
    $("add").hidden = true; fitAll(); return;
  }
  const [{ initializeApp }, fs] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js")]);
  const db = fs.getFirestore(initializeApp(firebaseConfig));
  const col = fs.collection(db, "places");
  /* Empty strings mean "clear this field": they're left out on create and deleted on update. */
  const clean = (o, forUpdate) => { const out = {}; for (const k of FIELDS) if (k in o) { if (o[k] === "" || o[k] == null) { if (forUpdate) out[k] = fs.deleteField(); } else out[k] = o[k]; } return out; };
  store = {
    add: body => fs.addDoc(col, clean(body, false)),
    update: (id, body) => fs.updateDoc(fs.doc(col, id), clean(body, true)),
    remove: id => fs.deleteDoc(fs.doc(col, id))
  };
  let fitted = false, seeded = false;
  fs.onSnapshot(col, async snap => {
    if (snap.empty && !snap.metadata.fromCache && !seeded) {
      seeded = true;
      const b = fs.writeBatch(db);
      SEED.forEach(p => { const { id, ...rest } = p; b.set(fs.doc(col, id), clean(rest, false)); });
      try { await b.commit(); } catch (e) { console.error("Seeding failed", e); }
      return;
    }
    setPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    if (!fitted && PLACES.length) { fitted = true; fitAll(); }
  }, err => {
    console.error(err);
    const e = document.createElement("div"); e.className = "empty";
    e.textContent = "Couldn't load the shared list. Check the database rules in Firebase, then reload.";
    $("areas").replaceChildren(e);
  });
}
connect();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(e => console.warn("Offline support unavailable", e));

/* Top menu: highlight the section you're looking at, and keep that button in view. */
(() => {
  const btns = [...document.querySelectorAll(".nav-btn")];
  const secs = btns.map(b => document.getElementById(b.dataset.sec)).filter(Boolean);
  let current = null;
  const setCurrent = id => {
    if (id === current) return; current = id;
    btns.forEach(b => { const on = b.dataset.sec === id; b.setAttribute("aria-current", on ? "true" : "false");
      if (on) { const row = b.parentElement, l = b.offsetLeft - 16, r = b.offsetLeft + b.offsetWidth - row.clientWidth + 36;
        if (row.scrollLeft > l) row.scrollTo({ left: l, behavior: "smooth" }); else if (row.scrollLeft < r) row.scrollTo({ left: r, behavior: "smooth" }); } });
  };
  const pick = () => {
    const line = (document.getElementById("topnav")?.offsetHeight || 60) + 24;
    let best = null;
    for (const s of secs) { if (s.hidden || !s.offsetParent) continue; if (s.getBoundingClientRect().top <= line) best = s.id; }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) best = secs[secs.length - 1].id;
    setCurrent(best);
  };
  let raf; addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); }, { passive: true });
  addEventListener("resize", pick); setTimeout(pick, 300);
})();

