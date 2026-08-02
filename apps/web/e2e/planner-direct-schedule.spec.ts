import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("Planner direct scheduling is aligned from UI through guarded publisher", () => {
  const page = read("src/app/(app)/planning/single/page.tsx");
  const actions = read("src/app/(app)/planning/single/actions.ts");
  const access = read("src/lib/planning/access.ts");
  const migration = read("../../supabase/migrations/20260729030000_planner_direct_schedule.sql");

  expect(page).toContain('publish: t("plan.single.publish", "Schedule visit")');
  expect(page).toContain("transitionsExecutable={canSchedule}");
  expect(actions).toContain("await canScheduleSingleVisit(sb, access)");
  expect(actions).toContain('blockers.push("Scheduling requires Planner access")');
  expect(access).toContain('sb.rpc("has_role", { r: "planner" })');
  expect(access).toContain('access.can("planning.publish")');
  expect(migration).toContain("insert into public.role_permissions");
  expect(migration).toContain("select 'planner', 'planning.publish'");
  expect(migration).toContain("on conflict do nothing");
  expect(migration).not.toContain("supervisor");
  expect(migration).not.toMatch(/delete\s+from/i);
});
