"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";

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
  if (!request_type) return { error: "A request type is required." };
  const { error } = await sb.from("external_requests").insert({
    factory_id, request_type, subject, status: "submitted",
  });
  if (error) { logProviderError("external request create", error); return { error: `${NEUTRAL_WRITE_ERROR} (compliance scope required).` }; }
  return { ok: true };
}
