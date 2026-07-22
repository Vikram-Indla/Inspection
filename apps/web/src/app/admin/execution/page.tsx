import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import CapacityForm from "./CapacityForm";
import VisitModesForm, { type VisitModesValue } from "./VisitModesForm";
import ReasonsManager, { type ReasonRow } from "./ReasonsManager";
import GisRulesForm from "./GisRulesForm";
import EvidencePolicyForm, { type EvidenceTypeRule } from "./EvidencePolicyForm";
import OfflinePolicyForm from "./OfflinePolicyForm";
import RawJsonDetails from "./RawJsonDetails";

// TASK-EXECUTION-MODULE-001 · Phase 2A — Execution control plane.
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §27: governed forms over engine_settings for
// daily capacity, visit mode eligibility, cancellation/exception reasons,
// arrival/geofence rules, evidence policy and offline/sync policy. Access
// requires at least one admin execution capability; every section renders
// only when the caller holds that section's capability (has_capability RPC,
// checked server-side). Writes live in ./actions.ts; RLS engine_write remains
// the authority. Unset values are shown honestly as unset — never invented.
export const dynamic = "force-dynamic";

const PAGE_CAPABILITIES = [
  "admin.execution_workflow",
  "admin.execution_lookups",
  "admin.mode_eligibility",
  "admin.evidence_policy",
  "admin.offline_policy",
] as const;

type EngineRow = { settings: Record<string, unknown>; version_label: string; updated_at: string };

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);

function reasonsFrom(settings: Record<string, unknown>, key: string): ReasonRow[] {
  const list = settings[key];
  if (!Array.isArray(list)) return [];
  return list
    .map(entry => ({
      key: String((entry as ReasonRow)?.key ?? ""),
      en: String((entry as ReasonRow)?.en ?? ""),
      ar: String((entry as ReasonRow)?.ar ?? ""),
    }))
    .filter(row => row.key !== "");
}

export default async function ExecutionControlPlane() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  // Page access: any of the five admin execution capabilities. Per-section
  // rendering is gated on that section's own capability below.
  const capabilityChecks = user
    ? await Promise.all(PAGE_CAPABILITIES.map(cap => sb.rpc("has_capability", { p_capability: cap })))
    : [];
  const granted = new Set(
    PAGE_CAPABILITIES.filter((_, i) => capabilityChecks[i]?.data === true),
  );
  const canWorkflow = granted.has("admin.execution_workflow");
  const canModes = granted.has("admin.mode_eligibility");
  const canEvidence = granted.has("admin.evidence_policy");
  const canOffline = granted.has("admin.offline_policy");

  const [executionRes, fieldRes, gisRes, evidenceRes] = await Promise.all([
    sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "execution").maybeSingle(),
    sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "field").maybeSingle(),
    sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "gis").maybeSingle(),
    sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "evidence").maybeSingle(),
  ]);
  for (const [scope, res] of [["execution", executionRes], ["field", fieldRes], ["gis", gisRes], ["evidence", evidenceRes]] as const) {
    if (res.error) logProviderError(`admin execution ${scope} read`, res.error);
  }
  const execution = (executionRes.data ?? null) as EngineRow | null;
  const field = (fieldRes.data ?? null) as EngineRow | null;
  const gis = (gisRes.data ?? null) as EngineRow | null;
  const evidence = (evidenceRes.data ?? null) as EngineRow | null;

  const execSettings = execution?.settings ?? {};
  const modes = (execSettings.visit_modes ?? {}) as Record<string, Record<string, unknown>>;
  const offline = (execSettings.offline ?? {}) as Record<string, unknown>;
  const evidenceSettings = evidence?.settings ?? {};

  const visitModes: VisitModesValue = {
    physical: { enabled: bool(modes.physical?.enabled, false) },
    virtual: {
      enabled: bool(modes.virtual?.enabled, false),
      requires_otp: bool(modes.virtual?.requires_otp, true),
      requires_appointment: bool(modes.virtual?.requires_appointment, true),
    },
    self_assessment: {
      enabled: false,
      release_gate: String(modes.self_assessment?.release_gate ?? "release_2"),
    },
  };

  const evidenceTypes: EvidenceTypeRule[] = ["photo", "video", "document", "voice"].map(name => {
    const rule = evidenceSettings[name];
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      return { name, present: false, formats: [], maxMb: null, maxMinutes: null };
    }
    const r = rule as Record<string, unknown>;
    return {
      name,
      present: true,
      formats: Array.isArray(r.formats) ? r.formats.map(String) : [],
      maxMb: num(r.max_mb),
      maxMinutes: num(r.max_minutes),
    };
  });

  const journeyTiming = typeof execSettings.journey_start_timing === "string"
    ? execSettings.journey_start_timing
    : null;
  const onePenalty = execSettings.one_penalty_per_violation_phase1 === true;

  const sectionStyle = { padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)" } as const;

  return (
    <Shell
      current="/admin/execution"
      title={t("admin.execution.title", "Execution Settings")}
      context={<>
        <span className="ax-lozenge ax-lozenge--info">EXE-ADMIN · TASK-EXECUTION-MODULE-001</span>
        {execution?.version_label && <span className="ax-version">{execution.version_label}</span>}
      </>}
    >
      <div className="ax-stack" style={{ gap: "var(--space-6)" }}>
        <div className="ax-banner"><div>
          <strong>{t("admin.execution.banner.title", "This is the execution control plane.")}</strong>{" "}
          {t("admin.execution.banner.body", "Each section governs one part of the execution configuration. Every change is checked against your capabilities, written only to the keys that section owns, versioned, and recorded in the activity log. A value that has never been set is shown as unset — nothing is filled in by assumption.")}
        </div></div>

        {granted.size === 0 && (
          <EmptyState
            glyph="🔒"
            title={t("admin.execution.noAccess.title", "No execution configuration access")}
            body={t("admin.execution.noAccess.body", "None of the execution configuration capabilities are granted to your roles. The sections stay hidden; nothing here is readable or writable for you on this screen.")}
          />
        )}

        {canWorkflow && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-capacity-h">
            <h3 id="exec-capacity-h" style={{ margin: 0 }}>{t("admin.execution.capacity.title", "Daily capacity & journey")}</h3>
            <CapacityForm
              cap={num(execSettings.daily_visit_cap)}
              labels={{
                capLabel: t("admin.execution.capacity.capLabel", "Daily visit capacity per inspector"),
                capHint: t("admin.execution.capacity.capHint", "Whole number of at least 1. Planning and Pre-Execution share this single number."),
                save: t("admin.execution.save", "Save configuration"),
                saving: t("admin.execution.saving", "Saving…"),
                saved: t("admin.execution.saved", "saved — effective immediately"),
              }}
            />
            <div>
              <b>{t("admin.execution.journey.title", "Journey-start timing policy")}</b>
              {journeyTiming === "inside_visit_window" ? (
                <p className="ax-caption" style={{ margin: 0 }}>
                  {t("admin.execution.journey.insideWindow", "Starting the journey is allowed before or on the Execution Date. Starting after the Execution Date but still inside the visit window records an overdue warning and an activity-log entry. Starting outside the visit window is blocked.")}
                </p>
              ) : (
                <p className="ax-caption" style={{ margin: 0 }}>
                  {t("admin.execution.journey.notConfigured", "Not configured — journey starts fail closed until a policy is set.")}
                </p>
              )}
              <p className="ax-caption" style={{ margin: 0 }}>
                {t("admin.execution.journey.readonly", "This policy is read-only here; it changes only through a governed release decision.")}
              </p>
            </div>
            <div>
              <span className="ax-lozenge ax-lozenge--info">{t("admin.execution.invariant.label", "Governed invariant")}</span>{" "}
              <span>{t("admin.execution.invariant.onePenalty", "One penalty per violation (Phase 1)")}</span>{" "}
              <span className="ax-caption">
                {onePenalty
                  ? t("admin.execution.invariant.active", "Active — not editable on this screen.")
                  : t("admin.execution.invariant.unknown", "Not configured on the execution row — treated as unset.")}
              </span>
            </div>
          </section>
        )}

        {canModes && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-modes-h">
            <h3 id="exec-modes-h" style={{ margin: 0 }}>{t("admin.execution.modes.title", "Visit mode eligibility")}</h3>
            <VisitModesForm
              modes={visitModes}
              labels={{
                physical: t("admin.execution.modes.physical", "Physical visit"),
                virtual: t("admin.execution.modes.virtual", "Virtual visit"),
                virtualOtp: t("admin.execution.modes.virtualOtp", "Virtual visits require a one-time passcode"),
                virtualAppointment: t("admin.execution.modes.virtualAppointment", "Virtual visits require an appointment"),
                selfAssessment: t("admin.execution.modes.selfAssessment", "Self-assessment"),
                selfAssessmentGate: t("admin.execution.modes.selfAssessmentGate", "Release 2 — stays disabled in Release 1"),
                failClosedNote: t("admin.execution.modes.failClosed", "A mode that is not enabled here is never offered to planners or inspectors."),
                save: t("admin.execution.save", "Save configuration"),
                saving: t("admin.execution.saving", "Saving…"),
                saved: t("admin.execution.saved", "saved — effective immediately"),
              }}
            />
          </section>
        )}

        {canWorkflow && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-reasons-h">
            <h3 id="exec-reasons-h" style={{ margin: 0 }}>{t("admin.execution.reasons.title", "Cancellation & exception reasons")}</h3>
            {field ? (
              <ReasonsManager
                cancellationReasons={reasonsFrom(field.settings, "cancellation_reasons")}
                geoOverrideReasons={reasonsFrom(field.settings, "geo_override_reasons")}
                labels={{
                  cancellationTitle: t("admin.execution.reasons.cancellation.title", "Visit cancellation reasons"),
                  cancellationHint: t("admin.execution.reasons.cancellation.hint", "Inspectors pick from this list when requesting a cancellation. Keys are stable ids — the field app validates against them. The “other” reason carries the mandatory-comment rule and cannot be removed."),
                  geoTitle: t("admin.execution.reasons.geo.title", "Location override reasons"),
                  geoHint: t("admin.execution.reasons.geo.hint", "Inspectors pick from this list when a check-in falls outside the fence. The “safety_security” reason carries the photo-evidence exception and cannot be removed."),
                  colKey: t("admin.execution.reasons.col.key", "Key (stable id)"),
                  colEn: t("admin.execution.reasons.col.en", "English label"),
                  colAr: t("admin.execution.reasons.col.ar", "Arabic label"),
                  colActions: t("admin.execution.reasons.col.actions", "Actions"),
                  add: t("admin.execution.reasons.add", "Add reason"),
                  remove: t("admin.execution.reasons.remove", "Remove"),
                  moveUp: t("admin.execution.reasons.moveUp", "Move up"),
                  moveDown: t("admin.execution.reasons.moveDown", "Move down"),
                  protectedReason: t("admin.execution.reasons.protected", "Required rule"),
                  newKeyPlaceholder: t("admin.execution.reasons.newKey", "lowercase_key"),
                  save: t("admin.execution.save", "Save configuration"),
                  saving: t("admin.execution.saving", "Saving…"),
                  saved: t("admin.execution.saved", "saved — effective immediately"),
                }}
              />
            ) : (
              <p className="ax-caption" style={{ margin: 0 }}>
                {t("admin.execution.reasons.unavailable", "The field configuration row is not available, so the governed reason lists cannot be shown. Nothing is displayed as a substitute.")}
              </p>
            )}
          </section>
        )}

        {canWorkflow && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-gis-h">
            <h3 id="exec-gis-h" style={{ margin: 0 }}>{t("admin.execution.gis.title", "Arrival & geofence rules")}</h3>
            {gis ? (
              <>
                <GisRulesForm
                  values={{
                    arrival_detection_radius_m: num(gis.settings.arrival_detection_radius_m),
                    geofence_default_radius_m: num(gis.settings.geofence_default_radius_m),
                    gps_accuracy_checkin_max_m: num(gis.settings.gps_accuracy_checkin_max_m),
                    telemetry_interval_s: num(gis.settings.telemetry_interval_s),
                  }}
                  labels={{
                    arrival: t("admin.execution.gis.arrival", "Arrival detection radius (m)"),
                    arrivalHint: t("admin.execution.gis.arrivalHint", "A check-in inside this radius counts as arrived."),
                    geofence: t("admin.execution.gis.geofence", "Default geofence radius (m)"),
                    geofenceHint: t("admin.execution.gis.geofenceHint", "Used when a factory has no override of its own."),
                    accuracy: t("admin.execution.gis.accuracy", "Check-in GPS accuracy (m)"),
                    accuracyHint: t("admin.execution.gis.accuracyHint", "Check-ins with worse accuracy than this are refused."),
                    telemetry: t("admin.execution.gis.telemetry", "Telemetry interval (s)"),
                    telemetryHint: t("admin.execution.gis.telemetryHint", "How often position updates are recorded during a journey."),
                    save: t("admin.execution.save", "Save configuration"),
                    saving: t("admin.execution.saving", "Saving…"),
                    saved: t("admin.execution.saved", "saved — effective immediately"),
                  }}
                />
                <p className="ax-caption" style={{ margin: 0 }}>
                  {t("admin.execution.gis.perFactory", "Per-factory geofence radius overrides stay in Map Settings (/admin/gis); this screen governs only the shared defaults.")}
                </p>
              </>
            ) : (
              <p className="ax-caption" style={{ margin: 0 }}>
                {t("admin.execution.gis.unavailable", "The GIS configuration row is not available, so arrival and geofence rules cannot be shown.")}
              </p>
            )}
          </section>
        )}

        {canEvidence && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-evidence-h">
            <h3 id="exec-evidence-h" style={{ margin: 0 }}>{t("admin.execution.evidence.title", "Evidence policy")}</h3>
            {evidence ? (
              <>
                <EvidencePolicyForm
                  types={evidenceTypes}
                  retentionYears={num(evidenceSettings.retention_years)}
                  labels={{
                    colType: t("admin.execution.evidence.col.type", "Evidence type"),
                    colFormats: t("admin.execution.evidence.col.formats", "Allowed file types"),
                    colMaxSize: t("admin.execution.evidence.col.maxSize", "Max size (MB)"),
                    colMaxDuration: t("admin.execution.evidence.col.maxDuration", "Max duration (min)"),
                    notConfigured: t("admin.execution.evidence.notConfigured", "Not configured"),
                    notConfiguredHint: t("admin.execution.evidence.notConfiguredHint", "absent from the policy — this type is not permitted until configured"),
                    formatsHint: t("admin.execution.evidence.formatsHint", "Comma-separated, e.g. jpeg, png"),
                    retentionLabel: t("admin.execution.evidence.retention", "Evidence retention (years)"),
                    retentionHint: t("admin.execution.evidence.retentionHint", "Whole number of years, at least 1."),
                    save: t("admin.execution.save", "Save configuration"),
                    saving: t("admin.execution.saving", "Saving…"),
                    saved: t("admin.execution.saved", "saved — effective immediately"),
                  }}
                />
                <div>
                  <span className="ax-lozenge ax-lozenge--info">{t("admin.execution.invariant.label", "Governed invariant")}</span>{" "}
                  <span>{t("admin.execution.evidence.hash", "Integrity hash: sha256 at sync")}</span>{" "}
                  <span className="ax-caption">{t("admin.execution.evidence.hashNote", "Not editable — every evidence record is hashed when it syncs.")}</span>
                </div>
                <p className="ax-caption" style={{ margin: 0 }}>
                  {t("admin.execution.evidence.multiplicity", "Per-item multiplicity bounds (minimum/maximum captures per evidence requirement): not configured — absent bounds are treated as not permitted, never assumed.")}
                </p>
              </>
            ) : (
              <p className="ax-caption" style={{ margin: 0 }}>
                {t("admin.execution.evidence.unavailable", "The evidence configuration row is not available, so the evidence policy cannot be shown.")}
              </p>
            )}
          </section>
        )}

        {canOffline && (
          <section className="ax-surface" style={sectionStyle} aria-labelledby="exec-offline-h">
            <h3 id="exec-offline-h" style={{ margin: 0 }}>{t("admin.execution.offline.title", "Offline & sync policy")}</h3>
            <OfflinePolicyForm
              maxSyncAttempts={num(offline.max_sync_attempts)}
              autosaveSeconds={num(offline.autosave_interval_s)}
              labels={{
                attemptsLabel: t("admin.execution.offline.attempts", "Maximum sync attempts"),
                attemptsHint: t("admin.execution.offline.attemptsHint", "Whole number between 1 and 100. Leave empty for the platform default."),
                autosaveLabel: t("admin.execution.offline.autosave", "Autosave interval (seconds)"),
                autosaveHint: t("admin.execution.offline.autosaveHint", "Whole number of seconds between 5 and 600. Leave empty for the platform default."),
                currentValue: t("admin.execution.offline.currentValue", "set to"),
                platformDefault: t("admin.execution.offline.platformDefault", "platform default"),
                unsetNote: t("admin.execution.offline.unsetNote", "These values have not been supplied by the business. An empty field is an honest unset: the current platform behavior applies and no number is assumed."),
                save: t("admin.execution.save", "Save configuration"),
                saving: t("admin.execution.saving", "Saving…"),
                saved: t("admin.execution.saved", "saved — effective immediately"),
              }}
            />
          </section>
        )}

        {granted.size > 0 && (
          <div className="ax-stack" style={{ gap: "var(--space-4)" }}>
            <h4 style={{ margin: 0 }}>{t("admin.execution.raw.title", "Stored engine rows")}</h4>
            <p className="ax-caption" style={{ margin: 0 }}>
              {t("admin.execution.raw.hint", "Read-only inspection of the exact stored configuration. The governed forms above are the supported editing path.")}
            </p>
            {execution && <RawJsonDetails engine="execution" json={execution.settings} />}
            {field && <RawJsonDetails engine="field" json={field.settings} />}
            {gis && <RawJsonDetails engine="gis" json={gis.settings} />}
            {evidence && <RawJsonDetails engine="evidence" json={evidence.settings} />}
          </div>
        )}
      </div>
    </Shell>
  );
}
