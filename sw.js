/* Lets the site open with no signal (e.g. at the gate) once it has been visited.
   The site's own files: network first, falling back to the saved copy.
   Libraries and fonts: saved copy first. Map tiles: saved as you browse, capped. */
const SHELL = "bcn-shell-v13", LIBS = "bcn-libs-v2", TILES = "bcn-tiles-v2";
const FILES = ["./", "index.html", "styles.css", "app.js", "passes.js", "seed.js", "guides.js", "firebase-config.js", "manifest.webmanifest", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL, LIBS, TILES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function trimTiles() {
  const c = await caches.open(TILES); const keys = await c.keys();
  for (let i = 0; i < keys.length - 1500; i++) await c.delete(keys[i]);
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  if (url.hostname === "tile.openstreetmap.org" || url.hostname === "tiles.openfreemap.org") {
    e.respondWith(caches.open(TILES).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { c.put(req, r.clone()); trimTiles(); } return r; }))));
    return;
  }
  if (["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname) || (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"))) {
    e.respondWith(caches.open(LIBS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }))));
  }
});
