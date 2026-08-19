export type GisFactory = {
  readonly id: string;
  readonly factory_code: string;
  readonly name: string;
  readonly city: string | null;
  readonly region: string | null;
  readonly official_lat: number | null;
  readonly official_lng: number | null;
  readonly risk_band: string | null;
  readonly risk_score: number | null;
  readonly geofence_radius_m: number | null;
};

export type GisSettings = {
  readonly gps_accuracy_checkin_max_m?: number;
  readonly arrival_detection_radius_m?: number;
  readonly geofence_default_radius_m?: number;
  readonly telemetry_interval_s?: number;
  readonly route_deviation?: unknown;
  readonly retention?: unknown;
};

export type GisView = {
  readonly factories: readonly GisFactory[];
  readonly settings: GisSettings;
  readonly versionLabel: string | null;
  readonly canEdit: boolean;
  readonly failed: boolean;
};
