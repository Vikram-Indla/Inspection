/* MIM Field — app-shell service worker (FND-005: field app survives offline).
   Static assets: cache-first. Navigations: network-first, fallback to cached shell.
   Data writes are NOT handled here — the IndexedDB outbox owns them (idempotent replay). */
const SHELL = "mim-shell-v2";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/field", "/manifest.json", "/icon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg" || url.pathname === "/manifest.json") {
    e.respondWith(caches.open(SHELL).then(async (c) => (await c.match(e.request)) ?? fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (e.request.mode === "navigate") {
    // Offline fallback to the cached field shell applies to field routes only —
    // public pages (/, /login) must never silently render the field app.
    e.respondWith(fetch(e.request).then((r) => { caches.open(SHELL).then((c) => c.put(e.request, r.clone())); return r; })
      .catch(async () => (await caches.match(e.request))
        ?? (url.pathname.startsWith("/field") ? await caches.match("/field") : undefined)
        ?? Response.error()));
  }
});
