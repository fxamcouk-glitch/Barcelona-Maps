/* Boarding passes.
   - "On this phone": saved in this browser's storage (IndexedDB). Private, works with no signal.
   - "Shared": saved in Firestore under a collection named from a hash of the trip passcode,
     so only someone who knows the passcode can find or read them. */
import { firebaseConfig } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const $ = id => document.getElementById(id);
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/* ---------- local storage (IndexedDB) ---------- */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("bcn-trip", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("passes", { keyPath: "id" });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function localAll() {
  const db = await idb();
  return new Promise((res, rej) => { const q = db.transaction("passes").objectStore("passes").getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
async function localPut(rec) {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction("passes", "readwrite"); t.objectStore("passes").put(rec); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
async function localDel(id) {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction("passes", "readwrite"); t.objectStore("passes").delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); });
}

/* ---------- images ---------- */
/* Shrinks a photo or screenshot to fit comfortably in one database document (well under 1 MB),
   keeping the barcode sharp enough to scan. */
async function toJpegDataUrl(file, maxBytes) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let w = img.naturalWidth, h = img.naturalHeight;
    const maxSide = 2000;
    if (Math.max(w, h) > maxSide) { const k = maxSide / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
    const c = document.createElement("canvas");
    for (let attempt = 0; attempt < 6; attempt++) {
      c.width = w; c.height = h;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
      for (const qual of [0.85, 0.75, 0.65]) {
        const d = c.toDataURL("image/jpeg", qual);
        if (d.length <= maxBytes) return d;
      }
      w = Math.round(w * 0.8); h = Math.round(h * 0.8);
    }
    throw new Error("too big");
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- shared (passcode) ---------- */
let shared = null; // { fs, col, unsub }
async function sha256hex(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function openShared(code) {
  if (!firebaseConfig) throw new Error("not connected");
  const [{ initializeApp, getApps }, fs] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js")]);
  const app = getApps().find(a => a.name === "passes") || initializeApp(firebaseConfig, "passes");
  const db = fs.getFirestore(app);
  const name = "passes_" + (await sha256hex("bcn-trip:" + code.trim().toLowerCase())).slice(0, 24);
  closeShared();
  const col = fs.collection(db, name);
  const stayRef = fs.doc(db, "trip_" + name.slice(7), "stay");
  shared = { fs, col, stayRef, unsub: null, unsubStay: null, list: [], stay: null };
  shared.unsub = fs.onSnapshot(col, snap => {
    shared.list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => { console.error(err); say("Couldn't open the shared passes. Check the passcode and your signal.", true); });
  shared.unsubStay = fs.onSnapshot(stayRef, d => { shared.stay = d.exists() ? d.data() : null; renderStay(); }, err => console.error(err));
  renderLock();
}

function closeShared() { if (shared) { shared.unsub && shared.unsub(); shared.unsubStay && shared.unsubStay(); } shared = null; }

/* ---------- accommodation ---------- */
const STAY_FIELDS = [
  ["name", "Name"], ["address", "Address"], ["checkin", "Check-in"], ["checkout", "Check-out"],
  ["access", "Getting in"], ["wifi", "Wi-Fi"], ["contact", "Host contact"], ["ref", "Booking ref"], ["link", "Booking link"], ["notes", "Notes"]
];
function renderLock() {
  const open = !!shared;
  $("bp-unlock").hidden = open; $("bp-unlocked").hidden = !open;
  $("stay").hidden = !open;
  if (!open) { $("stay-view").replaceChildren(); }
}
function renderStay() {
  renderLock();
  const v = $("stay-view"); v.replaceChildren();
  const st = shared && shared.stay;
  if (!st || !STAY_FIELDS.some(([k]) => st[k])) {
    const e = document.createElement("p"); e.className = "bp-empty"; e.textContent = "No accommodation details yet. Tap Edit to add the address, check-in times and how to get in.";
    v.appendChild(e); return;
  }
  const dl = document.createElement("dl"); dl.className = "facts";
  STAY_FIELDS.forEach(([k, label]) => {
    if (!st[k]) return;
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd");
    if (k === "link" && /^https:\/\//.test(st[k])) { const a = document.createElement("a"); a.href = st[k]; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Open booking"; dd.appendChild(a); }
    else dd.textContent = st[k];
    dl.append(dt, dd);
  });
  v.appendChild(dl);
  if (st.address) {
    const links = document.createElement("div"); links.className = "links";
    const g = document.createElement("a"); g.className = "btn"; g.target = "_blank"; g.rel = "noopener"; g.textContent = "Google Maps"; g.dataset.i = "maps";
    g.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(st.address);
    links.appendChild(g);
    if (IOS) { const ap = document.createElement("a"); ap.className = "btn"; ap.target = "_blank"; ap.rel = "noopener"; ap.textContent = "Apple Maps"; ap.dataset.i = "apple"; ap.href = "https://maps.apple.com/?q=" + encodeURIComponent(st.address); links.appendChild(ap); }
    v.appendChild(links);
  }
}
function editStay(on) {
  $("stay-form").hidden = !on; $("stay-view").hidden = on; $("stay-edit").hidden = on;
  if (on) { const st = (shared && shared.stay) || {}; STAY_FIELDS.forEach(([k]) => { $("st-" + k).value = st[k] || ""; }); $("st-name").focus(); }
}
async function saveStay(e) {
  e.preventDefault();
  if (!shared) return;
  const body = {};
  STAY_FIELDS.forEach(([k]) => { const v = $("st-" + k).value.trim(); if (v) body[k] = v.slice(0, k === "notes" || k === "access" ? 1000 : 300); });
  body.updatedAt = new Date().toISOString();
  $("st-save").disabled = true; $("st-msg").textContent = "Saving…";
  try { await shared.fs.setDoc(shared.stayRef, body); editStay(false); $("st-msg").textContent = ""; }
  catch (err) { console.error(err); $("st-msg").textContent = "Couldn't save. Check your signal and try again."; }
  finally { $("st-save").disabled = false; }
}

/* ---------- travel documents (this phone only, never uploaded) ---------- */
function renderDocs() {
  const list = $("doc-list"); if (!list) return; list.replaceChildren();
  const items = LOCAL.filter(p => p.cat === "doc").sort((a, b) => (a.who || "").localeCompare(b.who || "") || (a.label || "").localeCompare(b.label || ""));
  if (!items.length) { const e = document.createElement("p"); e.className = "bp-empty"; e.textContent = "No documents saved on this phone yet."; list.appendChild(e); return; }
  items.forEach(p => {
    const row = document.createElement("div"); row.className = "bp-item";
    const th = document.createElement("button"); th.type = "button"; th.className = "bp-thumb"; th.setAttribute("aria-label", "Open " + (p.label || "document"));
    if (p.kind === "pdf") { th.textContent = "PDF"; } else { const im = document.createElement("img"); im.alt = ""; im.src = p.img; th.appendChild(im); }
    th.addEventListener("click", () => openPass({ ...p, flight: p.label }));
    const info = document.createElement("div"); info.className = "bp-info";
    const t = document.createElement("strong"); t.textContent = p.label || "Document";
    const s = document.createElement("span"); s.textContent = p.who || "";
    info.append(t, s);
    const del = document.createElement("button"); del.type = "button"; del.className = "btn-quiet"; del.textContent = "Remove"; del.dataset.i = "del";
    del.addEventListener("click", async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again"; setTimeout(() => { del.classList.remove("confirm"); del.textContent = "Remove"; }, 3000); return; }
      try { await localDel(p.id); LOCAL = await localAll(); renderDocs(); } catch (e) { $("doc-msg").textContent = "Couldn't remove it."; }
    });
    row.append(th, info, del); list.appendChild(row);
  });
}
async function saveDoc(e) {
  e.preventDefault();
  const file = $("doc-file").files[0], m = $("doc-msg");
  if (!file) { m.className = "msg err"; m.textContent = "Choose a photo or PDF first."; return; }
  const rec = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), cat: "doc",
    label: $("doc-label").value.trim().slice(0, 60) || "Passport", who: $("doc-who").value.trim().slice(0, 40), createdAt: new Date().toISOString() };
  $("doc-save").disabled = true; m.className = "msg"; m.textContent = "Saving…";
  try {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) { rec.kind = "pdf"; rec.blob = file; }
    else { rec.kind = "img"; rec.img = await toJpegDataUrl(file, 3000000); }
    await localPut(rec); LOCAL = await localAll(); renderDocs();
    $("doc-add").reset(); m.textContent = "Saved on this phone.";
  } catch (err) { console.error(err); m.className = "msg err"; m.textContent = "Couldn't save it. Try a smaller photo."; }
  finally { $("doc-save").disabled = false; }
}
function initDocs() {
  if (!$("doc-add")) return;
  $("doc-add").addEventListener("submit", saveDoc);
  renderDocs();
}

/* ---------- UI ---------- */
let LOCAL = [], where = "local";
const msg = () => $("bp-msg");
function say(t, err) { const m = msg(); m.className = "msg" + (err ? " err" : ""); m.textContent = t; }

function render() {
  const list = $("bp-list"); list.replaceChildren();
  const items = (where === "local" ? LOCAL.filter(p => p.cat !== "doc") : (shared ? shared.list : []))
    .slice().sort((a, b) => (a.when || "").localeCompare(b.when || "") || (a.who || "").localeCompare(b.who || ""));
  $("bp-shared-lock").hidden = where !== "shared" || !!shared;
  $("bp-add").hidden = where === "shared" && !shared;
  if (!items.length) {
    const e = document.createElement("p"); e.className = "bp-empty";
    e.textContent = where === "local" ? "No passes saved on this phone yet." : (shared ? "No shared passes yet." : "");
    if (e.textContent) list.appendChild(e);
    return;
  }
  items.forEach(p => {
    const row = document.createElement("div"); row.className = "bp-item";
    const th = document.createElement("button"); th.type = "button"; th.className = "bp-thumb"; th.setAttribute("aria-label", "Open " + (p.who || "pass"));
    if (p.kind === "pdf") { th.textContent = "PDF"; th.classList.add("pdf"); }
    else { const im = document.createElement("img"); im.alt = ""; im.src = p.img; th.appendChild(im); }
    th.addEventListener("click", () => openPass(p));
    const info = document.createElement("div"); info.className = "bp-info";
    const t = document.createElement("strong"); t.textContent = [p.who, p.flight].filter(Boolean).join(" · ") || "Boarding pass";
    const s = document.createElement("span"); s.textContent = [p.leg === "back" ? "Flying home" : "Flying out", p.when ? fmtDate(p.when) : ""].filter(Boolean).join(" · ");
    info.append(t, s);
    const del = document.createElement("button"); del.type = "button"; del.className = "btn-quiet"; del.textContent = "Remove"; del.dataset.i = "del";
    del.addEventListener("click", async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again"; setTimeout(() => { del.classList.remove("confirm"); del.textContent = "Remove"; }, 3000); return; }
      try {
        if (where === "local") { await localDel(p.id); LOCAL = await localAll(); render(); }
        else await shared.fs.deleteDoc(shared.fs.doc(shared.col, p.id));
      } catch (e) { say("Couldn't remove it.", true); }
    });
    row.append(th, info, del); list.appendChild(row);
  });
}
function fmtDate(d) { try { return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); } catch (_) { return d; } }

function openPass(p) {
  const v = $("bp-viewer"), body = $("bp-view-body");
  body.replaceChildren();
  if (p.kind === "pdf") {
    const blob = p.blob instanceof Blob ? p.blob : null;
    if (blob) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; a.className = "btn-main"; a.textContent = "Open the PDF"; a.dataset.i = "pdf"; body.appendChild(a); }
  } else { const im = document.createElement("img"); im.src = p.img; im.alt = "Boarding pass"; body.appendChild(im); }
  $("bp-view-title").textContent = [p.who, p.flight].filter(Boolean).join(" · ") || "Boarding pass";
  v.hidden = false; document.body.classList.add("noscroll");
  $("bp-close").focus();
}
function closePass() { $("bp-viewer").hidden = true; document.body.classList.remove("noscroll"); }

async function save(e) {
  e.preventDefault();
  const file = $("bp-file").files[0];
  if (!file) { say("Choose a screenshot or photo of the boarding pass first.", true); return; }
  const rec = {
    who: $("bp-who").value.trim().slice(0, 40),
    flight: $("bp-flight").value.trim().toUpperCase().slice(0, 12),
    when: $("bp-when").value || "",
    leg: $("bp-leg").value === "back" ? "back" : "out",
    createdAt: new Date().toISOString()
  };
  $("bp-save").disabled = true; say("Saving…");
  try {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (where === "local") {
      rec.id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
      if (isPdf) { rec.kind = "pdf"; rec.blob = file; } else { rec.kind = "img"; rec.img = await toJpegDataUrl(file, 2500000); }
      await localPut(rec); LOCAL = await localAll(); render();
    } else {
      if (isPdf) { say("For shared passes, use a screenshot rather than a PDF.", true); return; }
      rec.kind = "img"; rec.img = await toJpegDataUrl(file, 900000);
      await shared.fs.addDoc(shared.col, rec);
    }
    $("bp-add").reset(); say("Saved.");
  } catch (err) { console.error(err); say(err && err.message === "too big" ? "That image is too large. Try a screenshot instead of a photo." : "Couldn't save it. Check your signal and try again.", true); }
  finally { $("bp-save").disabled = false; }
}

function setWhere(w) {
  where = w;
  document.querySelectorAll("#bp-tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.w === w)));
  $("bp-where-note").textContent = w === "local"
    ? "Only on this phone. Nobody else can see these, and they open with no signal."
    : "Everyone with the trip passcode can see these. Open them once while you have signal.";
  say(""); render();
}

async function init() {
  if (!$("passes")) return;
  document.querySelectorAll("#bp-tabs button").forEach(b => b.addEventListener("click", () => setWhere(b.dataset.w)));
  $("bp-add").addEventListener("submit", save);
  $("bp-close").addEventListener("click", closePass);
  $("bp-viewer").addEventListener("click", e => { if (e.target === $("bp-viewer")) closePass(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("bp-viewer").hidden) closePass(); });
  $("bp-unlock").addEventListener("submit", async e => {
    e.preventDefault();
    const code = $("bp-code").value;
    if (code.trim().length < 6) { say("Use a passcode of at least 6 characters, and share it with the others privately.", true); return; }
    try { localStorage.setItem("bcn-pass-code", code); } catch (_) {}
    say("Opening…");
    try { await openShared(code); say(""); } catch (err) { say("Couldn't connect to the shared passes.", true); }
  });
  $("bp-forget").addEventListener("click", () => { try { localStorage.removeItem("bcn-pass-code"); } catch (_) {} closeShared(); $("bp-code").value = ""; renderLock(); render(); });
  $("stay-edit").addEventListener("click", () => editStay(true));
  $("st-cancel").addEventListener("click", () => editStay(false));
  $("stay-form").addEventListener("submit", saveStay);
  renderLock();
  if (!IOS) $("bp-wallet").hidden = true;
  try { LOCAL = await localAll(); } catch (e) { LOCAL = []; }
  initDocs();
  let saved = null; try { saved = localStorage.getItem("bcn-pass-code"); } catch (_) {}
  if (saved) { $("bp-code").value = saved; openShared(saved).catch(() => {}); }
  setWhere("local");
}
init();
