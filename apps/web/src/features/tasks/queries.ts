import { getUserRoles } from "@/lib/persona";
import type { supabaseServer } from "@/lib/supabase-server";
import { canManageTask, type TaskStatus } from "@/lib/workflow/tasks";
import type { TaskRowData } from "./types";

type Client = Awaited<ReturnType<typeof supabaseServer>>;

export type TaskBoardRead = {
  tasks: readonly TaskRowData[];
  error: boolean;
};

export async function loadTaskBoard(sb: Client): Promise<TaskBoardRead> {
  const { data: { user } } = await sb.auth.getUser();
  const [{ data: rows, error }, { data: profile }, { data: roles }] = await Promise.all([
    sb.from("workflow_task_assignments")
      .select("id, task_type, task_ref, assignee, status, branch, sector, active")
      .order("created_at", { ascending: false }),
    user
      ? sb.from("profiles").select("region, org_scope").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user ? getUserRoles(user.id) : Promise.resolve({ data: [] }),
  ]);

  const actor = { id: user?.id ?? "", roles: (roles ?? []).map((row: { role_key: string }) => row.role_key) };
  const manager = { region: profile?.region ?? null, orgScope: profile?.org_scope ?? null };

  const tasks: TaskRowData[] = (rows ?? []).map(row => ({
    id: row.id,
    taskType: row.task_type,
    taskRef: row.task_ref,
    assignee: row.assignee,
    status: row.status as TaskStatus,
    branch: row.branch,
    sector: row.sector,
    active: row.active,
    canManage: canManageTask(actor, manager, { branch: row.branch, sector: row.sector }),
  }));

  return { tasks, error: Boolean(error) };
}
