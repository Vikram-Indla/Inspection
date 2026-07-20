import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import VisitMap, { type MappedVisit } from "./VisitMap";

export const dynamic = "force-dynamic";

export default async function VisitsMapPage() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: visits, error }, { data: geo }] = await Promise.all([
    sb.from("visits").select(`id, factory_id, operational_state,
      factories(name, region, city, official_lat, official_lng),
      assignments(inspector_id, profiles(full_name))`).order("window_start", { ascending: false }).limit(1000),
    sb.from("geo_events").select("visit_id, observed_lat, observed_lng, occurred_at")
      .in("kind", ["telemetry", "arrival", "checkin", "override"]).order("occurred_at", { ascending: false }).limit(5000),
  ]);
  if (error) console.error(`[visits map] visit read failed: ${error.message}`);
  const latest = new Map<string, { observed_lat: number; observed_lng: number; occurred_at: string }>();
  for (const row of geo ?? []) if (!latest.has(row.visit_id)) latest.set(row.visit_id, row as never);
  const rows: MappedVisit[] = ((visits ?? []) as unknown as {
    id: string; factory_id: string; operational_state: string;
    factories: { name: string; region: string | null; city: string | null; official_lat: number | null; official_lng: number | null } | null;
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
    }];
  });
  return (
    <Shell current="/visits" title={t("visit.map.title", "Visit management — map")} context={<span className="ax-lozenge ax-lozenge--info">{t("visit.map.context", "Filtered to your access")}</span>}>
      <div className="ax-row" role="group" aria-label={t("visit.views.aria", "Visit management views")}>
        <a className="ax-btn ax-btn--subtle" href="/visits">{t("visit.views.list", "List")}</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/calendar">{t("visit.views.calendar", "Calendar")}</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/workload">{t("visit.views.workload", "Workload")}</a>
        <a className="ax-btn ax-btn--secondary" aria-current="page" href="/visits/map">{t("visit.views.map", "Map")}</a>
      </div>
      {error ? <div className="ax-banner ax-banner--critical" role="alert"><div>{t("visit.map.error", "Map data is temporarily unavailable. Please try again.")}</div></div>
        : <VisitMap visits={rows} strings={{
            region: t("visit.map.region", "Region"), allRegions: t("visit.map.allRegions", "All regions"),
            factoryVisitLegend: t("visit.map.legendFactory", "factory / visit"), inspectorLegend: t("visit.map.legendInspector", "latest inspector position"),
            noneInRegion: t("visit.map.empty", "No located visits in this region"), visit: t("visit.map.visit", "Visit"),
            factory: t("visit.map.factory", "Factory"), regionCity: t("visit.map.regionCity", "Region / city"),
            inspectorLocation: t("visit.map.inspectorLocation", "Inspector location"), state: t("visit.map.state", "State"),
            assignedInspector: t("visit.map.assignedInspector", "Assigned inspector"), inspectorFallback: t("visit.map.inspectorFallback", "Inspector"),
            unavailableScope: t("visit.map.unavailableScope", "Unavailable under current scope"), latestLocation: t("visit.map.latestLocation", "latest location"),
          }} />}
    </Shell>
  );
}
