import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("Planner submission is aligned from UI through the supervised lifecycle", () => {
  const page = read("src/app/(app)/planning/single/page.tsx");
  const actions = read("src/app/(app)/planning/single/actions.ts");
  const access = read("src/lib/planning/access.ts");
  const migration = read("../../supabase/migrations/20260729021000_single_visit_supervision_lifecycle.sql");

  expect(page).toContain('publish: t("plan.single.publish", "Submit for supervision")');
  expect(page).toContain('getPlanningAccess(sb, ["planning.submit_for_supervision"])');
  expect(page).toContain("transitionsExecutable={transitionsExecutable}");
  expect(actions).toContain('getPlanningAccess(sb, ["planning.submit_for_supervision"])');
  expect(actions).toContain('access.can("planning.submit_for_supervision")');
  expect(access).toContain('sb.rpc("has_planning_capability", { p_capability: capability })');
  expect(migration).toContain("submit_single_visit_for_supervision");
  expect(migration).toContain("planning.submit_for_supervision");
  expect(migration).toContain("planning_supervision_requests");
  expect(migration).toContain("status text not null default 'pending'");
  expect(migration).toContain("public.has_permission('planning.approve')");
  expect(migration).not.toContain("planning.publish");
});
