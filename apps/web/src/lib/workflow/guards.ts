// M2-02 Workflow, SLA & Notification Studio — runtime transition guards.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027/0028/0029/0030.
//
// Pure, deterministic guard evaluators. A transition declares guard keys
// (e.g. "evidence_required", "signature_consent", "geofence") in its payload;
// these functions evaluate each key against a runtime context. No DB access —
// the server-side canonical transition function and the simulation preview both
// call the same evaluator, so a simulated denial matches the real denial.
//
// This file never invents policy values (evidence counts, geofence radii,
// exception rules). It evaluates only the facts supplied in the context; the
// authoritative values come from configuration and the operational record.

export type GuardContext = {
  actor: { id: string; roles: string[] };
  scopeMatch: boolean;                 // MVP2-REQ-0027: actor scope covers the record (branch/sector/jurisdiction)
  objectState: string;                 // current state key of the record
  evidence?: {                         // MVP2-REQ-0028
    requiredKinds: string[];           // configured required evidence for this question/finding/severity
    presentKinds: string[];            // evidence actually attached
  };
  signature?: {                        // MVP2-REQ-0029
    signed: boolean;
    consent: boolean;
  };
  approvedException?: { approved: boolean; reason?: string };
  geofence?: {                         // MVP2-REQ-0030
    inside: boolean;
    exceptionReason?: string;
    exceptionEvidence?: boolean;
  };
};

export type GuardResult = { id: string; ok: boolean; why: string };

const missing = (required: string[], present: string[]) =>
  required.filter((k) => !present.includes(k));

/** Evaluate a single guard key against the context. Unknown keys fail closed. */
export function evaluateGuard(key: string, ctx: GuardContext): GuardResult {
  switch (key) {
    case "role_scope": {
      const ok = ctx.scopeMatch;
      return { id: "role_scope", ok, why: ok ? "Actor scope covers the record." : "Actor scope does not cover the record (branch/sector/jurisdiction)." };
    }
    case "object_state": {
      // Presence guard — the caller sets objectState; the transition's own
      // from-check is enforced in evaluateTransition. Here we only assert a state exists.
      const ok = !!ctx.objectState;
      return { id: "object_state", ok, why: ok ? `Object is in state ${ctx.objectState}.` : "Object has no resolved state." };
    }
    case "evidence_required": {
      const ev = ctx.evidence;
      if (!ev) return { id: "evidence_required", ok: false, why: "No evidence context supplied." };
      const gaps = missing(ev.requiredKinds, ev.presentKinds);
      const ok = gaps.length === 0;
      return { id: "evidence_required", ok, why: ok ? "All required evidence is present." : `Missing required evidence: ${gaps.join(", ")}.` };
    }
    case "signature_consent": {
      const sig = ctx.signature;
      const exc = ctx.approvedException?.approved === true;
      const ok = exc || (!!sig && sig.signed && sig.consent);
      return { id: "signature_consent", ok, why: ok ? (exc ? "Approved exception on file." : "Signature and consent completed.") : "Signature/consent not completed and no approved exception." };
    }
    case "approved_exception": {
      const ok = ctx.approvedException?.approved === true;
      return { id: "approved_exception", ok, why: ok ? "Approved exception on file." : "No approved exception." };
    }
    case "geofence": {
      const g = ctx.geofence;
      if (!g) return { id: "geofence", ok: false, why: "No geofence context supplied." };
      const exc = !!g.exceptionReason && g.exceptionEvidence === true;
      const ok = g.inside || exc;
      return { id: "geofence", ok, why: ok ? (g.inside ? "Inside geofence." : "Geofence exception with reason and evidence.") : "Outside geofence and no governed exception (reason + evidence)." };
    }
    default:
      // Fail closed: an unrecognised guard key must never silently pass.
      return { id: key, ok: false, why: `Unknown guard "${key}" — fails closed until implemented.` };
  }
}

/** Evaluate all guard keys. ok only when every guard passes. */
export function evaluateGuards(keys: string[] | undefined, ctx: GuardContext): { ok: boolean; results: GuardResult[] } {
  const results = (keys ?? []).map((k) => evaluateGuard(k, ctx));
  return { ok: results.every((r) => r.ok), results };
}
