import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("INSP-721 assignment reads fail closed by governed factory scope", () => {
  const sql = read("supabase/migrations/20260804055256_insp_721_assignments_rls_recursion_repair.sql");
  const grant = read("supabase/migrations/20260804055652_insp_721_assignment_scope_policy_execute_grant.sql");
  expect(sql).toMatch(/inspector_id\s*=\s*\(select auth\.uid\(\)\)/);
  expect(sql).toContain("private.assignment_read_in_governed_scope(visit_id)");
  expect(sql).toContain("security definer");
  expect(sql).toContain("revoke all on function private.assignment_read_in_governed_scope(uuid)");
  expect(sql).toContain("planning_closure_factory_in_scope");
  expect(sql).not.toContain("where v.id=assignments.visit_id");
  expect(grant).toContain("grant execute on function private.assignment_read_in_governed_scope(uuid)");
  expect(grant).toContain("to authenticated");
  expect(grant).toContain("from public, anon, service_role");
});

test("INSP-721 reassignment pages use only the authoritative request-scoped roster", () => {
  const list = read("apps/web/src/app/(app)/visits/page.tsx");
  const detail = read("apps/web/src/app/(app)/visits/[id]/page.tsx");
  for (const source of [list, detail]) {
    expect(source).toMatch(/rpc\(\s*"list_available_reassignment_inspectors"/);
    expect(source).not.toContain('.from("user_roles")');
    expect(source).not.toContain('user_roles!user_roles_user_id_fkey');
  }
});

test("INSP-721 reassignment mutation reuses overlap eligibility and remains audited", () => {
  const sql = read("supabase/migrations/20260804030000_insp_721_regional_assignments_reassignment_roster.sql");
  const mutation = read("supabase/migrations/20260727023541_post_publication_visit_mutations.sql");
  expect(sql).toContain("private.supervision_inspector_is_available");
  expect(sql).toContain("PLANNING-REASSIGN-SELECTION-OVERLAP");
  expect(sql).toContain("public.mutate_published_visits_atomic");
  expect(mutation).toContain("insert into public.audit_events");
  expect(mutation).toContain("'PLANNING_VISIT_' || upper(p_operation)");
});
