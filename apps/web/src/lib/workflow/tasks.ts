// M2-02 Workflow, SLA & Notification Studio — governed task model.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0032.
//
// Pure task-status machine, scope matching and reassignment/activation rules.
// Deterministic; reused by the server actions and (later) the /tasks workspace.
// No DB access — RLS enforces visibility; this enforces the state contract.

export const TASK_STATUSES = ["new", "assigned", "in_progress", "suspended", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TERMINAL_TASK_STATUSES: readonly TaskStatus[] = ["completed", "cancelled"];

// Allowed status transitions (BRD task lifecycle).
const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  new: ["assigned", "cancelled"],
  assigned: ["in_progress", "suspended", "cancelled"],
  in_progress: ["suspended", "completed", "cancelled"],
  suspended: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isTaskStatusTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalTaskStatus(s: TaskStatus): boolean {
  return TERMINAL_TASK_STATUSES.includes(s);
}

export type TaskScope = { branch?: string | null; sector?: string | null };
export type ManagerScope = { region?: string | null; orgScope?: string | null };

/** Manager scope covers a task when branch matches region OR sector matches org_scope. */
export function taskScopeMatch(manager: ManagerScope, task: TaskScope): boolean {
  const branchOk = !!manager.region && !!task.branch && manager.region === task.branch;
  const sectorOk = !!manager.orgScope && !!task.sector && manager.orgScope === task.sector;
  return branchOk || sectorOk;
}

export type Actor = { id: string; roles: string[] };
const MANAGER_ROLES = ["ops", "planner", "leadership", "workflow_admin"];

/** A user may manage (reassign / change status) a task if they are the assignee's
 *  manager (manager role + scope) or hold a workflow-admin role. */
export function canManageTask(actor: Actor, manager: ManagerScope, task: TaskScope): boolean {
  if (!actor.roles.some((r) => MANAGER_ROLES.includes(r))) return false;
  if (actor.roles.includes("workflow_admin")) return true;
  return taskScopeMatch(manager, task);
}

export type ReassignInput = { toAssignee: string; reason: string; currentStatus: TaskStatus };
export type ReassignDecision = { ok: boolean; why: string };

/** Reassignment requires a non-empty reason and a non-terminal task. */
export function evaluateReassign(input: ReassignInput): ReassignDecision {
  if (isTerminalTaskStatus(input.currentStatus)) {
    return { ok: false, why: `Cannot reassign a ${input.currentStatus} task.` };
  }
  if (!input.reason?.trim()) return { ok: false, why: "A reassignment reason is required." };
  if (!input.toAssignee?.trim()) return { ok: false, why: "A new assignee is required." };
  return { ok: true, why: "Reassignment permitted." };
}

/** Deactivation (active=false) is allowed on any non-terminal task with a reason;
 *  reactivation is never allowed on a terminal task. */
export function evaluateActivation(active: boolean, status: TaskStatus, reason: string): ReassignDecision {
  if (!reason?.trim()) return { ok: false, why: "An activation/deactivation reason is required." };
  if (active && isTerminalTaskStatus(status)) {
    return { ok: false, why: `Cannot reactivate a ${status} task.` };
  }
  return { ok: true, why: active ? "Activation permitted." : "Deactivation permitted." };
}
