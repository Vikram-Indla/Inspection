import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { canManageTask, type TaskStatus } from "@/lib/workflow/tasks";
import { TaskRow, type TaskBoardStrings, type TaskRowData } from "./TaskBoard";
import { IconFolder } from "@/app/icons";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-002 · MVP2-REQ-0032 · CD-043 /tasks workspace.
// Visibility comes from RLS (a user sees only in-scope rows); manage controls are
// additionally gated by the pure scope/role contract, and the server actions
// fail closed if RLS rejects the write.

export default async function TasksPage() {
  const { t } = await useT();

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const [{ data: rows, error }, { data: profile }, { data: roles }] = await Promise.all([
    sb.from("workflow_task_assignments")
      .select("id, task_type, task_ref, assignee, status, branch, sector, active")
      .order("created_at", { ascending: false }),
    user ? sb.from("profiles").select("region, org_scope").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? getUserRoles(user.id) : Promise.resolve({ data: [] }),
  ]);
  if (error) console.error("[tasks] load failed", error);

  const actor = { id: user?.id ?? "", roles: (roles ?? []).map((r: { role_key: string }) => r.role_key) };
  const manager = { region: profile?.region ?? null, orgScope: profile?.org_scope ?? null };

  const tasks: TaskRowData[] = (rows ?? []).map((r) => ({
    id: r.id, taskType: r.task_type, taskRef: r.task_ref, assignee: r.assignee,
    status: r.status as TaskStatus, branch: r.branch, sector: r.sector, active: r.active,
    canManage: canManageTask(actor, manager, { branch: r.branch, sector: r.sector }),
  }));

  const strings: TaskBoardStrings = {
    reassignTo: t("tasks.reassignTo", "Reassign to"),
    reason: t("tasks.reason", "Reason"),
    reassign: t("tasks.reassign", "Reassign"),
    reassigning: t("tasks.reassigning", "Reassigning…"),
    reassigned: t("tasks.reassigned", "reassigned"),
    changeStatus: t("tasks.changeStatus", "Change status"),
    apply: t("tasks.apply", "Apply"),
    applying: t("tasks.applying", "Applying…"),
    statusChanged: t("tasks.statusChanged", "status changed"),
    deactivate: t("tasks.deactivate", "Deactivate"),
    reactivate: t("tasks.reactivate", "Reactivate"),
    activating: t("tasks.activating", "Working…"),
    activeYes: t("tasks.activeYes", "active"),
    activeNo: t("tasks.activeNo", "inactive"),
    terminalNote: t("tasks.terminal", "This task is terminal — no further transitions are possible."),
    readOnly: t("tasks.readOnly", "Scope-locked — visible, not yours to manage (RLS)"),
  };
  const columns = [
    { key: "assigned", label: t("tasks.column.assigned", "Assigned"), tasks: tasks.filter(task => ["new", "assigned", "suspended"].includes(task.status)) },
    { key: "in-progress", label: t("tasks.column.inProgress", "In progress"), tasks: tasks.filter(task => task.status === "in_progress") },
    { key: "completed", label: t("tasks.column.completed", "Completed"), tasks: tasks.filter(task => ["completed", "cancelled"].includes(task.status)) },
  ];

  return (
    <Shell current="/tasks" title={t("tasks.title", "Tasks")}
      context={<span className="badge badge-info">MVP2-REQ-0032</span>}>
      <div className="sq-banner"><div>
        <strong>{t("tasks.banner.title", "Governed task management.")}</strong> {t("tasks.banner.body", "Reassignment and status changes require a manager role in scope and a reason; every change is audited. You see only tasks in your scope (RLS).")}
      </div></div>
      {error && (
        <div className="sq-banner sq-banner--critical" role="alert"><div>
          <strong>{t("tasks.error", "Couldn’t load tasks. Nothing was changed. Try again.")}</strong>
        </div></div>
      )}
      {!error && tasks.length === 0 && (
        <EmptyState icon={<IconFolder size={28} />} title={t("tasks.empty.title", "No tasks in your scope")}
          body={t("tasks.empty.body", "Tasks appear here when assigned within your branch or sector. An empty list may mean none exist, or none are in your scope (RLS).")} />
      )}
      {!error && tasks.length > 0 && <div className="sq-planning-insights" aria-label={t("tasks.board.label", "Task status board")}>
        {columns.map(column => <section key={column.key} aria-labelledby={`tasks-column-${column.key}`}>
          <div className="panel-row">
            <strong id={`tasks-column-${column.key}`}>{column.label}</strong>
            <span className="id-code sq-numeric">{column.tasks.length}</span>
          </div>
          <div className="stack">
            {column.tasks.map(task => <TaskRow key={task.id} task={task} strings={strings} />)}
          </div>
        </section>)}
      </div>}
    </Shell>
  );
}
