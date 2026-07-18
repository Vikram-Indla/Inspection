// M2-06 Spatial GIS & Maps — pure geo logic.
// TASK-MVP2-M2-06-SPATIAL-GIS-001 · MVP2-REQ-0087..0108 · CD-045.
// Deterministic, DB-free. POLICY (DEC-002): all thresholds/radii are the accepted
// engine_settings.gis values passed IN — none are hardcoded here. Mapbox is HELD.

export type GisPolicy = {
  gps_accuracy_checkin_max_m: number;
  geofence_default_radius_m: number;
  arrival_detection_radius_m: number;
};

/** Haversine distance in metres between two WGS84 points. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A check-in is accepted only when reported GPS accuracy is within the accepted
 *  engine_settings.gis threshold. Poor accuracy is a distinct, honest outcome. */
export function isCheckinAccuracyAcceptable(accuracyM: number, policy: GisPolicy): boolean {
  return Number.isFinite(accuracyM) && accuracyM >= 0 && accuracyM <= policy.gps_accuracy_checkin_max_m;
}

export type GeofenceResult = "inside" | "outside" | "unknown";

/** Geofence evaluation against the official pin using the accepted radius (or an
 *  explicit per-factory radius). Missing geometry → 'unknown', never a false pass. */
export function evaluateGeofence(
  point: { lat: number; lng: number } | null,
  official: { lat: number; lng: number } | null,
  radiusM: number | null,
  policy: GisPolicy,
): GeofenceResult {
  if (!point || !official) return "unknown";
  const r = radiusM && radiusM > 0 ? radiusM : policy.geofence_default_radius_m;
  return distanceMeters(point, official) <= r ? "inside" : "outside";
}

/** Sensitivity-class visibility: precise coordinates are shown only when the
 *  visibility matrix grants the viewer's role; otherwise the caller must mask. */
export function canViewPrecise(
  matrix: Array<{ sensitivityClass: string; roleKey: string; canViewPrecise: boolean }>,
  sensitivityClass: string,
  roles: string[],
): boolean {
  return matrix.some((m) => m.sensitivityClass === sensitivityClass && roles.includes(m.roleKey) && m.canViewPrecise);
}
