import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test("DM-005 exposes existing inspectors to Planner without changing the selector markup", () => {
  const page = source("src/app/(app)/planning/single/page.tsx");
  const wizard = source("src/app/(app)/planning/single/Wizard.tsx");
  const migration = source(
    "../../supabase/migrations/20260729170000_planner_inspector_roster_read.sql",
  );

  expect(page).toContain('sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector")');
  expect(page).toContain("const inspectors = (inspRoles ?? []).map");
  expect(wizard).toContain('className="select" name="inspector_id" id="wizard-inspector"');
  expect(wizard).toContain("inspectors.map(i => <option");

  expect(migration).toContain("alter policy user_roles_read on public.user_roles");
  expect(migration).toContain("public.has_internal_role('planner')");
  expect(migration).toContain("public.has_internal_role('admin')");
  expect(migration).toContain("public.has_internal_role('supervisor')");
  expect(migration).not.toMatch(/\b(insert|update|delete)\s+(?:into|public\.)/i);
});
