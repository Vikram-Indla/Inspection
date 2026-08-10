import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test("DM-005 exposes existing inspectors to Planner without changing the selector markup", () => {
  const page = source("src/features/planning-single/queries.ts");
  const wizard = source("src/components/sections/planning-single/visit-configuration/visit-configuration.tsx");
  const migration = source(
    "../../supabase/migrations/20260729170000_planner_inspector_roster_read.sql",
  );
  const readContract = source(
    "../../supabase/migrations/20260729180000_planning_read_contract.sql",
  );

  expect(page).toContain("const inspectors = contract.data.inspectors");
  expect(readContract).toContain("from public.user_roles ur");
  expect(readContract).toContain("join public.profiles pr on pr.user_id = ur.user_id");
  expect(readContract).toContain("where ur.role_key = 'inspector'");
  expect(wizard).toContain('className="select" name="inspector_id" id="wizard-inspector"');
  expect(wizard).toContain("inspectors.map(i => <option");

  expect(migration).toContain("alter policy user_roles_read on public.user_roles");
  expect(migration).toContain("public.has_internal_role('planner')");
  expect(migration).toContain("public.has_internal_role('admin')");
  expect(migration).toContain("public.has_internal_role('supervisor')");
  expect(migration).not.toMatch(/\b(insert|update|delete)\s+(?:into|public\.)/i);
});
