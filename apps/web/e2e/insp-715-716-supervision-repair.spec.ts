import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "../../supabase/migrations/20260803220806_insp_715_716_supervision_availability_audit_read.sql"), "utf8");
const page = readFileSync(resolve(process.cwd(), "src/app/(app)/planning/supervision/page.tsx"), "utf8");

test("INSP-715 uses one guarded overlap predicate for roster and release", () => {
  expect(migration).toContain("supervision_inspector_is_available");
  expect(migration.match(/private\.supervision_inspector_is_available\(/g)).toHaveLength(4);
  expect(migration).toContain("v.planning_status in ('published','returned')");
  expect(migration).toContain("v.window_start < p_window_end");
  expect(migration).toContain("v.window_end > p_window_start");
  expect(page).toContain('rpc("list_available_supervision_inspectors"');
  expect(page).not.toContain('from("user_roles")');
});

test("INSP-715 availability RPC is capability-guarded and bounded", () => {
  expect(migration).toContain("not public.has_permission('planning.approve')");
  expect(migration).toContain("cardinality(p_visit_ids) > 100");
  expect(migration).toContain("r.status = 'pending'");
  expect(migration).toContain("v.planning_status = 'pending_supervision'");
  expect(migration).toContain("revoke all on function private.supervision_inspector_is_available");
});

test("INSP-716 grants only authorized supervision audit reads", () => {
  expect(migration).toContain("create policy audit_read_planning_supervision");
  expect(migration).toContain("object_type = 'planning_supervision_requests'");
  expect(migration).toContain("public.has_permission('planning.approve')");
  expect(migration).toContain("where r.id = audit_events.object_id");
  expect(migration).not.toMatch(/grant\s+(insert|update|delete).*audit_events/i);
});
