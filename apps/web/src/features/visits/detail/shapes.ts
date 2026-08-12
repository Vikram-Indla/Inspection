import type { Shape } from "@/lib/postgrest/shape";
import type {
  AttachmentSourceRow, AuditRow, LifecycleRow, LocationRow, PackageLinkRow, VisitRow,
} from "./types";

const named: Shape<{ full_name: string }> = f => ({ full_name: f.text("full_name") });

export const visitDetailRow: Shape<VisitRow> = f => ({
  id: f.text("id"),
  visit_type: f.text("visit_type"),
  execution_mode: f.text("execution_mode"),
  planning_status: f.text("planning_status"),
  planning_version: f.number("planning_version"),
  operational_state: f.text("operational_state"),
  window_start: f.text("window_start"),
  window_end: f.text("window_end"),
  cancellation_reason: f.optionalText("cancellation_reason"),
  notes: f.optionalText("notes"),
  immediate_creator_role: f.optionalText("immediate_creator_role"),
  source_channel: f.optionalText("source_channel"),
  internal_reference: f.optionalText("internal_reference"),
  priority: f.optionalText("priority"),
  visit_reference: f.optionalText("visit_reference"),
  expired_by_rule_id: f.optionalText("expired_by_rule_id"),
  package_version_id: f.optionalText("package_version_id"),
  planner_lat: f.optionalNumber("planner_lat"),
  planner_lng: f.optionalNumber("planner_lng"),
  original_lat: f.optionalNumber("original_lat"),
  original_lng: f.optionalNumber("original_lng"),
  visit_location_source: f.optionalText("visit_location_source"),
  created_at: f.text("created_at"),
  visit_plans: f.toOne("visit_plans", plan => ({
    id: plan.text("id"),
    method: plan.text("method"),
    status: plan.text("status"),
    published_at: plan.optionalText("published_at"),
    created_at: plan.text("created_at"),
    plan_reference: plan.optionalText("plan_reference"),
    profiles: plan.toOne("profiles", named),
  })),
  factories: f.toOne("factories", factory => ({
    id: factory.text("id"),
    factory_code: factory.text("factory_code"),
    name: factory.text("name"),
    cr_number: factory.text("cr_number"),
    official_lat: factory.optionalNumber("official_lat"),
    official_lng: factory.optionalNumber("official_lng"),
    risk_band: factory.optionalText("risk_band"),
    is_temporary: factory.flag("is_temporary"),
    source: factory.optionalText("source"),
  })),
  package_versions: f.toOne("package_versions", version => ({
    version_label: version.text("version_label"),
    packages: version.toOne("packages", pkg => ({ code: pkg.text("code") })),
  })),
  assignments: f.optionalToMany("assignments", assignment => ({
    method: assignment.text("method"),
    status: assignment.text("status"),
    profiles: assignment.toOne("profiles", named),
  })),
  journey_sessions: f.optionalToMany("journey_sessions", session => ({
    id: session.text("id"),
    started_at: session.text("started_at"),
    geo_events: session.toMany("geo_events", event => ({
      kind: event.text("kind"),
      accuracy_m: event.optionalNumber("accuracy_m"),
      geofence_result: event.optionalText("geofence_result"),
      gis_version: event.optionalText("gis_version"),
      occurred_at: event.text("occurred_at"),
    })),
  })),
  inspections: f.toOne("inspections", inspection => ({
    id: inspection.text("id"),
    status: inspection.text("status"),
    submission_versions: inspection.toMany("submission_versions", version => ({
      version_number: version.number("version_number"),
      submitted_at: version.text("submitted_at"),
    })),
    reviews: inspection.toMany("reviews", review => ({
      decision: review.optionalText("decision"),
      status: review.text("status"),
      returned_sections: review.optionalTextList("returned_sections"),
    })),
  })),
});

export const auditRow: Shape<AuditRow> = f => ({
  id: f.text("id"),
  actor: f.optionalText("actor"),
  action: f.text("action"),
  before_state: f.optionalRecord("before_state"),
  after_state: f.optionalRecord("after_state"),
  occurred_at: f.text("occurred_at"),
});

export const lifecycleRow: Shape<LifecycleRow> = f => ({
  id: f.text("id"),
  event_type: f.text("event_type"),
  reason_key: f.optionalText("reason_key"),
  comments: f.optionalText("comments"),
  actor: f.optionalText("actor"),
  previous: f.optionalRecord("previous"),
  created_at: f.text("created_at"),
});

export const locationRow: Shape<LocationRow> = f => ({
  id: f.text("id"),
  lat: f.number("lat"),
  lng: f.number("lng"),
  source: f.text("source"),
  actor: f.optionalText("actor"),
  note: f.optionalText("note"),
  created_at: f.text("created_at"),
});

export const packageLinkRow: Shape<PackageLinkRow> = f => ({
  id: f.text("id"),
  package_version_id: f.text("package_version_id"),
  added_at: f.text("added_at"),
  snapshot: f.optionalRecord("snapshot"),
});

export const attachmentSourceRow: Shape<AttachmentSourceRow> = f => ({
  id: f.text("id"),
  name: f.text("name"),
  mime: f.text("mime"),
  storage_path: f.text("storage_path"),
  uploaded_at: f.text("uploaded_at"),
  uploader: f.toOne("uploader", named),
});
