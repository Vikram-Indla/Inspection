"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — arrival & geofence rules editor.
// These engine_settings.gis values are business-seeded (0001_foundation.sql),
// so editing them is configuration, not invention. Per-factory radius
// overrides stay in /admin/gis — noted in the section copy on the page.
import { useActionState } from "react";
import { saveGisRules } from "./actions";

export type GisRulesValue = {
  arrival_detection_radius_m: number | null;
  geofence_default_radius_m: number | null;
  gps_accuracy_checkin_max_m: number | null;
  telemetry_interval_s: number | null;
};

export type GisRulesLabels = {
  arrival: string;
  arrivalHint: string;
  geofence: string;
  geofenceHint: string;
  accuracy: string;
  accuracyHint: string;
  telemetry: string;
  telemetryHint: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

export default function GisRulesForm({ values, labels }: { values: GisRulesValue; labels: GisRulesLabels }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveGisRules(fd),
    {},
  );

  const field = (name: keyof GisRulesValue, label: string, hint: string) => (
    <div className="ax-field" style={{ maxInlineSize: 260 }}>
      <label className="ax-field__label" htmlFor={name}>{label}</label>
      <input
        className="ax-input ax-numeric" id={name} name={name}
        type="number" min={1} step={1} required defaultValue={values[name] ?? ""}
      />
      <p className="ax-caption" style={{ margin: 0 }}>{hint}</p>
    </div>
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="ax-row" style={{ gap: "var(--space-6)", flexWrap: "wrap" }}>
        {field("arrival_detection_radius_m", labels.arrival, labels.arrivalHint)}
        {field("geofence_default_radius_m", labels.geofence, labels.geofenceHint)}
        {field("gps_accuracy_checkin_max_m", labels.accuracy, labels.accuracyHint)}
        {field("telemetry_interval_s", labels.telemetry, labels.telemetryHint)}
      </div>
      <div className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
      </div>
      {state.error && <p className="ax-caption" role="alert" style={{ color: "var(--status-critical-text)", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
