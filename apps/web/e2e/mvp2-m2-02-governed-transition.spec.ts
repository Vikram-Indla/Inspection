import { test, expect } from "@playwright/test";
import { runGovernedTransition, type GovernedTransitionDeps, type AuditEntry } from "../src/lib/workflow/governed-transition";
import type { OutboxClient, SideEffectCommand } from "../src/lib/workflow/outbox";
import { disabledEventEmitter, type EventEmitter } from "../src/lib/workflow/events";
import type { WfPayload } from "../src/lib/workflow/validate";
import type { GuardContext } from "../src/lib/workflow/guards";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027..0031.
// Self-authored governed-transition orchestrator tests (pure; injected deps).

const def: WfPayload = {
  object: "visit",
  states: [{ key: "submitted", initial: true }, { key: "approved", terminal: true }],
  transitions: [
    { from: "submitted", to: "approved", trigger: "approve", actor: "reviewer",
      guards: ["role_scope", "signature_consent"],
      fx: [{ kind: "notify", idempotencyKey: "d:n" }, { kind: "sla", idempotencyKey: "d:s" }] },
  ],
};

function fakes() {
  const store = new Set<string>();
  const audits: AuditEntry[] = [];
  const outbox: OutboxClient = {
    async insertIgnoringConflicts(cmds: SideEffectCommand[]) {
      const ins: string[] = [];
      for (const c of cmds) if (!store.has(c.idempotencyKey)) { store.add(c.idempotencyKey); ins.push(c.idempotencyKey); }
      return ins;
    },
  };
  let emitted = 0;
  const emit: EventEmitter = { async emit() { emitted++; return { emitted: true, id: "evt-1" }; } };
  const deps: GovernedTransitionDeps = {
    getDefinition: async () => def,
    outbox, emit,
    audit: async (e) => { audits.push(e); },
    now: () => "2026-07-17T00:00:00.000Z",
    correlationId: () => "corr-fixed",
  };
  return { deps, audits, store, get emitted() { return emitted; } };
}

const reviewerCtx: GuardContext = {
  actor: { id: "r1", roles: ["reviewer"] }, scopeMatch: true, objectState: "submitted",
  signature: { signed: true, consent: true },
};
const input = {
  workflowObject: "visit", aggregate: { type: "visit", id: "agg-1", version: 2 },
  fromState: "submitted", trigger: "approve", ctx: reviewerCtx, requirementRefs: ["MVP2-REQ-0027"],
};

test("mvp2-m2-02 governed allow: enqueues, emits, audits allowed", async () => {
  const f = fakes();
  const r = await runGovernedTransition(f.deps, input);
  expect(r.allowed).toBe(true);
  expect(r.toState).toBe("approved");
  expect(r.enqueue?.enqueued).toHaveLength(2);
  expect(r.emit?.emitted).toBe(true);
  expect(f.emitted).toBe(1);
  expect(f.audits.at(-1)!.action).toBe("workflow_transition_allowed");
});

test("mvp2-m2-02 governed allow is idempotent — retry dedupes side effects", async () => {
  const f = fakes();
  await runGovernedTransition(f.deps, input);
  const retry = await runGovernedTransition(f.deps, input);
  expect(retry.enqueue?.enqueued).toHaveLength(0);
  expect(retry.enqueue?.deduped).toHaveLength(2);
  expect(f.store.size).toBe(2);
});

test("mvp2-m2-02 governed deny (guard fail): no enqueue, no emit, audits denied", async () => {
  const f = fakes();
  const denyCtx: GuardContext = { ...reviewerCtx, signature: { signed: false, consent: false } };
  const r = await runGovernedTransition(f.deps, { ...input, ctx: denyCtx });
  expect(r.allowed).toBe(false);
  expect(r.denials.some((d) => d.id === "signature_consent")).toBe(true);
  expect(f.store.size).toBe(0);        // nothing enqueued
  expect(f.emitted).toBe(0);           // nothing emitted
  expect(f.audits.at(-1)!.action).toBe("workflow_transition_denied");
});

test("mvp2-m2-02 governed deny when no published definition", async () => {
  const f = fakes();
  const deps = { ...f.deps, getDefinition: async () => null };
  const r = await runGovernedTransition(deps, input);
  expect(r.allowed).toBe(false);
  expect(r.denials[0].id).toBe("definition");
  expect(f.audits.at(-1)!.action).toBe("workflow_transition_denied");
});

test("mvp2-m2-02 disabled M2-05 adapter reports honest non-emit (no fabricated success)", async () => {
  const f = fakes();
  const deps = { ...f.deps, emit: disabledEventEmitter };
  const r = await runGovernedTransition(deps, input);
  expect(r.allowed).toBe(true);          // transition still governed + side effects enqueued
  expect(r.emit?.emitted).toBe(false);   // event not fabricated
  expect(r.emit?.reason).toBe("m2_05_adapter_disabled");
});
