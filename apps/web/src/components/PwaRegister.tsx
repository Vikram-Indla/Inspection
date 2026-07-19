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
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
