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
  await page.evaluate(theme => {
    localStorage.setItem("saqeel-theme", theme);
  }, state.theme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
  await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
  await expect(page.locator("nav#sqx-shell-rail")).toHaveCount(1);
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
    const access = source("src/features/reviews/access.ts");
    const workspace = source("src/app/(app)/reviews/[id]/page.tsx");
    const actions = source("src/app/(app)/reviews/[id]/actions.ts");

    // The queue gate is the governed allow-list (RBAC-011): supervisor/admin/
    // planner coordinate; inspectors pass RLS-limited to their own work.
    expect(queue).toContain("if (!hasQueueAccess(roleRows))");
    expect(access).toContain('const QUEUE_ROLES = ["supervisor", "admin", "planner", "inspector"]');
    // Decision capability stays with supervisor (Level 2 Reviewer) and admin
    // only — read-admitted planner/inspector never gain it.
    expect(workspace).toContain('const canDecide = !!user && (roleRows ?? []).some(r => r.role_key === "supervisor" || r.role_key === "admin")');
    expect(workspace).not.toMatch(/canDecide[^\n]*(?:planner|inspector)/);
    expect(actions).toContain('const validDecisions = ["approve", "return", "reject"]');
    expect(actions).toContain("validSectionKeys");
    expect(actions).toContain("invalidSections.length > 0");
    expect(actions).toContain('if (current.decided_at || current.status !== "under_review")');
    expect(`${queue}\n${access}\n${workspace}\n${actions}`).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls/i);
  });

  test("opening remains read-only and exact-scope decisions remain explicit and immutable", () => {
    const workspace = source("src/app/(app)/reviews/[id]/page.tsx");
    const actions = source("src/app/(app)/reviews/[id]/actions.ts");
    const compare = source("src/app/(app)/reviews/[id]/VersionCompare.tsx");
    const rpcs = readFileSync(join(process.cwd(), "../..", "supabase/migrations/20260729004841_execution_supervisor_review_authority.sql"), "utf8");

    expect(workspace).toContain("opening is read-only");
    expect(workspace).not.toMatch(/from\("reviews"\)\s*\.insert/);
    expect(workspace).toContain("<StartReview");
    expect(actions).toContain("export async function startReview");
    // the review-create + under_review transition lives in the canonical
    // start_review transaction, never as a direct insert from the action
    expect(actions).not.toMatch(/from\("reviews"\)\s*\.insert/);
    expect(actions).toContain('sb.rpc("start_review"');
    expect(rpcs).toContain("insert into public.reviews(");
    expect(rpcs).toMatch(/set status = 'under_review'/);
    expect(compare).toMatch(/returnedScope\.includes\(sect\.key\)\s*\?\s*"expected"\s*:\s*"unexpected"/);
    expect(compare).toContain("Comparison is navigation-only");
  });

  test("review surfaces declare bounded responsive containment and reduced motion", () => {
    const queue = source("src/app/(app)/reviews/QueueScreen.tsx");
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
      await expect(page.locator('[data-saqeel-screen="SCR-WEB-310"]')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Read-only submitted version|الإصدار النهائي المُقدَّم/i)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("heading", { name: /Finding trace chain|سلسلة تتبع/i })).toBeVisible();
      await page.getByRole("tab", { name: /Version comparison|مقارنة/i }).click();
      await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail|شريط النطاق الكاشف للتلاعب/i })).toBeVisible();
      await expectNoRootOverflow(page, `${state.width}px workspace ${state.locale}/${state.theme}`);
    }
    await context.close();
  });

  test("Read-admitted personas without decision capability never obtain decision authority", async ({ browser }) => {
    // Governed model (RBAC-011): inspector and planner pass the queue gate
    // RLS-limited, but decision capability belongs to supervisor/admin only.
    // Their workspace view must stay read-only — no Start review, no decision
    // radiogroup, no reason box — with the explicit read-only note rendered.
    const reviewerContext = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const reviewerPage = await reviewerContext.newPage();
    await reviewerPage.goto("/reviews");
    const workspacePath = await reviewerPage.locator('a[href^="/reviews/"]').first().getAttribute("href");
    await reviewerContext.close();
    test.skip(!workspacePath, "no reviewer workspace row in this environment");

    for (const persona of ["inspector", "planner"] as const) {
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
      await expect(page.locator('input[name="decision"], textarea[name="reason"]')).toHaveCount(0);
      await page.goto(workspacePath!);
      // RLS keeps this reviewer-owned record out of the persona's scope, so
      // the honest outcomes are the unauthorized block, the not-found/outside-
      // scope state, or the read-only workspace — never a decision surface.
      const unauthorized = await page.getByRole("heading", { name: /don’t have access to this review/i }).count();
      const outsideScope = await page.getByText(/not found|outside your (review|permitted) scope|could not load/i).count();
      const readOnly = await page.getByText(/Read-only for this role/i).count();
      expect(unauthorized + outsideScope + readOnly).toBeGreaterThan(0);
      await expect(page.getByRole("button", { name: /^start review$/i })).toHaveCount(0);
      await expect(page.locator('input[name="decision"], textarea[name="reason"]')).toHaveCount(0);
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
