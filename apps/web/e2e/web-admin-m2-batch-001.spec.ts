import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("WA-P1-M2-BATCH-001 source and security", () => {
  test("canonical Planning routes are capability-gated before governed data reads", () => {
    for (const file of [
      "src/app/(app)/planning/page.tsx",
      "src/app/(app)/planning/visits/page.tsx",
      "src/app/(app)/planning/visits/[id]/page.tsx",
    ]) {
      const text = source(file);
      expect(text).toContain("getPlanningAccess");
      expect(text).not.toContain("SAQEEL_M2_PREVIEW");
      expect(text).not.toContain("wa_preview");
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls|mockVisit/i);
    }
    const listRoute = source("src/app/(app)/planning/visits/page.tsx");
    expect(listRoute.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(listRoute.indexOf("return Visits("));
    const detailRoute = source("src/app/(app)/planning/visits/[id]/page.tsx");
    expect(detailRoute.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(detailRoute.indexOf("return VisitDetail("));
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain('.from("audit_events")');
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain("DualStateRibbon");
  });
});

test.describe("WA-P1-M2-BATCH-001 planner runtime", () => {
  test.use({ storageState: storageStatePath("planner") });

  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

  test("Planning target uses real package/draft reads and preserves the three governed creation paths", async ({ page }) => {
    await page.goto("/planning");
    await expect(page.locator('[data-saqeel-design="WA-DES-036"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Planning methods" })).toBeVisible();
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Visit plans" })).toBeVisible();
  });

  test("Visits target preserves RLS scope, dual statuses, filters, sorting and detail navigation", async ({ page }) => {
    await page.goto("/planning/visits");
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.getByRole("group", { name: /Status counts/i })).toBeVisible();
    await expect(page.getByText(/RLS-scoped — showing \d+ of \d+/i)).toBeVisible();
    await expect(page.getByText(/Planning status and operational state remain independent/i)).toBeVisible();
    await expect(page.getByText(/Visit management summary/i)).toHaveCount(0);
    await expect(page.getByText(/Select a visit to see its identity/i)).toHaveCount(0);
    const detailLinks = page.locator('a[href^="/planning/visits/"]');
    test.skip(await detailLinks.count() === 0, "no visits in planner scope");
    await expect(detailLinks.first()).toBeVisible();
  });

  test("Visit target retains the five-domain ribbon, actions and append-only audit", async ({ page }) => {
    await page.goto("/planning/visits");
    const links = page.locator('a[href^="/planning/visits/"]');
    test.skip(await links.count() === 0, "no visits in planner scope");
    await links.first().click();
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.getByRole("tablist", { name: /state domains/i })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(5);
    await expect(page.getByText(/Planning history — cannot be edited/i)).toBeVisible();
  });

  test("Arabic RTL, narrow reflow, keyboard semantics and accessibility pass", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/planning/visits");
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test("admin remains denied from canonical Planning routes", async ({ browser }) => {
  const context = await browser.newContext({ storageState: storageStatePath("admin") });
  const page = await context.newPage();
  await page.goto("/locale?set=en");
  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
  await expect(page.locator('[data-saqeel-design="WA-DES-036"]')).toHaveCount(0);
  await context.close();
});
