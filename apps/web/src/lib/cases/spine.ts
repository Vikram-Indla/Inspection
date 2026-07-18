// M2-10 Correction / Reinspection / Appeal — pure case-spine logic.
// TASK-MVP2-M2-10-CASE-SPINE-001 · MVP2-REQ-0114..0119 · CD-046.
// Deterministic, DB-free. The DB unique index enforces one-open-case-per-origin;
// this mirrors the rule for client-side pre-checks and drives the lifecycle.

export const CASE_TYPES = ["correction", "reinspection", "appeal"] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_STATUSES = ["open", "in_progress", "resolved", "closed", "withdrawn"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

const CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  open: ["in_progress", "withdrawn"],
  in_progress: ["resolved", "withdrawn"],
  resolved: ["closed"],
  closed: [],
  withdrawn: [],
};

export function isCaseTransitionAllowed(from: CaseStatus, to: CaseStatus): boolean {
  return CASE_TRANSITIONS[from]?.includes(to) ?? false;
}

export const OPEN_CASE_STATUSES: readonly CaseStatus[] = ["open", "in_progress"];

/** Pre-check mirroring the DB unique index cases_one_open_per_origin: an origin
 *  object may have at most one non-terminal case. */
export function hasOpenCaseForOrigin(
  existing: Array<{ originType: string | null; originRef: string | null; status: CaseStatus }>,
  originType: string,
  originRef: string,
): boolean {
  return existing.some(
    (c) => c.originType === originType && c.originRef === originRef && OPEN_CASE_STATUSES.includes(c.status),
  );
}

/** Closing requires a reason; a case can only close from resolved. */
export function canCloseCase(status: CaseStatus, reason: string): { ok: boolean; why: string } {
  if (status !== "resolved") return { ok: false, why: "Only a resolved case can be closed." };
  if (!reason?.trim()) return { ok: false, why: "A closure reason is required." };
  return { ok: true, why: "Closure permitted." };
}
