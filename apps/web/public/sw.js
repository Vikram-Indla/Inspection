/* SAQEEL Web Push worker.
 *
 * The unified responsive application does not use a service worker for
 * installability, navigation, asset caching, offline shell delivery or update
 * prompts. This worker is registered only after an explicit PushOptIn action.
 * IndexedDB drafts/outbox/conflicts are owned by lib/offline.ts and are never
 * read, changed or deleted here.
 */
const LEGACY_SHELL_PREFIX = "saqeel-shell-";

self.addEventListener("install", () => {
  // A push-only worker has no shell assets to prepare and can activate at once.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Retire only obsolete PWA app-shell caches. Cache Storage is not the
  // authoritative field datastore; IndexedDB remains untouched.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(LEGACY_SHELL_PREFIX))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "MIM Inspection", body: "You have a new notification." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Non-JSON payload: retain the neutral notification copy.
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/saqeel-favicon-192.png",
    badge: "/saqeel-favicon-192.png",
    data: { event_key: data.event_key ?? null },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) return existing.focus();
      return self.clients.openWindow("/");
    }),
  );
});
