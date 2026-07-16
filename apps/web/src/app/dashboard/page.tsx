import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  buildDashboardMetrics,
  parseDateScope,
  riyadhTodayScope,
  type FactoryRef,
  type AuditRow,
  type DashboardSla,
  type GeoRow,
  type InspectionRow,
  type ResponseRow,
  type ReviewRow,
  type ViolationRow,
  type VisitRow,
} from "./metrics";
import {
  DashboardScope,
  DashboardTabs,
  DashboardToolbar,
  OperationalView,
  SearchResults,
  StrategicView,
} from "./DashboardView";

export const dynamic = "force-dynamic";

type PageError = { message: string };
type RowPage<T> = { data: T[] | null; error: PageError | null };

async function collect<T>(load: (from: number, to: number) => PromiseLike<RowPage<T>>) {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await load(from, from + pageSize - 1);
    if (result.error) return { rows: [] as T[], failed: true };
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return { rows, failed: false };
  }
}

type SearchParams = {
  view?: string;
  group?: string;
  q?: string;
  from?: string;
  to?: string;
  region?: string;
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { locale } = await useT();
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;
  const nowMs = Date.now();
  const scope = parseDateScope(params.from, params.to, nowMs);
  const today = riyadhTodayScope(nowMs);
  const region = typeof params.region === "string" ? params.region : "";
  const query = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const view = params.view === "operational" ? "operational" : "strategic";
  const group = (["region", "city", "sector", "authority"] as const).includes(params.group as "region" | "city" | "sector" | "authority")
    ? params.group as "region" | "city" | "sector" | "authority"
    : "region";
  const sb = await supabaseServer();

  // The sidebar is only a usability filter. Enforce the dashboard persona at
  // the route boundary as well so a copied URL cannot grant dashboard access.
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: dashboardRoles, error: roleError } = await sb
    .from("user_roles")
    .select("role_key")
    .eq("user_id", user.id);
  const mayViewDashboard = !roleError && (dashboardRoles ?? []).some(row => row.role_key === "ops" || row.role_key === "leadership");
  if (!mayViewDashboard) redirect("/launch");

  const [visitsResult, inspectionsResult, reviewsResult, responsesResult, violationsResult, geoResult, factoriesResult, auditResult, slaResult] = await Promise.all([
    collect<VisitRow>((from, to) => sb.from("visits").select(`
      id, planning_status, operational_state, window_start, window_end, priority, cancellation_reason, created_at,
      factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary),
      assignments(inspector_id, profiles(full_name))
    `).range(from, to) as unknown as PromiseLike<RowPage<VisitRow>>),
    collect<InspectionRow>((from, to) => sb.from("inspections").select(`
      id, visit_id, status, started_at, submitted_at,
      visits(window_start, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))
    `).range(from, to) as unknown as PromiseLike<RowPage<InspectionRow>>),
    collect<ReviewRow>((from, to) => sb.from("reviews").select(`
      id, inspection_id, status, decision, decided_at,
      inspections(submitted_at, visits(window_start, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary)))
    `).range(from, to) as unknown as PromiseLike<RowPage<ReviewRow>>),
    collect<ResponseRow>((from, to) => sb.from("checklist_responses").select(`
      inspection_id, is_complete, response,
      inspections(submitted_at, visits(factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))),
      inspection_items(regulation_clauses(regulations(title, issuing_authority)))
    `).range(from, to) as unknown as PromiseLike<RowPage<ResponseRow>>),
    collect<ViolationRow>((from, to) => sb.from("violations").select(`
      id, inspection_id,
      inspections(submitted_at, visits(factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))),
      violation_codes(title, level, regulation_clauses(regulations(title, issuing_authority)))
    `).range(from, to) as unknown as PromiseLike<RowPage<ViolationRow>>),
    collect<GeoRow>((from, to) => sb.from("geo_events").select(`
      id, visit_id, kind, geofence_result, override_reason, occurred_at, observed_lat, observed_lng,
      visits(planner_lat, planner_lng, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))
    `).range(from, to) as unknown as PromiseLike<RowPage<GeoRow>>),
    collect<FactoryRef>((from, to) => sb.from("factories").select("id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary").range(from, to) as unknown as PromiseLike<RowPage<FactoryRef>>),
    // The UI renders only the 12 newest lifecycle events. Fetch a bounded,
    // newest-first candidate set for the four lifecycle object types it can
    // display, then metrics applies the exact visible-object/date filter. This
    // avoids paging through the entire append-only audit history forever.
    (async () => {
      const result = await sb.from("audit_events")
        .select("id, object_type, object_id, action, requirement_refs, occurred_at")
        .in("object_type", ["visits", "inspections", "reviews", "violations"])
        .gte("occurred_at", new Date(scope.fromMs).toISOString())
        .lte("occurred_at", new Date(scope.toMs).toISOString())
        .order("occurred_at", { ascending: false })
        .limit(1000);
      return { rows: (result.data ?? []) as AuditRow[], failed: !!result.error };
    })(),
    sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle(),
  ]);

  const failedSources = [
    visitsResult.failed && text("visits", "الزيارات"),
    inspectionsResult.failed && text("inspections", "التفتيشات"),
    reviewsResult.failed && text("reviews", "المراجعات"),
    responsesResult.failed && text("checklist answers", "إجابات قوائم التحقق"),
    violationsResult.failed && text("violations", "المخالفات"),
    geoResult.failed && text("location events", "أحداث الموقع"),
    factoriesResult.failed && text("factories", "المصانع"),
    auditResult.failed && text("audit timeline", "الخط الزمني للتدقيق"),
    slaResult.error && text("SLA configuration", "تهيئة اتفاقية مستوى الخدمة"),
  ].filter(Boolean) as string[];

  const metrics = buildDashboardMetrics({
    visits: visitsResult.rows,
    inspections: inspectionsResult.rows,
    reviews: reviewsResult.rows,
    responses: responsesResult.rows,
    violations: violationsResult.rows,
    geo: geoResult.rows,
    audit: auditResult.rows,
    factories: factoriesResult.rows,
    sla: (slaResult.data?.settings ?? {}) as DashboardSla,
    scope,
    today,
    region,
    nowMs,
  });
  const regions = [...new Set(factoriesResult.rows.map(row => row.region).filter((value): value is string => !!value))].sort();
  const currentParams: Record<string, string> = {
    view,
    group,
    q: query,
    from: scope.fromDate,
    to: scope.toDate,
    region,
  };
  const refreshedAt = new Date(nowMs).toISOString().slice(0, 16).replace("T", " ");
  const defaultScope = parseDateScope(undefined, undefined, nowMs);
  const dateLabel = scope.fromDate === defaultScope.fromDate && scope.toDate === defaultScope.toDate
    ? text("Last 30 days", "آخر 30 يوماً")
    : `${scope.fromDate} — ${scope.toDate}`;

  return <Shell current="/dashboard" title={text("Dashboard", "لوحة القيادة")}
    context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-500 · DASH-001..016</span>}
    topbar={<DashboardToolbar locale={locale} query={query} from={scope.fromDate} to={scope.toDate} dateLabel={dateLabel} region={region} regions={regions} view={view} group={group} />}>
    {failedSources.length > 0 && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{text("Partial dashboard", "لوحة قيادة جزئية")}</strong> — {text("these sources are temporarily unavailable:", "هذه المصادر غير متاحة مؤقتاً:")} {failedSources.join(" · ")}. {text("Other panels remain usable; refresh to retry.", "تظل اللوحات الأخرى قابلة للاستخدام؛ حدّث الصفحة لإعادة المحاولة.")}</div></div>}
    <DashboardTabs locale={locale} view={view} params={currentParams} />
    <DashboardScope locale={locale} from={scope.fromDate} to={scope.toDate} region={region} refreshedAt={refreshedAt} />
    <SearchResults locale={locale} query={query} factories={factoriesResult.rows} visits={visitsResult.rows} inspections={inspectionsResult.rows} />
    {view === "strategic"
      ? <StrategicView locale={locale} metrics={metrics} group={group} params={currentParams} />
      : <OperationalView locale={locale} metrics={metrics} />}
  </Shell>;
}
