// TASK-EXECUTION-MODULE-001 · Phase 1 shared contracts
// SAQEEL-EXE-CANONICAL-PLAN v1.0 — canonical three-tier state model.
//
// Three state domains, never conflated:
//   1. Visit Status       (Planning-owned): draft → published → returned /
//                         cancelled / expired. NEVER gains 'approved'.
//   2. Inspection Status  (lifecycle): new → in_progress → returned →
//                         in_progress → approved / rejected; cancelled is
//                         terminal.
//   3. Operational State  (field execution): new → ready_for_execution →
//                         on_the_way → arrived → executing → submitted →
//                         under_review; virtual visits skip the journey pair.
//
// Backward compatibility (decision D-002): the database still stores the
// legacy values (inspections.status free text; operational_state enum values
// 'prepared' … 'submitted'). These pure projections translate stored values
// into the canonical vocabulary; no destructive rewrite ever happens. The
// migration `20260721090000_execution_canonical_contracts.sql` mirrors the
// lifecycle projection in SQL — keep both mappings in lockstep.

/** Tier 1 — Planning-owned visit status (stored enum values, canonical). */
export type CanonicalVisitStatus =
  | "draft"
  | "published"
  | "returned"
  | "cancelled"
  | "expired";

/** Tier 2 — canonical inspection lifecycle. */
export type InspectionLifecycleStatus =
  | "new"
  | "in_progress"
  | "returned"
  | "approved"
  | "rejected"
  | "cancelled";

/** Tier 3 — canonical operational state. */
export type CanonicalOperationalState =
  | "new"
  | "ready_for_execution"
  | "on_the_way"
  | "arrived"
  | "executing"
  | "submitted"
  | "under_review";

/**
 * Project the legacy free-text `inspections.status` onto the canonical
 * lifecycle. Identical to the SQL mapping in the Phase 1 migration and to
 * the `sync_inspection_lifecycle_status` trigger — unknown values fail to
 * 'new' rather than inventing a state.
 */
export function projectLifecycleStatus(storedStatus: string): InspectionLifecycleStatus {
  switch (storedStatus) {
    case "not_started":
      return "new";
    case "in_progress":
    case "submitted":
    case "under_review":
      return "in_progress";
    case "returned":
      return "returned";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    default:
      return "new";
  }
}

/**
 * Project the stored `operational_state` enum onto the canonical vocabulary.
 * D-002: the stored value 'prepared' remains the persisted Ready-for-Execution
 * marker until writers migrate to the canonical value; both names mean the
 * same state.
 */
export function projectOperationalState(stored: string): CanonicalOperationalState {
  switch (stored) {
    case "new":
      return "new";
    case "prepared":
    case "ready_for_execution":
      return "ready_for_execution";
    case "on_the_way":
      return "on_the_way";
    case "arrived":
      return "arrived";
    case "executing":
      return "executing";
    case "submitted":
      return "submitted";
    case "under_review":
      return "under_review";
    default:
      return "new";
  }
}

/**
 * Legal operational transitions per execution mode.
 *   physical: new → ready_for_execution → on_the_way → arrived → executing →
 *             submitted → under_review
 *   virtual:  new → ready_for_execution → executing → submitted →
 *             under_review (the journey pair on_the_way/arrived is skipped)
 */
export const OPERATIONAL_TRANSITIONS: Readonly<
  Record<"physical" | "virtual", Readonly<Record<CanonicalOperationalState, readonly CanonicalOperationalState[]>>>
> = {
  physical: {
    new: ["ready_for_execution"],
    ready_for_execution: ["on_the_way"],
    on_the_way: ["arrived"],
    arrived: ["executing"],
    executing: ["submitted"],
    submitted: ["under_review"],
    under_review: [],
  },
  virtual: {
    new: ["ready_for_execution"],
    ready_for_execution: ["executing"],
    on_the_way: [],
    arrived: [],
    executing: ["submitted"],
    submitted: ["under_review"],
    under_review: [],
  },
} as const;

/** Pure legality check; authorization (capabilities) is evaluated separately. */
export function canTransitionOperational(
  from: CanonicalOperationalState,
  to: CanonicalOperationalState,
  mode: "physical" | "virtual",
): boolean {
  return (OPERATIONAL_TRANSITIONS[mode][from] as readonly CanonicalOperationalState[]).includes(to);
}
