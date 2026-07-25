// SCR-IPAD — pure, dependency-free helpers for Inspector Offline Conflict &
// Recovery: stale submitted-version detection and conflict→section navigation.
// No invented policy: the "locked" set is the canonical workflow terminal/review
// states, and staleness is a plain status + submission-version-number comparison
// (the immutable submitted version is never overwritten from a stale device).
import type { Section } from "./runtime";

export type RecoveryState = "none" | "advanced" | "returned";

// Canonical states in which the SERVER inspection is no longer an open working
// copy for this device: a submission exists / is under review / is decided.
const SERVER_LOCKED = new Set(["submitted", "under_review", "approved", "rejected"]);

/** Detect that the server inspection has advanced beyond the copy this device
 *  loaded, so the device must RECOVER instead of silently overwriting:
 *   - "advanced": the server reached a locked state the device didn't start in,
 *     or a newer submission version exists than the device knew (immutable
 *     submitted-version protection).
 *   - "returned": the server returned the inspection for correction while the
 *     device still holds a pre-return copy.
 *   - "none": the device copy is still current. */
export function detectServerAdvance(
  loaded: { status: string; version: number },
  server: { status: string; version: number },
): RecoveryState {
  if (SERVER_LOCKED.has(server.status) && !SERVER_LOCKED.has(loaded.status)) return "advanced";
  if (server.version > loaded.version) return "advanced";
  if (server.status === "returned" && loaded.status !== "returned") return "returned";
  return "none";
}

/** The section key that owns an item code — for safe navigation back to the
 *  affected section from a conflict. null when the code is outside the current
 *  package scope. */
export function sectionKeyForItem(sections: Section[], itemCode: string): string | null {
  for (const s of sections) if ((s.items ?? []).includes(itemCode)) return s.key;
  return null;
}
