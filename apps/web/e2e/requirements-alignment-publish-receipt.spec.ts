import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-012 server action submits the complete governed supervision request", () => {
  const action = read("src/app/(app)/planning/single/actions.ts");
  expect(action).toContain('sb.rpc("submit_single_visit_for_supervision"');
  expect(action).toContain("p_target: canonicalTarget");
  expect(action).toContain("p_package_version_ids: package_version_ids");
  expect(action).toContain("p_proposed_inspector_id: proposedInspectorId");
  expect(action).toContain("p_resume_plan_id: resumeId || null");
  expect(action).toContain('redirect(`/planning/supervision?submitted=${visitId}`)');
});

test("REQ-012 supervision transaction covers plan, visit, packages, request, notification and audit", () => {
  const migration = read("../../supabase/migrations/20260729021000_single_visit_supervision_lifecycle.sql");
  for (const table of [
    "visit_plans", "visits", "visit_packages", "planning_supervision_requests",
    "notifications", "audit_events",
  ]) expect(migration).toContain(table);
  expect(migration).toContain("PLANNING-SUPERVISION-DUPLICATE");
  expect(migration).toContain("PLANNING-SUPERVISION-CANONICAL-TARGET");
  expect(migration).toContain("SINGLE_VISIT_SUBMITTED_FOR_SUPERVISION");
});
