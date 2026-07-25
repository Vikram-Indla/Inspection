// SCR-IPAD-630 · FLD-FND-001..003 — pure, dependency-free helpers for the
// inspector-finding outbox op. Findings are written through the SAME canonical
// FIFO outbox as responses/evidence/submit (lib/offline.ts), so a finding is a
// replay-safe operation with a stable client-generated id that doubles as its
// idempotency key. Keeping these helpers free of any browser/Supabase import
// lets the ordering, idempotency and submit-gate be tested behaviorally with no
// backend (see field-inspection-findings-630.spec.ts).

/** Canonical outbox op for an inspector finding narrative on a mapped violation.
 *  `id` is a client-generated UUID == idempotency key: replay UPSERTs the
 *  `findings` row by id, so an ambiguous retry never yields a duplicate row. The
 *  finding↔violation association rides `findings.item_id` + the submission
 *  manifest — `violations.finding_id` is immutable post-insert (guard
 *  guard_violation_invalidate) and is never mutated from the client. */
export type FindingOp = {
  kind: "finding";
  id: string;
  inspection_id: string;
  item_id: string;
  severity: string;               // frozen canonical level from the violation config
  description: string;
  queued_at: string;
};

export type FindingSyncState = "saved" | "pending" | "failed" | "empty";

/** Dedupe by stable id: re-saving/retrying a finding replaces its queued op
 *  rather than appending a second one, and the fresh op takes the tail (FIFO)
 *  position — so it still precedes a later submit op. */
export function mergeFindingOp<T extends { kind: string }>(queue: T[], op: FindingOp): (T | FindingOp)[] {
  return [...queue.filter(o => !(o.kind === "finding" && (o as unknown as FindingOp).id === op.id)), op];
}

/** Idempotent replay: UPSERT the finding row by id. The same id replayed any
 *  number of times (ambiguous retry, duplicate op) collapses to ONE row whose
 *  content is the last write. */
export function applyFindingReplay(
  rows: { id: string; item_id: string; severity: string; description: string }[],
  op: FindingOp,
): { id: string; item_id: string; severity: string; description: string }[] {
  const row = { id: op.id, item_id: op.item_id, severity: op.severity, description: op.description };
  const i = rows.findIndex(r => r.id === op.id);
  if (i >= 0) { const next = rows.slice(); next[i] = row; return next; }
  return [...rows, row];
}

/** A required finding blocks submission unless its op has SYNCED (state
 *  'saved'). Empty narrative, still-queued (pending) and failed all block —
 *  the inspector cannot submit over an unpersisted finding. Returns the blocking
 *  item codes. */
export function findingSubmitBlockers(
  implied: { itemId: string; itemCode: string }[],
  state: Record<string, FindingSyncState>,
): string[] {
  return implied.filter(v => (state[v.itemId] ?? "empty") !== "saved").map(v => v.itemCode);
}

/** FIFO invariant: every finding op must precede the submit op, so persistence
 *  is replayed before submission in any queued scenario. */
export function findingsPrecedeSubmit(queue: { kind: string }[]): boolean {
  const submitIndex = queue.findIndex(o => o.kind === "submit");
  if (submitIndex < 0) return true;
  return queue.every((o, i) => o.kind !== "finding" || i < submitIndex);
}
