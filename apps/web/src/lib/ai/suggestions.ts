// M2-11 Assistive AI — pure governed-suggestion logic.
// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066,0217..0223 · CD-048.
// Deterministic, DB-free. AI is advisory only: a human disposition is mandatory,
// AI never writes a decision, and the adapter is fail-closed without config.

export const AI_DISPOSITIONS = ["proposed", "accepted", "rejected", "superseded"] as const;
export type AiDisposition = (typeof AI_DISPOSITIONS)[number];

const DISPOSITION_TRANSITIONS: Record<AiDisposition, AiDisposition[]> = {
  proposed: ["accepted", "rejected", "superseded"],
  accepted: ["superseded"],
  rejected: [],
  superseded: [],
};

export function isDispositionAllowed(from: AiDisposition, to: AiDisposition): boolean {
  return DISPOSITION_TRANSITIONS[from]?.includes(to) ?? false;
}

/** A suggestion — human-proposed OR provider-generated — always enters the
 *  docket as 'proposed'. AI never writes an accepted/rejected outcome, so the
 *  entry disposition is a constant, not a provider-supplied value. */
export const AI_INITIAL_DISPOSITION: AiDisposition = "proposed";

/** No further transition is legal from here — the UI renders a terminal note
 *  instead of a disposition control. */
export function isTerminalDisposition(d: AiDisposition): boolean {
  return (DISPOSITION_TRANSITIONS[d]?.length ?? 0) === 0;
}

/** A disposition is a HUMAN act: accept/reject requires an actor + reason. */
export function canDispose(input: { to: AiDisposition; actor: string | null; reason: string }): { ok: boolean; why: string } {
  if (!["accepted", "rejected", "superseded"].includes(input.to)) return { ok: false, why: "Not a disposition." };
  if (!input.actor) return { ok: false, why: "A human actor is required to dispose an AI suggestion." };
  if ((input.to === "accepted" || input.to === "rejected") && !input.reason?.trim()) {
    return { ok: false, why: "A reason is required to accept or reject." };
  }
  return { ok: true, why: "Disposition permitted." };
}

export const AI_PROVIDER_STATES = ["configured", "unavailable", "degraded", "failed", "retrying"] as const;
export type AiProviderState = (typeof AI_PROVIDER_STATES)[number];

/** Fail-closed: without configured credentials the adapter is unavailable and
 *  MUST NOT surface suggestions. Only 'configured' may produce output. */
export function adapterMaySuggest(state: AiProviderState): boolean {
  return state === "configured";
}

/** Guardrail: AI may never generate legal source text (regulation/clause bodies).
 *  Only advisory surfaces are permitted. */
const LEGAL_SURFACES = ["regulation_body", "clause_text", "legal_decision"];
export function isSuggestionSurfaceAllowed(surface: string): boolean {
  return !LEGAL_SURFACES.includes(surface);
}
