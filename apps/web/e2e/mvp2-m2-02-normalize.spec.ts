import { test, expect } from "@playwright/test";
import { normalizeWorkflowPayload } from "../src/lib/workflow/normalize";
import { validateWorkflowPayload } from "../src/lib/workflow/validate";
import { VISIT_LIFECYCLE } from "../src/lib/workflow/lifecycles";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001. Self-authored, pure.
// The Flight Deck normaliser must handle both the MVP1 stored shape and the MVP2
// lifecycle shape WITHOUT fabricating actors or idempotency keys.

test("mvp2-m2-02 normalize handles the MVP1 stored shape and infers initial/terminal", () => {
  const mvp1 = {
    object: "legacy",
    states: ["draft", "published", "retired"],
    transitions: [
      { id: "T1", from: "draft", to: "published", actor: "admin", guard: "—", side_effects: ["notify"] },
      { id: "T2", from: "published", to: "retired", actor: "admin", guard: "successor", side_effects: [] },
    ],
  };
  const n = normalizeWorkflowPayload(mvp1);
  expect(n.states.find((s) => s.key === "draft")!.initial).toBe(true);
  expect(n.states.find((s) => s.key === "retired")!.terminal).toBe(true);
  // '—' guard is dropped; a real guard is kept
  expect(n.transitions[0].guards).toEqual([]);
  expect(n.transitions[1].guards).toEqual(["successor"]);
  // side effects are NOT given fabricated idempotency keys (honest VAL-05 flag)
  expect(n.transitions[0].fx?.[0].idempotencyKey).toBeUndefined();
});

test("mvp2-m2-02 normalize is idempotent on the MVP2 lifecycle shape (already valid)", () => {
  const n = normalizeWorkflowPayload(VISIT_LIFECYCLE);
  const r = validateWorkflowPayload(n);
  expect(r.ok).toBe(true);
});

test("mvp2-m2-02 normalize + validate flags MVP1 side effects lacking idempotency keys", () => {
  const mvp1 = {
    object: "legacy", states: ["a", "b"],
    transitions: [{ id: "T", from: "a", to: "b", actor: "admin", side_effects: ["notify"] }],
  };
  const r = validateWorkflowPayload(normalizeWorkflowPayload(mvp1));
  expect(r.checks.find((c) => c.id === "VAL-05")!.ok).toBe(false); // honest: no fabricated key
});

test("mvp2-m2-02 normalize derives states from transitions when states are absent", () => {
  const n = normalizeWorkflowPayload({ object: "x", transitions: [{ id: "T", from: "a", to: "b", actor: "u" }] });
  expect(n.states.map((s) => s.key).sort()).toEqual(["a", "b"]);
});
