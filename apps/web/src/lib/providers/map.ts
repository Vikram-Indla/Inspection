// Cycle 2 Wave 2.B — Map/geocoding/routing provider adapter.
//
// A Mapbox MCP was referenced by the task prompt but was not discoverable in
// this session's tool registry (ToolSearch "mapbox" returned no match) — this
// module does NOT fabricate a Mapbox integration or hardcode a token. The
// repo's real map rendering today is Leaflet + CARTO tiles
// (StoryMapInner.tsx, LiveMapInner.tsx, GeoMap.tsx) and stays as-is; this
// adapter only covers the app-facing geocoding/directions/ETA surface that
// has no implementation at all today (confirmed: zero "mapbox" hits repo-wide).
//
// FEATURE_MAP_PROVIDER=mapbox|stub|off — "mapbox" is defined here as an
// interface contract only; it is NOT wired to a real Mapbox client (no
// credential is configured in this environment) and must never be reported
// as real-provider-certified. Selecting it without MAPBOX_ACCESS_TOKEN set
// falls back to "stub" (fail closed, never a silent invented network call).
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type LngLat = { lng: number; lat: number };

export type GeocodeResult = { query: string; match: LngLat | null; provider: "stub" | "mapbox"; fixtureId: string };
export type DirectionsResult =
  | { ok: true; distanceMeters: number; durationSeconds: number; polyline: LngLat[]; provider: "stub" | "mapbox"; fixtureId: string }
  | { ok: false; reason: "no_route" | "tile_failure" | "token_failure"; provider: "stub" | "mapbox"; fixtureId: string };

export interface MapProvider {
  readonly name: "stub" | "mapbox";
  readonly certified: boolean; // true only after sandbox/real contract tests pass — always false for "stub"
  geocode(query: string): Promise<GeocodeResult>;
  directions(from: LngLat, to: LngLat, requestId: string): Promise<DirectionsResult>;
  health(): Promise<{ available: boolean; detail?: string }>;
}

const KSA_BOUNDS = { minLat: 16, maxLat: 32, minLng: 34, maxLng: 56 };

export class StubMapProvider implements MapProvider {
  readonly name = "stub" as const;
  readonly certified = false;

  constructor() { assertNonProduction("StubMapProvider"); }

  async geocode(query: string): Promise<GeocodeResult> {
    const fixtureId = `geo-fixture-${query.length}`;
    const f = seededFraction(query);
    if (f < 0.1 || !query.trim()) return { query, match: null, provider: "stub", fixtureId };
    const lat = KSA_BOUNDS.minLat + f * (KSA_BOUNDS.maxLat - KSA_BOUNDS.minLat);
    const lng = KSA_BOUNDS.minLng + seededFraction(`${query}:lng`) * (KSA_BOUNDS.maxLng - KSA_BOUNDS.minLng);
    return { query, match: { lat, lng }, provider: "stub", fixtureId };
  }

  async directions(from: LngLat, to: LngLat, requestId: string): Promise<DirectionsResult> {
    const fixtureId = `dir-fixture-${requestId.slice(0, 8)}`;
    const f = seededFraction(requestId);
    if (f < 0.05) return { ok: false, reason: "tile_failure", provider: "stub", fixtureId };
    if (f < 0.1) return { ok: false, reason: "token_failure", provider: "stub", fixtureId };
    if (f < 0.15) return { ok: false, reason: "no_route", provider: "stub", fixtureId };
    const distanceMeters = Math.round(1000 + f * 40000);
    const durationSeconds = Math.round(distanceMeters / 12); // ~43km/h average
    return {
      ok: true, distanceMeters, durationSeconds,
      polyline: [from, { lng: (from.lng + to.lng) / 2, lat: (from.lat + to.lat) / 2 }, to],
      provider: "stub", fixtureId,
    };
  }

  async health(): Promise<{ available: boolean; detail?: string }> {
    return { available: true, detail: "stub provider — always available, never a real network dependency" };
  }
}

/**
 * Real Mapbox HTTP API client (Geocoding v6 + Directions v5). Plain fetch —
 * no mapbox-gl/SDK dependency needed for the server-side geocode/directions
 * surface this adapter covers. `certified` stays false: this has NEVER been
 * exercised against a live Mapbox account (no MAPBOX_ACCESS_TOKEN exists in
 * any environment this task had access to — see MAPBOX_INTEGRATION_REPORT.md
 * in the Cycle 2 handoff). Do not report this as production-certified until
 * a real token is supplied and the sandbox contract tests in
 * apps/web/e2e/cycle2-wave2-providers.spec.ts are re-run against it.
 */
export class RealMapboxProvider implements MapProvider {
  readonly name = "mapbox" as const;
  readonly certified = false;

  constructor(private readonly token: string) {}

  async geocode(query: string): Promise<GeocodeResult> {
    const fixtureId = `mapbox-live-${Date.now()}`;
    if (!query.trim()) return { query, match: null, provider: "mapbox", fixtureId };
    try {
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&country=sa&limit=1&access_token=${encodeURIComponent(this.token)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) { console.error(`[mapbox geocode] HTTP ${res.status}`); return { query, match: null, provider: "mapbox", fixtureId }; }
      const body = await res.json() as { features?: { geometry?: { coordinates?: [number, number] } }[] };
      const coords = body.features?.[0]?.geometry?.coordinates;
      return { query, match: coords ? { lng: coords[0], lat: coords[1] } : null, provider: "mapbox", fixtureId };
    } catch (e) {
      console.error("[mapbox geocode]", e);
      return { query, match: null, provider: "mapbox", fixtureId };
    }
  }

  async directions(from: LngLat, to: LngLat, requestId: string): Promise<DirectionsResult> {
    const fixtureId = `mapbox-live-${requestId.slice(0, 8)}`;
    try {
      const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${encodeURIComponent(this.token)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.status === 401 || res.status === 403) return { ok: false, reason: "token_failure", provider: "mapbox", fixtureId };
      if (!res.ok) return { ok: false, reason: "tile_failure", provider: "mapbox", fixtureId };
      const body = await res.json() as { routes?: { distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }[] };
      const route = body.routes?.[0];
      if (!route) return { ok: false, reason: "no_route", provider: "mapbox", fixtureId };
      return {
        ok: true,
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        polyline: (route.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lng, lat })),
        provider: "mapbox", fixtureId,
      };
    } catch (e) {
      console.error("[mapbox directions]", e);
      return { ok: false, reason: "tile_failure", provider: "mapbox", fixtureId };
    }
  }

  async health(): Promise<{ available: boolean; detail?: string }> {
    try {
      const res = await fetch(`https://api.mapbox.com/tokens/v2?access_token=${encodeURIComponent(this.token)}`, { signal: AbortSignal.timeout(5000) });
      return { available: res.ok, detail: res.ok ? "token validated" : `HTTP ${res.status}` };
    } catch (e) {
      return { available: false, detail: e instanceof Error ? e.message : "network error" };
    }
  }
}

export const MAP_PROVIDER_MODES = ["mapbox", "stub", "off"] as const;
export type MapProviderMode = (typeof MAP_PROVIDER_MODES)[number];

export function selectMapProvider(): MapProvider | null {
  const mode = resolveFeatureFlag(process.env.FEATURE_MAP_PROVIDER, MAP_PROVIDER_MODES, "stub");
  if (mode === "off") return null;
  if (mode === "mapbox") {
    // Fail closed: without a real token there is nothing to call.
    if (!process.env.MAPBOX_ACCESS_TOKEN) return new StubMapProvider();
    return new RealMapboxProvider(process.env.MAPBOX_ACCESS_TOKEN);
  }
  return new StubMapProvider();
}
