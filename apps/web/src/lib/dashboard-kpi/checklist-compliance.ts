// Canonical checklist-compliance calculation — the SINGLE shared definition
// used by the Web dashboard, the iPad field dashboard, and any analytics drill.
//
// P0 formula rule (CODEX 01):
//   compliance rate = compliant eligible answers / (compliant + non_compliant)
//   Exclude N/A, unknown, and incomplete answers from BOTH numerator and
//   denominator. No denominator => no percentage (return null, never a
//   fabricated 0%).
//
// P0 semantic rule: an approval outcome (Approve/Return/Reject) is NOT
// checklist compliance. This module deliberately knows nothing about reviews.
//
// Answer encoding is confirmed from live data: checklist_responses.response =
// { "value": "compliant" | "non_compliant" | "na" }, with is_complete gating
// whether the answer counts at all.

/** Minimal shape needed to score an answer. Matches checklist_responses. */
export type CompliesResponse = {
  is_complete: boolean;
  response: { value?: string | null } | null;
};

export const COMPLIANT_VALUE = "compliant";
export const NON_COMPLIANT_VALUE = "non_compliant";

/** Values that are eligible answers but excluded from the compliance ratio. */
export const COMPLIANCE_EXCLUSIONS = ["na", "unknown", "incomplete"] as const;

export type ChecklistComplianceBreakdown = {
  compliant: number;
  nonCompliant: number;
  /** compliant + non_compliant — the denominator. */
  eligible: number;
  /** answers seen but excluded (incomplete, na, unknown, blank). */
  excluded: number;
  /** compliant / eligible as an integer percent, or null when eligible === 0. */
  rate: number | null;
};

/**
 * Count compliant vs non-compliant over a set of checklist responses, applying
 * the governed exclusions. Incomplete answers (is_complete === false) and any
 * value that is not exactly "compliant" or "non_compliant" (na/unknown/blank)
 * are excluded from the ratio.
 */
export function countChecklistCompliance(responses: readonly CompliesResponse[]): ChecklistComplianceBreakdown {
  let compliant = 0;
  let nonCompliant = 0;
  let excluded = 0;
  for (const row of responses) {
    if (!row.is_complete) {
      excluded += 1;
      continue;
    }
    const value = row.response?.value;
    if (value === COMPLIANT_VALUE) compliant += 1;
    else if (value === NON_COMPLIANT_VALUE) nonCompliant += 1;
    else excluded += 1;
  }
  const eligible = compliant + nonCompliant;
  return {
    compliant,
    nonCompliant,
    eligible,
    excluded,
    rate: eligible > 0 ? Math.round((compliant / eligible) * 100) : null,
  };
}
