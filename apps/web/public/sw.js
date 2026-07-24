/* MIM Field — app-shell service worker (FND-005: field app survives offline).
   Static assets: cache-first. Navigations: network-first, fallback to cached shell.
   Data writes are NOT handled here — the IndexedDB outbox owns them (idempotent replay). */
const SHELL = "saqeel-shell-v6";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/field", "/manifest.json", "/saqeel-favicon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  // Purge every cache from a previous shell version so cache-first can never
  // resurrect stale /_next/static chunks after a deploy.
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// TASK-MVP2-M2-02 notification delivery, push channel. The push payload is
// plain JSON {title, body, event_key} — the adapter (push-webpush.ts) never
// sends anything requiring decryption beyond what pushManager already
// handles. Tapping the notification focuses an existing client or opens one.
self.addEventListener("push", (e) => {
  let data = { title: "MIM Inspection", body: "You have a new notification." };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch { /* non-JSON payload: use default */ }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/saqeel-favicon-192.png",
    badge: "/saqeel-favicon-192.png",
    data: { event_key: data.event_key ?? null },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow("/field");
    }),
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/saqeel-favicon.svg" || url.pathname === "/manifest.json") {
    e.respondWith(caches.open(SHELL).then(async (c) => (await c.match(e.request)) ?? fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (e.request.mode === "navigate") {
    // Offline support (cache the navigation, fall back to it when offline)
    // applies to the field app ONLY. Public pages (/, /login) are network-only:
    // the SW must never write them to the cache and never serve them from it,
    // or a stale public page (e.g. a pre-redesign /login) survives every code
    // change and reappears on each load. Let those navigations pass through
    // untouched so the network is always the source of truth.
    if (!url.pathname.startsWith("/field")) return;
    e.respondWith(fetch(e.request).then((r) => { caches.open(SHELL).then((c) => c.put(e.request, r.clone())); return r; })
      .catch(async () => (await caches.match(e.request)) ?? (await caches.match("/field")) ?? Response.error()));
  }
});
