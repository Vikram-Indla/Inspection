import type { Shape } from "@/lib/postgrest/shape";
import type { LiveFactoryRow, LiveGeoRow, LiveVisitRow } from "./types";

export const liveFactoryRow: Shape<LiveFactoryRow> = f => ({
  id: f.text("id"),
  name: f.text("name"),
  region: f.optionalText("region"),
  city: f.optionalText("city"),
  official_lat: f.optionalNumber("official_lat"),
  official_lng: f.optionalNumber("official_lng"),
  source: f.text("source"),
  is_temporary: f.flag("is_temporary"),
  factory_code: f.optionalText("factory_code"),
});

export const liveVisitRow: Shape<LiveVisitRow> = f => ({
  id: f.text("id"),
  operational_state: f.text("operational_state"),
  planning_status: f.text("planning_status"),
  window_start: f.optionalText("window_start"),
  window_end: f.optionalText("window_end"),
  factory_id: f.optionalText("factory_id"),
  notes: f.optionalText("notes"),
  factories: f.toOne("factories", liveFactoryRow),
  assignments: f.optionalToMany("assignments", assignment => ({
    profiles: assignment.toOne("profiles", profile => ({
      full_name: profile.text("full_name"),
      email: profile.optionalText("email"),
    })),
  })),
});

export const liveGeoRow: Shape<LiveGeoRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  observed_lat: f.number("observed_lat"),
  observed_lng: f.number("observed_lng"),
  occurred_at: f.text("occurred_at"),
  integration_mode: f.optionalText("integration_mode"),
  kind: f.text("kind"),
});
