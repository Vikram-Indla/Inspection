import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getPlanningAccess } from "@/lib/planning/access";
import SupervisionQueue, { type PendingSupervision } from "./SupervisionQueue";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SupervisionPage() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.approve", "planning.return", "planning.reject"]);
  const title = t("plan.supervision.title", "Supervision queue");
  if (access.error) return <Shell current="/planning" title={title}><EmptyState glyph="⚠" title={t("plan.supervision.unavailable.title", "Supervision data not available")} body={t("plan.supervision.unavailable.body", "We couldn't load the queue. Nothing was changed.")} /></Shell>;
  if (!access.can("planning.approve")) return <Shell current="/planning" title={title}><EmptyState glyph="⛔" title={t("plan.supervision.denied.title", "Supervisor access required")} body={t("plan.supervision.denied.body", "Only Supervisors can approve, return, or reject submitted visits.")} /></Shell>;

  const [requestRead, inspectorRead] = await Promise.all([
    sb.from("planning_supervision_requests").select("id, visit_id, proposed_inspector_id, submitted_at, visits!inner(id, visit_reference, visit_type, window_start, window_end, planning_status, factories(name))").eq("status", "pending").order("submitted_at"),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector").order("user_id"),
  ]);
  if (requestRead.error || inspectorRead.error) return <Shell current="/planning" title={title}><EmptyState glyph="⚠" title={t("plan.supervision.unavailable.title", "Supervision data not available")} body={t("plan.supervision.unavailable.body", "We couldn't load the queue. Nothing was changed.")} /></Shell>;
  const inspectorMap = new Map<string, string>();
  for (const row of inspectorRead.data ?? []) {
    const profile = row.profiles as unknown as { full_name?: string | null } | null;
    const userId = row.user_id as string;
    inspectorMap.set(userId, profile?.full_name?.trim() || userId.slice(0, 8));
  }
  const inspectors = [...inspectorMap].map(([user_id, full_name]) => ({ user_id, full_name }));
  const requests: PendingSupervision[] = (requestRead.data ?? []).map((row: any) => ({
    id: row.id, visitId: row.visit_id, reference: row.visits.visit_reference, factoryName: row.visits.factories?.name ?? "—",
    visitType: row.visits.visit_type, windowStart: row.visits.window_start, windowEnd: row.visits.window_end,
    submittedAt: row.submitted_at, proposedInspectorId: row.proposed_inspector_id,
  }));
  const strings = {
    empty: t("plan.supervision.empty", "No visit is awaiting supervision."),
    requestLabel: t("plan.supervision.requestLabel", "Supervision request {ref}"),
    awaiting: t("plan.supervision.awaiting", "Awaiting Supervisor"),
    newVisit: t("plan.supervision.newVisit", "New visit"),
    pending: t("plan.supervision.pending", "Pending supervision"),
    factory: t("plan.supervision.factory", "Factory"), visitType: t("plan.supervision.visitType", "Visit type"),
    window: t("plan.supervision.window", "Window"), submitted: t("plan.supervision.submitted", "Submitted"),
    finalInspector: t("plan.supervision.finalInspector", "Final Inspector"),
    selectInspector: t("plan.supervision.selectInspector", "— select Inspector"),
    noteOptional: t("plan.supervision.noteOptional", "Decision note (optional)"),
    noteRequired: t("plan.supervision.noteRequired", "Decision note (required)"),
    approve: t("plan.supervision.approve", "Approve & release"), releasing: t("plan.supervision.releasing", "Releasing…"),
    returnToPlanner: t("plan.supervision.return", "Return to Planner"), reject: t("plan.supervision.reject", "Reject"),
  };
  return <Shell current="/planning" title={title} context={<span className="sq-lozenge sq-lozenge--warning">{t("plan.supervision.actionRequired", "Supervisor action required")}</span>}><SupervisionQueue requests={requests} inspectors={inspectors} strings={strings} locale={locale} /></Shell>;
}
