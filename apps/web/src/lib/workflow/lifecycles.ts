// M2-02 Workflow, SLA & Notification Studio — canonical per-object lifecycles.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0035..0043.
//
// The nine governed workflow definitions, verbatim from the MVP2 workbook state
// contract. Each is a WfPayload (config_versions.payload shape) that PASSES the
// slice-01 validator (reachable, no orphans, valid terminals, unambiguous, every
// side effect idempotency-keyed, every transition authorized). These are the
// authoritative definition content proposed through the governed
// propose → validate → maker-checker → publish path; nothing here mutates an
// operational record. Branches use distinct triggers so the graph is unambiguous.

import type { WfPayload, WfTransition, WfState, WfSideEffect } from "./validate";

const s = (key: string, opts?: { initial?: boolean; terminal?: boolean }): WfState => ({ key, ...opts });
const fx = (kind: string): WfSideEffect => ({ kind, idempotencyKey: `${kind}:{aggregateId}` });
const t = (from: string, to: string, trigger: string, actor: string, guards?: string[], effects?: string[]): WfTransition => ({
  from, to, trigger, actor, guards, fx: effects?.map(fx),
});

// 0035 Plan: Draft → Generated → Reviewed → Published → Modified → Cancelled
export const PLAN_LIFECYCLE: WfPayload = {
  object: "plan",
  states: [s("draft", { initial: true }), s("generated"), s("reviewed"), s("published"), s("modified"), s("cancelled", { terminal: true })],
  transitions: [
    t("draft", "generated", "generate", "planner", ["factories_selected"]),
    t("generated", "reviewed", "review", "planner", ["duplicates_checked", "inspector_assigned"]),
    t("reviewed", "published", "publish", "planner", ["package_resolvable"], ["create_visits", "create_ipad_packages"]),
    t("published", "modified", "modify", "planner"),
    t("modified", "published", "republish", "planner", ["package_resolvable"]),
    t("draft", "cancelled", "cancel", "planner"),
    t("generated", "cancelled", "cancel", "planner"),
    t("reviewed", "cancelled", "cancel", "planner"),
    t("published", "cancelled", "cancel", "planner"),
    t("modified", "cancelled", "cancel", "planner"),
  ],
};

// 0036 Visit/inspection: Assigned → Acknowledged → En Route → On Site → In Progress
//   → Submitted → Under Review → Approved/Returned/Cancelled/Unable to Execute
export const VISIT_LIFECYCLE: WfPayload = {
  object: "visit",
  states: [
    s("assigned", { initial: true }), s("acknowledged"), s("en_route"), s("on_site"), s("in_progress"),
    s("submitted"), s("under_review"), s("returned"),
    s("approved", { terminal: true }), s("cancelled", { terminal: true }), s("unable_to_execute", { terminal: true }),
  ],
  transitions: [
    t("assigned", "acknowledged", "acknowledge", "assigned_inspector"),
    t("acknowledged", "en_route", "depart", "assigned_inspector"),
    t("en_route", "on_site", "arrive", "assigned_inspector", ["geofence"]),
    t("on_site", "in_progress", "start", "assigned_inspector", ["check_in"]),
    t("in_progress", "submitted", "submit", "assigned_inspector", ["package", "form_complete", "signature_consent", "evidence_required"], ["notify", "sla"]),
    t("submitted", "under_review", "route_review", "supervisor", undefined, ["assign"]),
    t("under_review", "approved", "approve", "supervisor"),
    t("under_review", "returned", "return", "supervisor"),
    t("returned", "in_progress", "rework", "assigned_inspector"),
    t("assigned", "cancelled", "cancel", "supervisor"),
    t("acknowledged", "cancelled", "cancel", "supervisor"),
    t("en_route", "cancelled", "cancel", "supervisor"),
    t("on_site", "cancelled", "cancel", "supervisor"),
    t("in_progress", "cancelled", "cancel", "supervisor"),
    t("assigned", "unable_to_execute", "unable", "assigned_inspector", ["reason"]),
    t("en_route", "unable_to_execute", "unable", "assigned_inspector", ["reason"]),
    t("on_site", "unable_to_execute", "unable", "assigned_inspector", ["reason"]),
  ],
};

// 0037 Report: Draft → Submitted → QA Review → Returned → Approved → Shared → Archived
export const REPORT_LIFECYCLE: WfPayload = {
  object: "report",
  states: [s("draft", { initial: true }), s("submitted"), s("qa_review"), s("returned"), s("approved"), s("shared"), s("archived", { terminal: true })],
  transitions: [
    t("draft", "submitted", "submit", "assigned_inspector", ["report_mapping", "evidence_required"]),
    t("submitted", "qa_review", "route_qa", "supervisor"),
    t("qa_review", "returned", "return", "supervisor"),
    t("qa_review", "approved", "approve", "supervisor", ["signature_consent", "no_critical_sync_conflict"]),
    t("returned", "submitted", "resubmit", "assigned_inspector", ["report_mapping"]),
    t("approved", "shared", "share", "supervisor", ["signature_consent"]),
    t("shared", "archived", "archive", "supervisor"),
  ],
};

// 0038 Finding/violation: Candidate → Confirmed → Violation Proposed → Violation Approved
//   → Corrective Action Open → Closed/Overdue/Escalated
export const FINDING_LIFECYCLE: WfPayload = {
  object: "finding",
  states: [
    s("candidate", { initial: true }), s("confirmed"), s("violation_proposed"), s("violation_approved"),
    s("corrective_action_open"), s("overdue"), s("escalated"), s("closed", { terminal: true }),
  ],
  transitions: [
    t("candidate", "confirmed", "confirm", "supervisor", ["evidence_required"]),
    t("confirmed", "violation_proposed", "propose_violation", "supervisor", ["clause", "severity"]),
    t("violation_proposed", "violation_approved", "approve_violation", "committee", ["clause", "due_date"], ["violation"]),
    t("violation_approved", "corrective_action_open", "open_action", "supervisor"),
    t("corrective_action_open", "closed", "close", "supervisor", ["evidence_required"]),
    t("corrective_action_open", "overdue", "mark_overdue", "supervisor"),
    t("overdue", "escalated", "escalate", "supervisor", undefined, ["notify"]),
    t("escalated", "closed", "close", "supervisor", ["evidence_required"]),
  ],
};

// 0039 Self-assessment/compliance: Submitted → Compliance Review → Accepted/Rejected/Returned
//   → Correction Action → Verified → Closed
export const SELF_ASSESSMENT_LIFECYCLE: WfPayload = {
  object: "self_assessment",
  states: [
    s("submitted", { initial: true }), s("compliance_review"), s("accepted"), s("rejected"), s("returned"),
    s("correction_action"), s("verified"), s("closed", { terminal: true }),
  ],
  transitions: [
    t("submitted", "compliance_review", "review", "admin", ["eligibility", "evidence_required"]),
    t("compliance_review", "accepted", "accept", "admin"),
    t("compliance_review", "rejected", "reject", "admin"),
    t("compliance_review", "returned", "return", "admin"),
    t("returned", "correction_action", "correct", "assigned_inspector"),
    t("correction_action", "verified", "verify", "admin", ["evidence_required", "sla"]),
    t("verified", "closed", "close", "admin"),
    t("accepted", "closed", "close_accepted", "admin"),
    t("rejected", "closed", "close_rejected", "admin"),
  ],
};

// 0040 Committee/objection: Submitted → Committee Review → Accepted/Rejected/Field Visit Requested → Closed
export const COMMITTEE_LIFECYCLE: WfPayload = {
  object: "committee",
  states: [
    s("submitted", { initial: true }), s("committee_review"), s("accepted"), s("rejected"),
    s("field_visit_requested"), s("closed", { terminal: true }),
  ],
  transitions: [
    t("submitted", "committee_review", "open_review", "committee", ["objection_window", "attachments"]),
    t("committee_review", "accepted", "accept", "committee", ["quorum", "reason"]),
    t("committee_review", "rejected", "reject", "committee", ["quorum", "reason"]),
    t("committee_review", "field_visit_requested", "request_field_visit", "committee", ["quorum"], ["assign"]),
    t("accepted", "closed", "close_accepted", "committee"),
    t("rejected", "closed", "close_rejected", "committee"),
    t("field_visit_requested", "closed", "close_field", "committee"),
  ],
};

// 0041 Form: Draft → Review → Field Pilot → Approved → Published → Retired
export const FORM_LIFECYCLE: WfPayload = {
  object: "form_template",
  states: [s("draft", { initial: true }), s("review"), s("field_pilot"), s("approved"), s("published"), s("retired", { terminal: true })],
  transitions: [
    t("draft", "review", "submit_review", "admin", ["bilingual_labels", "mappings"]),
    t("review", "field_pilot", "pilot", "admin", ["no_broken_logic"]),
    t("field_pilot", "approved", "approve", "admin", ["report_mapping"]),
    t("approved", "published", "publish", "admin", undefined, ["activate_form"]),
    t("published", "retired", "retire", "admin", ["successor"]),
  ],
};

// 0042 Risk model: Draft → Simulated → Review → Approved → Scheduled → Published → Retired/Rolled Back
export const RISK_MODEL_LIFECYCLE: WfPayload = {
  object: "risk_model",
  states: [
    s("draft", { initial: true }), s("simulated"), s("review"), s("approved"), s("scheduled"), s("published"),
    s("retired", { terminal: true }), s("rolled_back", { terminal: true }),
  ],
  transitions: [
    t("draft", "simulated", "simulate", "admin", ["valid_weights", "thresholds"], ["risk"]),
    t("simulated", "review", "submit_review", "admin"),
    t("review", "approved", "approve", "admin", ["maker_checker"]),
    t("approved", "scheduled", "schedule", "admin"),
    t("scheduled", "published", "publish", "admin", undefined, ["risk", "notify"]),
    t("published", "retired", "retire", "admin", ["successor"]),
    t("published", "rolled_back", "rollback", "admin"),
  ],
};

// 0043 Offline sync: Pending → Syncing → Synced/Conflict/Failed → Manually Resolved
export const SYNC_LIFECYCLE: WfPayload = {
  object: "offline_sync",
  states: [
    s("pending", { initial: true }), s("syncing"), s("conflict"), s("failed"),
    s("synced", { terminal: true }), s("manually_resolved", { terminal: true }),
  ],
  transitions: [
    t("pending", "syncing", "start_sync", "supervisor", ["device_registered", "package_not_expired", "evidence_hash_valid"]),
    t("syncing", "synced", "complete", "supervisor"),
    t("syncing", "conflict", "conflict_detected", "supervisor"),
    t("syncing", "failed", "fail", "supervisor"),
    t("failed", "syncing", "retry", "supervisor"),
    t("conflict", "manually_resolved", "resolve", "supervisor", ["reason"]),
    t("failed", "manually_resolved", "manual_resolve", "supervisor", ["reason"]),
  ],
};

export const LIFECYCLES: Record<string, WfPayload> = {
  plan: PLAN_LIFECYCLE,
  visit: VISIT_LIFECYCLE,
  report: REPORT_LIFECYCLE,
  finding: FINDING_LIFECYCLE,
  self_assessment: SELF_ASSESSMENT_LIFECYCLE,
  committee: COMMITTEE_LIFECYCLE,
  form_template: FORM_LIFECYCLE,
  risk_model: RISK_MODEL_LIFECYCLE,
  offline_sync: SYNC_LIFECYCLE,
};

// Requirement → lifecycle mapping (0035..0043).
export const LIFECYCLE_REQUIREMENTS: Record<string, string> = {
  "MVP2-REQ-0035": "plan",
  "MVP2-REQ-0036": "visit",
  "MVP2-REQ-0037": "report",
  "MVP2-REQ-0038": "finding",
  "MVP2-REQ-0039": "self_assessment",
  "MVP2-REQ-0040": "committee",
  "MVP2-REQ-0041": "form_template",
  "MVP2-REQ-0042": "risk_model",
  "MVP2-REQ-0043": "offline_sync",
};
