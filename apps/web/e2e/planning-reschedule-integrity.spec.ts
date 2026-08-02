import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { classifyPlanningClosureError } from "../src/lib/planning/closure-receipts";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260802120000_planning_reschedule_inspector_overlap.sql"),
  "utf8",
);

test("TASK-PLANNING-RESCHEDULE-INTEGRITY-001 preserves the atomic RPC and adds the canonical guard", () => {
  expect(migration).toContain("mutate_planning_window_atomic");
  expect(migration).toContain("assignment-inspector:");
  expect(migration).toContain("pg_advisory_xact_lock");
  expect(migration).toContain("order by assignment.inspector_id");
  expect(migration).toContain("other_assignment.visit_id<>v_visit.id");
  expect(migration).toContain("other_visit.planning_status in ('draft','published','returned')");
  expect(migration).toContain("other_visit.window_start<p_window_end");
  expect(migration).toContain("other_visit.window_end>p_window_start");
  expect(migration).toContain("PLANNING-RESCHEDULE-CONFLICT");
  expect(migration).toContain("errcode = '23505'");
  expect(migration).not.toContain("create table");
  expect(migration).not.toContain("alter table");
});

test("stable reschedule conflict maps to the existing conflict outcome", () => {
  expect(classifyPlanningClosureError({
    code: "23505",
    message: "PLANNING-RESCHEDULE-CONFLICT",
  })).toBe("conflict");
  expect(classifyPlanningClosureError({
    code: "40001",
    message: "PLANNING-CLOSURE-STALE",
  })).toBe("conflict");
  expect(classifyPlanningClosureError({
    code: "23514",
    message: "PLANNING-CLOSURE-720H",
  })).toBe("cutoff_blocked");
  expect(classifyPlanningClosureError({
    code: "42501",
    message: "PLANNING-CLOSURE-SCOPE-DENIED",
  })).toBe("scope_denied");
});
