"use client";
import { useEffect } from "react";
export default function PwaRegister() {
  useEffect(() => {
    // Dev-mode webpack chunks share a stable URL across recompiles/restarts
    // while their content changes; sw.js caches /_next/static/* cache-first,
    // so a dev-time cache poisons every reload with a stale chunk (survives
    // hard refresh — Service Worker interception is orthogonal to HTTP cache
    // busting). Registration is production-only; the offline field-app
    // contract (FND-005) only needs to hold in production.
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      return;
    }

    // A worker previously installed from a production build can still control
    // localhost during development. Remove it before it serves an obsolete
    // stable-named Next.js chunk after a restart.
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .catch(() => {});
  }, []);
  return null;
}
