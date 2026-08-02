import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homeForRoles } from "../src/lib/role-home";
import { buildShellNavigation } from "../src/lib/shell-navigation";
import { isTaskStatusTransitionAllowed } from "../src/lib/workflow/tasks";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.describe("Planner development closure contracts", () => {
  test("Planner lands on and retains access to the shared Dashboard", () => {
    expect(homeForRoles(["planner"])).toBe("/dashboard");
    const hrefs = buildShellNavigation(["planner"]).flatMap(group => group.items.map(item => item.href));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/planning");
  });

  test("Planning exposes the governed three-column task workspace", () => {
    const planning = source("src/app/(app)/planning/page.tsx");
    const tasks = source("src/app/(app)/tasks/page.tsx");
    expect(planning).toContain('href="/tasks"');
    expect(tasks).toContain('sb.from("workflow_task_assignments")');
    expect(tasks).toContain('{ key: "assigned"');
    expect(tasks).toContain('{ key: "in-progress"');
    expect(tasks).toContain('{ key: "completed"');
    expect(isTaskStatusTransitionAllowed("assigned", "in_progress")).toBe(true);
    expect(isTaskStatusTransitionAllowed("completed", "assigned")).toBe(false);
  });

  test("task mutations and supervision remain on atomic database boundaries", () => {
    const taskActions = source("src/app/(app)/admin/workflows/task-actions.ts");
    const supervision = source("src/app/(app)/planning/supervision/actions.ts");
    expect(taskActions).toContain('sb.rpc("mutate_workflow_task"');
    expect(taskActions).toContain('message.includes("WORKFLOW-TASK-SCOPE")');
    expect(supervision).toContain('sb.rpc("decide_single_visit_supervision"');
  });

  test("supervision strings are registered without invented Arabic", () => {
    const migration = source("../../supabase/migrations/20260802100000_planner_supervision_localization_catalog.sql");
    expect(migration).toContain("'plan.supervision.title'");
    expect(migration).toContain("'plan.supervision.actionRequired'");
    expect(migration).toContain("null, 'draft'");
  });
});
