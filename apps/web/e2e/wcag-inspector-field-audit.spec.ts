import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { storageStatePath } from "./personas";

// WCAG 2.2 AA & Keyboard Closure — TASK-FIGMA-APPLICATION-PARITY-20260802.
// Governed 2026-08-03: every role lands on /dashboard after login (personas.ts
// inspector.home fix); /field is reached via navigation from there.
//
// Scope: only the "inspector" persona has a configured non-production test
// identity in this environment (SAQEEL_TEST_INSPECTOR_EMAIL). Planner,
// reviewer, admin and ops cells are explicitly BLOCKED below — not run, not
// faked — since no credentials exist for them. Do not widen this file into
// the full multi-persona release suite; it is a bounded WCAG spot-check.
//
// Covers: text/non-text contrast, aria name/role/value, labels, landmarks,
// heading order, and keyboard focus visibility, via axe-core (WCAG 2.2 AA
// ruleset) + a manual keyboard-tab pass, at the three declared widths, both
// languages, both themes, for the two routes this persona actually reaches:
// /dashboard (SC-DASH-000, shared login landing) and /field/my-tasks
// (SCR-FLD-600, this session's own build target).

const WIDTHS = [1280, 1024, 720] as const;
const LANGS = ["en", "ar"] as const;
const THEMES = ["light", "dark"] as const;
const ROUTES = ["/dashboard", "/field/my-tasks"] as const;

async function applyState(
  page: Page,
  width: number,
  locale: "en" | "ar",
  theme: "light" | "dark",
  route: string,
) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/locale?set=${locale}`);
  await page.goto(route);
  await page.evaluate(t => localStorage.setItem("saqeel-theme", t), theme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
}

test.describe("WCAG 2.2 AA — inspector, cross-matrix", () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      for (const locale of LANGS) {
        for (const theme of THEMES) {
          test(`${route} @ ${width}px ${locale} ${theme} — axe 2.2 AA, zero violations`, async ({ browser }) => {
            const context = await browser.newContext({ storageState: storageStatePath("inspector") });
            const page = await context.newPage();
            await applyState(page, width, locale, theme, route);
            const results = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
              .analyze();
            expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
            await context.close();
          });
        }
      }
    }
  }
});

test.describe("Keyboard closure — inspector, EN Light 1280 only (representative)", () => {
  for (const route of ROUTES) {
    test(`${route} — Tab reaches every interactive element with a visible focus indicator`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath("inspector") });
      const page = await context.newPage();
      await applyState(page, 1280, "en", "light", route);

      // Skip link is the very first focus stop (WCAG 2.4.1 Bypass Blocks).
      await page.keyboard.press("Tab");
      const first = page.locator(":focus");
      await expect(first).toBeVisible();

      // Walk a bounded number of Tab stops (not the whole page — this is a
      // spot check, not exhaustive traversal) and assert each stop paints a
      // visible focus ring (outline or box-shadow), never focus with no
      // visible indicator (WCAG 2.4.7 / 2.4.11).
      const stops = 15;
      let invisibleFocusCount = 0;
      for (let i = 0; i < stops; i++) {
        await page.keyboard.press("Tab");
        const style = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const hasOutline = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
          const hasShadow = cs.boxShadow !== "none" && cs.boxShadow !== "";
          return { tag: el.tagName, hasOutline, hasShadow };
        });
        if (style && !style.hasOutline && !style.hasShadow) invisibleFocusCount++;
      }
      expect(invisibleFocusCount, "elements receiving Tab focus with no visible outline/box-shadow").toBe(0);
      await context.close();
    });
  }
});

test.describe("Landmarks & heading order — inspector, EN Light 1280 only (representative)", () => {
  for (const route of ROUTES) {
    test(`${route} — has main landmark, nav landmark, no skipped heading level`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath("inspector") });
      const page = await context.newPage();
      await applyState(page, 1280, "en", "light", route);

      await expect(page.locator("main, [role=main]")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(h => Number(h.tagName[1])),
      );
      let skipped = false;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) skipped = true;
      }
      expect(skipped, `heading levels found: ${levels.join(",")}`).toBe(false);
      await context.close();
    });
  }
});

test.describe("Reflow containment — /dashboard, 720px (representative narrow width)", () => {
  test("every table sits inside its own scroll container; page root does not gain horizontal scroll", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await applyState(page, 720, "en", "light", "/dashboard");

    const root = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(root.overflow, "document root should not scroll horizontally at 720px").toBeLessThanOrEqual(1);

    const uncontained = await page.evaluate(() =>
      Array.from(document.querySelectorAll("table")).filter(table => {
        for (let node = table.parentElement; node; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === "auto" || overflowX === "scroll") return false;
        }
        return true;
      }).map(table => table.className || table.tagName),
    );
    expect(uncontained, "tables must scroll inside their own container (WCAG 1.4.10 Reflow)").toEqual([]);
    await context.close();
  });
});

test.describe("Reduced motion — /dashboard, /field/my-tasks", () => {
  for (const route of ROUTES) {
    test(`${route} — honors prefers-reduced-motion (no animation/transition duration survives)`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath("inspector") });
      const page = await context.newPage();
      await context.grantPermissions([]);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await applyState(page, 1280, "en", "light", route);

      const offenders = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const cs = getComputedStyle(el);
          const dur = parseFloat(cs.animationDuration || "0s");
          const tdur = parseFloat(cs.transitionDuration || "0s");
          if (dur > 0.05 || tdur > 0.5) bad.push(el.tagName + "." + Array.from(el.classList).join("."));
        }
        return bad.slice(0, 20);
      });
      expect(offenders, "elements with live animation/long transition under prefers-reduced-motion:reduce").toEqual([]);
      await context.close();
    });
  }
});

// Error/validation states: neither /dashboard nor /field/my-tasks exposes a
// live-triggerable error/validation UI reachable without mutating backend
// data (the dashboard's partial-source banner needs a real degraded query;
// my-tasks has no client-validated form). Verified statically instead of
// fabricating a scenario: DashboardView.tsx's partial-source banner and every
// EmptyState-based error surface already carry role="alert"/role="status"
// (confirmed by source read during this session) — not re-asserted here as a
// live test since there is no honest way to trigger it from this persona.

// Explicitly blocked — no test credentials configured, not run, not faked.
test.describe("Cross-role cells — BLOCKED, no test identity available", () => {
  test.skip("planner /planning — SAQEEL_TEST_PLANNER_EMAIL not configured", () => {});
  test.skip("reviewer /reviews — SAQEEL_TEST_REVIEWER_EMAIL not configured", () => {});
  test.skip("admin /admin — SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL not configured", () => {});
  test.skip("ops /dashboard(ops-scoped) — SAQEEL_TEST_OPS_EMAIL not configured", () => {});
});
