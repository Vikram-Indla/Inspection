// Inspector iPad PWA Shell — device/storage readiness classification (pure).
//
// Contract anchors: SCR-IPAD-610 (Inspector Startup Pack negative state
// "storage low"), SPC-OFF-002 (user can see what is available offline),
// MVP2-REQ-0181 (readiness must tell the inspector the exact fix before field
// travel), FND-005 (field app survives offline).
//
// This module is intentionally framework-free and side-effect-free: every
// function takes already-measured inputs and returns a verdict, so the browser
// glue (client.ts) owns all `navigator`/`caches` access and this file stays
// unit-testable. Zero-assumption rendering (CLAUDE.md): when a measurement is
// missing we return an honest "unknown" — never a fabricated default.

/** Raw StorageManager.estimate() shape, tolerant of partial/absent support. */
export type StorageEstimateInput = { usage?: number | null; quota?: number | null };

export type StorageState = "unknown" | "ample" | "constrained";

export type StorageReadiness = {
  /** false when the browser did not report a usable estimate at all. */
  measured: boolean;
  state: StorageState;
  usageBytes: number | null;
  quotaBytes: number | null;
  availableBytes: number | null;
  /** usage / quota in [0,1], or null when not computable. */
  usedRatio: number | null;
};

// Display heuristic ONLY — not a governed policy value. The product contract
// does not fix a numeric "storage low" threshold, so this is a UI cue for the
// readiness readout; the exact measured bytes are always rendered alongside it
// so the inspector sees ground truth regardless of where this line sits. A
// single boundary (rather than a policy-looking multi-tier scale) keeps the
// invented surface minimal and easy to revise if a governed value is defined.
export const CONSTRAINED_FLOOR_BYTES = 250 * 1024 * 1024; // 250 MB free

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Classify a StorageManager estimate into an honest readiness verdict.
 * Returns state "unknown" whenever the browser gave us nothing usable.
 */
export function classifyStorage(input: StorageEstimateInput | null | undefined): StorageReadiness {
  const usageBytes = finite(input?.usage);
  const quotaBytes = finite(input?.quota);

  if (quotaBytes === null || quotaBytes === 0) {
    // No quota → cannot say anything truthful about headroom.
    return { measured: usageBytes !== null, state: "unknown", usageBytes, quotaBytes, availableBytes: null, usedRatio: null };
  }

  const used = usageBytes ?? 0;
  const availableBytes = Math.max(0, quotaBytes - used);
  const usedRatio = Math.min(1, used / quotaBytes);
  const state: StorageState = availableBytes < CONSTRAINED_FLOOR_BYTES ? "constrained" : "ample";
  return { measured: true, state, usageBytes, quotaBytes, availableBytes, usedRatio };
}

export type PersistState = "persisted" | "best_effort" | "unknown";

/** Map navigator.storage.persisted() result (or absence) to an honest state. */
export function classifyPersistence(persisted: boolean | null | undefined): PersistState {
  if (persisted === true) return "persisted";
  if (persisted === false) return "best_effort";
  return "unknown";
}

export type DisplayMode = "standalone" | "browser" | "unknown";

/**
 * Resolve the installed presentation. `displayStandalone` is the result of
 * matchMedia("(display-mode: standalone)"); `iosStandalone` is the legacy
 * navigator.standalone flag Safari exposes for home-screen installs.
 */
export function classifyDisplayMode(
  displayStandalone: boolean | null | undefined,
  iosStandalone: boolean | null | undefined,
): DisplayMode {
  if (displayStandalone === true || iosStandalone === true) return "standalone";
  if (displayStandalone === false && (iosStandalone === false || iosStandalone == null)) return "browser";
  return "unknown";
}

export type UpdateState = "current" | "update_ready" | "unregistered" | "unsupported";

/**
 * Derive the update-lifecycle state from booleans the registration exposes.
 * `supported` = serviceWorker in navigator; `registered` = a registration
 * exists; `hasWaiting` = a new worker is installed and waiting to take over.
 */
export function classifyUpdate(input: {
  supported: boolean;
  registered: boolean;
  hasWaiting: boolean;
}): UpdateState {
  if (!input.supported) return "unsupported";
  if (!input.registered) return "unregistered";
  return input.hasWaiting ? "update_ready" : "current";
}

export type ShellState = "ready" | "not_cached" | "no_controller" | "unsupported";

/**
 * Offline app-shell readiness (FND-005). `controlling` = a service worker
 * currently controls this page; `shellCached` = the /field navigation shell is
 * present in Cache Storage. Both true ⇒ a cold start can render offline.
 */
export function classifyShell(input: {
  supported: boolean;
  controlling: boolean;
  shellCached: boolean | null;
}): ShellState {
  if (!input.supported) return "unsupported";
  if (!input.controlling) return "no_controller";
  if (input.shellCached === false) return "not_cached";
  return "ready";
}

/** Human-facing byte formatting kept pure for deterministic tests. */
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
