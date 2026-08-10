import type { GeoRow } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected } from "./paginate";
import type { DashboardClient, SourceBounds } from "./client-type";
import { geoRow } from "./shapes";

export function loadGeoEvents(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<GeoRow>> {
  return collect(geoRow, "dashboard.geo_events", (from, to) => sb.from("geo_events").select(`
      id, visit_id, kind, geofence_result, override_reason, occurred_at, observed_lat, observed_lng,
      visits(planner_lat, planner_lng, factory_id)
    `)
    .gte("occurred_at", bounds.boundIso)
    .range(from, to));
}
