import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "src/app/(app)/portal/page.tsx"), "utf8");
const actions = fs.readFileSync(path.join(root, "src/app/(app)/portal/actions.ts"), "utf8");
const create = fs.readFileSync(path.join(root, "src/app/(app)/portal/CreateRequest.tsx"), "utf8");
const migration = fs.readFileSync(path.resolve(root, "../../supabase/migrations/20260804010000_insp_713_external_portal_canonical_roles.sql"), "utf8");

test("INSP-713 replaces the one-form placeholder with nine query-state seams", () => {
  expect(page).toContain("resolvePortalState");
  for (const tab of ["establishments", "requests", "self-assessment"]) expect(page).toContain(`tab=${tab}`);
  for (const type of ["visit", "correction", "objection"]) expect(page).toContain(`"${type}"`);
  expect(page).toContain("view=review");
  expect(create).not.toContain('defaultValue="correction"');
  expect(create).toContain('name="request_type" value={requestType}');
});

test("INSP-713 uses approved classes only and removes portal inline styles", () => {
  for (const source of [page, create]) expect(source).not.toContain("style={{");
  for (const className of ["tabs", "tab", "alert", "panel", "stack", "row", "field", "input", "select", "btn", "badge"]) {
    expect(page + create).toContain(className);
  }
  expect(page + create).not.toContain("ax-");
});

test("INSP-713 keeps transitions guarded and reasoned", () => {
  expect(actions).toContain("isExternalRequestTransitionAllowed");
  expect(actions).toContain("isSelfAssessmentTransitionAllowed");
  expect(actions).toContain("A decision reason is required.");
  expect(actions).toContain('.eq("status", current.status)');
});

test("INSP-713 converges every four-table RLS occurrence without external grants", () => {
  for (const table of ["external_requests", "self_assessments", "correction_evidence", "objections"]) {
    expect(migration).toContain(`alter policy ${table}_internal_read`);
    expect(migration).toContain(`alter policy ${table}_internal_write`);
    expect(migration).toContain(`alter policy ${table}_internal_update`);
    expect(migration).toContain(`trg_audit_${table}`);
  }
  expect(migration).toContain("has_internal_role('admin')");
  expect(migration).toContain("has_internal_role('supervisor')");
  expect(migration).not.toMatch(/has_internal_role\('inspector'\)|has_internal_role\('factory_rep'\)/);
});
