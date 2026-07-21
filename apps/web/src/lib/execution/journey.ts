// TASK-EXECUTION-MODULE-001 · Phase 4A — Physical Journey, Cancellation & Location.
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §11/§12/§13.
//
// Typed wrappers over the journey/cancellation/location RPCs from migration
// `20260721140000_execution_journey_cancellation.sql`. The RPCs are the single
// write path: start_journey atomically validates and creates (or returns) the
// one active Journey; the active-session cancellation is a request + decide
// workflow gated by operations.approve_active_cancel; location corrections are
// append-only facts that never overwrite the Factory 360/Senaei master or the
// Planning pin; confirm_arrival fails closed outside the fence (notice, never
// a silent override). This layer only maps the stable RPC error tokens to
// neutral codes — provider diagnostics stay server-side.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

/** Device provenance captured at journey start (plan §11). */
export type JourneyDeviceInfo = {
  device_id: string; // mandatory — EXE-JOURNEY-DEVICE-MISSING otherwise
  device_os_version?: string | null; // tolerated absent, recorded honestly
  application_version: string; // mandatory
  network?: string | null;
  gps?: { lat: number; lng: number; accuracy_m?: number | null } | null;
  device_occurred_at?: string | null; // ISO timestamp from the device clock
};

export type JourneyStartResult = {
  journey_id: string;
  status: string;
  reused: boolean; // true when an existing active Journey was returned
  overdue: boolean; // started after the Execution Date, inside the window
};

export type CancellationRequest = {
  id: string;
  visit_id: string;
  inspection_id: string | null;
  requested_by: string;
  requested_at: string;
  phase: "pre_execution" | "on_the_way" | "arrived" | "executing";
  reason_key: string;
  comment: string | null;
  evidence_id: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  idempotency_key: string;
};

export type LocationCorrection = {
  id: string;
  visit_id: string;
  corrected_lat: number;
  corrected_lng: number;
  accuracy_m: number | null;
  reason: string;
  evidence_id: string | null;
  source: "inspector_field" | "operations";
  corrected_by: string;
  corrected_at: string;
  capture_context: "online" | "offline";
};

export type ArrivalResult = {
  result: "inside" | "outside";
  reused?: boolean;
  journey_id?: string | null;
  arrival_event_id?: string | null;
  distance_m?: number;
  radius_m?: number;
  target_source?: string;
  notice?: string; // 'EXE-ARRIVAL-OUTSIDE' on the outside path (no mutation)
};

/**
 * Stable tokens raised by the Phase 4A RPCs (see the migration header) mapped
 * to neutral, UI-safe codes. Anything unrecognized stays server-side and
 * surfaces as the neutral write error — the token itself is never user copy.
 */
const JOURNEY_TOKEN_CODES: Record<string, string> = {
  "EXE-JOURNEY-DENIED": "JOURNEY_DENIED",
  "EXE-JOURNEY-VISIT-STATE": "JOURNEY_VISIT_STATE",
  "EXE-READY-REQUIRED": "JOURNEY_READINESS_REQUIRED",
  "EXE-JOURNEY-OUTSIDE-WINDOW": "JOURNEY_OUTSIDE_WINDOW",
  "EXE-JOURNEY-PACKAGE-MISSING": "JOURNEY_PACKAGE_MISSING",
  "EXE-JOURNEY-PACKAGE-INTEGRITY": "JOURNEY_PACKAGE_INTEGRITY",
  "EXE-JOURNEY-LOCATION-MISSING": "JOURNEY_LOCATION_MISSING",
  "EXE-JOURNEY-DEVICE-MISSING": "JOURNEY_DEVICE_MISSING",
  "EXE-CANCEL-DENIED": "CANCEL_DENIED",
  "EXE-CANCEL-USE-PRESTART": "CANCEL_USE_PRESTART_FLOW",
  "EXE-CANCEL-VISIT-STATE": "CANCEL_VISIT_STATE",
  "EXE-CANCEL-REASON": "CANCEL_REASON_UNKNOWN",
  "EXE-CANCEL-COMMENT": "CANCEL_COMMENT_REQUIRED",
  "EXE-CANCEL-EVIDENCE": "CANCEL_EVIDENCE_INVALID",
  "EXE-CANCEL-IDEMPOTENCY": "CANCEL_IDEMPOTENCY_REQUIRED",
  "EXE-CANCEL-NOT-FOUND": "CANCEL_NOT_FOUND",
  "EXE-CANCEL-SELF-DECIDE": "CANCEL_SELF_DECIDE",
  "EXE-CANCEL-DECIDED": "CANCEL_ALREADY_DECIDED",
  "EXE-CANCEL-DECISION-INVALID": "CANCEL_DECISION_INVALID",
  "EXE-CANCEL-DECISION-REASON": "CANCEL_REJECTION_REASON_REQUIRED",
  "EXE-LOCATION-DENIED": "LOCATION_DENIED",
  "EXE-LOCATION-VISIT-STATE": "LOCATION_VISIT_STATE",
  "EXE-LOCATION-REASON": "LOCATION_REASON_REQUIRED",
  "EXE-LOCATION-RANGE": "LOCATION_RANGE",
  "EXE-LOCATION-CONTEXT": "LOCATION_CONTEXT_INVALID",
  "EXE-LOCATION-EVIDENCE": "LOCATION_EVIDENCE_INVALID",
  "EXE-ARRIVAL-DENIED": "ARRIVAL_DENIED",
  "EXE-ARRIVAL-VISIT-STATE": "ARRIVAL_VISIT_STATE",
  "EXE-ARRIVAL-ACCURACY": "ARRIVAL_ACCURACY",
  "EXE-ARRIVAL-LOCATION-MISSING": "ARRIVAL_LOCATION_MISSING",
};

function mapJourneyError(scope: string, error: { message?: unknown }): string {
  logProviderError(scope, error);
  const message = String(error?.message ?? "");
  for (const token of Object.keys(JOURNEY_TOKEN_CODES)) {
    if (message.includes(token)) return JOURNEY_TOKEN_CODES[token];
  }
  return NEUTRAL_WRITE_ERROR;
}

/**
 * Start the physical journey atomically (plan §11). Validates assignment +
 * execution.start_journey, Published visit, confirmed Ready preparation,
 * inside-window timing (after the Execution Date but inside the window is
 * allowed with an overdue warning), frozen package availability/integrity,
 * resolved dispatch coordinates and device provenance. Multiple
 * clicks/retries return the existing active Journey (reused: true).
 */
export async function startJourney(
  sb: SupabaseClient,
  visitId: string,
  device: JourneyDeviceInfo,
): Promise<{ result?: JourneyStartResult; error?: string }> {
  const { data, error } = await sb.rpc("start_journey", {
    p_visit: visitId,
    p_device: device,
  });
  if (error) return { error: mapJourneyError("start_journey", error) };
  return { result: (data ?? undefined) as JourneyStartResult | undefined };
}

/**
 * Request cancellation of an ACTIVE visit (on_the_way / arrived / executing —
 * plan §12). Pre-journey visits keep the existing request_visit_cancellation
 * flag flow (the RPC refuses with CANCEL_USE_PRESTART_FLOW). Idempotent on
 * the caller-supplied idempotency key: replays return the existing request.
 */
export async function requestActiveCancellation(
  sb: SupabaseClient,
  input: {
    visitId: string;
    reasonKey: string;
    comment?: string | null;
    evidenceId?: string | null;
    idempotencyKey: string;
  },
): Promise<{ request?: CancellationRequest; error?: string }> {
  const { data, error } = await sb.rpc("request_active_cancellation", {
    p_visit: input.visitId,
    p_reason_key: input.reasonKey,
    p_comment: input.comment ?? null,
    p_evidence_id: input.evidenceId ?? null,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) return { error: mapJourneyError("request_active_cancellation", error) };
  return { request: (data ?? undefined) as CancellationRequest | undefined };
}

/**
 * Decide a pending cancellation request (operations.approve_active_cancel).
 * Approval is terminal and atomic: the visit is cancelled, tracking/sessions
 * stop, the assignment returns (freeing the schedule) and every captured
 * response/evidence/geo row is PRESERVED. Rejection leaves the visit
 * unchanged and requires a reason. The requester can never decide their own
 * request; replaying the same decision returns the current state.
 */
export async function decideActiveCancellation(
  sb: SupabaseClient,
  input: { requestId: string; decision: "approve" | "reject"; reason?: string | null },
): Promise<{ request?: CancellationRequest; error?: string }> {
  const { data, error } = await sb.rpc("decide_active_cancellation", {
    p_request: input.requestId,
    p_decision: input.decision,
    p_reason: input.reason ?? null,
  });
  if (error) return { error: mapJourneyError("decide_active_cancellation", error) };
  return { request: (data ?? undefined) as CancellationRequest | undefined };
}

/**
 * Append a corrected visit location (plan §13). Applies to the CURRENT visit
 * only — the Factory 360/Senaei master and the Planning pin are never
 * overwritten, and the correction row is append-only so original and
 * corrected stay visible and auditable.
 */
export async function correctVisitLocation(
  sb: SupabaseClient,
  input: {
    visitId: string;
    lat: number;
    lng: number;
    accuracyM?: number | null;
    reason: string;
    evidenceId?: string | null;
    captureContext?: "online" | "offline";
  },
): Promise<{ correction?: LocationCorrection; error?: string }> {
  const { data, error } = await sb.rpc("correct_visit_location", {
    p_visit: input.visitId,
    p_lat: input.lat,
    p_lng: input.lng,
    p_accuracy: input.accuracyM ?? null,
    p_reason: input.reason,
    p_evidence_id: input.evidenceId ?? null,
    p_capture_context: input.captureContext ?? "online",
  });
  if (error) return { error: mapJourneyError("correct_visit_location", error) };
  return { correction: (data ?? undefined) as LocationCorrection | undefined };
}

/**
 * Confirm arrival (plan §13). Accuracy-gated against the governed check-in
 * maximum; the fence is evaluated against the effective target (latest
 * correction, else the registered/planning location). Inside: the arrival
 * geo_event is recorded, tracking stops and the visit flips to Arrived.
 * Outside: NOTHING mutates — the result carries the EXE-ARRIVAL-OUTSIDE
 * notice and the caller uses retry / correction / the geo-override flow.
 */
export async function confirmArrival(
  sb: SupabaseClient,
  input: {
    visitId: string;
    observedLat: number;
    observedLng: number;
    accuracyM: number;
    device?: Partial<JourneyDeviceInfo> | null;
  },
): Promise<{ result?: ArrivalResult; error?: string }> {
  const { data, error } = await sb.rpc("confirm_arrival", {
    p_visit: input.visitId,
    p_observed_lat: input.observedLat,
    p_observed_lng: input.observedLng,
    p_accuracy_m: input.accuracyM,
    p_device: input.device ?? {},
  });
  if (error) return { error: mapJourneyError("confirm_arrival", error) };
  return { result: (data ?? undefined) as ArrivalResult | undefined };
}
