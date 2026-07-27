import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

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

async function applyState(
  page: Page,
  state: { width: number; height: number; locale: "en" | "ar"; theme: "light" | "dark" },
  route: string,
) {
  await page.setViewportSize({ width: state.width, height: state.height });
  await page.goto(`/locale?set=${state.locale}`);
  await page.goto(route);
  await page.evaluate(theme => localStorage.setItem("saqeel-theme", theme), state.theme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
  await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
  await expect(page.locator("nav#saqeel-primary-nav")).toHaveCount(1);
}

async function expectNoRootOverflow(page: Page, label: string) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      overflow: root.scrollWidth - root.clientWidth,
      width: root.clientWidth,
    };
  });
  expect(result.overflow, `${label}: ${JSON.stringify(result)}`).toBeLessThanOrEqual(1);
}

test.describe("PKT-RESPONSIVE-REVIEW-APPROVALS-005 source contracts", () => {
  test("queue and decision authority stay fail-closed and capability-specific", () => {
    const queue = source("src/app/(app)/reviews/page.tsx");
    const workspace = source("src/app/(app)/reviews/[id]/page.tsx");
    const actions = source("src/app/(app)/reviews/[id]/actions.ts");

    expect(queue).toContain('roles.has("reviewer") || roles.has("ops")');
    expect(queue).not.toMatch(/roles\.has\("(?:admin|compliance_admin)"\)/);
    expect(workspace).toContain('r.role_key === "reviewer" || r.role_key === "ops"');
    expect(workspace).not.toMatch(/canDecide[\s\S]{0,180}(?:admin|compliance_admin)/);
    expect(actions).toContain('const validDecisions = ["approve", "return", "reject"]');
    expect(actions).toContain("validSectionKeys");
    expect(actions).toContain("invalidSections.length > 0");
    expect(actions).toMatch(/\.eq\("status", "under_review"\)\.is\("decided_at", null\)/);
    expect(`${queue}\n${workspace}\n${actions}`).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls/i);
  });

  test("opening remains read-only and exact-scope decisions remain explicit and immutable", () => {
    const workspace = source("src/app/(app)/reviews/[id]/page.tsx");
    const actions = source("src/app/(app)/reviews/[id]/actions.ts");
    const compare = source("src/app/(app)/reviews/[id]/VersionCompare.tsx");

    expect(workspace).toContain("opening is read-only");
    expect(workspace).not.toMatch(/from\("reviews"\)\s*\.insert/);
    expect(workspace).toContain("<StartReview");
    expect(actions).toContain("export async function startReview");
    expect(actions).toMatch(/from\("reviews"\)\.insert/);
    expect(compare).toMatch(/returnedScope\.includes\(sect\.key\)\s*\?\s*"expected"\s*:\s*"unexpected"/);
    expect(compare).toContain("Comparison is navigation-only");
  });

  test("review surfaces declare bounded responsive containment and reduced motion", () => {
    const queue = source("src/app/(app)/reviews/page.tsx");
    const workspace = source("src/app/(app)/reviews/[id]/page.tsx");
    const css = source("src/app/(app)/reviews/responsive.module.css");

    expect(queue).toContain('data-saqeel-screen="SCR-WEB-300"');
    expect(workspace).toContain('data-saqeel-screen="SCR-WEB-310"');
    expect(css).toContain("min-inline-size: 0");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("@media (max-width: 899px)");
    expect(css).toContain("@media (max-width: 560px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

test.describe("PKT-RESPONSIVE-REVIEW-APPROVALS-005 runtime", () => {
  test("Reviewer queue reflows across the bilingual light/dark width continuum", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const page = await context.newPage();

    for (const state of matrix) {
      await applyState(page, state, "/reviews");
      await expect(page.locator('[data-saqeel-screen="SCR-WEB-300"]')).toBeVisible();
      await expect(page.locator("input[name=decision], textarea[name=reason]")).toHaveCount(0);
      await expect(page.locator("body")).toContainText(state.locale === "ar" ? /مراجعة/ : /review/i);
      await expectNoRootOverflow(page, `${state.width}px queue ${state.locale}/${state.theme}`);
    }
    await context.close();
  });

  test("Read-only workspace reflows without creating or recording a decision", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/reviews");
    const workspacePath = await page.locator('a[href^="/reviews/"]').first().getAttribute("href");
    test.skip(!workspacePath, "no reviewer workspace row in this environment");

    for (const state of matrix) {
      await applyState(page, state, workspacePath!);
      await expect(page.locator('[data-saqeel-screen="SCR-WEB-310"]')).toBeVisible();
      await expect(page.getByText(/Read-only submitted version|نسخة مُقدَّمة للاطّلاع فقط/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: /Finding trace chain|سلسلة تتبع/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail|شريط النطاق الكاشف للتلاعب/i })).toBeVisible();
      await expectNoRootOverflow(page, `${state.width}px workspace ${state.locale}/${state.theme}`);
    }
    await context.close();
  });

  test("Inspector and generic Administrator cannot obtain queue or workspace authority", async ({ browser }) => {
    const reviewerContext = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const reviewerPage = await reviewerContext.newPage();
    await reviewerPage.goto("/reviews");
    const workspacePath = await reviewerPage.locator('a[href^="/reviews/"]').first().getAttribute("href");
    await reviewerContext.close();
    test.skip(!workspacePath, "no reviewer workspace row in this environment");

    for (const persona of ["inspector", "admin"] as const) {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto("/locale?set=en");
      await page.goto("/reviews");
      if (/\/login(?:\?|$)/.test(page.url())) {
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
        await expect(page.locator('[data-saqeel-migration="review-approvals"]')).toHaveCount(0);
        await context.close();
        continue;
      }
      await expect(page.getByRole("heading", { name: /don’t have access to the review queue/i })).toBeVisible();
      await expect(page.locator('[data-saqeel-migration="review-approvals"]')).toHaveCount(0);
      await page.goto(workspacePath!);
      await expect(page.getByRole("heading", { level: 3, name: /don’t have access to this review/i })).toBeVisible();
      await expect(page.locator('[data-saqeel-migration="review-approvals"]')).toHaveCount(0);
      await context.close();
    }
  });

  test("Arabic mobile queue and workspace have no automated accessibility violations", async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const page = await context.newPage();
    const state = { width: 390, height: 844, locale: "ar", theme: "dark" } as const;
    await applyState(page, state, "/reviews");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    const workspacePath = await page.locator('a[href^="/reviews/"]').first().getAttribute("href");
    test.skip(!workspacePath, "no reviewer workspace row in this environment");
    await applyState(page, state, workspacePath!);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await context.close();
  });
});
