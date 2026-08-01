import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getPlanningAccess } from "@/lib/planning/access";
import SupervisionQueue, { type PendingSupervision } from "./SupervisionQueue";

export const dynamic = "force-dynamic";

export default async function SupervisionPage() {
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.approve", "planning.return", "planning.reject"]);
  if (access.error) return <Shell current="/planning" title="Supervision queue"><EmptyState glyph="⚠" title="Supervision data not available" body="We couldn't load the queue. Nothing was changed." /></Shell>;
  if (!access.can("planning.approve")) return <Shell current="/planning" title="Supervision queue"><EmptyState glyph="⛔" title="Supervisor access required" body="Only Supervisors can approve, return, or reject submitted visits." /></Shell>;

  const [requestRead, inspectorRead] = await Promise.all([
    sb.from("planning_supervision_requests").select("id, visit_id, proposed_inspector_id, submitted_at, visits!inner(id, visit_reference, visit_type, window_start, window_end, planning_status, factories(name))").eq("status", "pending").order("submitted_at"),
    sb.from("profiles").select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)").eq("user_roles.role_key", "inspector").order("full_name"),
  ]);
  if (requestRead.error || inspectorRead.error) return <Shell current="/planning" title="Supervision queue"><EmptyState glyph="⚠" title="Supervision data not available" body="We couldn't load the queue. Nothing was changed." /></Shell>;
  const inspectorMap = new Map<string, string>();
  for (const row of inspectorRead.data ?? []) inspectorMap.set(row.user_id as string, row.full_name as string);
  const inspectors = [...inspectorMap].map(([user_id, full_name]) => ({ user_id, full_name }));
  const requests: PendingSupervision[] = (requestRead.data ?? []).map((row: any) => ({
    id: row.id, visitId: row.visit_id, reference: row.visits.visit_reference, factoryName: row.visits.factories?.name ?? "—",
    visitType: row.visits.visit_type, windowStart: row.visits.window_start, windowEnd: row.visits.window_end,
    submittedAt: row.submitted_at, proposedInspectorId: row.proposed_inspector_id,
  }));
  return <Shell current="/planning" title="Supervision queue" context={<span className="sq-lozenge sq-lozenge--warning">Supervisor action required</span>}><SupervisionQueue requests={requests} inspectors={inspectors} /></Shell>;
}
