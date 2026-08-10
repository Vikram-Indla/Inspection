import type { Shape } from "@/lib/postgrest/shape";
import type {
  ActionRow, EngineRow, EvidenceRow, FactoryEmbed, FactoryRow,
  GeoRow, NotifRow, OverrideRow, VisitRow,
} from "../types";

type NamedFactory = {
  name: string; region: string | null; city: string | null; factory_code: string | null;
};

const inspectorName: Shape<{ full_name: string }> = f => ({ full_name: f.text("full_name") });

const assignment: Shape<{ profiles: { full_name: string } | null }> = f => ({
  profiles: f.toOne("profiles", inspectorName),
});

const namedFactory: Shape<NamedFactory> = f => ({
  name: f.text("name"),
  region: f.optionalText("region"),
  city: f.optionalText("city"),
  factory_code: f.optionalText("factory_code"),
});

const factoryEmbed: Shape<NonNullable<FactoryEmbed>> = f => ({
  ...namedFactory(f),
  id: f.text("id"),
  source: f.text("source"),
});

export const visitRow: Shape<VisitRow> = f => ({
  id: f.text("id"),
  operational_state: f.text("operational_state"),
  planning_status: f.text("planning_status"),
  window_start: f.text("window_start"),
  window_end: f.text("window_end"),
  factory_id: f.optionalText("factory_id"),
  factories: f.toOne("factories", factoryEmbed),
  assignments: f.optionalToMany("assignments", assignment),
});

export const actionRow: Shape<ActionRow> = f => ({
  id: f.text("id"),
  form_type: f.text("form_type"),
  owner_name: f.optionalText("owner_name"),
  owner_role: f.optionalText("owner_role"),
  due_at: f.optionalText("due_at"),
  status: f.text("status"),
  is_blocking: f.flag("is_blocking"),
  required_correction: f.optionalText("required_correction"),
  inspections: f.toOne("inspections", inspection => ({
    visit_id: inspection.text("visit_id"),
    visits: inspection.toOne("visits", visit => ({
      factories: visit.toOne("factories", factory => ({
        ...namedFactory(factory),
        id: factory.text("id"),
      })),
    })),
  })),
});

export const factoryRow: Shape<FactoryRow> = f => ({
  ...namedFactory(f),
  id: f.text("id"),
  source: f.text("source"),
  official_lat: f.optionalNumber("official_lat"),
  official_lng: f.optionalNumber("official_lng"),
  geofence_radius_m: f.optionalNumber("geofence_radius_m"),
  risk_score: f.optionalNumber("risk_score"),
  risk_band: f.optionalText("risk_band"),
  activity_class: f.optionalText("activity_class"),
});

export const notifRow: Shape<NotifRow> = f => ({
  id: f.text("id"),
  event_key: f.text("event_key"),
  channel: f.text("channel"),
  delivery_state: f.text("delivery_state"),
  created_at: f.text("created_at"),
});

export const engineRow: Shape<EngineRow> = f => ({
  engine: f.text("engine"),
  settings: f.optionalRecord("settings") ?? {},
});

export const overrideRow: Shape<OverrideRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  status: f.text("status"),
  reason_label: f.text("reason_label"),
  explanation: f.text("explanation"),
  safety_security_exception: f.flag("safety_security_exception"),
  observed_lat: f.number("observed_lat"),
  observed_lng: f.number("observed_lng"),
  accuracy_m: f.number("accuracy_m"),
  distance_m: f.number("distance_m"),
  device_occurred_at: f.text("device_occurred_at"),
  requested_at: f.text("requested_at"),
  expires_at: f.text("expires_at"),
  visits: f.toOne("visits", visit => ({
    factories: visit.toOne("factories", namedFactory),
    assignments: visit.optionalToMany("assignments", assignment),
  })),
});

export const evidenceRow: Shape<EvidenceRow> = f => ({
  linked_id: f.text("linked_id"),
  storage_path: f.optionalText("storage_path"),
});

export const geoRow: Shape<GeoRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  kind: f.text("kind"),
  geofence_result: f.optionalText("geofence_result"),
  accuracy_m: f.number("accuracy_m"),
  occurred_at: f.text("occurred_at"),
  observed_lat: f.number("observed_lat"),
  observed_lng: f.number("observed_lng"),
  integration_mode: f.optionalText("integration_mode"),
});
