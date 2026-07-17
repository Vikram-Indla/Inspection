import { test, expect } from "@playwright/test";
import { evaluateTransition } from "../src/lib/workflow/transition";
import { evaluateGuard, type GuardContext } from "../src/lib/workflow/guards";
import type { WfPayload } from "../src/lib/workflow/validate";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027/0028/0029/0030.
// Self-authored deterministic guard + canonical-transition tests. Prefix mvp2-m2-02-.

const def: WfPayload = {
  object: "visit",
  states: [
    { key: "on_site", initial: true },
    { key: "in_progress" },
    { key: "submitted" },
    { key: "approved", terminal: true },
  ],
  transitions: [
    { from: "on_site", to: "in_progress", trigger: "start", actor: "inspector", guards: ["role_scope", "geofence"] },
    { from: "in_progress", to: "submitted", trigger: "submit", actor: "inspector", guards: ["role_scope", "evidence_required"] },
    { from: "submitted", to: "approved", trigger: "approve", actor: "reviewer", guards: ["role_scope", "signature_consent"] },
  ],
};

const baseCtx: GuardContext = {
  actor: { id: "u1", roles: ["inspector"] },
  scopeMatch: true,
  objectState: "on_site",
  geofence: { inside: true },
  evidence: { requiredKinds: ["photo"], presentKinds: ["photo"] },
  signature: { signed: true, consent: true },
};

// MVP2-REQ-0027 — role/scope
test("mvp2-m2-02 0027 authorized actor+scope may transition", () => {
  const d = evaluateTransition(def, "on_site", "start", baseCtx);
  expect(d.allowed).toBe(true);
});

test("mvp2-m2-02 0027 wrong role is denied", () => {
  const d = evaluateTransition(def, "on_site", "start", { ...baseCtx, actor: { id: "u2", roles: ["reviewer"] } });
  expect(d.allowed).toBe(false);
  expect(d.denials.some((x) => x.id === "role_scope")).toBe(true);
});

test("mvp2-m2-02 0027 out-of-scope actor is denied", () => {
  const d = evaluateTransition(def, "on_site", "start", { ...baseCtx, scopeMatch: false });
  expect(d.allowed).toBe(false);
  expect(d.denials.some((x) => x.id === "role_scope")).toBe(true);
});

test("mvp2-m2-02 0027 unknown transition from current state is denied (no state jump)", () => {
  const d = evaluateTransition(def, "on_site", "approve", baseCtx);
  expect(d.allowed).toBe(false);
  expect(d.denials[0].id).toBe("object_state");
});

// MVP2-REQ-0028 — evidence required
test("mvp2-m2-02 0028 submit blocked without required evidence", () => {
  const ctx: GuardContext = { ...baseCtx, objectState: "in_progress", evidence: { requiredKinds: ["photo"], presentKinds: [] } };
  const d = evaluateTransition(def, "in_progress", "submit", ctx);
  expect(d.allowed).toBe(false);
  expect(d.denials.some((x) => x.id === "evidence_required")).toBe(true);
});

test("mvp2-m2-02 0028 submit allowed once evidence present", () => {
  const ctx: GuardContext = { ...baseCtx, objectState: "in_progress" };
  const d = evaluateTransition(def, "in_progress", "submit", ctx);
  expect(d.allowed).toBe(true);
});

// MVP2-REQ-0029 — signature/consent or approved exception
test("mvp2-m2-02 0029 approve blocked without signature/consent", () => {
  const ctx: GuardContext = { ...baseCtx, actor: { id: "r1", roles: ["reviewer"] }, objectState: "submitted", signature: { signed: false, consent: false } };
  const d = evaluateTransition(def, "submitted", "approve", ctx);
  expect(d.allowed).toBe(false);
  expect(d.denials.some((x) => x.id === "signature_consent")).toBe(true);
});

test("mvp2-m2-02 0029 approved exception satisfies signature guard", () => {
  const ctx: GuardContext = { ...baseCtx, actor: { id: "r1", roles: ["reviewer"] }, objectState: "submitted", signature: { signed: false, consent: false }, approvedException: { approved: true, reason: "signer refused" } };
  const d = evaluateTransition(def, "submitted", "approve", ctx);
  expect(d.allowed).toBe(true);
});

// MVP2-REQ-0030 — geofence or exception
test("mvp2-m2-02 0030 start blocked outside geofence without exception", () => {
  const ctx: GuardContext = { ...baseCtx, geofence: { inside: false } };
  const d = evaluateTransition(def, "on_site", "start", ctx);
  expect(d.allowed).toBe(false);
  expect(d.denials.some((x) => x.id === "geofence")).toBe(true);
});

test("mvp2-m2-02 0030 geofence exception with reason+evidence is allowed", () => {
  const ctx: GuardContext = { ...baseCtx, geofence: { inside: false, exceptionReason: "gps unavailable indoors", exceptionEvidence: true } };
  const d = evaluateTransition(def, "on_site", "start", ctx);
  expect(d.allowed).toBe(true);
});

// Fail-closed
test("mvp2-m2-02 unknown guard key fails closed", () => {
  const r = evaluateGuard("totally_unknown_guard", baseCtx);
  expect(r.ok).toBe(false);
});
