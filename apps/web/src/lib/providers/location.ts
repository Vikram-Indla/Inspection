// Cycle 2 Wave 2.C — Location/GPS/Geofence simulator.
// FEATURE_LOCATION_SOURCE=device|simulator|off. The real production path
// (browser Geolocation API + the governed geo_events/geo_override_requests
// tables from supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql)
// is untouched by this module. This adapter exists only for dev/test/staging
// GPS scenarios that are impractical to reproduce with a real device.
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type LocationSample = {
  lat: number; lng: number; accuracyMeters: number; observedAt: string;
  mode: "accurate" | "weak_accuracy" | "stale_timestamp" | "permission_denied" | "no_signal";
};

export type GeofenceCheck = {
  insideFence: boolean;
  distanceMeters: number;
  routeDeviation: boolean;
  arrived: boolean;
};

export interface LocationProvider {
  readonly name: "device" | "simulator";
  sample(seed: string): Promise<LocationSample>;
  checkGeofence(sample: LocationSample, centerLat: number, centerLng: number, radiusMeters: number, seed: string): GeofenceCheck;
}

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Deterministic dev/test GPS simulator. `seed` (e.g. a visit/journey id)
 * selects the scenario reproducibly. Every sample carries its `mode` so a
 * caller can render an honest state (never silently substitute a stale/weak
 * fix for a confident one).
 */
export class SimulatorLocationProvider implements LocationProvider {
  readonly name = "simulator" as const;

  constructor() { assertNonProduction("SimulatorLocationProvider"); }

  async sample(seed: string): Promise<LocationSample> {
    const f = seededFraction(seed);
    const baseLat = 24.7136, baseLng = 46.6753; // Riyadh reference point — fixture only
    const jitter = (seededFraction(`${seed}:jitter`) - 0.5) * 0.01;
    if (f < 0.08) return { lat: baseLat, lng: baseLng, accuracyMeters: 0, observedAt: new Date().toISOString(), mode: "permission_denied" };
    if (f < 0.16) return { lat: baseLat, lng: baseLng, accuracyMeters: 0, observedAt: new Date().toISOString(), mode: "no_signal" };
    if (f < 0.3) return { lat: baseLat + jitter, lng: baseLng + jitter, accuracyMeters: 250, observedAt: new Date().toISOString(), mode: "weak_accuracy" };
    if (f < 0.4) return { lat: baseLat + jitter, lng: baseLng + jitter, accuracyMeters: 15, observedAt: new Date(Date.now() - 15 * 60_000).toISOString(), mode: "stale_timestamp" };
    return { lat: baseLat + jitter, lng: baseLng + jitter, accuracyMeters: 12, observedAt: new Date().toISOString(), mode: "accurate" };
  }

  checkGeofence(sample: LocationSample, centerLat: number, centerLng: number, radiusMeters: number, seed: string): GeofenceCheck {
    if (sample.mode === "permission_denied" || sample.mode === "no_signal") {
      return { insideFence: false, distanceMeters: -1, routeDeviation: false, arrived: false };
    }
    const distanceMeters = Math.round(haversineMeters(sample.lat, sample.lng, centerLat, centerLng));
    const insideFence = distanceMeters <= radiusMeters;
    // "authorized override" and "route deviation" are separate governed
    // concepts already covered by geo_override_requests — this simulator only
    // reports the raw geometric fact so the same real guard code path
    // (the DB constraint trigger + Ops approval workflow) decides the rest.
    const routeDeviation = seededFraction(`${seed}:deviation`) < 0.15 && !insideFence;
    const arrived = insideFence && sample.mode === "accurate";
    return { insideFence, distanceMeters, routeDeviation, arrived };
  }
}

export const LOCATION_SOURCE_MODES = ["device", "simulator", "off"] as const;
export type LocationSourceMode = (typeof LOCATION_SOURCE_MODES)[number];

export function selectLocationProvider(): LocationProvider | null {
  const mode = resolveFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_LOCATION_SOURCE, LOCATION_SOURCE_MODES, "device");
  if (mode === "off" || mode === "device") return null; // "device" = use the real browser Geolocation API, unchanged
  return new SimulatorLocationProvider();
}
