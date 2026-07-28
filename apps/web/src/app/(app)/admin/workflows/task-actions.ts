"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import {
  canManageTask, evaluateReassign, evaluateActivation, isTaskStatusTransitionAllowed,
  type TaskStatus,
} from "@/lib/workflow/tasks";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0032.
// Governed task-workspace actions. Feature-flagged OFF by default
// (FEATURE_TASKS_WORKSPACE=on). RLS already restricts writes to manager roles;
// these actions add the state-contract + scope + reason + audit layer.

export type TaskResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;

function taskMutationError(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  if (message.includes("WORKFLOW")) return "A reason is required. Nothing was changed.";
  if (message.includes("WORKFLOW")) return "A new assignee is required.";
  if (message.includes("WORKFLOW")) return "The task changed or that transition is no longer permitted. Reload and try again.";
  if (message.includes("WORKFLOW")) return "A completed or cancelled task cannot be reactivated.";
  if (message.includes("WORKFLOW")) return "Task not found or out of scope.";
  if (message.includes("WORKFLOW") || message.includes("WORKFLOW")) {
    return "Task change blocked — a scoped manager role is required.";
  }
  return NEUTRAL_WRITE_ERROR;
}

async function mutateTask(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  params: {
    taskId: string;
    status?: TaskStatus | null;
    assignee?: string | null;
    setAssignee?: boolean;
    active?: boolean | null;
    reason: string;
  },
): Promise<TaskResult> {
  const { error } = await sb.rpc("mutate_workflow_task", {
    p_task: params.taskId,
    p_status: params.status ?? null,
    p_assignee: params.assignee ?? null,
    p_set_assignee: params.setAssignee ?? false,
    p_active: params.active ?? null,
    p_reason: params.reason,
    p_correlation_id: crypto.randomUUID(),
  });
  if (error) {
    logProviderError("atomic workflow task mutation", error);
    return { error: taskMutationError(error) };
  }
  return { ok: true };
}

async function loadActorAndTask(taskId: string) {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const [{ data: task, error: te }, { data: profile }, { data: roles }] = await Promise.all([
    sb.from("workflow_task_assignments").select("id, task_type, task_ref, assignee, status, branch, sector, active").eq("id", taskId).maybeSingle(),
    sb.from("profiles").select("region, org_scope").eq("user_id", user.id).maybeSingle(),
    sb.from("user_roles").select("role_key").eq("user_id", user.id),
  ]);
  if (te) { logProviderError("task load", te); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!task) return { error: "Task not found or out of scope." };
  return {
    sb, user, task,
    actor: { id: user.id, roles: (roles ?? []).map((r: { role_key: string }) => r.role_key) },
    manager: { region: profile?.region ?? null, orgScope: profile?.org_scope ?? null },
  };
}

export async function reassignTask(_: TaskResult, formData: FormData): Promise<TaskResult> {
  if (resolveFeatureFlag(process.env.FEATURE_TASKS_WORKSPACE, MODES, "off") !== "on")
    return { error: "Task workspace is feature-flagged off (FEATURE_TASKS_WORKSPACE)." };
  const ctx = await loadActorAndTask(String(formData.get("task_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, task, actor, manager } = ctx;

  const toAssignee = String(formData.get("to_assignee") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!canManageTask(actor, manager, task)) return { error: "You are not authorized to reassign this task (scope/role)." };
  const decision = evaluateReassign({ toAssignee, reason, currentStatus: task.status as TaskStatus });
  if (!decision.ok) return { error: decision.why };

  return mutateTask(sb, {
    taskId: task.id,
    // Reassignment does not regress an in-progress/suspended task to assigned.
    status: null,
    assignee: toAssignee,
    setAssignee: true,
    reason,
  });
}

export async function setTaskStatus(_: TaskResult, formData: FormData): Promise<TaskResult> {
  if (resolveFeatureFlag(process.env.FEATURE_TASKS_WORKSPACE, MODES, "off") !== "on")
    return { error: "Task workspace is feature-flagged off (FEATURE_TASKS_WORKSPACE)." };
  const ctx = await loadActorAndTask(String(formData.get("task_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, task, actor, manager } = ctx;

  const to = String(formData.get("to_status") ?? "").trim() as TaskStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!canManageTask(actor, manager, task)) return { error: "You are not authorized to change this task (scope/role)." };
  if (!isTaskStatusTransitionAllowed(task.status as TaskStatus, to))
    return { error: `Illegal task transition ${task.status} → ${to}.` };
  if (!reason) return { error: "A status-change reason is required." };

  return mutateTask(sb, { taskId: task.id, status: to, reason });
}

export async function setTaskActive(_: TaskResult, formData: FormData): Promise<TaskResult> {
  if (resolveFeatureFlag(process.env.FEATURE_TASKS_WORKSPACE, MODES, "off") !== "on")
    return { error: "Task workspace is feature-flagged off (FEATURE_TASKS_WORKSPACE)." };
  const ctx = await loadActorAndTask(String(formData.get("task_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, task, actor, manager } = ctx;

  const active = String(formData.get("active") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!canManageTask(actor, manager, task)) return { error: "You are not authorized to change this task (scope/role)." };
  const decision = evaluateActivation(active, task.status as TaskStatus, reason);
  if (!decision.ok) return { error: decision.why };

  return mutateTask(sb, { taskId: task.id, active, reason });
}
