import { test, expect } from "@playwright/test";
import {
  groupExceptions, groupCountEqualsSource, scopeToBranch, type ExceptionSource,
} from "../src/lib/operations/exceptions";

// TASK-MVP2-M2-09-OPS-INTEL-001 · MVP2-REQ-0120,0124 · CD-047.
// Pure source-contract test (no browser/DB). Enforces the CD-047 "no synthetic
// rows" contract: grouped counts must equal source counts.

const SRC: ExceptionSource[] = [
  { id: "1", category: "review_overdue", branch: "riyadh", ref: "rv-1", occurredAt: "2026-07-16T09:00:00Z" },
  { id: "2", category: "review_overdue", branch: "jeddah", ref: "rv-2", occurredAt: "2026-07-17T09:00:00Z" },
  { id: "3", category: "sync_conflict", branch: "riyadh", ref: "sy-1", occurredAt: "2026-07-15T09:00:00Z" },
  { id: "4", category: "override_pending", branch: "riyadh", ref: "ov-1", occurredAt: "2026-07-17T10:00:00Z" },
];

test("group-count equals source-count (no synthetic or dropped rows)", () => {
  expect(groupCountEqualsSource(SRC)).toBe(true);
  expect(groupCountEqualsSource([])).toBe(true);
});

test("grouping buckets by category and orders newest-first", () => {
  const groups = groupExceptions(SRC);
  const review = groups.find((g) => g.category === "review_overdue")!;
  expect(review.count).toBe(2);
  expect(review.items[0].id).toBe("2"); // newer first
});

test("branch scoping never invents rows", () => {
  const scoped = scopeToBranch(SRC, "riyadh");
  expect(scoped).toHaveLength(3);
  expect(groupCountEqualsSource(scoped)).toBe(true);
  expect(scopeToBranch(SRC, null)).toHaveLength(4);
});
