import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { redirect } from "next/navigation";
import {
  buildDashboardMetrics,
  parseDateScope,
  riyadhTodayScope,
  type FactoryRef,
  type AuditRow,
  type ChecklistItemRow,
  type DashboardSla,
  type GeoRow,
  type InspectionRow,
  type ResponseRow,
  type ReviewRow,
  type ViolationRow,
  type VisitRow,
} from "./metrics";
import {
  DashboardControls,
  OperationalView,
  SearchResults,
  StrategicView,
} from "./DashboardView";
import { buildDashboardKpiProjection } from "@/lib/dashboard-kpi/projection";
import { resolveDashboardPolicyVersion } from "@/lib/dashboard-kpi/loader";
import type { MetricScope } from "@/lib/dashboard-kpi/contract";
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
  const params = await searchParams;
  const { locale } = await useT();
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;
  const nowMs = Date.now();
  const scope = parseDateScope(params.from, params.to, nowMs);
  const today = riyadhTodayScope(nowMs);
  const region = typeof params.region === "string" ? params.region : "";
  const query = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const requestedView = params.view ?? "strategic";
  const unsupportedView = requestedView !== "strategic" && requestedView !== "operational"
    ? requestedView
    : null;
  const view = requestedView === "operational" ? "operational" : "strategic";
  const group = (["region", "city", "sector", "authority"] as const).includes(params.group as "region" | "city" | "sector" | "authority")
    ? params.group as "region" | "city" | "sector" | "authority"
    : "region";
  const sb = await supabaseServer();
  // K-003 / DASH-015 — load only the source families rendered by the selected
  // perspective, and bound every historical source to the current/previous
  // comparison window. The search surface explicitly opts entity rows back in.
  const strategic = view === "strategic";
  const searching = query.trim().length > 0;
  const prevScopeFromMs = scope.fromMs - (scope.toMs - scope.fromMs + 1);
  const boundIso = new Date(Math.min(prevScopeFromMs, today.fromMs)).toISOString();
  const empty = <T,>() => Promise.resolve({ rows: [] as T[], failed: false });
  // K-perf: factories is fetched once as its own query below (factoriesResult)
  // and hydrated back onto every row here — embedding the full factories(...)
  // object at every nesting level re-ran the factories table's RLS+join on
  // 5 separate requests for data already fetched once. Selecting the bare
  // factory_id (a plain column, no join) and hydrating post-fetch is
  // output-identical, just cheaper.
  const loadVisits = (from: number, to: number) => {
    let request = sb.from("visits").select(`
      id, planning_status, operational_state, window_start, window_end, priority, cancellation_reason, created_at, factory_id,
      assignments(inspector_id, profiles(full_name))
    `);
    // Operational Visit pipeline is an as-of live count and therefore must not
    // inherit the selected reporting window. Strategic entity search remains
    // bounded to avoid turning every dashboard load into a history export.
    if (strategic) request = request.or(`window_start.gte.${boundIso},created_at.gte.${boundIso}`);
    return request.range(from, to) as unknown as PromiseLike<RowPage<VisitRow>>;
  };
  const loadInspections = (from: number, to: number) => {
    let request = sb.from("inspections").select(`
      id, visit_id, status, started_at, submitted_at,
      visits(window_start, factory_id)
    `);
    // Pending approvals is an as-of queue: an older submitted inspection stays
    // eligible until Level 2 records a decision.
    if (strategic) request = request.or(`submitted_at.gte.${boundIso},started_at.gte.${boundIso},status.eq.not_started,status.eq.in_progress`);
    return request.range(from, to) as unknown as PromiseLike<RowPage<InspectionRow>>;
  };
  const loadReviews = (from: number, to: number) => {
    let request = sb.from("reviews").select(`
      id, inspection_id, status, decision, decided_at,
      inspections!inner(submitted_at, visits(window_start, factory_id))
    `);
    if (strategic) request = request.gte("inspections.submitted_at", boundIso);
    return request.range(from, to) as unknown as PromiseLike<RowPage<ReviewRow>>;
  };

  // The sidebar is only a usability filter. Enforce the dashboard persona at
  // the route boundary as well so a copied URL cannot grant dashboard access.
  // CC-SAQEEL-RESPONSIVE-REVAMP-001: the canonical Planner and Inspector
  // presentation roles can open Dashboard. Legacy ops/leadership grants map
  // to Planner-read during the evidence-backed role migration.
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) redirect("/login");
  const { data: dashboardRoles, error: roleError } = await sb
    .from("user_roles")
    .select("role_key")
    .eq("user_id", user.id);
  const dashboardRoleKeys = ["planner", "inspector", "ops", "leadership", "reviewer", "compliance_admin", "form_admin", "workflow_admin", "security_admin", "gis_admin", "risk_owner"] as const;
  const mayViewDashboard = !roleError && (dashboardRoles ?? []).some(row => dashboardRoleKeys.includes(row.role_key as typeof dashboardRoleKeys[number]));
  if (!mayViewDashboard) redirect("/launch");

  const dataPromise = Promise.all([
    collect<VisitRow>(loadVisits),
    collect<InspectionRow>(loadInspections),
    collect<ReviewRow>(loadReviews),
    strategic ? collect<ResponseRow>((from, to) => sb.from("checklist_responses").select(`
      inspection_id, is_complete, response,
      inspections!inner(submitted_at, visits(factory_id)),
      inspection_items(regulation_clauses(regulations(title, issuing_authority)))
    `).gte("inspections.submitted_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<ResponseRow>>) : empty<ResponseRow>(),
    strategic ? collect<ChecklistItemRow>((from, to) => sb.from("inspection_items").select(`
      id, active,
      regulation_clauses!inner(regulations!inner(issuing_authority, status))
    `).eq("active", true).eq("regulation_clauses.regulations.status", "published")
      .range(from, to) as unknown as PromiseLike<RowPage<ChecklistItemRow>>) : empty<ChecklistItemRow>(),
    strategic ? collect<ViolationRow>((from, to) => sb.from("violations").select(`
      id, inspection_id,
      inspections!inner(submitted_at, visits(factory_id)),
      violation_codes(title, level, regulation_clauses(regulations(title, issuing_authority)))
    `).gte("inspections.submitted_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<ViolationRow>>) : empty<ViolationRow>(),
    !strategic ? collect<GeoRow>((from, to) => sb.from("geo_events").select(`
      id, visit_id, kind, geofence_result, override_reason, occurred_at, observed_lat, observed_lng,
      visits(planner_lat, planner_lng, factory_id)
    `).gte("occurred_at", boundIso).range(from, to) as unknown as PromiseLike<RowPage<GeoRow>>) : empty<GeoRow>(),
    collect<FactoryRef>((from, to) => sb.from("factories").select("id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary, official_lat, official_lng, geofence_radius_m").range(from, to) as unknown as PromiseLike<RowPage<FactoryRef>>),
    !strategic ? sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const policyPromise = resolveDashboardPolicyVersion(sb);

  async function DashboardDataSections() {
    const [
      visitsResult,
      inspectionsResult,
      reviewsResult,
      responsesResult,
      checklistItemsResult,
      violationsResult,
      geoResult,
      factoriesResult,
      slaResult,
    ] = await dataPromise;

  // Rehydrate the factories(...) shape metrics.ts/DashboardView.tsx expect,
  // from the bare factory_id each query now selects (see loadVisits comment).
  const factoriesById = new Map(factoriesResult.rows.map(f => [f.id, f] as const));
  const withFactory = (factoryId: string | null | undefined) => (factoryId && factoriesById.get(factoryId)) || null;
  for (const row of visitsResult.rows as unknown as (VisitRow & { factory_id?: string })[]) row.factories = withFactory(row.factory_id);
  for (const row of inspectionsResult.rows as unknown as (InspectionRow & { visits?: { factory_id?: string } & InspectionRow["visits"] })[]) if (row.visits) row.visits.factories = withFactory(row.visits.factory_id);
  for (const row of reviewsResult.rows as unknown as (ReviewRow & { inspections?: { visits?: { factory_id?: string } & NonNullable<ReviewRow["inspections"]>["visits"] } & ReviewRow["inspections"] })[]) if (row.inspections?.visits) row.inspections.visits.factories = withFactory(row.inspections.visits.factory_id);
  for (const row of responsesResult.rows as unknown as (ResponseRow & { inspections?: { visits?: { factory_id?: string } & NonNullable<ResponseRow["inspections"]>["visits"] } & ResponseRow["inspections"] })[]) if (row.inspections?.visits) row.inspections.visits.factories = withFactory(row.inspections.visits.factory_id);
  for (const row of violationsResult.rows as unknown as (ViolationRow & { inspections?: { visits?: { factory_id?: string } & NonNullable<ViolationRow["inspections"]>["visits"] } & ViolationRow["inspections"] })[]) if (row.inspections?.visits) row.inspections.visits.factories = withFactory(row.inspections.visits.factory_id);
  for (const row of geoResult.rows as unknown as (GeoRow & { visits?: { factory_id?: string } & GeoRow["visits"] })[]) if (row.visits) row.visits.factories = withFactory(row.visits.factory_id);

  const auditObjectIds = [
    ...visitsResult.rows.map(row => row.id),
    ...inspectionsResult.rows.map(row => row.id),
    ...reviewsResult.rows.map(row => row.id),
    ...violationsResult.rows.map(row => row.id),
  ];
  const auditResult = !strategic
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
    checklistItemsResult.failed && text("checklist items", "بنود قائمة التحقق"),
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
    checklistItems: checklistItemsResult.rows,
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

  const policy = await policyPromise;
  const metricScope: MetricScope = {
    fromMs: scope.fromMs,
    toMs: scope.toMs,
    fromDate: scope.fromDate,
    toDate: scope.toDate,
    timezone: "Asia/Riyadh",
    region: region || null,
    filters: query ? { q: query } : {},
  };
  const projection = buildDashboardKpiProjection(metrics, {
    scope: metricScope,
    policyVersionId: policy.policyVersionId,
    targets: policy.targets,
    refreshedAt: new Date(nowMs).toISOString(),
    generatedAtMs: nowMs,
    failedSources: [...failedSources, ...policy.failedSources],
  });

  const factoryCoords = new Map<string, { lat: number; lng: number; radiusM: number | null }>();
  for (const factory of factoriesResult.rows) {
    if (factory.official_lat != null && factory.official_lng != null) {
      factoryCoords.set(factory.id, {
        lat: Number(factory.official_lat),
        lng: Number(factory.official_lng),
        radiusM: factory.geofence_radius_m ?? null,
      });
    }
  }
  const currentParams: Record<string, string> = {
    view,
    group,
    q: query,
    from: scope.fromDate,
    to: scope.toDate,
    region,
  };
  const refreshedAt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(nowMs));
  const partialSources = Array.from(new Set([...failedSources, ...policy.failedSources]));
  if (unsupportedView) {
    return <section className="panel" role="status" style={{ padding: "var(--space-6)", display: "grid", gap: "var(--space-3)" }}>
      <h2 className="panel-title">{text("Dashboard view not configured", "منظور لوحة القيادة غير مهيأ")}</h2>
      <p className="t-body">{text(`The “${unsupportedView}” perspective is not an approved M1 view. Choose an available perspective.`, `المنظور «${unsupportedView}» ليس منظوراً معتمداً في M1. اختر منظوراً متاحاً.`)}</p>
      <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <a className="sq-btn sq-btn--primary" href="/dashboard?view=strategic">{text("Open Strategic View", "فتح المنظور الاستراتيجي")}</a>
        <a className="sq-btn sq-btn--secondary" href="/dashboard?view=operational">{text("Open Operational View", "فتح المنظور التشغيلي")}</a>
      </div>
    </section>;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* The DEC-032 submission-verification caveat is NOT dropped — it moved to
          where it applies. It is a statement about what the counts mean, so it
          now renders as a "Verification" lineage row on every metric's basis
          drawer (buildMethodology, dashboard-format.ts), one action from the
          number it qualifies.
          As a permanent page-level role="alert" it was unconditional and
          hardcoded, so it had no lifecycle and would have kept asserting itself
          after DEC-032 closed; it was written in database vocabulary
          (submission_versions, RLS, backend probes) that this audience cannot
          act on; and it rendered in the same critical styling as the real,
          conditional partial-dashboard alert below, which camouflaged it.
          Every other DEC-032 surface attaches the caveat to the action it
          blocks. The dashboard blocks no action, so it attaches to the data. */}
      {failedSources.length > 0 && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{text("Partial dashboard", "لوحة قيادة جزئية")}</strong> — {text("these sources are temporarily unavailable:", "هذه المصادر غير متاحة مؤقتاً:")} {failedSources.join(" · ")}. {text("Other panels remain usable; refresh to retry.", "تظل اللوحات الأخرى قابلة للاستخدام؛ حدّث الصفحة لإعادة المحاولة.")}</div></div>}
      <DashboardControls locale={locale} view={view} params={currentParams} from={scope.fromDate} to={scope.toDate}
        region={region} query={query} refreshedAt={refreshedAt} partialSources={partialSources} />
      <SearchResults locale={locale} query={query} factories={factoriesResult.rows} visits={visitsResult.rows} inspections={inspectionsResult.rows} />
      {view === "strategic"
          ? <StrategicView locale={locale} metrics={metrics} projection={projection} factories={factoriesResult.rows} group={group} params={currentParams} partialSources={partialSources} />
          : <OperationalView locale={locale} metrics={metrics} projection={projection} factoryCoords={factoryCoords} partialSources={partialSources} />}
    </div>;
  }

  return <Shell current="/dashboard" title="">
    <Suspense fallback={<div className="panel" aria-busy="true" role="status">{text("Loading dashboard data…", "جارٍ تحميل بيانات لوحة القيادة…")}</div>}>
      <DashboardDataSections />
    </Suspense>
  </Shell>;
}
