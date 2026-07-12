// Shared shapes for the live operations prototype (server page → client map).
export type RagBand = "high" | "medium" | "low";

export type LiveFactory = {
  id: string;        // map key ("f:<uuid>")
  rawId: string;     // factory uuid for links
  name: string;      // real seeded name
  region: string | null;
  city: string | null;
  lat: number;
  lng: number;
  band: RagBand;
  riskScore: number | null;
};

export type LiveRegion = {
  id: string;
  name: string;
  lat: number;       // centroid of the region's factories
  lng: number;
  radiusM: number;
  posture: RagBand;  // aggregate inspection posture
  factories: number;
  avgRisk: number | null;
};

export type LiveInspector = {
  id: string;            // "i:<visitId>"
  inspector: string;
  factoryId: string;     // map key of the target factory ("f:<uuid>")
  factoryName: string;
  state: "on_the_way" | "arrived" | "executing";
  stateLabel: string;
  destLat: number;
  destLng: number;
  originLat: number;     // projected route origin (NOT live GPS)
  originLng: number;
  baseFraction: number;  // window-derived starting progress 0..1
  seed: number;          // per-inspector phase so they don't move in lockstep
  etaMin: number;        // nominal minutes for the full leg (label only)
};
