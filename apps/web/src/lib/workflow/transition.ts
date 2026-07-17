// M2-02 Workflow, SLA & Notification Studio — canonical transition evaluator.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027 (+0028/0029/0030 via guards).
//
// Pure decision core for "may this actor move this record from its current
// state via this trigger?". No DB writes — the server action wraps this with
// the CAS update and audit; the simulation preview calls it with fixture
// context and never mutates. A simulated denial therefore equals the real one.
//
// Direct status mutation is prohibited (MVP2 canonical transition contract):
// callers must go through this evaluator, never patch a status column directly.

import type { WfPayload, WfTransition } from "./validate";
import { evaluateGuards, type GuardContext, type GuardResult } from "./guards";

export type TransitionDecision = {
  allowed: boolean;
  transition?: WfTransition;
  denials: GuardResult[];   // empty when allowed
};

/**
 * Evaluate a requested transition against a workflow definition + runtime context.
 * @param def       published workflow payload (config_versions.payload)
 * @param fromState current object state key
 * @param trigger   the trigger being fired
 * @param ctx       runtime facts (actor roles, scope, evidence, signature, geofence, …)
 */
export function evaluateTransition(
  def: WfPayload,
  fromState: string,
  trigger: string,
  ctx: GuardContext,
): TransitionDecision {
  const transitions = Array.isArray(def?.transitions) ? def.transitions : [];
  const candidates = transitions.filter((t) => t.from === fromState && (t.trigger ?? "") === trigger);

  // Object-state guard (MVP2-REQ-0027): the transition must exist from the
  // record's actual current state — no jumping states.
  if (candidates.length === 0) {
    return { allowed: false, denials: [{ id: "object_state", ok: false, why: `No transition "${trigger}" from state "${fromState}".` }] };
  }
  // Ambiguity is a definition defect the validator blocks at publish; fail closed here.
  if (candidates.length > 1) {
    return { allowed: false, denials: [{ id: "ambiguous", ok: false, why: `Ambiguous transition "${trigger}" from "${fromState}" — definition must be validated.` }] };
  }

  const transition = candidates[0];
  const denials: GuardResult[] = [];

  // Role/scope guard (MVP2-REQ-0027).
  if (!transition.actor) {
    denials.push({ id: "role_scope", ok: false, why: "Transition declares no authorized actor." });
  } else if (!ctx.actor.roles.includes(transition.actor)) {
    denials.push({ id: "role_scope", ok: false, why: `Actor lacks the required role "${transition.actor}".` });
  } else if (!ctx.scopeMatch) {
    denials.push({ id: "role_scope", ok: false, why: "Actor scope does not cover the record (branch/sector/jurisdiction)." });
  }

  // Declared guards (evidence_required / signature_consent / geofence / …).
  const g = evaluateGuards(transition.guards, ctx);
  for (const r of g.results) if (!r.ok) denials.push(r);

  return { allowed: denials.length === 0, transition, denials };
}
