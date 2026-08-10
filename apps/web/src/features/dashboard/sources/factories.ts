import type { FactoryRef } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected } from "./paginate";
import type { DashboardClient } from "./client-type";
import { factoryRef } from "./shapes";

const FACTORY_COLUMNS =
  "id, name, factory_code, region, city, activity_class, risk_score, risk_band, is_temporary, official_lat, official_lng, geofence_radius_m";

export function loadFactories(sb: DashboardClient): Promise<Collected<FactoryRef>> {
  return collect(factoryRef, "dashboard.factories", (from, to) => sb.from("factories")
    .select(FACTORY_COLUMNS)
    .range(from, to));
}
