// TASK-EXECUTION-MODULE-001 · Phase 3A — Pre-Execution readiness backend.
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §7/§8/§10.
//
// Typed wrappers over the readiness RPCs from migration
// `20260721121000_execution_preparation.sql`. The RPCs are the single write
// path: they re-check assignment + execution.prepare, validate the Execution
// Date (window / not-past / shared daily-cap with self-exclusion), mode
// eligibility, package resolution and the fail-closed form_config composition
// (D-007), freeze the immutable visit package snapshot on Ready (D-008) and
// append EXE-PREP audit rows themselves. This layer only maps the stable RPC
// error tokens to neutral codes — provider diagnostics stay server-side.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

/** Visit-specific form composition (see the migration column comment). */
export type PreparationFormConfig = {
  removed_optional_section_keys?: string[];
  added_action_form_template_ids?: string[];
  notify_factory?: boolean;
};

export type VisitPreparation = {
  visit_id: string;
  preparation_version: number;
  execution_date: string | null;
  confirmed_mode: "physical" | "virtual" | null;
  package_version_id: string | null;
  form_config: PreparationFormConfig;
  saved_by: string | null;
  saved_at: string | null;
  confirmed_ready_at: string | null;
  reopened_at: string | null;
};

export type VisitPackageSnapshot = {
  id: string;
  visit_id: string;
  preparation_version: number;
  package_version_id: string;
  definition: unknown;
  checksum: string;
  created_by: string | null;
  created_at: string;
};

export type WindowCapacityDay = {
  date: string; // YYYY-MM-DD
  used: number;
  remaining: number;
};

export type WindowCapacity = {
  cap: number;
  days: WindowCapacityDay[];
  has_availability: boolean;
  truncated: boolean; // true when the window exceeded the 62-day scan cap
};

export type ReadinessResult = { ok?: boolean; error?: string };

/**
 * Stable tokens raised by the readiness RPCs (see the migration header)
 * mapped to neutral, UI-safe codes. Anything unrecognized stays server-side
 * and surfaces as the neutral write error — the token itself is never
 * treated as user copy.
 */
const READINESS_TOKEN_CODES: Record<string, string> = {
  "EXE-PREP-DENIED": "READINESS_DENIED",
  "EXE-PREP-VISIT-STATE": "READINESS_VISIT_STATE",
  "EXE-PREP-DATE-WINDOW": "READINESS_DATE_OUTSIDE_WINDOW",
  "EXE-PREP-DATE-PAST": "READINESS_DATE_IN_PAST",
  "EXE-PREP-CAPACITY": "READINESS_DAY_AT_CAPACITY",
  "EXE-PREP-MODE-INELIGIBLE": "READINESS_MODE_INELIGIBLE",
  "EXE-PREP-PACKAGE-REQUIRED": "READINESS_PACKAGE_REQUIRED",
  "EXE-PREP-PACKAGE-INACTIVE": "READINESS_PACKAGE_INELIGIBLE",
  "EXE-PREP-MANDATORY-REMOVAL": "READINESS_SECTION_NOT_REMOVABLE",
  "EXE-PREP-DUPLICATE": "READINESS_DUPLICATE",
  "EXE-PREP-CONFIG-INVALID": "READINESS_CONFIG_INVALID",
  "EXE-PREP-FORM-INELIGIBLE": "READINESS_ACTION_FORM_INELIGIBLE",
  "EXE-PREP-REOPEN-REQUIRED": "READINESS_REOPEN_REQUIRED",
  "EXE-PREP-JOURNEY-STARTED": "READINESS_LOCKED_AFTER_JOURNEY_START",
  "EXE-PREP-WORK-CAPTURED": "READINESS_REOPEN_BLOCKED_BY_WORK",
  "EXE-PREP-INCOMPLETE": "READINESS_INCOMPLETE",
  "EXE-CAPACITY-WINDOW-INVALID": "READINESS_WINDOW_INVALID",
};

function mapReadinessError(scope: string, error: { message?: unknown }): string {
  logProviderError(scope, error);
  const message = String(error?.message ?? "");
  for (const token of Object.keys(READINESS_TOKEN_CODES)) {
    if (message.includes(token)) return READINESS_TOKEN_CODES[token];
  }
  return NEUTRAL_WRITE_ERROR;
}

/**
 * Save the preparation draft for an assigned, published visit. Saving never
 * changes visit/inspection state; a save after Ready is refused by the RPC
 * (READINESS_REOPEN_REQUIRED) and any successful save wipes readiness, so a
 * fresh confirmVisitReady is always required afterwards.
 */
export async function saveVisitPreparation(
  sb: SupabaseClient,
  input: {
    visitId: string;
    executionDate?: string | null;
    confirmedMode?: "physical" | "virtual" | null;
    packageVersionId?: string | null;
    formConfig?: PreparationFormConfig;
  },
): Promise<ReadinessResult> {
  const { error } = await sb.rpc("save_visit_preparation", {
    p_visit: input.visitId,
    p_execution_date: input.executionDate ?? null,
    p_confirmed_mode: input.confirmedMode ?? null,
    p_package_version_id: input.packageVersionId ?? null,
    p_form_config: input.formConfig ?? {},
  });
  if (error) return { error: mapReadinessError("save_visit_preparation", error) };
  return { ok: true };
}

/**
 * Confirm Ready for Execution. The RPC re-validates the complete saved
 * preparation NOW, freezes the immutable visit package snapshot (new
 * preparation_version + sha256 checksum), flips the visit to stored
 * 'prepared' (≡ Ready for Execution, D-002), creates the inspections row
 * pre-journey with started_at NULL (D-008) and marks the assignment ready.
 * Idempotent: replaying while already ready returns the existing snapshot.
 */
export async function confirmVisitReady(
  sb: SupabaseClient,
  visitId: string,
): Promise<{ snapshot?: VisitPackageSnapshot; error?: string }> {
  const { data, error } = await sb.rpc("confirm_visit_ready", { p_visit: visitId });
  if (error) return { error: mapReadinessError("confirm_visit_ready", error) };
  return { snapshot: (data ?? undefined) as VisitPackageSnapshot | undefined };
}

/**
 * Reopen a ready visit back to New (pre-journey only, and only while no
 * inspection work exists — D-008). Snapshot rows stay immutable as history;
 * the next Ready appends a new preparation_version.
 */
export async function reopenVisitPreparation(
  sb: SupabaseClient,
  visitId: string,
): Promise<ReadinessResult> {
  const { error } = await sb.rpc("reopen_visit_preparation", { p_visit: visitId });
  if (error) return { error: mapReadinessError("reopen_visit_preparation", error) };
  return { ok: true };
}

/**
 * Per-day daily-cap availability for an inspector across a date range
 * (YYYY-MM-DD), evaluated by the SAME shared counting service Planning
 * publish and date selection use. The RPC itself enforces authorization:
 * the caller must be a planner, ops, or the inspector themself. Windows
 * longer than 62 days are evaluated over the first 62 (truncated: true).
 */
export async function getWindowCapacity(
  sb: SupabaseClient,
  inspectorId: string,
  start: string,
  end: string,
): Promise<{ capacity?: WindowCapacity; error?: string }> {
  const { data, error } = await sb.rpc("inspector_window_capacity", {
    p_inspector: inspectorId,
    p_window_start: start,
    p_window_end: end,
  });
  if (error) {
    logProviderError("inspector_window_capacity", error);
    const message = String(error.message ?? "");
    if (message.includes("EXE-CAPACITY-WINDOW-INVALID")) {
      return { error: READINESS_TOKEN_CODES["EXE-CAPACITY-WINDOW-INVALID"] };
    }
    return { error: NEUTRAL_LOAD_ERROR };
  }
  const row = (data ?? {}) as Partial<WindowCapacity>;
  return {
    capacity: {
      cap: typeof row.cap === "number" ? row.cap : 0,
      days: Array.isArray(row.days) ? (row.days as WindowCapacityDay[]) : [],
      has_availability: row.has_availability === true,
      truncated: row.truncated === true,
    },
  };
}
