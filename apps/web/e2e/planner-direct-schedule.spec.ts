import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("Planner submission is aligned from UI through governed supervision", () => {
  const page = read("src/app/(app)/planning/single/page.tsx");
  const actions = read("src/app/(app)/planning/single/actions.ts");
  const migration = read("../../supabase/migrations/20260729021000_single_visit_supervision_lifecycle.sql");

  expect(page).toContain('publish: t("plan.single.publish", "Submit for supervision")');
  expect(page).toContain('getPlanningAccess(sb, ["planning.submit_for_supervision"])');
  expect(page).toContain('transitionAccess.can("planning.submit_for_supervision")');
  expect(actions).toContain('getPlanningAccess(sb, ["planning.submit_for_supervision"])');
  expect(actions).toContain('blockers.push("Submitting requires the planning.submit_for_supervision capability")');
  expect(actions).toContain('sb.rpc("submit_single_visit_for_supervision"');
  expect(actions).toContain('redirect(`/planning/supervision?submitted=${visitId}`)');
  expect(migration).toContain("planning_supervision_requests");
  expect(migration).toContain("'pending_supervision'");
  expect(migration).toContain("SINGLE_VISIT_SUBMITTED_FOR_SUPERVISION");
  expect(migration).toContain("planning.approve");
});
