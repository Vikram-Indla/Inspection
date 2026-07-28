// TASK-EXECUTION-MODULE-001 · Phase 1 shared contracts
// SAQEEL-EXE-CANONICAL-PLAN v1.0 — capability model (decision D-003).
//
// Capabilities replace new top-level roles: the existing roles stay untouched
// as compatibility aliases, and the fine-grained capability keys below are
// what guards evaluate. The catalogue and the default role mapping are seeded
// by migration `20260721093000_execution_canonical_contracts.sql`.
//
// AUTHORITATIVE ENFORCEMENT IS SERVER-SIDE ONLY: the `has_capability` RPC and
// RLS decide. This module exists purely for UI affordance (rendering or
// hiding a button). Menu visibility is never authorization.

/** The 22 seeded capability keys — keep in lockstep with the migration. */
export const EXECUTION_CAPABILITIES = [
  "execution.view_assigned",
  "execution.prepare",
  "execution.start_journey",
  "execution.arrive",
  "execution.execute",
  "execution.submit",
  "execution.return_assignment",
  "execution.cancel_prestart",
  "execution.request_active_cancel",
  "review.view",
  "review.decide",
  "review.return_scope",
  "review.approve",
  "review.reject",
  "operations.view",
  "operations.resolve_exception",
  "operations.approve_active_cancel",
  "admin.execution_workflow",
  "admin.execution_lookups",
  "admin.mode_eligibility",
  "admin.evidence_policy",
  "admin.offline_policy",
] as const;

export type ExecutionCapability = (typeof EXECUTION_CAPABILITIES)[number];

/** Canonical roles plus transitional legacy aliases. */
export type RoleKey =
  | "admin"
  | "supervisor"
  | "compliance_admin"
  | "form_admin"
  | "workflow_admin"
  | "risk_owner"
  | "gis_admin"
  | "security_admin"
  | "planner"
  | "inspector"
  | "reviewer"
  | "ops"
  | "auditor"
  | "leadership"
  | "factory_rep";

const INSPECTOR_CAPS: readonly ExecutionCapability[] = [
  "execution.view_assigned",
  "execution.prepare",
  "execution.start_journey",
  "execution.arrive",
  "execution.execute",
  "execution.submit",
  "execution.return_assignment",
  "execution.cancel_prestart",
  "execution.request_active_cancel",
];

const REVIEWER_CAPS: readonly ExecutionCapability[] = [
  "review.view",
  "review.decide",
  "review.return_scope",
  "review.approve",
  "review.reject",
];

const OPS_CAPS: readonly ExecutionCapability[] = [
  "operations.view",
  "operations.resolve_exception",
  "operations.approve_active_cancel",
  "review.view",
];

const ADMIN_CAPS: readonly ExecutionCapability[] = [
  "admin.execution_workflow",
  "admin.execution_lookups",
  "admin.mode_eligibility",
  "admin.evidence_policy",
  "admin.offline_policy",
];

const ADMIN_ROLE_KEYS: readonly RoleKey[] = [
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "risk_owner",
  "gis_admin",
  "security_admin",
];

/** Mirrors the `role_capabilities` seed in the Phase 1 migration exactly. */
const DEFAULT_ROLE_CAPABILITIES: Readonly<Record<RoleKey, readonly ExecutionCapability[]>> = {
  // Admin and supervisor intentionally receive the union of their deprecated
  // predecessors during Phase 1. Further separation can later be restored
  // with capability grants without adding another top-level role.
  admin: ADMIN_CAPS,
  supervisor: [...REVIEWER_CAPS, ...OPS_CAPS],
  inspector: INSPECTOR_CAPS,
  reviewer: REVIEWER_CAPS,
  ops: OPS_CAPS,
  planner: ["operations.view"],
  leadership: ["review.view", "operations.view"],
  auditor: ["review.view"],
  factory_rep: [],
  compliance_admin: ADMIN_CAPS,
  form_admin: ADMIN_CAPS,
  workflow_admin: ADMIN_CAPS,
  risk_owner: ADMIN_CAPS,
  gis_admin: ADMIN_CAPS,
  security_admin: ADMIN_CAPS,
};

/**
 * Union of the default seeded capabilities for the given legacy roles.
 * Unknown role keys contribute nothing (fail closed).
 */
export function defaultCapabilitiesForRoles(roles: string[]): string[] {
  const granted = new Set<string>();
  for (const role of roles) {
    const caps = DEFAULT_ROLE_CAPABILITIES[role as RoleKey];
    if (caps) for (const cap of caps) granted.add(cap);
  }
  return Array.from(granted);
}

/**
 * Pure UI-affordance check against the seeded default mapping. The server
 * (`has_capability` RPC + RLS) remains authoritative — never gate a write on
 * the result of this function.
 */
export function roleHasCapability(roles: string[], capability: string): boolean {
  return defaultCapabilitiesForRoles(roles).includes(capability);
}
