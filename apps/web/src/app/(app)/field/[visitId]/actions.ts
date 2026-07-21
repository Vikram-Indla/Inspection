"use server";
// Slice E3 — journey state machine legs (M04-018 / M04-046 / M04-055 · STM-OPS).
// The guard lives in the DB: set_operational_state (0015) is SECURITY DEFINER,
// checks is_assigned_inspector (RBAC-009) and only permits the legal legs
// new/prepared -> on_the_way -> arrived -> executing. Provider/RPC details are
// logged server-side only; callers receive stable recovery codes.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import {
  confirmArrival,
  correctVisitLocation,
  requestActiveCancellation,
  startJourney,
  type ArrivalResult,
  type CancellationRequest,
  type JourneyDeviceInfo,
  type JourneyStartResult,
  type LocationCorrection,
} from "@/lib/execution";

export type ActionResult = { error?: string; ok?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// TASK-EXECUTION-MODULE-001 · Phase 4B — journey/arrival/cancellation/location
// actions. Thin transports over lib/execution/journey.ts: the RPCs
// (20260721140000) re-verify assignment, capability and every business rule on
// each call; errors arrive as neutral codes (JOURNEY_* / ARRIVAL_* /
// CANCEL_* / LOCATION_* / NEUTRAL_WRITE_ERROR) and never carry provider text.
// The field UI only calls these when its server-side schema probe succeeded;
// pre-migration the legacy direct-write path stays untouched (D-015).

export type JourneyActionResult = { ok?: boolean; journey?: JourneyStartResult; error?: string };

export async function startJourneyAction(input: { visitId: string; device: JourneyDeviceInfo }): Promise<JourneyActionResult> {
  if (!UUID.test(input.visitId)) return { error: "JOURNEY_VISIT_STATE" };
  if (!input.device?.device_id || !input.device?.application_version) return { error: "JOURNEY_DEVICE_MISSING" };
  const sb = await supabaseServer();
  const r = await startJourney(sb, input.visitId, input.device);
  if (r.error || !r.result) return { error: r.error ?? "JOURNEY_VISIT_STATE" };
  revalidatePath(`/field/${input.visitId}`);
  revalidatePath(`/visits/${input.visitId}`);
  revalidatePath("/operations");
  return { ok: true, journey: r.result };
}

export type ArrivalActionResult = { ok?: boolean; result?: ArrivalResult; error?: string };

export async function confirmArrivalAction(input: {
  visitId: string; observedLat: number; observedLng: number; accuracyM: number;
  device?: Partial<JourneyDeviceInfo> | null;
}): Promise<ArrivalActionResult> {
  if (!UUID.test(input.visitId)) return { error: "ARRIVAL_VISIT_STATE" };
  if (!Number.isFinite(input.observedLat) || !Number.isFinite(input.observedLng) || !Number.isFinite(input.accuracyM)) {
    return { error: "ARRIVAL_LOCATION_MISSING" };
  }
  const sb = await supabaseServer();
  const r = await confirmArrival(sb, {
    visitId: input.visitId,
    observedLat: input.observedLat,
    observedLng: input.observedLng,
    accuracyM: input.accuracyM,
    device: input.device ?? null,
  });
  if (r.error || !r.result) return { error: r.error ?? "ARRIVAL_VISIT_STATE" };
  revalidatePath(`/field/${input.visitId}`);
  revalidatePath(`/visits/${input.visitId}`);
  revalidatePath("/operations");
  return { ok: true, result: r.result };
}

export type CancellationActionResult = { ok?: boolean; request?: CancellationRequest; error?: string };

export async function requestActiveCancellationAction(input: {
  visitId: string; reasonKey: string; comment?: string | null; evidenceId?: string | null; idempotencyKey: string;
}): Promise<CancellationActionResult> {
  if (!UUID.test(input.visitId)) return { error: "CANCEL_VISIT_STATE" };
  if (!input.reasonKey) return { error: "CANCEL_REASON_UNKNOWN" };
  if (!input.idempotencyKey) return { error: "CANCEL_IDEMPOTENCY_REQUIRED" };
  const sb = await supabaseServer();
  const r = await requestActiveCancellation(sb, {
    visitId: input.visitId,
    reasonKey: input.reasonKey,
    comment: input.comment ?? null,
    evidenceId: input.evidenceId ?? null,
    idempotencyKey: input.idempotencyKey,
  });
  if (r.error || !r.request) return { error: r.error ?? "CANCEL_VISIT_STATE" };
  revalidatePath(`/field/${input.visitId}`);
  revalidatePath(`/visits/${input.visitId}`);
  revalidatePath("/operations");
  return { ok: true, request: r.request };
}

export type CorrectionActionResult = { ok?: boolean; correction?: LocationCorrection; error?: string };

export async function correctVisitLocationAction(input: {
  visitId: string; lat: number; lng: number; accuracyM?: number | null;
  reason: string; evidenceId?: string | null; captureContext?: "online" | "offline";
}): Promise<CorrectionActionResult> {
  if (!UUID.test(input.visitId)) return { error: "LOCATION_VISIT_STATE" };
  if (!input.reason?.trim()) return { error: "LOCATION_REASON_REQUIRED" };
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) return { error: "LOCATION_RANGE" };
  const sb = await supabaseServer();
  const r = await correctVisitLocation(sb, {
    visitId: input.visitId,
    lat: input.lat,
    lng: input.lng,
    accuracyM: input.accuracyM ?? null,
    reason: input.reason.trim(),
    evidenceId: input.evidenceId ?? null,
    captureContext: input.captureContext ?? "online",
  });
  if (r.error || !r.correction) return { error: r.error ?? "LOCATION_VISIT_STATE" };
  revalidatePath(`/field/${input.visitId}`);
  revalidatePath(`/visits/${input.visitId}`);
  return { ok: true, correction: r.correction };
}

export async function transitionOperationalState(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!visitId || !["on_the_way", "arrived", "executing"].includes(next)) {
    return { error: "Invalid operational transition request (STM-OPS)" };
  }
  const sb = await supabaseServer();
  const { error } = await sb.rpc("set_operational_state", { p_visit: visitId, p_next: next });
  if (error) {
    console.error("[field transitionOperationalState]", error);
    return { error: "transition_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath(`/visits/${visitId}`);
  revalidatePath("/operations");
  return { ok: next };
}

// F3 · M04-056/057 — field cancellation REQUEST at arrival. The inspector never
// cancels directly (visits_update RLS is planner/ops); request_visit_cancellation
// (0020, SECURITY DEFINER) validates the governed reason (engine_settings.field),
// flags visits.cancellation_requested, appends the operational note and notifies
// planner/ops. Provider/RPC details stay server-side.
export async function requestVisitCancellation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const reasonKey = String(fd.get("reason_key") ?? "");
  const comment = String(fd.get("comment") ?? "").trim();
  if (!visitId || !reasonKey) return { error: "Cancellation reason is mandatory (M04-057)" };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("request_visit_cancellation", {
    p_visit: visitId, p_reason_key: reasonKey, p_comment: comment || null,
  });
  if (error) {
    console.error("[field requestVisitCancellation]", error);
    return { error: "cancellation_request_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath(`/visits/${visitId}`);
  revalidatePath("/operations");
  return { ok: "cancellation_requested" };
}

// F3 · M03-006 — inspector return: assignment -> returned + return_reason,
// visit flagged return_requested, planner notified (request_visit_return, 0020).
export async function requestVisitReturn(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (!visitId || !reason) return { error: "Return reason is mandatory (M03-006)" };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("request_visit_return", { p_visit: visitId, p_reason: reason });
  if (error) {
    console.error("[field requestVisitReturn]", error);
    return { error: "return_request_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath("/field");
  revalidatePath(`/visits/${visitId}`);
  return { ok: "return_requested" };
}
