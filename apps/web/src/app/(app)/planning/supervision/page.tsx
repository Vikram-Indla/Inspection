import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getPlanningAccess } from "@/lib/planning/access";
import SupervisionQueue, { type PendingSupervision } from "./SupervisionQueue";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function SupervisionPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.approve", "planning.return", "planning.reject"]);
  const title = t("plan.supervision.title", "Supervision queue");
  if (access.error) return <Shell current="/planning" title={title}><EmptyState glyph="⚠" title={t("plan.supervision.unavailable.title", "Supervision data not available")} body={t("plan.supervision.unavailable.body", "We couldn't load the queue. Nothing was changed.")} /></Shell>;
  if (!access.can("planning.approve")) return <Shell current="/planning" title={title}><EmptyState glyph="⛔" title={t("plan.supervision.denied.title", "Supervisor access required")} body={t("plan.supervision.denied.body", "Only Supervisors can approve, return, or reject submitted visits.")} /></Shell>;

  const submitted = (await searchParams).submitted?.trim() ?? "";
  if (submitted && !UUID.test(submitted)) return <Shell current="/planning" title={title}><EmptyState glyph="⚠" title={t("plan.supervision.unavailable.title", "Supervision data not available")} body={t("plan.supervision.unavailable.body", "We couldn't load the queue. Nothing was changed.")} /></Shell>;
  let requestQuery = sb.from("planning_supervision_requests").select("id, visit_id, proposed_inspector_id, submitted_at, visits!inner(id, visit_reference, visit_type, window_start, window_end, planning_status, factories(name))").eq("status", "pending").order("submitted_at");
  if (submitted) requestQuery = requestQuery.eq("visit_id", submitted);
  const requestRead = await requestQuery;
  const visitIds = (requestRead.data ?? []).map(row => row.visit_id as string);
  const inspectorRead = requestRead.error || visitIds.length === 0
    ? { data: [], error: requestRead.error }
    : await sb.rpc("list_available_supervision_inspectors", { p_visit_ids: visitIds });
  if (requestRead.error || inspectorRead.error) return <Shell current="/planning" title={title}><EmptyState glyph="⚠" title={t("plan.supervision.unavailable.title", "Supervision data not available")} body={t("plan.supervision.unavailable.body", "We couldn't load the queue. Nothing was changed.")} /></Shell>;
  const inspectorsByVisit: Record<string, { user_id: string; full_name: string }[]> = {};
  for (const row of inspectorRead.data ?? []) {
    const visitId = row.visit_id as string;
    const userId = row.inspector_id as string;
    (inspectorsByVisit[visitId] ??= []).push({
      user_id: userId,
      full_name: (row.full_name as string | null)?.trim() || userId.slice(0, 8),
    });
  }
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
  return <Shell current="/planning" title={title} context={<span className="sq-lozenge sq-lozenge--warning">{t("plan.supervision.actionRequired", "Supervisor action required")}</span>}><SupervisionQueue requests={requests} inspectorsByVisit={inspectorsByVisit} strings={strings} locale={locale} /></Shell>;
}
