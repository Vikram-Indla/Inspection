import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-008 override uses Planning authority and preserves audit receipts", () => {
  const migration = read("../../supabase/migrations/20260729110000_planning_override_authority_repair.sql");
  expect(migration).toContain("planning_closure_has_explicit_capability");
  expect(migration).toContain("planning.override_assignment");
  expect(migration).toContain("planning.reassign");
  expect(migration).not.toContain("delete from");
});

test("REQ-008 recommendation labels only sourced factors", () => {
  const recommendation = read("../../supabase/migrations/20260729080000_planning_recommendation_authority_repair.sql");
  expect(recommendation).toContain("account_status='active'");
  expect(recommendation).toContain("'same_region','available'");
  expect(recommendation).toContain("'window_capacity'");
  expect(recommendation).toContain("'reason',capacity.fact->>'reason'");
  for (const unavailable of ["skills", "leave", "proximity"]) {
    expect(recommendation).not.toContain(`'${unavailable}'`);
  }
});
