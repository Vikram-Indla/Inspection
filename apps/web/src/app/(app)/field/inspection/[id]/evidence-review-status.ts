// SCR-IPAD-620 — pure, dependency-free status logic for the Evidence Review
// panel. A queued evidence op is "pending" until its OWN replay clears it; it is
// NEVER marked "failed" from the workspace-global sync state (a global failure
// can be caused by a DIFFERENT op ahead of it in the FIFO outbox, so painting
// every pending row "failed" is dishonest). A failed/offline sync instead
// surfaces once as a SEPARATE workspace-level warning while the rows stay
// pending. Free of browser/Supabase imports so the behavior is unit-testable.

export type EvidenceRowStatus = "synced" | "pending";
export type EvidenceSyncWarning = "none" | "offline" | "failed";

/** Per-row status is a function of outbox membership ONLY — independent of the
 *  workspace-global sync state. */
export function evidenceRowStatus(queued: boolean): EvidenceRowStatus {
  return queued ? "pending" : "synced";
}

/** A single workspace-level warning derived from the global sync state, shown
 *  only when something is actually pending. The rows themselves stay pending. */
export function evidenceSyncWarning(sync: string, pendingCount: number): EvidenceSyncWarning {
  if (pendingCount <= 0) return "none";
  if (sync === "offline") return "offline";
  if (sync === "failed") return "failed";
  return "none";
}

/** Counts carry synced + pending only — there is no global-derived "failed"
 *  bucket (that was the reported anti-pattern). */
export function evidenceReviewCounts(syncedCount: number, pendingCount: number): { synced: number; pending: number } {
  return { synced: syncedCount, pending: pendingCount };
}
