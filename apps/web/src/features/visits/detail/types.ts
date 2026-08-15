export type VisitFactory = {
  id: string; factory_code: string; name: string; cr_number: string;
  official_lat: number | null; official_lng: number | null;
  risk_band: string | null; is_temporary: boolean; source: string | null;
};

export type VisitPlan = {
  id: string; method: string; status: string;
  published_at: string | null; created_at: string;
  plan_reference: string | null; profiles: { full_name: string } | null;
};

export type VisitAssignment = {
  method: string; status: string; profiles: { full_name: string } | null;
};

export type VisitGeoEvent = {
  kind: string; accuracy_m: number | null; geofence_result: string | null;
  gis_version: string | null; occurred_at: string;
};

export type VisitJourney = { id: string; started_at: string; geo_events: VisitGeoEvent[] };

export type VisitInspection = {
  id: string; status: string;
  submission_versions: { version_number: number; submitted_at: string }[];
  reviews: { decision: string | null; status: string; returned_sections: string[] | null }[];
};

export type VisitRow = {
  id: string; visit_type: string; execution_mode: string;
  planning_status: string; planning_version: number; operational_state: string;
  window_start: string; window_end: string;
  cancellation_reason: string | null; notes: string | null;
  immediate_creator_role: string | null; source_channel: string | null;
  internal_reference: string | null; priority: string | null;
  visit_reference: string | null; expired_by_rule_id: string | null;
  package_version_id: string | null;
  planner_lat: number | null; planner_lng: number | null;
  original_lat: number | null; original_lng: number | null;
  visit_location_source: string | null; created_at: string;
  visit_plans: VisitPlan | null;
  factories: VisitFactory | null;
  package_versions: { version_label: string; packages: { code: string } | null } | null;
  assignments: VisitAssignment[] | null;
  journey_sessions: VisitJourney[] | null;
  inspections: VisitInspection | null;
};

export type AuditRow = {
  id: number; actor: string | null; action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  occurred_at: string;
};

export type LifecycleRow = {
  id: string; event_type: string; reason_key: string | null; comments: string | null;
  actor: string | null; previous: Record<string, unknown> | null; created_at: string;
};

export type LocationRow = {
  id: string; lat: number; lng: number; source: string;
  actor: string | null; note: string | null; created_at: string;
};

export type PackageLinkRow = {
  id: string; package_version_id: string; added_at: string;
  snapshot: Record<string, unknown> | null;
};

export type AttachmentSourceRow = {
  id: string; name: string; mime: string; storage_path: string;
  uploaded_at: string; uploader: { full_name: string } | null;
};

export type ActorProfileRow = { user_id: string; full_name: string };
