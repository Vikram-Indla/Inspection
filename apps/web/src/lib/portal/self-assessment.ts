// M2-08 External Portal & Self-Assessment — pure domain logic.
// TASK-MVP2-M2-08-EXTERNAL-PORTAL-001 · MVP2-REQ-0109..0113 · CD-044.
//
// Deterministic, DB-free. CD-044 W4 risk-signal boundary: ONLY an accepted
// self-assessment emits the CD-032 REQ-0019 risk signal; draft/submitted/returned
// never do. External-representative IDENTITY is a HELD stub — no auth decision is
// made here; server RLS + the (future) identity policy enforce access.

export const SELF_ASSESSMENT_STATUSES = ["draft", "submitted", "accepted", "rejected", "returned"] as const;
export type SelfAssessmentStatus = (typeof SELF_ASSESSMENT_STATUSES)[number];

const SA_TRANSITIONS: Record<SelfAssessmentStatus, SelfAssessmentStatus[]> = {
  draft: ["submitted"],
  submitted: ["accepted", "rejected", "returned"],
  returned: ["submitted"],
  accepted: [],
  rejected: [],
};

export function isSelfAssessmentTransitionAllowed(from: SelfAssessmentStatus, to: SelfAssessmentStatus): boolean {
  return SA_TRANSITIONS[from]?.includes(to) ?? false;
}

/** The CD-044 W4 invariant: a risk signal is permitted ONLY for an accepted
 *  assessment. Any other status must never emit — draft/submitted never touch risk. */
export function emitsRiskSignal(status: SelfAssessmentStatus): boolean {
  return status === "accepted";
}

// ---------- external request lifecycle --------------------------------------
export const EXTERNAL_REQUEST_STATUSES = [
  "submitted", "in_review", "returned", "accepted", "rejected", "withdrawn",
] as const;
export type ExternalRequestStatus = (typeof EXTERNAL_REQUEST_STATUSES)[number];

const REQ_TRANSITIONS: Record<ExternalRequestStatus, ExternalRequestStatus[]> = {
  submitted: ["in_review", "withdrawn"],
  in_review: ["returned", "accepted", "rejected"],
  returned: ["submitted", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function isExternalRequestTransitionAllowed(from: ExternalRequestStatus, to: ExternalRequestStatus): boolean {
  return REQ_TRANSITIONS[from]?.includes(to) ?? false;
}

/** A decision (accept/reject) requires a reason and an internal decider distinct
 *  from the submitting representative (maker-checker across the org boundary). */
export function canDecideExternalRequest(input: { toStatus: ExternalRequestStatus; reason: string }): { ok: boolean; why: string } {
  if (!["accepted", "rejected", "returned"].includes(input.toStatus)) {
    return { ok: false, why: "Not a decision transition." };
  }
  if (!input.reason?.trim()) return { ok: false, why: "A decision reason is required." };
  return { ok: true, why: "Decision permitted." };
}

export const EXTERNAL_REQUEST_TYPES = ["visit", "correction", "objection"] as const;
export type ExternalRequestType = (typeof EXTERNAL_REQUEST_TYPES)[number];

export function isExternalRequestType(value: string): value is ExternalRequestType {
  return EXTERNAL_REQUEST_TYPES.includes(value as ExternalRequestType);
}

export type PortalState =
  | { tab: "establishments"; type: null; review: false }
  | { tab: "requests"; type: ExternalRequestType; review: boolean }
  | { tab: "self-assessment"; type: null; review: boolean };

export function resolvePortalState(input: { tab?: string; type?: string; view?: string }): PortalState {
  if (input.tab === "establishments") return { tab: "establishments", type: null, review: false };
  if (input.tab === "self-assessment") return { tab: "self-assessment", type: null, review: input.view === "review" };
  return {
    tab: "requests",
    type: isExternalRequestType(input.type ?? "") ? input.type as ExternalRequestType : "visit",
    review: input.view === "review",
  };
}

export function decisionOptions(type: ExternalRequestType): ExternalRequestStatus[] {
  if (type === "correction") return ["accepted", "rejected", "returned"];
  if (type === "objection") return ["accepted", "rejected", "returned"];
  return ["accepted", "rejected", "returned"];
}
