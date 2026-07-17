// M2-02 Workflow, SLA & Notification Studio — payload normalizer.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001.
//
// The Flight Deck must render + validate BOTH the MVP1 stored shape
// (states: string[]; transitions: {id, from, to, actor, guard, side_effects, terminal})
// and the MVP2 lifecycle shape (states: {key,initial,terminal}[]; transitions with
// guards[] + fx[]). This normaliser maps either into the validator's WfPayload
// WITHOUT fabricating data: missing actors / idempotency keys are left absent so
// the validation ledger honestly flags them (VAL-05/VAL-06) instead of hiding them.

import type { WfPayload, WfState, WfTransition, WfSideEffect } from "./validate";

type RawState = string | { key?: string; initial?: boolean; terminal?: boolean };
type RawTransition = {
  id?: string; from?: string; to?: string; trigger?: string; actor?: string;
  guard?: string; guards?: string[]; side_effects?: string[]; fx?: WfSideEffect[]; terminal?: boolean;
};
type RawPayload = { object?: unknown; states?: RawState[]; transitions?: RawTransition[] };

function cleanGuards(tr: RawTransition): string[] {
  if (Array.isArray(tr.guards)) return tr.guards.filter(Boolean);
  const g = (tr.guard ?? "").trim();
  return g && g !== "—" && g !== "-" ? [g] : [];
}

function toFx(tr: RawTransition): WfSideEffect[] | undefined {
  if (Array.isArray(tr.fx)) return tr.fx;
  const se = tr.side_effects;
  if (!Array.isArray(se) || se.length === 0) return undefined;
  // Do NOT fabricate idempotency keys — leave absent so VAL-05 flags honestly.
  return se.filter(Boolean).map((kind) => ({ kind }));
}

export function normalizeWorkflowPayload(raw: RawPayload | null | undefined): WfPayload {
  const object = typeof raw?.object === "string" ? raw.object : "";
  const rawTransitions = Array.isArray(raw?.transitions) ? raw!.transitions : [];

  const transitions: WfTransition[] = rawTransitions.map((tr) => ({
    from: tr.from ?? "",
    to: tr.to ?? "",
    // id first → keeps distinct transitions unambiguous (no synthetic collisions).
    trigger: tr.trigger ?? tr.id ?? `${tr.from ?? "?"}->${tr.to ?? "?"}`,
    actor: tr.actor,                 // may be undefined → VAL-06 flags
    guards: cleanGuards(tr),
    fx: toFx(tr),
  }));

  const outgoing = new Set(transitions.map((t) => t.from));
  const incoming = new Set(transitions.map((t) => t.to));

  // Explicit state objects win; otherwise derive keys from the string list or the
  // transition endpoints, and infer initial/terminal from the graph.
  let stateKeys: { key: string; initial?: boolean; terminal?: boolean }[];
  if (Array.isArray(raw?.states) && raw!.states.length) {
    stateKeys = raw!.states.map((s) =>
      typeof s === "string" ? { key: s } : { key: s.key ?? "", initial: s.initial, terminal: s.terminal });
  } else {
    const keys = new Set<string>();
    transitions.forEach((t) => { if (t.from) keys.add(t.from); if (t.to) keys.add(t.to); });
    stateKeys = [...keys].map((key) => ({ key }));
  }

  const states: WfState[] = stateKeys.map((s) => ({
    key: s.key,
    initial: s.initial ?? !incoming.has(s.key),
    terminal: s.terminal ?? !outgoing.has(s.key),
  }));

  return { object, states, transitions };
}
