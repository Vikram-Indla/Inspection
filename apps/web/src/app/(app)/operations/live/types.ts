// WA-DES-034-C3 shapes (server page → client map). The page only carries
// read-only, RLS-visible operational facts and a single bounded projection.
// Retained for the separate Operations Center posture helper; Live does not
// render these bands as policy.
export type RagBand = "high" | "medium" | "low";

// M3-MAP-PROVENANCE-001 — a factory's official coordinate may be absent on
// file; nullable lat/lng lets it still exist as a real, counted record while
// the map-rendering step (LiveMapInner) is the only place that skips a pin.
export type LiveFactory = {
  id: string;        // map key ("f:<uuid>")
  rawId: string;     // factory uuid for links
  name: string;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

export type LiveRegion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type LivePositionProvenance = "recorded" | "projected" | "unavailable";

// Three truthful states (M3-MAP-PROVENANCE-001 §3), never a fabricated
// route/origin/drift: "recorded" = a real telemetry/arrival/checkin
// geo_events row; "projected" = coalesce(planner, factory) coordinate tied
// to a real assignment + window_start; "unavailable" = neither resolves —
// the inspector stays in the accessible list with lat/lng null, never
// dropped.
export type LiveInspector = {
  id: string;
  visitId: string;
  inspector: string;
  factoryId: string;
  factoryName: string;
  region: string;
  state: "on_the_way" | "arrived" | "executing";
  stateLabel: string;
  lat: number | null;
  lng: number | null;
  provenance: LivePositionProvenance;
  observedAt?: string;
  accuracyM?: number;
  scheduledAt?: string;
  coordinateSource?: "planner" | "factory";
  sinceLabel: string;
};
