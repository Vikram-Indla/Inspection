export type GisLayer = {
  readonly id: string;
  readonly layer_key: string;
  readonly label: string;
  readonly layer_type: string;
  readonly active: boolean;
};

export type SpatialLocation = {
  readonly id: string;
  readonly factory_id: string | null;
  readonly source: string | null;
  readonly geofence_radius_m: number | null;
};

export type SpatialView = {
  readonly enabled: boolean;
  readonly layers: readonly GisLayer[];
  readonly locations: readonly SpatialLocation[];
  readonly canCreate: boolean;
  readonly failed: boolean;
};
