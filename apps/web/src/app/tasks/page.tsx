import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { canManageTask, type TaskStatus } from "@/lib/workflow/tasks";
import { TaskRow, type TaskBoardStrings, type TaskRowData } from "./TaskBoard";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-002 · MVP2-REQ-0032 · CD-043 /tasks workspace.
// Feature-flagged OFF by default (FEATURE_TASKS_WORKSPACE). When off, the surface
// renders an honest "not enabled" boundary — never a fake or half-live board.
// Visibility comes from RLS (a user sees only in-scope rows); manage controls are
// additionally gated by the pure scope/role contract, and the server actions
// fail closed if RLS rejects the write.

export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function TasksPage() {
  const { t } = await useT();
  const enabled = resolveFeatureFlag(process.env.FEATURE_TASKS_WORKSPACE, MODES, "off") === "on";

  if (!enabled) {
    return (
      <Shell current="/tasks" title={t("tasks.title", "Task workspace")}
        context={<span className="ax-lozenge ax-lozenge--warning">CD-043 · MVP2-REQ-0032</span>}>
        <NotYetBoundary
          title={t("tasks.off.title", "Task workspace")}
          consequence={t("tasks.off.body", "The governed task workspace is not enabled in this environment, so assignments cannot be managed here yet. Task assignment still occurs through the workflow engine.")}
          seam="FEATURE_TASKS_WORKSPACE=off — flag-gated until nav/permission regression passes"
          notAvailableLabel={t("tasks.notYet", "Not available yet")}
          detailLabel={t("common.whyPrereq", "Why / prerequisites")}
        />
      </Shell>
    );
  }

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
  };

  return (
    <Shell current="/tasks" title={t("tasks.title", "Task workspace")}
      context={<span className="ax-lozenge ax-lozenge--info">CD-043 · MVP2-REQ-0032</span>}>
      <div className="ax-banner"><div>
        <strong>{t("tasks.banner.title", "Governed task management.")}</strong> {t("tasks.banner.body", "Reassignment and status changes require a manager role in scope and a reason; every change is audited. You see only tasks in your scope (RLS).")}
      </div></div>
      {error && (
        <div className="ax-banner ax-banner--critical" role="alert"><div>
          <strong>{t("tasks.error", "Couldn’t load tasks. Nothing was changed. Try again.")}</strong>
        </div></div>
      )}
      {!error && tasks.length === 0 && (
        <EmptyState glyph="🗂️" title={t("tasks.empty.title", "No tasks in your scope")}
          body={t("tasks.empty.body", "Tasks appear here when assigned within your branch or sector. An empty list may mean none exist, or none are in your scope (RLS).")} />
      )}
      {tasks.map((task) => <TaskRow key={task.id} task={task} strings={strings} />)}
    </Shell>
  );
}
