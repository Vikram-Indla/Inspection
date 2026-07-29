import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-020 · SCR-WEB-100 · Planning Visit List convergence (PLN-REQ-005/006/012).
// /planning is the canonical method landing. Planner and Supervisor may
// submit Bulk, Single and Immediate requests; Inspector execution begins from
// assigned work and Administration remains outside the planning workspace.

test.describe("CD-020 planning home", () => {
  test("planner (business staff) sees all three governed creation methods", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: "Planning", exact: true })).toBeVisible();
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(page.locator('a[href="/planning/visits"]')).toBeVisible();
    await context.close();
  });

  test("inspector is denied the Planning workspace and cannot initiate an Immediate visit", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
    await expect(page.locator('a[href="/planning/immediate"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/bulk"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/single"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/visits"]')).toHaveCount(0);
    await expect(page.getByTestId("planning-visit-table")).toHaveCount(0);
    await context.close();
  });

  test("admin class is denied the planning workspace", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("admin") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
    await expect(page.locator('a[href^="/planning/"]')).toHaveCount(0);
    await expect(page.getByTestId("planning-visit-table")).toHaveCount(0);
    await context.close();
  });

  test("source contract uses capability access, canonical design routes and neutral errors", () => {
    const home = readFileSync(join(process.cwd(), "src/app/(app)/planning/page.tsx"), "utf8");
    expect(home).toContain("getPlanningAccess");
    expect(home).toContain("CreateVisitSection");
    expect(home).toContain("planning-filter-toolbar");
    expect(home).not.toContain("SAQEEL_M2_PREVIEW");
    expect(home).not.toContain("wa_preview");
    expect(home).not.toContain("noPackage");
    const access = readFileSync(join(process.cwd(), "src/lib/planning/access.ts"), "utf8");
    expect(access).toContain("planning_access_class");
    expect(access).toContain("has_planning_capability");
    const planningVisits = readFileSync(join(process.cwd(), "src/app/(app)/planning/visits/page.tsx"), "utf8");
    expect(planningVisits).toContain('access.accessClass !== "business_staff"');
    expect(planningVisits.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(planningVisits.indexOf("return Visits("));
    const register = readFileSync(join(process.cwd(), "src/app/(app)/planning/plans/page.tsx"), "utf8");
    const drill = readFileSync(join(process.cwd(), "src/app/(app)/planning/plans/[id]/page.tsx"), "utf8");
    expect(register).not.toContain("{error.message}");
    expect(drill).not.toContain("pErr?.message ?? kErr?.message");
  });
});
