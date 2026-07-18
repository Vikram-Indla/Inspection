// M2-09 Executive Analytics & Operations Intelligence — exception projection.
// TASK-MVP2-M2-09-OPS-INTEL-001 · MVP2-REQ-0120, 0124 · CD-047 (exception_board_v1).
//
// Pure, DB-free read-model over EXISTING operational objects (reviews, sync,
// override requests, corrections). CD-047 mandates "no new tables" and
// "no synthetic rows": every projected exception traces to a real source item,
// and the grouped counts MUST equal the source count (group-count == source-count
// invariant). Decisions stay on the owning objects; this only groups + drills.

export type ExceptionCategory =
  | "review_overdue"
  | "sync_conflict"
  | "override_pending"
  | "correction_overdue";

export type ExceptionSource = {
  id: string;
  category: ExceptionCategory;
  branch: string | null;
  ref: string;              // owning object id (no copy of its state)
  occurredAt: string;
};

export type ExceptionGroup = {
  category: ExceptionCategory;
  count: number;
  items: ExceptionSource[];
};

/** Group source exceptions by category, newest first within a group. */
export function groupExceptions(sources: ExceptionSource[]): ExceptionGroup[] {
  const byCat = new Map<ExceptionCategory, ExceptionSource[]>();
  for (const s of sources) {
    const arr = byCat.get(s.category) ?? [];
    arr.push(s);
    byCat.set(s.category, arr);
  }
  return [...byCat.entries()].map(([category, items]) => ({
    category,
    count: items.length,
    items: [...items].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
  }));
}

/** The CD-047 W2 invariant: the sum of grouped counts equals the source count.
 *  Any drift means a synthetic or dropped row — a correctness failure. */
export function groupCountEqualsSource(sources: ExceptionSource[]): boolean {
  const groups = groupExceptions(sources);
  const grouped = groups.reduce((s, g) => s + g.count, 0);
  return grouped === sources.length;
}

/** Filter to a branch scope without inventing rows (RLS also enforces server-side). */
export function scopeToBranch(sources: ExceptionSource[], branch: string | null): ExceptionSource[] {
  if (!branch) return sources;
  return sources.filter((s) => s.branch === branch);
}
