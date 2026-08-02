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

/** The four canonical, live-governed roles (public.roles). */
export type RoleKey =
  | "admin"
  | "supervisor"
  | "planner"
  | "inspector";

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

/** Mirrors the `role_capabilities` seed, collapsed onto the four live roles.
 *  Admin receives the union of every retired governance/oversight role's
 *  capabilities (compliance_admin/form_admin/workflow_admin/risk_owner/
 *  gis_admin/security_admin/auditor/leadership); supervisor receives the
 *  union of reviewer + ops, per the four-role consolidation. */
const DEFAULT_ROLE_CAPABILITIES: Readonly<Record<RoleKey, readonly ExecutionCapability[]>> = {
  admin: [...ADMIN_CAPS, "review.view", "operations.view"],
  supervisor: [...REVIEWER_CAPS, ...OPS_CAPS],
  inspector: INSPECTOR_CAPS,
  planner: ["operations.view"],
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
