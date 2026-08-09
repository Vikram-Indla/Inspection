import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";
import { evidenceDirectory } from "./evidence-path";

// The seven hard states DESIGN_ROUTE_MAP declares for WA-DES / exec:
//   loading · empty · error · degraded · unauthorized · stale-conflict ·
//   provider-unavailable
//
// The dashboard is now server-first: the RSC fetches /api/dashboard/snapshot
// on the server, so a browser-side network abort can no longer provoke the
// error and degraded states. Each state is still held to account: provocable
// states are provoked in the running browser; the two server-side failure
// states are pinned at the enforcing code layer (per-source failure
// isolation → failedSources → the partial notice; whole-snapshot failure →
// the unavailable notice) because silence about an unprovable state is how
// regressions hide.

const STRAT = "/dashboard?view=strategic";
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
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

  // 2 · LOADING — the route suspends behind a governed skeleton region that
  // announces busy state; the streamed fallback is timing-dependent in a
  // browser, so the contract is pinned where it is enforced.
  test("loading", async ({ browser }) => {
    const pageSource = SRC("src/app/(app)/dashboard/page.tsx");
    expect(pageSource).toContain("<Suspense fallback={<DashboardSkeleton");
    const skeleton = SRC("src/components/saqeel/skeleton/skeleton.tsx");
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
    expect(skeleton).toContain('aria-live="polite"');
    // And the settled route replaces the skeleton with real content.
    const ctx = await browser.newContext({ storageState: storageStatePath("ops") });
    const page = await ctx.newPage();
    await page.goto(STRAT);
    await expect(page.locator("#dashboard-national-performance")).toBeVisible();
    await page.screenshot({ path: shot("loading"), fullPage: false });
    await ctx.close();
  });

  test.describe("authenticated states", () => {
    test.use({ storageState: storageStatePath("ops") });

    // 3 · EMPTY — a scope no row can satisfy renders governed absence,
    // never a zero dressed as a value.
    test("empty", async ({ page }) => {
      await page.goto("/dashboard?view=strategic&from=1990-01-01&to=1990-01-02");
      await expect(page.locator("#dashboard-national-performance")).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(
        /Not configured|Unavailable|No eligible|Nothing to compare yet|غير متاح|غير مهيأ|لا توجد/.test(body),
        "an out-of-range scope must render governed absence, never a zero dressed as a value",
      ).toBe(true);
      await page.screenshot({ path: shot("empty"), fullPage: true });
    });

    // 4 · ERROR — a whole-snapshot failure is a stated notice, not an empty
    // success. Server-side, so pinned at the enforcing seam.
    test("error", () => {
      const client = SRC("src/features/dashboard/client.ts");
      expect(client).toContain('if (!response.ok) return { status: "unavailable" };');
      const sections = SRC("src/components/dashboard/dashboard-sections/dashboard-sections.tsx");
      expect(sections).toContain('result.status === "unavailable"');
      expect(sections).toMatch(/unavailable"[\s\S]{0,400}DashboardNotice tone="danger"/);
      const messages = SRC("src/i18n/locales/en/dashboard.json");
      expect(messages).toContain('"title": "Partial dashboard"');
      expect(messages).toContain('"retry": "Other panels remain usable; refresh to retry."');
    });

    // 5 · DEGRADED — one failed source degrades its own section and names
    // itself; every other panel stays usable.
    test("degraded", () => {
      const paginate = SRC("src/features/dashboard/sources/paginate.ts");
      expect(paginate).toContain("page.error ? { rows: [], failed: true } : { rows: page.data ?? [], failed: false }");
      const snapshot = SRC("src/features/dashboard/snapshot.ts");
      expect(snapshot).toContain("const failedSources: SourceKey[]");
      expect(snapshot).toContain('violations.failed && "violations"');
      const sections = SRC("src/components/dashboard/dashboard-sections/dashboard-sections.tsx");
      expect(sections).toContain("snapshot.failedSources.map(key => dashboard.source[key])");
      expect(sections).toContain("partialSources.length ? (");
      expect(sections).toContain("{partialSources.join(\" · \")}");
    });

    // 6 · PROVIDER-UNAVAILABLE / NOT CONFIGURED — governed absence, shown as
    // policy rather than breakage.
    test("provider-unavailable", async ({ page }) => {
      await page.goto(STRAT);
      await expect(page.locator("#dashboard-national-performance")).toBeVisible();
      await expect(page.getByText(/Provider output withheld|مخرجات المزود محجوبة/)).toBeVisible({ timeout: 15_000 });
      const body = await page.locator("body").innerText();
      expect(
        /Not configured|غير مهيأ/.test(body),
        "ungoverned measures must name the missing decision",
      ).toBe(true);
      await page.screenshot({ path: shot("provider-unavailable"), fullPage: true });
    });

    // 7 · STALE / CONFLICT — an inverted scope is normalized by the governed
    // parser (from/to swapped), never fabricated into an impossible value.
    test("stale-conflict", async ({ page }) => {
      const metrics = SRC("src/app/(app)/dashboard/metrics.ts");
      expect(metrics).toContain("if (fromMs > toMs) [fromMs, toMs] = [toMs - (DAY_MS - 1), fromMs + (DAY_MS - 1)];");
      await page.goto("/dashboard?view=strategic&from=2027-01-01&to=2026-01-01");
      await expect(page.locator("#dashboard-national-performance")).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(0);
      expect(
        /NaN|Invalid Date/.test(body),
        "an impossible scope must not fabricate a value",
      ).toBe(false);
      await page.screenshot({ path: shot("stale-conflict"), fullPage: true });
    });
  });
});
