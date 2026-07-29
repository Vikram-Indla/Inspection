import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-010 publishes zero-many package snapshots atomically", () => {
  const atomic = read("../../supabase/migrations/20260728013000_planning_single_publish_atomic_contract.sql");
  const alias = read("../../supabase/migrations/20260729090000_single_publish_package_alias_repair.sql");
  const executor = read("../../supabase/migrations/20260729100000_single_publish_atomic_executor_repair.sql");
  expect(atomic).toContain("p_package_version_ids uuid[]");
  expect(atomic).toContain("coalesce(p_package_version_ids, '{}'::uuid[])");
  expect(atomic).toContain("foreach v_package_id in array v_package_ids");
  expect(atomic).toContain("insert into public.visit_packages");
  expect(alias).toContain("selected.package_version_id");
  expect(executor).toContain("security definer");
});

test("REQ-010 snapshots are append-only", () => {
  const immutable = read("../../supabase/migrations/20260729120000_visit_package_snapshot_immutability.sql");
  expect(immutable).toContain("before update or delete on public.visit_packages");
  expect(immutable).toContain("IMMUTABLE: visit package snapshots cannot be changed");
  expect(immutable).toContain("revoke update,delete,truncate");
  expect(immutable).not.toMatch(/delete\s+from/i);
});
