"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { isOutcomeConsistent, resolveVerification, type SignatureKind, type SignatureOutcome } from "@/lib/committee/signature";

// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049.
// Append a signature act. PKI/EBDA held → verification resolves to 'unavailable'
// (never 'verified' without a provider). Append-only; kind/outcome must be consistent.
export type CmteResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;

export async function recordSignatureAct(_: CmteResult, formData: FormData): Promise<CmteResult> {
  if (resolveFeatureFlag(process.env.FEATURE_DECISION_DOSSIER, MODES, "off") !== "on")
    return { error: "Committee dossier is feature-flagged off (FEATURE_DECISION_DOSSIER)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const kind = String(formData.get("kind") ?? "") as SignatureKind;
  const outcome = String(formData.get("outcome") ?? "") as SignatureOutcome;
  if (!isOutcomeConsistent(kind, outcome)) return { error: `Outcome ${outcome} is not valid for a ${kind}.` };
  // No PKI/EBDA provider configured → honest unavailable, never fabricated verification.
  const verification_status = resolveVerification({ providerConfigured: false });
  const { error } = await sb.from("signature_acts").insert({
    kind, outcome, method: kind === "refusal" ? "refusal" : "acknowledgement",
    verification_status, actor_user: user.id,
  });
  if (error) { logProviderError("signature act", error); return { error: NEUTRAL_WRITE_ERROR }; }
  return { ok: true };
}
