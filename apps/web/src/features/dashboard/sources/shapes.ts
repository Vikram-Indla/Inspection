import type {
  AuditRow, ChecklistItemRow, FactoryRef, GeoRow, InspectionRow,
  ResponseRow, ReviewRow, ViolationRow, VisitRow, VisitScopeRef,
} from "@/app/(app)/dashboard/metrics";
import type { Shape } from "@/lib/postgrest/shape";

const regulationRef: Shape<{ title: string; issuing_authority: string | null }> = f => ({
  title: f.text("title"),
  issuing_authority: f.optionalText("issuing_authority"),
});

const clauseRef: Shape<{ regulations: { title: string; issuing_authority: string | null } | null }> = f => ({
  regulations: f.toOne("regulations", regulationRef),
});

const visitScope: Shape<VisitScopeRef> = f => ({
  factory_id: f.optionalText("factory_id"),
  factories: null,
});

const scheduledVisitScope: Shape<VisitScopeRef & { window_start: string }> = f => ({
  ...visitScope(f),
  window_start: f.text("window_start"),
});

export const factoryRef: Shape<FactoryRef> = f => ({
  id: f.text("id"),
  name: f.text("name"),
  factory_code: f.optionalText("factory_code"),
  region: f.optionalText("region"),
  city: f.optionalText("city"),
  activity_class: f.optionalText("activity_class"),
  risk_score: f.optionalNumber("risk_score"),
  risk_band: f.optionalText("risk_band"),
  is_temporary: f.flag("is_temporary"),
  official_lat: f.optionalNumber("official_lat"),
  official_lng: f.optionalNumber("official_lng"),
  geofence_radius_m: f.optionalNumber("geofence_radius_m"),
});

export const visitRow: Shape<VisitRow> = f => ({
  ...visitScope(f),
  id: f.text("id"),
  planning_status: f.text("planning_status"),
  operational_state: f.text("operational_state"),
  window_start: f.text("window_start"),
  window_end: f.text("window_end"),
  priority: f.optionalText("priority"),
  cancellation_reason: f.optionalText("cancellation_reason"),
  created_at: f.text("created_at"),
  assignments: f.optionalToMany("assignments", assignment => ({
    inspector_id: assignment.text("inspector_id"),
    profiles: assignment.toOne("profiles", profile => ({ full_name: profile.text("full_name") })),
  })),
});

export const inspectionRow: Shape<InspectionRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  status: f.text("status"),
  started_at: f.optionalText("started_at"),
  submitted_at: f.optionalText("submitted_at"),
  visits: f.toOne("visits", scheduledVisitScope),
});

export const reviewRow: Shape<ReviewRow> = f => ({
  id: f.text("id"),
  inspection_id: f.text("inspection_id"),
  status: f.text("status"),
  decision: f.optionalText("decision"),
  decided_at: f.optionalText("decided_at"),
  inspections: f.toOne("inspections", inspection => ({
    submitted_at: inspection.optionalText("submitted_at"),
    visits: inspection.toOne("visits", scheduledVisitScope),
  })),
});

export const responseRow: Shape<ResponseRow> = f => ({
  inspection_id: f.text("inspection_id"),
  is_complete: f.flag("is_complete"),
  response: f.toOne("response", response => ({
    value: response.optionalText("value") ?? undefined,
  })),
  inspections: f.toOne("inspections", inspection => ({
    submitted_at: inspection.optionalText("submitted_at"),
    visits: inspection.toOne("visits", visitScope),
  })),
  inspection_items: f.toOne("inspection_items", item => ({
    regulation_clauses: item.toOne("regulation_clauses", clauseRef),
  })),
});

export const checklistItemRow: Shape<ChecklistItemRow> = f => ({
  id: f.text("id"),
  active: f.flag("active"),
  regulation_clauses: f.toOne("regulation_clauses", clause => ({
    regulations: clause.toOne("regulations", regulation => ({
      issuing_authority: regulation.optionalText("issuing_authority"),
      status: regulation.text("status"),
    })),
  })),
});

export const violationRow: Shape<ViolationRow> = f => ({
  id: f.text("id"),
  inspection_id: f.text("inspection_id"),
  inspections: f.toOne("inspections", inspection => ({
    submitted_at: inspection.optionalText("submitted_at"),
    visits: inspection.toOne("visits", visitScope),
  })),
  violation_codes: f.toOne("violation_codes", code => ({
    title: code.text("title"),
    level: code.text("level"),
    regulation_clauses: code.toOne("regulation_clauses", clauseRef),
  })),
});

export const geoRow: Shape<GeoRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  kind: f.text("kind"),
  geofence_result: f.optionalText("geofence_result"),
  override_reason: f.optionalText("override_reason"),
  occurred_at: f.text("occurred_at"),
  observed_lat: f.number("observed_lat"),
  observed_lng: f.number("observed_lng"),
  visits: f.toOne("visits", visit => ({
    ...visitScope(visit),
    planner_lat: visit.optionalNumber("planner_lat"),
    planner_lng: visit.optionalNumber("planner_lng"),
  })),
});

export const auditRow: Shape<AuditRow> = f => ({
  id: f.number("id"),
  object_type: f.text("object_type"),
  object_id: f.optionalText("object_id"),
  action: f.text("action"),
  requirement_refs: f.optionalTextList("requirement_refs"),
  occurred_at: f.text("occurred_at"),
});
