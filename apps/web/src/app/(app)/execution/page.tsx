import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getVerifiedUser } from "@/lib/verified-user";
import { getUserRoles } from "@/lib/persona";
import { isAdminOnlyPersona } from "@/lib/shell-navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getLocale, type Locale } from "@/lib/i18n";
import RevampExecutionWorkspace, { type ExecutionRow } from "./RevampExecutionWorkspace";

export const dynamic = "force-dynamic";

const EXECUTION_READ_ROLES = new Set(["inspector", "planner", "ops", "reviewer", "auditor", "leadership"]);

type ExecutionQueryRow = {
  id: string;
  visit_reference: string | null;
  planning_status: string;
  operational_state: string;
  visit_type: string | null;
  execution_mode: string | null;
  execution_date: string | null;
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
    status: string;
    profiles: { full_name: string } | null;
  }> | null;
  package_versions: {
    packages: { title: string } | null;
  } | null;
};

export default async function ExecutionPage() {
  const sb = await supabaseServer();
  const locale = await getLocale();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const [{ data: roleRows, error: roleError }, { data: executionRows, error: executionError, count: executionCount }] = await Promise.all([
    getUserRoles(user.id),
    sb.from("visits")
      .select("id, visit_reference, planning_status, operational_state, visit_type, execution_mode, execution_date, window_start, window_end, priority, factories(id, name, factory_code, cr_number, region, city, risk_band, official_lat, official_lng), assignments(inspector_id, status, profiles(full_name)), package_versions(packages(title))", { count: "exact" })
      .order("execution_date", { ascending: true, nullsFirst: false })
      .order("window_start", { ascending: true })
      .limit(1000),
  ]);
  const roleKeys = (roleRows ?? []).map(row => row.role_key);
  const canReadExecution = roleKeys.some(role => EXECUTION_READ_ROLES.has(role));

  if (executionError || roleError) {
    return (
      <Shell current="/execution" title="">
        <div className="sq-banner sq-banner--critical" role="alert">
          <div><strong>{copy("Execution data is temporarily unavailable.", "بيانات التنفيذ غير متاحة مؤقتاً.")}</strong> {copy("Nothing was changed; retry this destination.", "لم يتم تغيير أي شيء؛ أعد محاولة فتح هذه الوجهة.")}</div>
        </div>
      </Shell>
    );
  }

  if (isAdminOnlyPersona(roleKeys) || !canReadExecution) {
    return (
      <Shell current="/execution" title="">
        <section className="sq-access-refusal" role="alert">
          <span aria-hidden="true">🔒</span>
          <h1>{copy("You do not have access to this destination", "ليس لديك صلاحية الوصول إلى هذه الوجهة")}</h1>
          <p>{copy("The destination stays visible so the platform remains legible, and access is refused here, at the boundary.", "تظل الوجهة ظاهرة لسهولة فهم المنصة، ويُرفض الوصول هنا عند حد الصلاحية.")}</p>
          <div>
            <a className="sq-btn" href="/profile">{copy("Request access", "طلب الوصول")}</a>
            <a className="sq-btn sq-btn--secondary" href="/dashboard">{copy("Back to default state", "العودة إلى الصفحة الافتراضية")}</a>
          </div>
          <small>{copy("Execution is refused for an Administrator-only persona. Backend RLS remains authoritative.", "يُرفض التنفيذ لحساب يقتصر على دور المسؤول. وتظل سياسات أمان الصفوف في قاعدة البيانات هي المرجع.")}</small>
        </section>
      </Shell>
    );
  }

  const rows: ExecutionRow[] = ((executionRows ?? []) as unknown as ExecutionQueryRow[])
    .filter(row => !isTestFixtureEstablishment(row.factories))
    .map(row => {
    const activeAssignment = row.assignments?.find(assignment => assignment.status !== "returned") ?? null;
    return ({
    id: row.id,
    visitReference: row.visit_reference ?? row.id.slice(0, 8),
    factoryId: row.factories?.id ?? null,
    factory: row.factories?.name ?? copy("Factory unavailable", "المصنع غير متاح"),
    crNumber: row.factories?.cr_number ?? null,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    executionDate: row.execution_date,
    reportType: row.package_versions?.packages?.title ?? null,
    visitType: row.visit_type,
    visitMode: row.execution_mode,
    risk: row.factories?.risk_band ?? null,
    priority: row.priority,
    inspectorId: activeAssignment?.inspector_id ?? null,
    inspector: activeAssignment?.profiles?.full_name ?? null,
    region: row.factories?.region ?? null,
    city: row.factories?.city ?? null,
    operationalState: row.operational_state,
    planningStatus: row.planning_status,
    lat: row.factories?.official_lat ?? null,
    lng: row.factories?.official_lng ?? null,
    });
    });

  return (
    <Shell current="/execution" title="">
      <RevampExecutionWorkspace rows={rows} currentUserId={user.id} locale={locale satisfies Locale} totalVisibleRows={executionCount ?? rows.length} />
    </Shell>
  );
}
