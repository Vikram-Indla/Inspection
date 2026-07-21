import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-020 · SCR-WEB-100 · Planning Visit List convergence (PLN-REQ-005/006/012).
// /planning is now the canonical list-first landing for the business_staff
// access class (every authenticated user who is neither admin nor inspector):
// KPI/status tabs, the visit table and the Create Visit method selection.
// Inspector and admin classes are denied with the unauthorized empty state.

test.describe("CD-020 planning home", () => {
  test("planner (business staff) sees the visit list, tabs and Create Visit methods", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    for (const tab of ["All", "Draft", "Published", "Returned", "Cancelled", "Expired"]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${tab}\\s`) })).toBeVisible();
    }
    await page.getByRole("button", { name: "Create Visit" }).click();
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await context.close();
  });

  test("reviewer (business staff) sees the visit list — no longer role-blocked", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    await expect(page.getByRole("link", { name: /^All\s/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Visit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toHaveCount(0);
    await context.close();
  });

  test("inspector class is denied the planning workspace", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
    await expect(page.locator('a[href^="/planning/"]')).toHaveCount(0);
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

  test("source contract uses capability access, drops package gating and keeps neutral errors", () => {
    const home = readFileSync(join(process.cwd(), "src/app/planning/page.tsx"), "utf8");
    expect(home).toContain("getPlanningAccess");
    expect(home).not.toContain("noPackage");
    const access = readFileSync(join(process.cwd(), "src/lib/planning/access.ts"), "utf8");
    expect(access).toContain("planning_access_class");
    expect(access).toContain("has_planning_capability");
    const list = readFileSync(join(process.cwd(), "src/lib/planning/visit-list.ts"), "utf8");
    expect(list).toContain('"draft", "validated"');
    const exporter = readFileSync(join(process.cwd(), "src/app/planning/export-actions.ts"), "utf8");
    expect(exporter).toContain("planning.export");
    const register = readFileSync(join(process.cwd(), "src/app/planning/plans/page.tsx"), "utf8");
    const drill = readFileSync(join(process.cwd(), "src/app/planning/plans/[id]/page.tsx"), "utf8");
    expect(register).not.toContain("{error.message}");
    expect(drill).not.toContain("pErr?.message ?? kErr?.message");
  });
});
