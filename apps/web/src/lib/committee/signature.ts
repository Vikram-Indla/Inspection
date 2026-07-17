// M2-12 Committee, Signature & PKI — pure signature/verification logic.
// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049.
// Deterministic, DB-free. PKI/EBDA is HELD: verification is never 'verified'
// without provider evidence; acknowledgement is never promoted to a signature.

export const SIGNATURE_KINDS = ["signature", "refusal"] as const;
export type SignatureKind = (typeof SIGNATURE_KINDS)[number];

export const SIGNATURE_OUTCOMES = ["captured", "refused", "failed", "queued"] as const;
export type SignatureOutcome = (typeof SIGNATURE_OUTCOMES)[number];

export const VERIFICATION_STATUSES = ["unavailable", "pending", "failed", "unverified", "verified"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** A refusal is a distinct fact — it can never carry a 'captured' outcome, and a
 *  signature can never be 'refused'. Keeps the two branch outcomes separate. */
export function isOutcomeConsistent(kind: SignatureKind, outcome: SignatureOutcome): boolean {
  if (kind === "refusal") return outcome === "refused";
  return outcome === "captured" || outcome === "failed" || outcome === "queued";
}

/** queued is NOT delivered/verified. Only a real provider result may reach
 *  'verified'; absent a provider, the honest states are unavailable/pending. */
export function isVerified(status: VerificationStatus): boolean {
  return status === "verified";
}

/** Guard the promotion to 'verified': requires explicit provider evidence.
 *  Without it, verification stays unverified/unavailable — never silently verified. */
export function resolveVerification(input: { providerConfigured: boolean; providerResult?: "pass" | "fail" | "pending" }): VerificationStatus {
  if (!input.providerConfigured) return "unavailable";
  switch (input.providerResult) {
    case "pass": return "verified";
    case "fail": return "failed";
    case "pending": return "pending";
    default: return "unverified";
  }
}

/** DEC-009: an acknowledgement is acknowledgement — it must never be labelled a
 *  digital signature or a PKI verification. */
export function acknowledgementIsNotSignature(method: string): boolean {
  return method.toLowerCase() !== "acknowledgement";
}
