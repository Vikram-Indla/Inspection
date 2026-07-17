import { test, expect } from "@playwright/test";
import { isCaseTransitionAllowed, hasOpenCaseForOrigin, canCloseCase } from "../src/lib/cases/spine";

// TASK-MVP2-M2-10-CASE-SPINE-001 · MVP2-REQ-0114..0119 · CD-046.
test("case lifecycle is linear open→in_progress→resolved→closed", () => {
  expect(isCaseTransitionAllowed("open", "in_progress")).toBe(true);
  expect(isCaseTransitionAllowed("in_progress", "resolved")).toBe(true);
  expect(isCaseTransitionAllowed("resolved", "closed")).toBe(true);
  expect(isCaseTransitionAllowed("open", "closed")).toBe(false);
  expect(isCaseTransitionAllowed("closed", "open")).toBe(false);
});

test("one open case per origin (mirrors DB unique index)", () => {
  const existing = [{ originType: "review", originRef: "r1", status: "open" as const }];
  expect(hasOpenCaseForOrigin(existing, "review", "r1")).toBe(true);
  expect(hasOpenCaseForOrigin(existing, "review", "r2")).toBe(false);
  const closed = [{ originType: "review", originRef: "r1", status: "closed" as const }];
  expect(hasOpenCaseForOrigin(closed, "review", "r1")).toBe(false);
});

test("closing requires resolved + reason", () => {
  expect(canCloseCase("resolved", "done").ok).toBe(true);
  expect(canCloseCase("resolved", "").ok).toBe(false);
  expect(canCloseCase("open", "x").ok).toBe(false);
});
