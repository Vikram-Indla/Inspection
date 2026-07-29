import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-006 filters every Bulk read through the registered-source chain", () => {
  const page = read("src/app/(app)/planning/bulk/page.tsx");
  const actions = read("src/app/(app)/planning/bulk/actions.ts");
  const relation = "industrial_licenses!inner(commercial_registration_id)";
  const nonNull = '.not("industrial_licenses.commercial_registration_id", "is", null)';

  expect(page).toContain(relation);
  expect(page).toContain(nonNull);
  expect(actions.match(new RegExp(relation.replace(/[!()]/g, "\\$&"), "g"))).toHaveLength(3);
  expect(actions.match(/industrial_licenses\.commercial_registration_id/g)).toHaveLength(3);
});

test("REQ-006 database guard is method-scoped and fail-closed", () => {
  const migration = read("../../supabase/migrations/20260729060000_requirements_alignment_registered_bulk_source.sql");

  expect(migration).toContain("trg_guard_bulk_visit_registered_source");
  expect(migration).toContain("vp.method = 'bulk'");
  expect(migration).toContain("join public.industrial_licenses");
  expect(migration).toContain("join public.commercial_registrations");
  expect(migration).toContain("PLANNING-BULK-REGISTERED-SOURCE-REQUIRED");
  expect(migration).toContain("not f.is_temporary");
});
