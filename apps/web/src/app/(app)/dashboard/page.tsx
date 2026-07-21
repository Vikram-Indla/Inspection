import Shell, { preloadShell } from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
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
  OperationalView,
  SearchResults,
  StrategicView,
} from "./DashboardView";
import { BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";
import { Suspense } from "react";


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

// DASH-015 / AC-0444 — only the newest 12 scoped timeline rows are rendered.
// Query each bounded object-id chunk for its newest 12, then take the newest 12
// across chunks. This is mathematically equivalent to loading every matching
// audit row, without an O(total audit history) navigation cost.
async function collectLatestAudit(
  objectIds: string[],
  load: (ids: string[]) => PromiseLike<RowPage<AuditRow>>,
) {
  const ids = [...new Set(objectIds)];
  if (!ids.length) return { rows: [] as AuditRow[], failed: false };
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 80) chunks.push(ids.slice(i, i + 80));
  const results = await Promise.all(chunks.map(load));
  if (results.some(result => result.error)) return { rows: [] as AuditRow[], failed: true };
  return {
    rows: results.flatMap(result => result.data ?? [])
      .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
      .slice(0, 12),
    failed: false,
  };
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
  preloadShell("/dashboard");
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

  // K-003 — DB-side bounds. buildDashboardMetrics only counts rows dated inside
  // the current scope or the immediately-previous comparison window
  // (previousScope in metrics.ts), plus "today" for the today's-visits card.
  // Rows older than bound on every relevant date are provably uncounted, so
  // the full-table scans become window scans. Open inspections are always
  // loaded (they can enter scope at any time); factories stay unbounded
  // (reference data for search/region filters).
  const prevScopeFromMs = scope.fromMs - (scope.toMs - scope.fromMs + 1);
  const boundIso = new Date(Math.min(prevScopeFromMs, today.fromMs)).toISOString();

  // The sidebar is only a usability filter. Enforce the dashboard persona at
  // the route boundary as well so a copied URL cannot grant dashboard access.
  // The Dashboard is a shared Command destination for every non-admin persona
  // (business direction 2026-07-16); admin-only users are redirected. Data is
  // still RLS-scoped per persona (RBAC-001..014).
  const { data: { user } } = await getServerUser();
  if (!user) redirect("/login");
  const { data: dashboardRoles, error: roleError } = await getUserRoles(user.id);
  const businessRoles = BUSINESS_ROLE_KEYS as readonly string[];
  const mayViewDashboard = !roleError && (dashboardRoles ?? []).some(row => businessRoles.includes(row.role_key));
  if (!mayViewDashboard) redirect("/launch");

  const strategic = view === "strategic";
  const searching = query.trim().length > 0;
  const empty = <T,>() => Promise.resolve({ rows: [] as T[], failed: false });
  const currentParams: Record<string, string> = {
    view, group, q: query, from: scope.fromDate, to: scope.toDate, region,
  };
  const refreshedAt = new Date(nowMs).toISOString().slice(0, 16).replace("T", " ");

  // K-003 Tier C — each perspective fetches only the source families it can
  // render. Search explicitly opts entity sources back in. All selected reads
  // remain date-bound and RLS-scoped; no dashboard formula changes.
  const dataPromise = Promise.all([
    (!strategic || searching) ? collect<VisitRow>((from, to) => sb.from("visits").select(`
      id, planning_status, operational_state, window_start, window_end, priority, cancellation_reason, created_at,
      factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary),
      assignments(inspector_id, profiles(full_name))
    `).or(`window_start.gte.${boundIso},created_at.gte.${boundIso}`).range(from, to) as unknown as PromiseLike<RowPage<VisitRow>>) : empty<VisitRow>(),
    collect<InspectionRow>((from, to) => sb.from("inspections").select(`
      id, visit_id, status, started_at, submitted_at,
      visits(window_start, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))
    `).or(`submitted_at.gte.${boundIso},started_at.gte.${boundIso},status.eq.not_started,status.eq.in_progress`).range(from, to) as unknown as PromiseLike<RowPage<InspectionRow>>),
    collect<ReviewRow>((from, to) => sb.from("reviews").select(`
      id, inspection_id, status, decision, decided_at,
      inspections!inner(submitted_at, visits(window_start, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary)))
    `).gte("inspections.submitted_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<ReviewRow>>),
    strategic ? collect<ResponseRow>((from, to) => sb.from("checklist_responses").select(`
      inspection_id, is_complete, response,
      inspections!inner(submitted_at, visits(factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))),
      inspection_items(regulation_clauses(regulations(title, issuing_authority)))
    `).gte("inspections.submitted_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<ResponseRow>>) : empty<ResponseRow>(),
    strategic ? collect<ViolationRow>((from, to) => sb.from("violations").select(`
      id, inspection_id,
      inspections!inner(submitted_at, visits(factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))),
      violation_codes(title, level, regulation_clauses(regulations(title, issuing_authority)))
    `).gte("inspections.submitted_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<ViolationRow>>) : empty<ViolationRow>(),
    !strategic ? collect<GeoRow>((from, to) => sb.from("geo_events").select(`
      id, visit_id, kind, geofence_result, override_reason, occurred_at, observed_lat, observed_lng,
      visits(planner_lat, planner_lng, factories(id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary))
    `).gte("occurred_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<GeoRow>>) : empty<GeoRow>(),
    (strategic || searching) ? collect<FactoryRef>((from, to) => sb.from("factories").select("id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary").range(from, to) as unknown as PromiseLike<RowPage<FactoryRef>>) : empty<FactoryRef>(),
    !strategic ? sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle() : Promise.resolve({ data: null, error: null }),
    sb.rpc("dashboard_grouped_metrics", {
      p_from: new Date(scope.fromMs).toISOString(),
      p_to: new Date(scope.toMs).toISOString(),
      p_previous_from: new Date(prevScopeFromMs).toISOString(),
      p_region: region || null,
    }),
  ]);

  async function DashboardDataSections() {
    const [visitsResult, inspectionsResult, reviewsResult, responsesResult, violationsResult, geoResult, factoriesResult, slaResult, groupedResult] = await dataPromise;

  const auditObjectIds = [
    ...visitsResult.rows.map(row => row.id),
    ...inspectionsResult.rows.map(row => row.id),
    ...reviewsResult.rows.map(row => row.id),
    ...violationsResult.rows.map(row => row.id),
  ];
  // The audit timeline exists only in Operational View. Strategic navigation
  // must not wait for a query whose result it cannot render.
  const auditResult = view === "operational"
    ? await collectLatestAudit(auditObjectIds, ids => sb.from("audit_events")
      .select("id, object_type, object_id, action, requirement_refs, occurred_at")
      .in("object_id", ids)
      .gte("occurred_at", new Date(scope.fromMs).toISOString())
      .lte("occurred_at", new Date(scope.toMs).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(12) as unknown as PromiseLike<RowPage<AuditRow>>)
    : { rows: [] as AuditRow[], failed: false };

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
  const grouped = groupedResult.data as null | {
    completed_inspections: number; compliant: number; non_compliant: number;
    violations: number; previous_violations: number;
    violation_by_regulation: { label: string; value: number }[];
    planned_visits: number; completed_visits: number; cancelled_visits: number; active_field: number;
  };
  if (grouped) {
    metrics.strategic.completedInspections = Number(grouped.completed_inspections);
    metrics.strategic.compliant = Number(grouped.compliant);
    metrics.strategic.nonCompliant = Number(grouped.non_compliant);
    metrics.strategic.answeredForCompliance = Number(grouped.compliant) + Number(grouped.non_compliant);
    metrics.strategic.complianceRate = metrics.strategic.answeredForCompliance
      ? Math.round((metrics.strategic.compliant / metrics.strategic.answeredForCompliance) * 100)
      : null;
    metrics.strategic.previousViolations = Number(grouped.previous_violations);
    metrics.strategic.violationDelta = Number(grouped.violations) - Number(grouped.previous_violations);
    metrics.strategic.violationByRegulation = grouped.violation_by_regulation ?? [];
    metrics.operational.planned = Number(grouped.planned_visits);
    metrics.operational.completed = Number(grouped.completed_visits);
    metrics.operational.cancelled = Number(grouped.cancelled_visits);
    metrics.operational.activeField = Number(grouped.active_field);
  }
    return <>
      {failedSources.length > 0 && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{text("Partial dashboard", "لوحة قيادة جزئية")}</strong> — {text("these sources are temporarily unavailable:", "هذه المصادر غير متاحة مؤقتاً:")} {failedSources.join(" · ")}. {text("Other panels remain usable; refresh to retry.", "تظل اللوحات الأخرى قابلة للاستخدام؛ حدّث الصفحة لإعادة المحاولة.")}</div></div>}
      <SearchResults locale={locale} query={query} factories={factoriesResult.rows} visits={visitsResult.rows} inspections={inspectionsResult.rows} />
      {view === "strategic"
        ? <StrategicView locale={locale} metrics={metrics} group={group} params={currentParams} />
        : <OperationalView locale={locale} metrics={metrics} />}
    </>;
  }

  return <Shell current="/dashboard" title={text("Dashboard", "لوحة القيادة")}
    context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-500 · DASH-001..016</span>}>
    <DashboardTabs locale={locale} view={view} params={currentParams} />
    <DashboardScope locale={locale} from={scope.fromDate} to={scope.toDate} region={region} refreshedAt={refreshedAt} />
    <Suspense fallback={<div className="ax-surface" aria-busy="true" role="status"><span className="ax-skeleton" />{text("Loading dashboard data…", "جارٍ تحميل بيانات لوحة القيادة…")}</div>}>
      <DashboardDataSections />
    </Suspense>
  </Shell>;
}
