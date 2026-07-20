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

  const { error, count } = await sb.from("workflow_task_assignments")
    .update({ assignee: toAssignee, reason, status: "assigned" }, { count: "exact" })
    .eq("id", task.id).eq("active", true);
  if (error) { logProviderError("task reassign", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Reassignment blocked — RLS requires a scoped manager role." };
  await sb.from("audit_events").insert({
    actor: actor.id, object_type: "workflow_task", object_id: task.id, action: "task_reassigned",
    before_state: { assignee: task.assignee, status: task.status }, after_state: { assignee: toAssignee, status: "assigned", reason },
  });
  return { ok: true };
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

  const { error, count } = await sb.from("workflow_task_assignments")
    .update({ status: to, reason: reason || null }, { count: "exact" }).eq("id", task.id);
  if (error) { logProviderError("task status", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Status change blocked — RLS requires a scoped manager role." };
  await sb.from("audit_events").insert({
    actor: actor.id, object_type: "workflow_task", object_id: task.id, action: "task_status_changed",
    before_state: { status: task.status }, after_state: { status: to, reason },
  });
  return { ok: true };
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

  const { error, count } = await sb.from("workflow_task_assignments")
    .update({ active, reason }, { count: "exact" }).eq("id", task.id);
  if (error) { logProviderError("task activation", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Activation change blocked — RLS requires a scoped manager role." };
  await sb.from("audit_events").insert({
    actor: actor.id, object_type: "workflow_task", object_id: task.id, action: active ? "task_activated" : "task_deactivated",
    before_state: { active: task.active }, after_state: { active, reason },
  });
  return { ok: true };
}
