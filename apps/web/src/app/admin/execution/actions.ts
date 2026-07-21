"use server";
// TASK-EXECUTION-MODULE-001 · Phase 2A — Execution control plane writes.
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §27: Admin governs daily visit capacity,
// visit mode eligibility, cancellation/exception reasons, arrival/geofence
// rules, evidence policy and offline/sync policy. Every action:
//   (1) verifies the caller (getVerifiedUser),
//   (2) checks the section capability through the has_capability RPC,
//   (3) validates the payload,
//   (4) read-modify-writes ONLY the governed keys of the engine row —
//       unrelated keys are never clobbered,
//   (5) bumps version_label and sets updated_by,
//   (6) records an audit_events row (requirement_refs ['EXE-ADMIN']).
// RLS engine_write (0002_rbac_audit.sql) remains the authority; capability
// denial and RLS denial both surface as neutral errors. No policy value is
// invented here — unset values stay unset and fail closed.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import type { ExecutionCapability } from "@/lib/execution/capabilities";

export type ExecutionAdminResult = { ok?: boolean; error?: string };

type EngineSettings = Record<string, unknown>;

async function requireCapability(capability: ExecutionCapability) {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError || !user) {
    return { ok: false as const, error: "Your session has ended. Sign in again." };
  }
  const { data: allowed, error: capError } = await sb.rpc("has_capability", { p_capability: capability });
  if (capError) {
    logProviderError(`execution admin capability ${capability}`, capError);
    return { ok: false as const, error: "Your permissions could not be verified. Try again." };
  }
  if (allowed !== true) {
    return { ok: false as const, error: "You do not have permission to change this configuration." };
  }
  return { ok: true as const, sb, user };
}

async function writeGovernedKeys(options: {
  capability: ExecutionCapability;
  engine: string;
  section: string;
  governedKeys: string[];
  build: (current: EngineSettings) =>
    | { patch: Record<string, unknown>; error?: undefined }
    | { error: string; patch?: undefined };
}): Promise<ExecutionAdminResult> {
  const auth = await requireCapability(options.capability);
  if (!auth.ok) return { error: auth.error };
  const { sb, user } = auth;

  const { data: row, error: readError } = await sb
    .from("engine_settings")
    .select("settings")
    .eq("engine", options.engine)
    .maybeSingle();
  if (readError) {
    logProviderError(`execution admin ${options.section} read`, readError);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  if (!row) return { error: "This configuration is not available. Nothing was changed." };

  const current = (row.settings ?? {}) as EngineSettings;
  const built = options.build(current);
  if (built.error !== undefined) return { error: built.error };

  // Audit covers only the governed keys of this section — the full row would
  // bury the change under unrelated engines' values.
  const pick = (src: EngineSettings) =>
    Object.fromEntries(options.governedKeys.filter(k => k in src).map(k => [k, src[k]]));
  const before = pick(current);
  const next: EngineSettings = { ...current };
  for (const [key, value] of Object.entries(built.patch)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  const after = pick(next);

  const versionLabel = `v2026-07-21-${options.section}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const { error: updateError } = await sb.from("engine_settings")
    .update({
      settings: next,
      version_label: versionLabel,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("engine", options.engine);
  if (updateError) {
    logProviderError(`execution admin ${options.section} update`, updateError);
    return { error: NEUTRAL_WRITE_ERROR };
  }

  const { error: auditError } = await sb.from("audit_events").insert({
    actor: user.id,
    object_type: "engine_settings",
    // audit_events.object_id is uuid; the engine key is text, so the engine
    // name travels inside before/after state instead of a fabricated uuid.
    object_id: null,
    action: "execution_config_update",
    before_state: { engine: options.engine, governed: before },
    after_state: { engine: options.engine, governed: after, version_label: versionLabel },
    requirement_refs: ["EXE-ADMIN"],
  });
  if (auditError) logProviderError(`execution admin ${options.section} audit`, auditError);

  revalidatePath("/admin/execution");
  return { ok: true };
}

const checked = (formData: FormData, name: string) => formData.get(name) === "on";

// ---------- 1 · Daily capacity & journey (admin.execution_workflow) ---------
export async function saveDailyCapacity(formData: FormData): Promise<ExecutionAdminResult> {
  return writeGovernedKeys({
    capability: "admin.execution_workflow",
    engine: "execution",
    section: "daily-capacity",
    governedKeys: ["daily_visit_cap"],
    build: () => {
      const cap = Number(String(formData.get("daily_visit_cap") ?? "").trim());
      if (!Number.isInteger(cap) || cap < 1) {
        return { error: "Daily visit capacity must be a whole number of at least 1. Nothing was changed." };
      }
      return { patch: { daily_visit_cap: cap } };
    },
  });
}

// ---------- 2 · Visit mode eligibility (admin.mode_eligibility) -------------
export async function saveVisitModes(formData: FormData): Promise<ExecutionAdminResult> {
  // Release 1 gate (BRD): self-assessment can never be enabled from this
  // screen — hard validation, independent of what the client posts.
  if (checked(formData, "self_assessment_enabled")) {
    return { error: "Self-assessment stays disabled in Release 1 — it is gated to release_2 and cannot be enabled here. Nothing was changed." };
  }
  return writeGovernedKeys({
    capability: "admin.mode_eligibility",
    engine: "execution",
    section: "visit-modes",
    governedKeys: ["visit_modes"],
    build: () => ({
      patch: {
        visit_modes: {
          physical: { enabled: checked(formData, "physical_enabled") },
          virtual: {
            enabled: checked(formData, "virtual_enabled"),
            requires_otp: checked(formData, "virtual_requires_otp"),
            requires_appointment: checked(formData, "virtual_requires_appointment"),
          },
          self_assessment: { enabled: false, release_gate: "release_2" },
        },
      },
    }),
  });
}

// ---------- 3 · Cancellation & exception reasons (admin.execution_workflow) --
type Reason = { key: string; en: string; ar: string };

function parseReasons(raw: FormDataEntryValue | null, listLabel: string): { reasons?: Reason[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { error: `${listLabel} could not be read. Nothing was changed.` };
  }
  if (!Array.isArray(parsed) || parsed.length < 1) {
    return { error: `${listLabel}: at least one reason is required. Nothing was changed.` };
  }
  const seen = new Set<string>();
  const reasons: Reason[] = [];
  for (const entry of parsed as Reason[]) {
    const key = String(entry?.key ?? "").trim();
    const en = String(entry?.en ?? "").trim();
    const ar = String(entry?.ar ?? "").trim();
    if (!/^[a-z0-9_]+$/.test(key)) {
      return { error: `${listLabel}: every reason needs a stable key (lowercase letters, numbers, underscores). Nothing was changed.` };
    }
    if (seen.has(key)) {
      return { error: `${listLabel}: the reason key "${key}" is used twice. Nothing was changed.` };
    }
    if (!en || !ar) {
      return { error: `${listLabel}: every reason needs both an English and an Arabic label. Nothing was changed.` };
    }
    seen.add(key);
    reasons.push({ key, en, ar });
  }
  return { reasons };
}

export async function saveReasons(formData: FormData): Promise<ExecutionAdminResult> {
  const cancellation = parseReasons(formData.get("cancellation_reasons"), "Cancellation reasons");
  if (cancellation.error) return { error: cancellation.error };
  const geoOverride = parseReasons(formData.get("geo_override_reasons"), "Location override reasons");
  if (geoOverride.error) return { error: geoOverride.error };

  // Comment-mandatory semantics are enforced on the 'other' key by
  // request_visit_cancellation (0020_fix_field_journey.sql); removing the key
  // would silently drop that rule.
  if (!cancellation.reasons!.some(r => r.key === "other")) {
    return { error: 'The "other" reason must stay in the cancellation list — it carries the mandatory-comment rule. Nothing was changed.' };
  }
  // request_geo_override (20260716161605) ties the photo-evidence exception to
  // the 'safety_security' key; it must survive every edit.
  if (!geoOverride.reasons!.some(r => r.key === "safety_security")) {
    return { error: 'The "safety_security" reason must stay in the location-override list — it carries the photo-evidence exception. Nothing was changed.' };
  }

  return writeGovernedKeys({
    capability: "admin.execution_workflow",
    engine: "field",
    section: "reasons",
    governedKeys: ["cancellation_reasons", "geo_override_reasons"],
    build: () => ({
      patch: {
        cancellation_reasons: cancellation.reasons,
        geo_override_reasons: geoOverride.reasons,
      },
    }),
  });
}

// ---------- 4 · Arrival & geofence rules (admin.execution_workflow) ---------
const GIS_RULE_FIELDS = {
  arrival_detection_radius_m: "Arrival detection radius",
  geofence_default_radius_m: "Default geofence radius",
  gps_accuracy_checkin_max_m: "Check-in GPS accuracy",
  telemetry_interval_s: "Telemetry interval",
} as const;

export async function saveGisRules(formData: FormData): Promise<ExecutionAdminResult> {
  return writeGovernedKeys({
    capability: "admin.execution_workflow",
    engine: "gis",
    section: "arrival-geofence",
    governedKeys: Object.keys(GIS_RULE_FIELDS),
    build: () => {
      const patch: Record<string, number> = {};
      for (const key of Object.keys(GIS_RULE_FIELDS) as (keyof typeof GIS_RULE_FIELDS)[]) {
        const value = Number(String(formData.get(key) ?? "").trim());
        if (!Number.isInteger(value) || value < 1) {
          return { error: `${GIS_RULE_FIELDS[key]} must be a whole number of at least 1. Nothing was changed.` };
        }
        patch[key] = value;
      }
      return { patch };
    },
  });
}

// ---------- 5 · Evidence policy (admin.evidence_policy) ----------------------
const EVIDENCE_TYPES = ["photo", "video", "document", "voice"] as const;

export async function saveEvidencePolicy(formData: FormData): Promise<ExecutionAdminResult> {
  return writeGovernedKeys({
    capability: "admin.evidence_policy",
    engine: "evidence",
    section: "evidence-policy",
    governedKeys: [...EVIDENCE_TYPES, "retention_years"],
    build: (current) => {
      const patch: Record<string, unknown> = {};
      for (const type of EVIDENCE_TYPES) {
        const existing = current[type];
        // Absent = not permitted. A type missing from the governed row is
        // never invented by this screen — it stays not configured.
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) continue;
        const existingRule = existing as Record<string, unknown>;
        const formats = String(formData.get(`${type}_formats`) ?? "")
          .split(",")
          .map(f => f.trim().toLowerCase())
          .filter(Boolean);
        if (formats.length < 1) {
          return { error: `${type}: at least one allowed file type is required. Nothing was changed.` };
        }
        const maxMb = Number(String(formData.get(`${type}_max_mb`) ?? "").trim());
        if (!Number.isFinite(maxMb) || maxMb <= 0) {
          return { error: `${type}: maximum size must be a positive number. Nothing was changed.` };
        }
        const nextRule: Record<string, unknown> = { ...existingRule, formats, max_mb: maxMb };
        if ("max_minutes" in existingRule) {
          const maxMinutes = Number(String(formData.get(`${type}_max_minutes`) ?? "").trim());
          if (!Number.isFinite(maxMinutes) || maxMinutes <= 0) {
            return { error: `${type}: maximum duration must be a positive number. Nothing was changed.` };
          }
          nextRule.max_minutes = maxMinutes;
        }
        patch[type] = nextRule;
      }
      if ("retention_years" in current) {
        const years = Number(String(formData.get("retention_years") ?? "").trim());
        if (!Number.isInteger(years) || years < 1) {
          return { error: "Retention must be a whole number of years, at least 1. Nothing was changed." };
        }
        patch.retention_years = years;
      }
      if (Object.keys(patch).length === 0) {
        return { error: "No evidence policy is configured to edit. Nothing was changed." };
      }
      return { patch };
    },
  });
}

// ---------- 6 · Offline & sync policy (admin.offline_policy) -----------------
// max_sync_attempts / autosave interval are NOT business-supplied: empty means
// unset, and unset honestly means the current platform default applies. When
// every value is unset the governed key is removed so absence stays truthful.
export async function saveOfflinePolicy(formData: FormData): Promise<ExecutionAdminResult> {
  return writeGovernedKeys({
    capability: "admin.offline_policy",
    engine: "execution",
    section: "offline-sync",
    governedKeys: ["offline"],
    build: () => {
      const offline: Record<string, number> = {};
      const attemptsRaw = String(formData.get("max_sync_attempts") ?? "").trim();
      if (attemptsRaw) {
        const attempts = Number(attemptsRaw);
        if (!Number.isInteger(attempts) || attempts < 1 || attempts > 100) {
          return { error: "Sync attempts must be a whole number between 1 and 100, or left empty for the platform default. Nothing was changed." };
        }
        offline.max_sync_attempts = attempts;
      }
      const autosaveRaw = String(formData.get("autosave_interval_s") ?? "").trim();
      if (autosaveRaw) {
        const seconds = Number(autosaveRaw);
        if (!Number.isInteger(seconds) || seconds < 5 || seconds > 600) {
          return { error: "The autosave interval must be a whole number of seconds between 5 and 600, or left empty for the platform default. Nothing was changed." };
        }
        offline.autosave_interval_s = seconds;
      }
      return { patch: { offline: Object.keys(offline).length > 0 ? offline : undefined } };
    },
  });
}
