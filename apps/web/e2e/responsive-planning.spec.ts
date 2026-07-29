import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("PKT-RESPONSIVE-PLANNING-003 source contracts", () => {
  test("WA-DES-036 and WA-DES-045 are canonical without preview switches", () => {
    for (const file of [
      "src/app/(app)/planning/page.tsx",
      "src/app/(app)/planning/visits/page.tsx",
      "src/app/(app)/planning/visits/[id]/page.tsx",
      "src/app/(app)/visits/page.tsx",
      "src/app/(app)/visits/[id]/page.tsx",
    ]) {
      const text = source(file);
      expect(text).not.toContain("SAQEEL_M2_PREVIEW");
      expect(text).not.toContain("wa_preview");
      expect(text).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls|mockVisit/i);
    }
    expect(source("src/app/(app)/planning/page.tsx")).toContain("planning-filter-toolbar");
  });

  test("Inspector is denied Planning before governed reads", () => {
    const home = source("src/app/(app)/planning/page.tsx");
    expect(home).toContain('access.accessClass !== "business_staff"');
    expect(home.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(home.indexOf('sb.from("package_versions")'));

    const list = source("src/app/(app)/planning/visits/page.tsx");
    expect(list.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(list.indexOf("return Visits("));
    const detail = source("src/app/(app)/planning/visits/[id]/page.tsx");
    expect(detail.indexOf('access.accessClass !== "business_staff"')).toBeLessThan(detail.indexOf("return VisitDetail("));
  });

  test("Planning and Visit-detail layouts declare bounded responsive and reduced-motion rules", () => {
    const planningCss = source("src/app/saqeel-runtime.css");
    const detailCss = source("src/app/(app)/visits/[id]/VisitDetail.module.css");
    expect(planningCss).toContain(".planning-filter-toolbar");
    expect(planningCss).toContain("@media (max-width: 760px)");
    expect(detailCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(280px, 360px)");
    expect(detailCss).toContain("@media (max-width: 1024px)");
    expect(`${planningCss}\n${detailCss}`).toContain("min-inline-size: 0");
  });
});

test.describe("PKT-RESPONSIVE-PLANNING-003 runtime", () => {
  test("Planner landing reflows across the unified responsive width continuum", async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    const matrix = [
      { width: 320, height: 800, locale: "en", theme: "light" },
      { width: 375, height: 812, locale: "ar", theme: "dark" },
      { width: 390, height: 844, locale: "en", theme: "dark" },
      { width: 768, height: 1024, locale: "ar", theme: "light" },
      { width: 1024, height: 768, locale: "en", theme: "light" },
      { width: 1280, height: 800, locale: "ar", theme: "dark" },
      { width: 1440, height: 900, locale: "en", theme: "dark" },
      { width: 1920, height: 1080, locale: "ar", theme: "light" },
    ] as const;

    for (const state of matrix) {
      await page.setViewportSize({ width: state.width, height: state.height });
      await page.goto(`/locale?set=${state.locale}`);
      await page.evaluate(theme => localStorage.setItem("saqeel-theme", theme), state.theme);
      await page.goto("/planning");
      await expect(page.getByRole("heading", { name: "Planning", exact: true })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${state.width}px ${state.locale}/${state.theme}`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });

  test("Inspector is denied Planning and Planning-owned Visits before content", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
    await expect(page.locator('a[href="/planning/immediate"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/bulk"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/single"]')).toHaveCount(0);
    await expect(page.locator('a[href="/planning/visits"]')).toHaveCount(0);
    await page.goto("/planning/visits");
    await expect(page.getByRole("heading", { name: "Authorized role required", exact: true })).toBeVisible();
    await expect(page.locator('[data-saqeel-design="WA-DES-045"]')).toHaveCount(0);
    await context.close();
  });

  test("Administrator is denied Planning landing and Planning-owned Visits", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("admin") });
    const page = await context.newPage();
    for (const route of ["/planning", "/planning/visits"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
      await expect(page.locator('a[href="/planning/bulk"], a[href="/planning/single"], a[href="/planning/immediate"]')).toHaveCount(0);
    }
    await context.close();
  });
});
