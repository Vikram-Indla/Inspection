import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import VisitMap, { type MappedVisit } from "./VisitMap";

export const dynamic = "force-dynamic";

export default async function VisitsMapPage() {
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
    <Shell current="/visits" title="Visit management — map" context={<span className="ax-lozenge ax-lozenge--info">MVP1-M02-039 · RLS-scoped</span>}>
      <div className="ax-row" role="group" aria-label="Visit management views">
        <a className="ax-btn ax-btn--subtle" href="/visits">List</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/calendar">Calendar</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/workload">Workload</a>
        <a className="ax-btn ax-btn--secondary" aria-current="page" href="/visits/map">Map</a>
      </div>
      {error ? <div className="ax-banner ax-banner--critical" role="alert"><div>Map data is temporarily unavailable. Please try again.</div></div>
        : <VisitMap visits={rows} />}
    </Shell>
  );
}
