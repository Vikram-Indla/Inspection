"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import {
  isExternalRequestTransitionAllowed,
  isExternalRequestType,
  isSelfAssessmentTransitionAllowed,
  type ExternalRequestStatus,
  type SelfAssessmentStatus,
  canDecideExternalRequest,
} from "@/lib/portal/self-assessment";

// TASK-MVP2-M2-08-EXTERNAL-PORTAL-001 · MVP2-REQ-0109..0113 · CD-044.
// Internal-compliance create of an external request record (external-rep identity
// is held; this is the internal intake path). RLS: compliance/security/leadership.
export type PortalResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;

export async function createExternalRequest(_: PortalResult, formData: FormData): Promise<PortalResult> {
  if (resolveFeatureFlag(process.env.FEATURE_EXTERNAL_PORTAL, MODES, "off") !== "on")
    return { error: "External portal is feature-flagged off (FEATURE_EXTERNAL_PORTAL)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const factory_id = String(formData.get("factory_id") ?? "");
  const request_type = String(formData.get("request_type") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!factory_id) return { error: "A factory is required." };
  if (!isExternalRequestType(request_type)) return { error: "A supported request type is required." };
  if (!subject) return { error: "A subject is required." };
  const { error } = await sb.from("external_requests").insert({
    factory_id, request_type, subject, status: "submitted",
  });
  if (error) { logProviderError("external request create", error); return { error: `${NEUTRAL_WRITE_ERROR} (compliance scope required).` }; }
  return { ok: true };
}

export async function transitionExternalRequest(_: PortalResult, formData: FormData): Promise<PortalResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("id") ?? "");
  const toStatus = String(formData.get("to_status") ?? "") as ExternalRequestStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  const { data: current, error: readError } = await sb.from("external_requests")
    .select("status").eq("id", id).maybeSingle();
  if (readError || !current) return { error: "Request is unavailable or outside your scope." };
  if (!isExternalRequestTransitionAllowed(current.status as ExternalRequestStatus, toStatus))
    return { error: "This transition is not available from the current state." };
  if (["accepted", "rejected", "returned"].includes(toStatus)) {
    const guard = canDecideExternalRequest({ toStatus, reason });
    if (!guard.ok) return { error: guard.why };
  }
  const patch = toStatus === "in_review"
    ? { status: toStatus, decided_by: null, decision_reason: null }
    : { status: toStatus, decided_by: user.id, decision_reason: reason };
  const { error } = await sb.from("external_requests").update(patch).eq("id", id).eq("status", current.status);
  if (error) { logProviderError("external request transition", error); return { error: `${NEUTRAL_WRITE_ERROR} (review scope required).` }; }
  return { ok: true };
}

export async function transitionSelfAssessment(_: PortalResult, formData: FormData): Promise<PortalResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("id") ?? "");
  const toStatus = String(formData.get("to_status") ?? "") as SelfAssessmentStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A decision reason is required." };
  const { data: current, error: readError } = await sb.from("self_assessments")
    .select("status").eq("id", id).maybeSingle();
  if (readError || !current) return { error: "Self-assessment is unavailable or outside your scope." };
  if (!isSelfAssessmentTransitionAllowed(current.status as SelfAssessmentStatus, toStatus))
    return { error: "This transition is not available from the current state." };
  const { error } = await sb.from("self_assessments").update({
    status: toStatus,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_reason: reason,
    risk_signal_emitted: toStatus === "accepted",
  }).eq("id", id).eq("status", current.status);
  if (error) { logProviderError("self-assessment transition", error); return { error: `${NEUTRAL_WRITE_ERROR} (review scope required).` }; }
  return { ok: true };
}
