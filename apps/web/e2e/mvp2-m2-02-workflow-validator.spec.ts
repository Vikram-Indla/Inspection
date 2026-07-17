import { test, expect } from "@playwright/test";
import { validateWorkflowPayload, type WfPayload } from "../src/lib/workflow/validate";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0025/0026/0027/0031 · design GAP-01.
// Self-authored deterministic validator tests (no runtime/DB). Prefix mvp2-m2-02-.

const goodPayload: WfPayload = {
  object: "visit",
  states: [
    { key: "assigned", initial: true },
    { key: "on_site" },
    { key: "submitted" },
    { key: "approved", terminal: true },
  ],
  transitions: [
    { from: "assigned", to: "on_site", trigger: "arrive", actor: "inspector", fx: [{ kind: "notify", idempotencyKey: "notify:arrive:{visit}" }] },
    { from: "on_site", to: "submitted", trigger: "submit", actor: "inspector", guards: ["evidence_required"] },
    { from: "submitted", to: "approved", trigger: "approve", actor: "reviewer", fx: [{ kind: "sla", idempotencyKey: "sla:stop:{visit}" }] },
  ],
};

test("mvp2-m2-02 validator passes a well-formed governed graph", () => {
  const r = validateWorkflowPayload(goodPayload);
  expect(r.ok).toBe(true);
  expect(r.checks.every((c) => c.ok)).toBe(true);
});

test("mvp2-m2-02 VAL-01 flags an unreachable state", () => {
  const p: WfPayload = { ...goodPayload, states: [...goodPayload.states, { key: "orphan_island" }],
    transitions: [...goodPayload.transitions, { from: "orphan_island", to: "orphan_island", trigger: "loop", actor: "system" }] };
  const r = validateWorkflowPayload(p);
  expect(r.ok).toBe(false);
  expect(r.checks.find((c) => c.id === "VAL-01")!.ok).toBe(false);
});

test("mvp2-m2-02 VAL-03 flags an invalid terminal with outgoing transitions", () => {
  const p: WfPayload = {
    object: "visit",
    states: [{ key: "a", initial: true }, { key: "b", terminal: true }],
    transitions: [
      { from: "a", to: "b", trigger: "go", actor: "inspector" },
      { from: "b", to: "a", trigger: "back", actor: "inspector" },
    ],
  };
  const r = validateWorkflowPayload(p);
  expect(r.ok).toBe(false);
  expect(r.checks.find((c) => c.id === "VAL-03")!.ok).toBe(false);
});

test("mvp2-m2-02 VAL-04 flags ambiguous transitions", () => {
  const p: WfPayload = {
    object: "visit",
    states: [{ key: "a", initial: true }, { key: "b", terminal: true }, { key: "c", terminal: true }],
    transitions: [
      { from: "a", to: "b", trigger: "go", actor: "inspector" },
      { from: "a", to: "c", trigger: "go", actor: "inspector" },
    ],
  };
  const r = validateWorkflowPayload(p);
  expect(r.ok).toBe(false);
  expect(r.checks.find((c) => c.id === "VAL-04")!.ok).toBe(false);
});

test("mvp2-m2-02 VAL-05 flags a side effect with no idempotency key", () => {
  const p: WfPayload = {
    object: "visit",
    states: [{ key: "a", initial: true }, { key: "b", terminal: true }],
    transitions: [{ from: "a", to: "b", trigger: "go", actor: "inspector", fx: [{ kind: "notify" }] }],
  };
  const r = validateWorkflowPayload(p);
  expect(r.ok).toBe(false);
  expect(r.checks.find((c) => c.id === "VAL-05")!.ok).toBe(false);
});

test("mvp2-m2-02 VAL-06 flags a transition with no actor/scope", () => {
  const p: WfPayload = {
    object: "visit",
    states: [{ key: "a", initial: true }, { key: "b", terminal: true }],
    transitions: [{ from: "a", to: "b", trigger: "go" }],
  };
  const r = validateWorkflowPayload(p);
  expect(r.ok).toBe(false);
  expect(r.checks.find((c) => c.id === "VAL-06")!.ok).toBe(false);
});

test("mvp2-m2-02 validator is deterministic (same input → identical result)", () => {
  const a = JSON.stringify(validateWorkflowPayload(goodPayload));
  const b = JSON.stringify(validateWorkflowPayload(goodPayload));
  expect(a).toBe(b);
});
