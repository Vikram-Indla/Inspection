import { test, expect } from "@playwright/test";
import { validateWorkflowPayload } from "../src/lib/workflow/validate";
import { LIFECYCLES, LIFECYCLE_REQUIREMENTS, VISIT_LIFECYCLE, PLAN_LIFECYCLE, FINDING_LIFECYCLE, RISK_MODEL_LIFECYCLE, REPORT_LIFECYCLE, SYNC_LIFECYCLE, COMMITTEE_LIFECYCLE } from "../src/lib/workflow/lifecycles";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0035..0043. Self-authored, pure.

// Every canonical lifecycle must be a valid governed graph (VAL-01..06).
for (const [object, def] of Object.entries(LIFECYCLES)) {
  test(`mvp2-m2-02 lifecycle ${object} passes the graph validator`, () => {
    const r = validateWorkflowPayload(def);
    const failing = r.checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.why}`);
    expect(failing, failing.join(" | ")).toEqual([]);
    expect(r.ok).toBe(true);
  });
}

test("mvp2-m2-02 all 9 requirement→lifecycle mappings resolve (0035..0043)", () => {
  const reqs = Object.keys(LIFECYCLE_REQUIREMENTS).sort();
  expect(reqs).toEqual([
    "MVP2-REQ-0035", "MVP2-REQ-0036", "MVP2-REQ-0037", "MVP2-REQ-0038", "MVP2-REQ-0039",
    "MVP2-REQ-0040", "MVP2-REQ-0041", "MVP2-REQ-0042", "MVP2-REQ-0043",
  ]);
  for (const object of Object.values(LIFECYCLE_REQUIREMENTS)) expect(LIFECYCLES[object]).toBeDefined();
});

// Contract points from the workbook acceptance rows:
test("mvp2-m2-02 0035 plan publish creates visits + iPad packages (idempotent side effects)", () => {
  const publish = PLAN_LIFECYCLE.transitions.find((t) => t.trigger === "publish")!;
  const kinds = (publish.fx ?? []).map((f) => f.kind);
  expect(kinds).toContain("create_visits");
  expect(kinds).toContain("create_ipad_packages");
  expect((publish.fx ?? []).every((f) => !!f.idempotencyKey)).toBe(true);
});

test("mvp2-m2-02 0036 incomplete inspection cannot submit (evidence guard on submit)", () => {
  const submit = VISIT_LIFECYCLE.transitions.find((t) => t.from === "in_progress" && t.trigger === "submit")!;
  expect(submit.guards).toContain("evidence_required");
  expect(submit.guards).toContain("form_complete");
  const terminals = VISIT_LIFECYCLE.states.filter((s) => s.terminal).map((s) => s.key).sort();
  expect(terminals).toEqual(["approved", "cancelled", "unable_to_execute"]);
});

test("mvp2-m2-02 0037 approved report is not directly editable (only share/archive forward)", () => {
  const fromApproved = REPORT_LIFECYCLE.transitions.filter((t) => t.from === "approved").map((t) => t.to);
  expect(fromApproved).toEqual(["shared"]);
  expect(REPORT_LIFECYCLE.states.find((s) => s.key === "archived")!.terminal).toBe(true);
});

test("mvp2-m2-02 0038 no violation without an approved clause", () => {
  const propose = FINDING_LIFECYCLE.transitions.find((t) => t.trigger === "propose_violation")!;
  expect(propose.guards).toContain("clause");
});

test("mvp2-m2-02 0040 committee has the field-visit-requested branch", () => {
  const branch = COMMITTEE_LIFECYCLE.transitions.find((t) => t.to === "field_visit_requested");
  expect(branch).toBeDefined();
});

test("mvp2-m2-02 0042 risk model has Scheduled activation + Rolled Back terminal", () => {
  expect(RISK_MODEL_LIFECYCLE.states.some((s) => s.key === "scheduled")).toBe(true);
  expect(RISK_MODEL_LIFECYCLE.states.find((s) => s.key === "rolled_back")!.terminal).toBe(true);
});

test("mvp2-m2-02 0043 sync retains conflict + failed and ends manually_resolved", () => {
  const keys = SYNC_LIFECYCLE.states.map((s) => s.key);
  expect(keys).toContain("conflict");
  expect(keys).toContain("failed");
  expect(SYNC_LIFECYCLE.states.find((s) => s.key === "manually_resolved")!.terminal).toBe(true);
});
