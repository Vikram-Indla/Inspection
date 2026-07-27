import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getVerifiedUser } from "@/lib/verified-user";
import { getUserRoles } from "@/lib/persona";
import { isAdminOnlyPersona } from "@/lib/shell-navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import RevampExecutionWorkspace, { type ExecutionRow } from "./RevampExecutionWorkspace";

export const dynamic = "force-dynamic";

type ExecutionQueryRow = {
  id: string;
  visit_reference: string | null;
  planning_status: string;
  operational_state: string;
  visit_type: string | null;
  execution_mode: string | null;
  window_start: string;
  window_end: string;
  priority: string | null;
  factories: {
    id: string;
    name: string;
    factory_code: string | null;
    cr_number: string | null;
    region: string | null;
    city: string | null;
    risk_band: string | null;
    official_lat: number | null;
    official_lng: number | null;
  } | null;
  assignments: Array<{
    inspector_id: string;
    profiles: { full_name: string } | null;
  }> | null;
  inspections: { started_at: string | null } | null;
};

export default async function ExecutionPage() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const [{ data: roleRows }, { data: executionRows, error: executionError }] = await Promise.all([
    getUserRoles(user.id),
    sb.from("visits")
      .select("id, visit_reference, planning_status, operational_state, visit_type, execution_mode, window_start, window_end, priority, factories(id, name, factory_code, cr_number, region, city, risk_band, official_lat, official_lng), assignments(inspector_id, profiles(full_name)), inspections(started_at)")
      .order("window_start", { ascending: true })
      .limit(1000),
  ]);
  const roleKeys = (roleRows ?? []).map(row => row.role_key);

  if (isAdminOnlyPersona(roleKeys)) {
    return (
      <Shell current="/execution" title="">
        <section className="sq-access-refusal" role="alert">
          <span aria-hidden="true">🔒</span>
          <h1>You do not have access to this destination</h1>
          <p>The destination stays visible so the platform remains legible, and access is refused here, at the boundary.</p>
          <div>
            <a className="sq-btn" href="/profile">Request access</a>
            <a className="sq-btn sq-btn--secondary" href="/dashboard">Back to default state</a>
          </div>
          <small>Execution is refused for an Administrator-only persona. Backend RLS remains authoritative.</small>
        </section>
      </Shell>
    );
  }

  if (executionError) {
    return (
      <Shell current="/execution" title="">
        <div className="sq-banner sq-banner--critical" role="alert">
          <div><strong>Execution data is temporarily unavailable.</strong> Nothing was changed; retry this destination.</div>
        </div>
      </Shell>
    );
  }

  const rows: ExecutionRow[] = ((executionRows ?? []) as unknown as ExecutionQueryRow[])
    .filter(row => !isTestFixtureEstablishment(row.factories))
    .map(row => ({
    id: row.id,
    visitReference: row.visit_reference ?? row.id.slice(0, 8),
    factoryId: row.factories?.id ?? null,
    factory: row.factories?.name ?? "Factory unavailable",
    crNumber: row.factories?.cr_number ?? null,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    executionDate: row.inspections?.started_at ?? null,
    visitType: row.visit_type,
    visitMode: row.execution_mode,
    risk: row.factories?.risk_band ?? null,
    priority: row.priority,
    inspectorId: row.assignments?.[0]?.inspector_id ?? null,
    inspector: row.assignments?.[0]?.profiles?.full_name ?? null,
    region: row.factories?.region ?? null,
    city: row.factories?.city ?? null,
    operationalState: row.operational_state,
    planningStatus: row.planning_status,
    lat: row.factories?.official_lat ?? null,
    lng: row.factories?.official_lng ?? null,
    }));

  return (
    <Shell current="/execution" title="">
      <RevampExecutionWorkspace rows={rows} currentUserId={user.id} />
    </Shell>
  );
}
