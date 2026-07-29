import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("WA-P1-M2-BATCH-002 source, cutover and security", () => {
  test("Planning-owned replacements are canonical, capability-gated and preserve current Visit routes", () => {
    for (const file of [
      "src/app/(app)/planning/visits/page.tsx",
      "src/app/(app)/planning/visits/[id]/page.tsx",
    ]) {
      const text = source(file);
      expect(text).toContain("getPlanningAccess");
      expect(text).not.toContain("SAQEEL_M2_PREVIEW");
      expect(text).not.toContain("wa_preview");
      expect(text).not.toContain("notFound()");
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls|mockVisit/i);
    }

    expect(source("src/app/(app)/visits/page.tsx")).toContain('const routeBase = planningOwnedPreview ? "/planning/visits" : "/visits"');
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain('.from("audit_events")');
    expect(source("src/app/(app)/visits/[id]/page.tsx")).toContain("DualStateRibbon");
    const planningHome = source("src/app/(app)/planning/page.tsx");
    expect(planningHome).toContain("CreateVisitSection");
    expect(planningHome).toContain("planning-filter-toolbar");
    expect(source("src/components/ShellClient.tsx")).toContain('<Icon name="ai" />');
    const detailCss = source("src/app/(app)/visits/[id]/VisitDetail.module.css");
    expect(detailCss).toContain(".actions");
    expect(detailCss).toContain("position: sticky");
    expect(detailCss).toContain("@media (max-width: 1024px)");
    expect(source("src/app/saqeel-runtime.css")).toContain(".sq-btn:focus-visible { outline: 2px solid var(--focus-ring)");
    expect(source("src/app/saqeel-runtime.css")).toContain("text-decoration: none");
  });

  test("no Field or iPad ownership entered this batch", () => {
    const migration = source("../../product-contract/web-admin-phase1/M2_BATCH_002_CURRENT_TO_TARGET_MIGRATION.csv");
    expect(migration).not.toMatch(/\/field\/|field pwa|ipad/i);
  });

  test("runtime navigation colors match the supplied SAQEEL semantic tokens", () => {
    const tokens = source("src/app/tokens.css");
    const shell = source("src/app/saqeel-runtime.css");

    for (const token of [
      "--nav-bg:          #1f2328",
      "--nav-bg-hover:    #2a2f35",
      "--nav-bg-selected: #17352b",
      "--nav-border:      #32373d",
      "--nav-text:        #b9bec4",
      "--nav-indicator:   #35b285",
      "--nav-bg:          #131519",
      "--nav-bg-hover:    #1d2025",
      "--nav-bg-selected: #16342a",
      "--nav-border:      #262a30",
      "--nav-text:        #a8adb4",
      "--nav-indicator:   #3fbd8d",
    ]) expect(tokens).toContain(token);

    expect(tokens).not.toMatch(/#101828|#0b1120|#26314a|#8a93ab/);
    expect(shell).not.toMatch(/#4b5670|#6b7794/);
    expect(shell).toContain(".sq-shell-search input:focus-visible { outline: 2px solid var(--focus-ring)");
    expect(shell).toContain(".sq-shell-search:focus-within input");
    expect(shell).toContain("border-color: var(--sq-color-border)");
  });
});

test.describe("WA-P1-M2-BATCH-002 planner journey", () => {
  test.use({ storageState: storageStatePath("planner") });

  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

  test("Planning landing exposes the canonical creation methods", async ({ page }) => {
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: "Planning", exact: true })).toBeVisible();
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test("Visits list keeps real RLS scope, filters, dual states and Planning-owned detail links", async ({ page }) => {
    await page.goto("/planning/visits");
    await expect(page.getByText(/RLS-scoped — showing \d+ of \d+/i)).toBeVisible();
    await expect(page.getByRole("group", { name: /Status counts/i })).toBeVisible();
    await expect(page.getByText(/Planning status and operational state remain independent/i)).toBeVisible();
    const legacyDetailHrefs = await page.locator('a[href^="/visits/"]').evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute("href") ?? "")
        .filter((href) => /^\/visits\/[0-9a-f]{8}-/i.test(href)),
    );
    expect(legacyDetailHrefs).toEqual([]);

    const detailLinks = page.locator('a[href^="/planning/visits/"]');
    test.skip(await detailLinks.count() === 0, "no visits in planner scope");
    await expect(detailLinks.first()).toBeVisible();
  });

  test("Visit detail exposes governed actions, immutable versions and audit without legacy directional links", async ({ page }) => {
    await page.goto("/planning/visits");
    const detailLinks = page.locator('a[href^="/planning/visits/"]');
    test.skip(await detailLinks.count() === 0, "no visits in planner scope");
    await detailLinks.first().click();

    await expect(page).toHaveURL(/\/planning\/visits\/[^?]+$/);
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.getByRole("tablist", { name: /state domains/i })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(5);
    await expect(page.locator("#ribbon-panel a")).not.toContainText("→");
    await expect(page.locator(".wa-visit-detail-actions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open plan", exact: true })).not.toContainText("→");
    await expect(page.getByText(/Planning history — cannot be edited/i)).toBeVisible();
  });

  test("canonical Planning Visits route loads without a preview query", async ({ page }) => {
    await page.goto("/planning/visits");
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "404", exact: true })).toHaveCount(0);
  });

  test("Arabic RTL, narrow reflow and accessibility pass", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/planning/visits");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test("admin remains denied from the Planning replacement entry", async ({ browser }) => {
  const context = await browser.newContext({ storageState: storageStatePath("admin") });
  const page = await context.newPage();
  await page.goto("/locale?set=en");
  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
  await expect(page.locator('a[href="/planning/bulk"], a[href="/planning/single"], a[href="/planning/immediate"]')).toHaveCount(0);
  await context.close();
});
