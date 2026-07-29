import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("ACT-010 canonical Supervisor home and RLS repair stay aligned", () => {
  const roleHome = read("src/lib/role-home.ts");
  const dashboard = read("src/app/(app)/dashboard/page.tsx");
  const migration = read("../../supabase/migrations/20260729160000_canonical_supervisor_runtime_access.sql");

  expect(roleHome).toContain('["supervisor", "/dashboard"]');
  expect(dashboard).toContain('const dashboardRoleKeys = ["supervisor", "ops", "leadership"] as const');
  expect(migration).toContain("grant select on public.visit_packages, public.inspections to authenticated");
  expect(migration).toContain("alter policy inspections_read on public.inspections");
  expect(migration).toContain("has_internal_role('supervisor')");
  expect(migration).toContain("public.is_assigned_inspector(visit_id)");
  expect(migration).toContain("public.inspects_same_factory(visit_id)");
  expect(migration).not.toMatch(/grant\s+(insert|update|delete|all)/i);
});
