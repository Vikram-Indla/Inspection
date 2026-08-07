import type { GeoRow } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected, type SourcePage } from "./paginate";
import type { DashboardClient, SourceBounds } from "./client-type";

export function loadGeoEvents(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<GeoRow>> {
  return collect<GeoRow>((from, to) => sb.from("geo_events").select(`
      id, visit_id, kind, geofence_result, override_reason, occurred_at, observed_lat, observed_lng,
      visits(planner_lat, planner_lng, factory_id)
    `)
    .gte("occurred_at", bounds.boundIso)
    .range(from, to) as unknown as PromiseLike<SourcePage<GeoRow>>);
}
