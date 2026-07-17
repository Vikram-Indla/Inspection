// Cycle 2 Wave 2 — shared safety gate for every stub/simulator provider added
// in this wave (video, map, location, media, OTP/notification, factory/risk,
// offline harness). A stub must be impossible to activate accidentally in
// production: this checks NODE_ENV, never trusts the flag alone.
//
// Convention mirrored from the existing DeliveryAdapter registry pattern in
// src/lib/notify.ts (interface + register() + Map-backed lookup).

export function assertNonProduction(providerName: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${providerName}: stub/simulator providers may never run with NODE_ENV=production`);
  }
}

/**
 * Resolve a FEATURE_* selector env var to one of `allowed` values, defaulting
 * to `fallback`. Unknown values fail closed to `fallback` rather than being
 * silently accepted — a typo in an env var must never select an unintended
 * provider.
 */
export function resolveFeatureFlag<T extends string>(envVar: string | undefined, allowed: readonly T[], fallback: T): T {
  if (envVar && (allowed as readonly string[]).includes(envVar)) return envVar as T;
  return fallback;
}

/** Deterministic pseudo-random from a seed string — stubs must never use Math.random(). */
export function seededFraction(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
