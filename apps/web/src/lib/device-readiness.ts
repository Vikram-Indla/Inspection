// Browser/device readiness for the unified responsive application.
// This module deliberately has no install, display-mode, app-shell cache or
// service-worker update state. Offline inspection business state continues to
// live in the user-scoped IndexedDB stores owned by lib/offline.ts.

export type StorageEstimateInput = { usage?: number | null; quota?: number | null };
export type StorageState = "unknown" | "ample" | "constrained";
export type StorageReadiness = {
  measured: boolean;
  state: StorageState;
  usageBytes: number | null;
  quotaBytes: number | null;
  availableBytes: number | null;
  usedRatio: number | null;
};
export type PersistState = "persisted" | "best_effort" | "unknown";
export type ConnectivityState = "online" | "offline" | "unknown";
export type DeviceReadinessSnapshot = {
  storage: StorageReadiness;
  persistence: PersistState;
  connectivity: ConnectivityState;
};

// Existing display-only storage cue. It is not a governed package limit or
// policy threshold; measured bytes remain visible alongside the cue.
export const CONSTRAINED_FLOOR_BYTES = 250 * 1024 * 1024;

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function classifyStorage(input: StorageEstimateInput | null | undefined): StorageReadiness {
  const usageBytes = finite(input?.usage);
  const quotaBytes = finite(input?.quota);
  if (quotaBytes === null || quotaBytes === 0) {
    return { measured: usageBytes !== null, state: "unknown", usageBytes, quotaBytes, availableBytes: null, usedRatio: null };
  }
  const used = usageBytes ?? 0;
  const availableBytes = Math.max(0, quotaBytes - used);
  return {
    measured: true,
    state: availableBytes < CONSTRAINED_FLOOR_BYTES ? "constrained" : "ample",
    usageBytes,
    quotaBytes,
    availableBytes,
    usedRatio: Math.min(1, used / quotaBytes),
  };
}

export function classifyPersistence(persisted: boolean | null | undefined): PersistState {
  if (persisted === true) return "persisted";
  if (persisted === false) return "best_effort";
  return "unknown";
}

export function classifyConnectivity(online: boolean | null | undefined): ConnectivityState {
  if (online === true) return "online";
  if (online === false) return "offline";
  return "unknown";
}

function hasBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

async function estimateStorage(): Promise<StorageReadiness> {
  if (hasBrowser() && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return classifyStorage({ usage: estimate.usage ?? null, quota: estimate.quota ?? null });
    } catch {
      // Fall through to an honest unknown.
    }
  }
  return classifyStorage(null);
}

async function readPersistence(): Promise<PersistState> {
  if (hasBrowser() && navigator.storage?.persisted) {
    try {
      return classifyPersistence(await navigator.storage.persisted());
    } catch {
      // Fall through to an honest unknown.
    }
  }
  return classifyPersistence(null);
}

export async function readDeviceReadiness(): Promise<DeviceReadinessSnapshot> {
  const [storage, persistence] = await Promise.all([estimateStorage(), readPersistence()]);
  return {
    storage,
    persistence,
    connectivity: classifyConnectivity(hasBrowser() ? navigator.onLine : null),
  };
}

export async function requestPersistentStorage(): Promise<PersistState> {
  if (hasBrowser() && navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      // The read-back below is the source of truth.
    }
  }
  return readPersistence();
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
