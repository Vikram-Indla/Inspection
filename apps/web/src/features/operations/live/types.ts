export type LiveFactoryRow = {
  id: string;
  name: string;
  region: string | null;
  city: string | null;
  official_lat: number | null;
  official_lng: number | null;
  source: string;
  is_temporary: boolean;
  factory_code: string | null;
};

export type LiveVisitFactory = LiveFactoryRow;

export type LiveVisitRow = {
  id: string;
  operational_state: string;
  planning_status: string;
  window_start: string | null;
  window_end: string | null;
  factory_id: string | null;
  notes: string | null;
  factories: LiveVisitFactory | null;
  assignments: { profiles: { full_name: string; email: string | null } | null }[] | null;
};

export type LiveGeoRow = {
  id: string;
  visit_id: string;
  observed_lat: number;
  observed_lng: number;
  occurred_at: string;
  integration_mode: string | null;
  kind: string;
};
