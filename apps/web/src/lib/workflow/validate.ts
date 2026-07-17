// M2-02 Workflow, SLA & Notification Studio — deterministic graph validator.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0025/0026/0027/0031 · design GAP-01.
//
// Pure, side-effect-free publish gate over a config_versions payload
// (engine='workflow', shape {object, states[], transitions[]}). Runs the
// VAL-01..06 checks the Workflow Flight Deck design specifies. Never mutates
// input and never touches operational records — the same function backs the
// simulation preview and the publish gate.

export type WfState = {
  key: string;
  terminal?: boolean;
  initial?: boolean;
};

export type WfSideEffect = {
  kind: string;                 // assign|notify|report|package_lock|ebda|violation|sla|risk
  idempotencyKey?: string;      // MVP2-REQ-0031: every side effect must declare one
};

export type WfTransition = {
  from: string;
  to: string;
  trigger?: string;
  actor?: string;               // MVP2-REQ-0027: role/scope that may fire it
  guards?: string[];
  fx?: WfSideEffect[];
};

export type WfPayload = {
  object: string;
  states: WfState[];
  transitions: WfTransition[];
};

export type WfCheck = { id: string; label: string; ok: boolean; why: string };
export type WfValidation = { ok: boolean; checks: WfCheck[] };

const VAL = {
  reachable: "VAL-01",
  orphan: "VAL-02",
  terminal: "VAL-03",
  ambiguous: "VAL-04",
  idempotent: "VAL-05",
  actor: "VAL-06",
} as const;

/** Deterministic — identical payload always yields identical checks (safe to cache/replay). */
export function validateWorkflowPayload(payload: WfPayload): WfValidation {
  const checks: WfCheck[] = [];
  const states = Array.isArray(payload?.states) ? payload.states : [];
  const transitions = Array.isArray(payload?.transitions) ? payload.transitions : [];
  const keys = new Set(states.map((s) => s?.key).filter(Boolean));

  // Structural guard first — everything below assumes a well-formed shape.
  if (typeof payload?.object !== "string" || !states.length) {
    return {
      ok: false,
      checks: [{ id: "VAL-00", label: "Shape", ok: false, why: "Payload must define object and a non-empty states[]." }],
    };
  }

  const outgoing = new Map<string, WfTransition[]>();
  const hasIncoming = new Set<string>();
  for (const t of transitions) {
    if (!outgoing.has(t.from)) outgoing.set(t.from, []);
    outgoing.get(t.from)!.push(t);
    if (t.to) hasIncoming.add(t.to);
  }

  // VAL-06 unknown state references (fold into the reachability truth below).
  const unknownRefs = transitions
    .flatMap((t) => [t.from, t.to])
    .filter((k) => k && !keys.has(k));

  // VAL-01 reachability from the initial state(s).
  const initials = states.filter((s) => s.initial).map((s) => s.key);
  const roots = initials.length ? initials : states.slice(0, 1).map((s) => s.key);
  const seen = new Set<string>(roots);
  const stack = [...roots];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const t of outgoing.get(cur) ?? []) {
      if (t.to && keys.has(t.to) && !seen.has(t.to)) { seen.add(t.to); stack.push(t.to); }
    }
  }
  const unreachable = [...keys].filter((k) => !seen.has(k));
  checks.push({
    id: VAL.reachable, label: "Reachability",
    ok: unreachable.length === 0 && unknownRefs.length === 0,
    why: unknownRefs.length ? `Transitions reference unknown states: ${[...new Set(unknownRefs)].join(", ")}.`
      : unreachable.length ? `Unreachable states: ${unreachable.join(", ")}.`
      : "Every state is reachable from an initial state.",
  });

  // VAL-02 orphan states — no in and no out (excluding a lone initial).
  const orphans = [...keys].filter((k) =>
    !hasIncoming.has(k) && !(outgoing.get(k)?.length) && !initials.includes(k));
  checks.push({
    id: VAL.orphan, label: "No orphan states", ok: orphans.length === 0,
    why: orphans.length ? `Orphan states (no transitions): ${orphans.join(", ")}.` : "No orphan states.",
  });

  // VAL-03 invalid terminal paths — terminal with outgoing, or non-terminal dead-end.
  const badTerminal = states.filter((s) => s.terminal && (outgoing.get(s.key)?.length ?? 0) > 0).map((s) => s.key);
  const deadEnds = states.filter((s) => !s.terminal && (outgoing.get(s.key)?.length ?? 0) === 0).map((s) => s.key);
  checks.push({
    id: VAL.terminal, label: "Valid terminals", ok: badTerminal.length === 0 && deadEnds.length === 0,
    why: badTerminal.length ? `Terminal states have outgoing transitions: ${badTerminal.join(", ")}.`
      : deadEnds.length ? `Non-terminal dead-ends (no outgoing): ${deadEnds.join(", ")}.`
      : "Terminal and non-terminal states are consistent.",
  });

  // VAL-04 duplicate/ambiguous transitions — same (from,trigger) to different targets.
  const seenTrig = new Map<string, Set<string>>();
  const ambiguous: string[] = [];
  for (const t of transitions) {
    const k = `${t.from}::${t.trigger ?? ""}`;
    if (!seenTrig.has(k)) seenTrig.set(k, new Set());
    const tos = seenTrig.get(k)!;
    if (tos.size >= 1 && !tos.has(t.to)) ambiguous.push(`${t.from} —${t.trigger ?? "?"}→ {${[...tos, t.to].join(",")}}`);
    tos.add(t.to);
  }
  checks.push({
    id: VAL.ambiguous, label: "No ambiguous transitions", ok: ambiguous.length === 0,
    why: ambiguous.length ? `Ambiguous transitions: ${ambiguous.join("; ")}.` : "No duplicate/ambiguous transitions.",
  });

  // VAL-05 non-idempotent side effects — every fx must declare an idempotency key.
  const nonIdem = transitions.flatMap((t) =>
    (t.fx ?? []).filter((f) => !f.idempotencyKey).map((f) => `${t.from}→${t.to}:${f.kind}`));
  checks.push({
    id: VAL.idempotent, label: "Idempotent side effects", ok: nonIdem.length === 0,
    why: nonIdem.length ? `Side effects missing an idempotency key: ${nonIdem.join(", ")}.` : "Every side effect declares an idempotency key.",
  });

  // VAL-06 missing actor/scope on a transition.
  const noActor = transitions.filter((t) => !t.actor).map((t) => `${t.from}→${t.to}`);
  checks.push({
    id: VAL.actor, label: "Authorized transitions", ok: noActor.length === 0,
    why: noActor.length ? `Transitions with no actor/scope: ${noActor.join(", ")}.` : "Every transition names an authorized actor.",
  });

  return { ok: checks.every((c) => c.ok), checks };
}
