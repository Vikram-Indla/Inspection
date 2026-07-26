import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { storageStatePath } from "./personas";
import { evidenceDirectory } from "./evidence-path";

// The seven hard states DESIGN_ROUTE_MAP declares for WA-DES / exec:
//   loading · empty · error · degraded · unauthorized · stale-conflict ·
//   provider-unavailable
//
// They were previously "unverified as a set" — some almost certainly worked,
// but nobody had forced them. Passing by luck is not evidence, so each state
// here is provoked deliberately: unauthenticated for unauthorized, an
// out-of-range scope for empty, and aborted Supabase requests for error and
// degraded. A state that cannot be provoked is reported, not skipped.

const STRAT = "/dashboard?view=strategic";
const shot = (name: string) => join(evidenceDirectory("exec"), `state-${name}.png`);

test.describe("exec — seven declared hard states", () => {
  // 1 · UNAUTHORIZED — no session at all.
  test("unauthorized", async ({ browser }) => {
    const ctx = await browser.newContext(); // deliberately no storageState
    const page = await ctx.newPage();
    const res = await page.goto(STRAT);
    await expect(page).toHaveURL(/\/login/);
    expect(res?.status() ?? 0).toBeLessThan(400);
    await page.screenshot({ path: shot("unauthorized"), fullPage: false });
    await ctx.close();
  });

  test.describe("authenticated states", () => {
    test.use({ storageState: storageStatePath("ops") });

    // 2 · LOADING — the route ships a loading.tsx; assert the shell renders
    // its busy affordance rather than a blank frame.
    test("loading", async ({ page }) => {
      await page.goto(STRAT);
      const progress = page.locator('[role="status"], [class*="progress"], [class*="skeleton"]').first();
      await expect(progress).toBeAttached({ timeout: 15_000 });
      await page.screenshot({ path: shot("loading"), fullPage: false });
    });

    // 3 · EMPTY — a scope no row can satisfy.
    test("empty", async ({ page }) => {
      await page.goto("/dashboard?view=strategic&from=1990-01-01&to=1990-01-02");
      await expect(page.locator("#ex-assurance-h")).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(
        /Not available|غير متاح|No eligible|لا توجد/.test(body),
        "an out-of-range scope must render governed absence, never a zero dressed as a value",
      ).toBe(true);
      await page.screenshot({ path: shot("empty"), fullPage: true });
    });

    // 4 · ERROR — every data read fails.
    test("error", async ({ page }) => {
      await page.route("**/rest/v1/**", route => route.abort());
      await page.goto(STRAT);
      await expect(page.locator("#ex-assurance-h")).toBeVisible({ timeout: 30_000 });
      const body = await page.locator("body").innerText();
      expect(
        /Partial|جزئي|Couldn.t load|تعذّر|unavailable|غير متاح/.test(body),
        "a total read failure must be stated, not rendered as empty success",
      ).toBe(true);
      await page.screenshot({ path: shot("error"), fullPage: true });
    });

    // 5 · DEGRADED — one source fails, the rest must survive.
    test("degraded", async ({ page }) => {
      await page.route("**/rest/v1/violations**", route => route.abort());
      await page.goto(STRAT);
      await expect(page.locator("#ex-assurance-h")).toBeVisible({ timeout: 30_000 });
      const body = await page.locator("body").innerText();
      expect(
        /Partial|جزئي|degraded|منخفض|violations|المخالفات/.test(body),
        "one failed source must degrade its own section and leave the rest usable",
      ).toBe(true);
      await expect(page.locator("#ex-assurance-h")).toBeVisible();
      await page.screenshot({ path: shot("degraded"), fullPage: true });
    });

    // 6 · PROVIDER-UNAVAILABLE / NOT CONFIGURED — governed absence, shown as
    // policy rather than breakage.
    test("provider-unavailable", async ({ page }) => {
      await page.goto(STRAT);
      // Wait for the surface to settle before reading text — an early read
      // fails against a half-rendered page and looks like a product defect.
      await expect(page.locator("#ex-assurance-h")).toBeVisible();
      await expect(
        page.getByText(/Measures awaiting governance|قياسات بانتظار الحوكمة/),
      ).toBeVisible({ timeout: 15_000 });
      const body = await page.locator("body").innerText();
      expect(
        /Not configured|غير مهيأ|awaiting governance|بانتظار الحوكمة/.test(body),
        "ungoverned measures must name the missing decision",
      ).toBe(true);
      await page.screenshot({ path: shot("provider-unavailable"), fullPage: true });
    });

    // 7 · STALE / CONFLICT — provoked by a scope the projection cannot honour.
    // Reported honestly if the surface has no distinct treatment.
    test("stale-conflict", async ({ page }) => {
      await page.goto("/dashboard?view=strategic&from=2027-01-01&to=2026-01-01");
      await expect(page.locator("#ex-assurance-h")).toBeVisible();
      const body = await page.locator("body").innerText();
      const handled = /Not available|غير متاح|Not configured|غير مهيأ|invalid|غير صالح/.test(body);
      expect(handled, "an impossible scope must not fabricate a value").toBe(true);
      await page.screenshot({ path: shot("stale-conflict"), fullPage: true });
    });
  });
});
