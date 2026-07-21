"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { isOutcomeConsistent, resolveVerification, type SignatureKind, type SignatureOutcome } from "@/lib/committee/signature";
import { maybeBuildDocuSignAdapter, mapEnvelopeStatusToVerification } from "@/lib/providers/signature-docusign";
import { createHash } from "node:crypto";

// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049.
// Append a signature act. PKI/EBDA held → verification resolves to 'unavailable'
// (never 'verified' without a provider). Append-only; kind/outcome must be consistent.
export type CmteResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;

export async function recordSignatureAct(_: CmteResult, formData: FormData): Promise<CmteResult> {
  if (resolveFeatureFlag(process.env.FEATURE_DECISION_DOSSIER, MODES, "off") !== "on")
    return { error: "Committee decision record is feature-flagged off (FEATURE_DECISION_DOSSIER)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const kind = String(formData.get("kind") ?? "") as SignatureKind;
  const outcome = String(formData.get("outcome") ?? "") as SignatureOutcome;
  if (!isOutcomeConsistent(kind, outcome)) return { error: `Outcome ${outcome} is not valid for a ${kind}.` };

  const docusign = kind === "signature" && outcome === "captured" ? maybeBuildDocuSignAdapter() : null;
  let verification_status = resolveVerification({ providerConfigured: false });
  let method = kind === "refusal" ? "refusal" : "acknowledgement";
  let reportHash: string | null = null;
  let envelopeId: string | null = null;

  if (docusign && user.email) {
    reportHash = createHash("sha256").update(`${kind}:${outcome}:${user.id}:${Date.now()}`).digest("hex");
    const req = await docusign.requestSignature({ reportHash, signerEmail: user.email, signerName: user.email });
    if (req.ok && req.envelopeId) {
      envelopeId = req.envelopeId;
      method = "pki";
      // Only ever what DocuSign genuinely reports — 'sent' maps to 'pending',
      // never fabricated as 'verified' before the signer actually completes it.
      verification_status = mapEnvelopeStatusToVerification(req.providerStatus);
    } else {
      logProviderError("docusign envelope create", new Error(req.reason ?? "unknown"));
      // Provider configured but the call failed — honest 'failed', not silently 'unavailable'.
      verification_status = "failed";
    }
  }

  const { error } = await sb.from("signature_acts").insert({
    kind, outcome, method, verification_status, actor_user: user.id, report_hash: reportHash,
  });
  if (error) { logProviderError("signature act", error); return { error: NEUTRAL_WRITE_ERROR }; }

  if (docusign && reportHash) {
    const { error: verErr } = await sb.from("report_verifications").insert({
      report_hash: reportHash,
      provider: "docusign",
      status: verification_status,
      detail: envelopeId ? { envelopeId } : {},
      checked_at: new Date().toISOString(),
    });
    if (verErr) logProviderError("report verification", verErr);
  }
  return { ok: true };
}
