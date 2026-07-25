import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

// SCR-IPAD-600 · MVP1-M03-001..006 · AC-0099..0104
// Source-contract checks complement authenticated runtime coverage. They guard
// the RLS scope, journey ordering, honest state copy and governed action routes
// without mutating shared inspection data.
test.describe("SCR-IPAD-600 Assigned Visits widgets", () => {
  test("assigned work stays inspector-scoped and exposes the canonical states", () => {
    const page = read("src/app/(app)/field/my-tasks/page.tsx");
    expect(page).toContain('.eq("inspector_id", user.id)');
    expect(page).toContain('["published", "expired"].includes');
    expect(page).toContain("assignmentStatus: a.status");
    expect(page).toContain("packageVersionId: a.visits.package_version_id");
    expect(page).toContain('redirect("/login")');
    for (const state of ["Today", "Upcoming", "Returned", "Expired"]) {
      expect(page).toContain(`"${state}"`);
    }
  });

  test("search, filters and order operate on the same RLS-scoped assignment rows", () => {
    const browser = read("src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx");
    expect(browser).toContain("task.factory.name");
    expect(browser).toContain("task.factory.code");
    expect(browser).toContain("task.factory.region");
    expect(browser).toContain("task.factory.city");
    expect(browser).toContain('type Filter = "all" | "today" | "upcoming" | "returned" | "expired"');
    expect(browser).toContain("a.windowStart.localeCompare(b.windowStart)");
    expect(browser).toContain('role="status" aria-live="polite"');
  });

  test("open and return actions preserve governed startup and return workflows", () => {
    const browser = read("src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx");
    const startup = read("src/app/(app)/field/[visitId]/Startup.tsx");
    const actions = read("src/app/(app)/field/[visitId]/actions.ts");
    expect(browser).toContain("`/field/${task.id}`");
    expect(browser).toContain("`/field/${task.id}#return-assignment`");
    expect(browser).toContain("!expired && !returned");
    expect(startup).toContain('id="return-assignment"');
    expect(actions).toContain('sb.rpc("request_visit_return"');
    expect(actions).toContain("Return reason is mandatory (M03-006)");
  });

  test("offline and package wording remains truthful", () => {
    const browser = read("src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx");
    const page = read("src/app/(app)/field/my-tasks/page.tsx");
    expect(browser).toContain("navigator.onLine");
    expect(page).toContain("cached assignment details remain available; writes will queue where supported");
    expect(page).toContain('"Package linked"');
    expect(page).toContain('"Package not linked"');
    expect(page).not.toContain('"Offline ready"');
  });
});
