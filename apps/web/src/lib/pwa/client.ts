// Inspector iPad PWA Shell — browser glue for service-worker lifecycle and
// device/storage readiness. All `navigator`/`caches`/`window` access lives
// here; pure verdict logic lives in ./readiness. SSR-safe: every entry point
// guards for a browser environment and fails closed to honest "unknown".
//
// Contract anchors: FND-005 (offline shell), SPC-OFF-005 (reload/restart
// preserves draft — recovery here NEVER touches IndexedDB), SCR-IPAD-610,
// MVP2-REQ-0181.

import {
  classifyDisplayMode,
  classifyPersistence,
  classifyShell,
  classifyStorage,
  classifyUpdate,
  type DisplayMode,
  type PersistState,
  type ShellState,
  type StorageReadiness,
  type UpdateState,
} from "./readiness";

const SW_URL = "/sw.js";
const SHELL_NAV = "/field"; // the cached navigation shell (see public/sw.js)
const STALE_RECOVERY_FLAG = "saqeel-pwa-stale-recovery"; // sessionStorage guard

export type DeviceReadinessSnapshot = {
  storage: StorageReadiness;
  persistence: PersistState;
  display: DisplayMode;
  shell: ShellState;
  update: UpdateState;
};

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function swSupported(): boolean {
  return hasWindow() && "serviceWorker" in navigator;
}

async function estimateStorage(): Promise<StorageReadiness> {
  if (hasWindow() && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      return classifyStorage({ usage: est.usage ?? null, quota: est.quota ?? null });
    } catch {
      /* fall through to unknown */
    }
  }
  return classifyStorage(null);
}

async function readPersistence(): Promise<PersistState> {
  if (hasWindow() && navigator.storage?.persisted) {
    try {
      return classifyPersistence(await navigator.storage.persisted());
    } catch {
      /* fall through */
    }
  }
  return classifyPersistence(null);
}

function readDisplayMode(): DisplayMode {
  if (!hasWindow()) return classifyDisplayMode(null, null);
  const displayStandalone = typeof window.matchMedia === "function"
    ? window.matchMedia("(display-mode: standalone)").matches
    : null;
  // Safari home-screen installs expose the legacy navigator.standalone flag.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone ?? null;
  return classifyDisplayMode(displayStandalone, iosStandalone);
}

async function shellCached(): Promise<boolean | null> {
  if (!hasWindow() || !("caches" in window)) return null;
  try {
    return Boolean(await caches.match(SHELL_NAV));
  } catch {
    return null;
  }
}

async function readUpdate(): Promise<UpdateState> {
  if (!swSupported()) return classifyUpdate({ supported: false, registered: false, hasWaiting: false });
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return classifyUpdate({ supported: true, registered: Boolean(reg), hasWaiting: Boolean(reg?.waiting) });
  } catch {
    return classifyUpdate({ supported: true, registered: false, hasWaiting: false });
  }
}

/** Gather a full readiness snapshot for the Device Readiness surface. */
export async function readDeviceReadiness(): Promise<DeviceReadinessSnapshot> {
  const [storage, persistence, shellPresent, update] = await Promise.all([
    estimateStorage(),
    readPersistence(),
    shellCached(),
    readUpdate(),
  ]);
  return {
    storage,
    persistence,
    display: readDisplayMode(),
    shell: classifyShell({
      supported: swSupported(),
      controlling: swSupported() && Boolean(navigator.serviceWorker.controller),
      shellCached: shellPresent,
    }),
    update,
  };
}

/**
 * Ask the browser to make our storage persistent so iPadOS is less likely to
 * evict the offline package/outbox under pressure. Returns the resulting state.
 */
export async function requestPersistentStorage(): Promise<PersistState> {
  if (hasWindow() && navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      /* ignore — read back the real state below */
    }
  }
  return readPersistence();
}

// Only a user-initiated update should reload the page. First-ever activation
// (clients.claim on install) also fires controllerchange; reloading there would
// bounce the inspector unexpectedly, so we gate the reload behind this flag.
let userTriggeredReload = false;
let controllerReloadWired = false;

function wireControllerReload(): void {
  if (controllerReloadWired || !swSupported()) return;
  controllerReloadWired = true;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!userTriggeredReload) return; // silent first install: do not reload
    window.location.reload();
  });
}

/** Tell the waiting worker to activate; the controllerchange listener reloads. */
export function activateWaitingUpdate(registration: ServiceWorkerRegistration | null): void {
  const waiting = registration?.waiting;
  if (!waiting) return;
  userTriggeredReload = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export type UpdateListener = (registration: ServiceWorkerRegistration | null) => void;

/**
 * Register the field service worker (production) and drive the controlled
 * update lifecycle. `onWaiting` fires whenever a new worker is installed and
 * waiting to take over, so the UI can offer an explicit reload. In development
 * we instead unregister any worker so stable-named dev chunks are never served
 * stale (unchanged from the prior contract). Returns a cleanup function.
 */
export function registerFieldServiceWorker(onWaiting: UpdateListener): () => void {
  if (!swSupported()) return () => {};

  if (process.env.NODE_ENV !== "production") {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .catch(() => {});
    return () => {};
  }

  wireControllerReload();
  let disposed = false;

  navigator.serviceWorker.register(SW_URL)
    .then(reg => {
      if (disposed) return;
      // A worker may already be waiting from a previous load.
      if (reg.waiting && navigator.serviceWorker.controller) onWaiting(reg);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // "installed" + an existing controller ⇒ this is an update (not the
          // first install), so the new worker is waiting for the go-ahead.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            onWaiting(reg);
          }
        });
      });
    })
    .catch(() => {});

  return () => { disposed = true; };
}

/**
 * Recover from a stale cached asset (e.g. a ChunkLoadError after a deploy where
 * the running page references a chunk the new build dropped). Clears Cache
 * Storage ONLY — never IndexedDB, so drafts/outbox survive (SPC-OFF-005) — then
 * reloads at most once per session to avoid loops. Safe no-op off-browser.
 */
export function installStaleAssetRecovery(): () => void {
  if (!hasWindow()) return () => {};

  const isChunkError = (message: string): boolean =>
    /ChunkLoadError/i.test(message) || /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message);

  const recover = async () => {
    try {
      if (sessionStorage.getItem(STALE_RECOVERY_FLAG)) return; // already tried this session
      sessionStorage.setItem(STALE_RECOVERY_FLAG, "1");
    } catch {
      /* private mode / storage blocked — still attempt a single recovery */
    }
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      // NOTE: deliberately no indexedDB.deleteDatabase — offline drafts/outbox
      // are authoritative and must survive a shell recovery (SPC-OFF-005).
    } finally {
      window.location.reload();
    }
  };

  const onError = (e: ErrorEvent) => { if (isChunkError(e.message ?? "")) void recover(); };
  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    const message = typeof reason === "string" ? reason : (reason?.message ?? reason?.name ?? "");
    if (isChunkError(String(message))) void recover();
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
