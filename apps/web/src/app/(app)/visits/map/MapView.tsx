import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import VisitMap, { type MappedVisit } from "./VisitMap";
import CoveragePanel from "./CoveragePanel";
import VisitViewNavigation, { type VisitBasePath } from "../VisitViewNavigation";

export async function VisitsMapView({ basePath = "/visits" }: { basePath?: VisitBasePath }) {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const [{ data: visits, error }, { data: geo }] = await Promise.all([
    sb.from("visits").select(`id, factory_id, operational_state, window_start, window_end,
      factories(name, region, city, official_lat, official_lng, risk_band),
      assignments(inspector_id, profiles(full_name))`).order("window_start", { ascending: false }).limit(1000),
    sb.from("geo_events").select("visit_id, observed_lat, observed_lng, occurred_at")
      .in("kind", ["telemetry", "arrival", "checkin", "override"]).order("occurred_at", { ascending: false }).limit(5000),
  ]);
  if (error) console.error(`[visits map] visit read failed: ${error.message}`);
  const latest = new Map<string, { observed_lat: number; observed_lng: number; occurred_at: string }>();
  for (const row of geo ?? []) if (!latest.has(row.visit_id)) latest.set(row.visit_id, row as never);
  const rows: MappedVisit[] = ((visits ?? []) as unknown as {
    id: string; factory_id: string; operational_state: string; window_start: string | null; window_end: string | null;
    factories: { name: string; region: string | null; city: string | null; official_lat: number | null; official_lng: number | null; risk_band: string | null } | null;
    assignments: { inspector_id: string; profiles: { full_name: string } | null }[];
  }[]).flatMap(v => {
    if (!v.factories || v.factories.official_lat == null || v.factories.official_lng == null) return [];
    const position = latest.get(v.id);
    return [{
      id: v.id, factoryId: v.factory_id, factoryName: v.factories.name,
      region: v.factories.region ?? "", city: v.factories.city ?? "",
      factoryLat: Number(v.factories.official_lat), factoryLng: Number(v.factories.official_lng),
      inspectorName: v.assignments?.[0]?.profiles?.full_name ?? "",
      inspectorLat: position ? Number(position.observed_lat) : null,
      inspectorLng: position ? Number(position.observed_lng) : null,
      inspectorAt: position?.occurred_at ?? null, operationalState: v.operational_state,
      riskBand: v.factories.risk_band, windowStart: v.window_start, windowEnd: v.window_end,
    }];
  });
  return (
    <Shell current={basePath} title={t("visit.map.title", "Visit management — map")} context={<span className="sq-lozenge sq-lozenge--info">{t("visit.map.context", "Filtered to your access")}</span>}>
      <VisitViewNavigation basePath={basePath} active="map" ariaLabel={t("visit.views.aria", "Visit management views")}
        labels={{ list: basePath === "/planning" ? t("plan.home.title", "Planning") : t("visit.views.list", "List"), calendar: t("visit.views.calendar", "Calendar"), map: t("visit.views.map", "Map"), workload: t("visit.views.workload", "Workload") }} />
      {error ? <div className="sq-banner sq-banner--critical" role="alert"><div>{t("visit.map.error", "Map data is temporarily unavailable. Please try again.")}</div></div>
        : <>
            <VisitMap visits={rows} strings={{
                region: t("visit.map.region", "Region"), allRegions: t("visit.map.allRegions", "All regions"),
                factoryVisitLegend: t("visit.map.legendFactory", "factory / visit"), inspectorLegend: t("visit.map.legendInspector", "latest inspector position"),
                noneInRegion: t("visit.map.empty", "No located visits in this region"), visit: t("visit.map.visit", "Visit"),
                factory: t("visit.map.factory", "Factory"), regionCity: t("visit.map.regionCity", "Region / city"),
                inspectorLocation: t("visit.map.inspectorLocation", "Inspector location"), state: t("visit.map.state", "State"),
                assignedInspector: t("visit.map.assignedInspector", "Assigned inspector"), inspectorFallback: t("visit.map.inspectorFallback", "Inspector"),
                unavailableScope: t("visit.map.unavailableScope", "Unavailable under current scope"), latestLocation: t("visit.map.latestLocation", "latest location"),
              }} locale={locale} />
            {/* INSP-697 — Figma SCR-PLN-200 (433:49148) Coverage Filters / Unassigned
                Visits / Regional Summary. Planning-only; /visits and /virtual keep
                the map exactly as it was. */}
            {basePath === "/planning" && <CoveragePanel visits={rows} strings={{
                title: t("plan.map.coverage.title", "Coverage filters"),
                filtersTitle: t("plan.map.coverage.filtersTitle", "Coverage filters"),
                regionLabel: t("visit.map.region", "Region"), allRegions: t("visit.map.allRegions", "All regions"),
                riskLabel: t("plan.map.coverage.riskLabel", "Risk band"), allRisk: t("plan.map.coverage.allRisk", "Any risk band"),
                riskHigh: t("enum.high", "high"), riskMedium: t("enum.medium", "medium"), riskLow: t("enum.low", "low"),
                windowLabel: t("plan.map.coverage.windowLabel", "Window"),
                window7: t("plan.map.coverage.window7", "Next 7 days"), window30: t("plan.map.coverage.window30", "Next 30 days"),
                window90: t("plan.map.coverage.window90", "Next 90 days"), windowAll: t("plan.map.coverage.windowAll", "Any window"),
                inspectorLabel: t("plan.map.coverage.inspectorLabel", "Inspector status"), inspectorAll: t("plan.map.coverage.inspectorAll", "Any status"),
                inspectorAssigned: t("plan.map.coverage.inspectorAssigned", "Assigned"), inspectorUnassigned: t("plan.map.coverage.inspectorUnassigned", "Unassigned"),
                resetLabel: t("plan.map.coverage.reset", "Reset"),
                unassignedCount: (n: number) => t("plan.map.coverage.unassignedCount", "{n} unassigned visits").replace("{n}", String(n)),
                unassignedEmpty: t("plan.map.coverage.unassignedEmpty", "No visits in this scope"),
                regionalTitle: t("plan.map.coverage.regionalTitle", "Regional visit coverage"),
                regionalHelp: t("plan.map.coverage.regionalHelp", "Located visits in the current filter, grouped by region"),
                visitsCount: (n: number) => t("plan.map.coverage.visitsCount", "{n} visits").replace("{n}", String(n)),
              }} />}
          </>}
    </Shell>
  );
}
