// WA-DES-034-C3 shapes (server page → client map). The page only carries
// read-only, RLS-visible operational facts and a single bounded projection.
// Retained for the separate Operations Center posture helper; Live does not
// render these bands as policy.
export type RagBand = "high" | "medium" | "low";

export type LiveFactory = {
  id: string;        // map key ("f:<uuid>")
  rawId: string;     // factory uuid for links
  name: string;
  region: string | null;
  city: string | null;
  lat: number;
  lng: number;
};

export type LiveRegion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type LiveInspector = {
  id: string;
  visitId: string;
  inspector: string;
  factoryId: string;
  factoryName: string;
  region: string;
  state: "on_the_way" | "arrived" | "executing";
  stateLabel: string;
  lat: number;
  lng: number;
  sinceLabel: string;
};
