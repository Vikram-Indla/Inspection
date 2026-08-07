export type FactoryEmbed = {
  id: string; name: string; region: string | null; city: string | null;
  factory_code: string | null; source: string;
} | null;

export type VisitRow = {
  id: string;
  operational_state: string;
  planning_status: string;
  window_start: string;
  window_end: string;
  factory_id: string | null;
  factories: FactoryEmbed;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

export type GeoRow = {
  id: string; visit_id: string; kind: string; geofence_result: string | null;
  accuracy_m: number; occurred_at: string; observed_lat: number; observed_lng: number;
  integration_mode: string | null;
};

export type ActionRow = {
  id: string;
  form_type: string;
  owner_name: string | null;
  owner_role: string | null;
  due_at: string | null;
  status: string;
  is_blocking: boolean;
  required_correction: string | null;
  inspections: { visit_id: string; visits: { factories: {
    id: string; name: string; factory_code: string | null; region: string | null; city: string | null;
  } | null } | null } | null;
};

export type NotifRow = {
  id: string; event_key: string; channel: string; delivery_state: string; created_at: string;
};

export type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  geofence_radius_m: number | null; risk_score: number | null; risk_band: string | null;
  activity_class: string | null; factory_code: string | null; source: string;
};

export type EngineRow = { engine: string; settings: Record<string, unknown> };

export type OverrideRow = {
  id: string; visit_id: string; status: string; reason_label: string; explanation: string;
  safety_security_exception: boolean; observed_lat: number; observed_lng: number;
  accuracy_m: number; distance_m: number; device_occurred_at: string; requested_at: string; expires_at: string;
  visits: { factories: {
    name: string; region: string | null; city: string | null; factory_code: string | null;
  } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
};

export type EvidenceRow = { linked_id: string; storage_path: string | null };

export const OPERATIONS_SOURCE_KEYS = [
  "visits", "actions", "notifications", "factories", "settings",
  "risk", "overrides", "evidence", "geo",
] as const;

export type OperationsSourceKey = (typeof OPERATIONS_SOURCE_KEYS)[number];

export type OperationsSnapshot = {
  readonly visits: VisitRow[];
  readonly actions: ActionRow[];
  readonly notifications: NotifRow[];
  readonly factories: FactoryRow[];
  readonly settings: EngineRow[];
  readonly risk: FactoryRow[];
  readonly overrides: OverrideRow[];
  readonly evidence: EvidenceRow[];
  readonly geo: GeoRow[];
  readonly authorizedScope: string;
  readonly capturedAt: string;
  readonly failedSources: OperationsSourceKey[];
};
