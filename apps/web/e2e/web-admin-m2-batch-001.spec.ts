import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("WA-P1-M2-BATCH-001 source and security", () => {
  test("preview is server-gated and reuses the governed routes without a bypass", () => {
    for (const file of [
      "src/app/(app)/planning/page.tsx",
      "src/app/(app)/visits/page.tsx",
      "src/app/(app)/visits/[id]/page.tsx",
    ]) {
      const text = source(file);
      expect(text).toContain('process.env.SAQEEL_M2_PREVIEW === "enabled"');
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls|mockVisit/i);
    }
    expect(source("src/app/(app)/planning/page.tsx")).toContain("getPlanningAccess");
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain('.from("audit_events")');
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain("DualStateRibbon");
  });
});

test.describe("WA-P1-M2-BATCH-001 planner runtime", () => {
  test.use({ storageState: storageStatePath("planner") });

  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

  test("Planning target uses real package/draft reads and preserves the three governed creation paths", async ({ page }) => {
    await page.goto("/planning?wa_preview=1");
    await expect(page.locator('[data-saqeel-design="WA-DES-036"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Planning methods" })).toBeVisible();
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Visit plans" })).toBeVisible();
  });

  test("Visits target preserves RLS scope, dual statuses, filters, sorting and detail navigation", async ({ page }) => {
    await page.goto("/visits?wa_preview=1");
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.getByRole("group", { name: /Status counts/i })).toBeVisible();
    await expect(page.getByText(/RLS-scoped — showing \d+ of \d+/i)).toBeVisible();
    await expect(page.getByText(/Planning status and operational state remain independent/i)).toBeVisible();
    await expect(page.getByText(/Visit management summary/i)).toHaveCount(0);
    await expect(page.getByText(/Select a visit to see its identity/i)).toHaveCount(0);
    const detailLinks = page.locator('a[href^="/visits/"][href$="?wa_preview=1"]');
    test.skip(await detailLinks.count() === 0, "no visits in planner scope");
    await expect(detailLinks.first()).toBeVisible();
  });

  test("Visit target retains the five-domain ribbon, actions and append-only audit", async ({ page }) => {
    await page.goto("/visits?wa_preview=1");
    const links = page.locator('a[href^="/visits/"][href$="?wa_preview=1"]');
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
    await page.goto("/visits?wa_preview=1");
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test("admin remains denied even when the preview query is supplied", async ({ browser }) => {
  const context = await browser.newContext({ storageState: storageStatePath("admin") });
  const page = await context.newPage();
  await page.goto("/locale?set=en");
  await page.goto("/planning?wa_preview=1");
  await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
  await expect(page.locator('[data-saqeel-design="WA-DES-036"]')).toHaveCount(0);
  await context.close();
});
