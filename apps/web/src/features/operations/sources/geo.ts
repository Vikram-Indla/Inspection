import { readPages, type ReadResult } from "@/lib/postgrest/read";
import type { OperationsClient } from "./client-type";
import type { GeoRow } from "../types";
import { geoRow } from "./shapes";

const CHUNK_SIZE = 100;

const GEO_COLUMNS =
  "id, visit_id, kind, geofence_result, accuracy_m, occurred_at, observed_lat, observed_lng, integration_mode";

function chunk(ids: readonly string[]): string[][] {
  return Array.from(
    { length: Math.ceil(ids.length / CHUNK_SIZE) },
    (_, index) => ids.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );
}

export async function loadGeoEvents(
  sb: OperationsClient,
  visitIds: readonly string[],
  nowIso: string,
): Promise<ReadResult<GeoRow>> {
  if (!visitIds.length) return { rows: [], failed: false, reason: null };
  const pages = await Promise.all(chunk(visitIds).map(group =>
    readPages((from, to) => sb.from("geo_events")
      .select(GEO_COLUMNS)
      .in("visit_id", group)
      .or("integration_mode.is.null,integration_mode.eq.production")
      .lte("occurred_at", nowIso)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to), geoRow, "operations.geo_events")));
  if (pages.some(page => page.failed)) return { rows: [], failed: true, reason: null };
  return { rows: pages.flatMap(page => page.rows), failed: false, reason: null };
}
