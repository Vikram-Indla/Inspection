import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-029 / SCR-WEB-310 — Level 2 Review Workspace.
// The source checks protect server-side integrity that a read-only browser run
// cannot safely mutate. The live checks only inspect the workspace and never
// submit a decision.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const ACTIONS = "src/app/reviews/[id]/actions.ts";
const PAGE = "src/app/reviews/[id]/page.tsx";
const PANEL = "src/app/reviews/[id]/DecisionPanel.tsx";
const TRACE = "src/app/reviews/[id]/FindingTraceChain.tsx";

test.describe("CD-029 server wiring — integrity guards", () => {
  test("leg 3 — startReview binds version to inspection and latest submission", () => {
    const src = SRC(ACTIONS);
    expect(src).toMatch(/from\("inspections"\)[\s\S]*submission_versions\(id, version_number\)/);
    expect(src).toContain("ins.submission_versions.find");
    expect(src).toContain("Only the latest submitted version can be started");
    expect(src).toMatch(/ins\.submission_versions[\s\S]*sort\(\(a, b\) => b\.version_number - a\.version_number\)/);
    expect(src).toMatch(/\.eq\("status", "submitted"\)\.select\("id"\)\.maybeSingle\(\)/);
  });

  test("legs 13/14 — decision and return scope are allow-listed server-side", () => {
    const src = SRC(ACTIONS);
    expect(src).toContain('const validDecisions = ["approve", "return", "reject"]');
    expect(src).toContain("validSectionKeys");
    expect(src).toContain("invalidSections.length > 0");
    expect(src).toMatch(/\.eq\("status", "under_review"\)\.is\("decided_at", null\)/);
  });

  test("legs 3/15/16 — state transitions require an affected row", () => {
    const src = SRC(ACTIONS);
    expect(src).toMatch(/transErr \|\| !transitioned/);
    expect(src).toMatch(/insErr \|\| !transitioned/);
    expect(src).toContain("This review is no longer open. Refresh before deciding.");
  });

  test("read failures fail closed instead of becoming a false no-row or skipped notification", () => {
    const src = SRC(ACTIONS);
    expect(src).toContain("const REVIEW_READ_ERROR");
    expect(src).toContain("aggregateError");
    expect(src).toContain("currentReadError");
    expect(src).toContain("inspector notification could not be verified");
    expect(src).toContain("asgReadError");
  });
});

test.describe("CD-029 trace and accessibility wiring", () => {
  test("leg 4 — trace chain is a source-labelled list, not a decorative graph", () => {
    const page = SRC(PAGE);
    const trace = SRC(TRACE);
    expect(page).toContain("FindingTraceChain");
    expect(page).toContain("checklist_responses");
    expect(page).toContain("findings");
    expect(page).toContain("triggered_by_response");
    expect(trace).toContain("<details open>");
    expect(trace).toContain("source");
    expect(trace).toContain("unavailable");
    expect(trace).not.toMatch(/<svg|<canvas/);
    expect(page).toMatch(/actionForms\.find\(a => \(violation && a\.violation_id === violation\.id\)\)[\s\S]*\?\? actionForms\.find/);
  });

  test("legs 10/13/18 — provider errors and invalid decisions are accessible", () => {
    const page = SRC(PAGE);
    const panel = SRC(PANEL);
    expect(page).not.toContain('replace("{error}", fv.error)');
    expect(panel).toContain('role="alert"');
    expect(panel).toContain("errorRef.current?.focus()");
    expect(panel).toContain('htmlFor={reasonId}');
  });
});

test.describe("CD-029 reviewer workspace — read-only runtime", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  async function openFirstWorkspace(page: Page): Promise<boolean> {
    await page.goto("/reviews");
    const open = page.getByRole("link", { name: /open workspace/i }).first();
    if (await open.count() === 0) {
      // The link label is localized in RTL; route ownership is stable and does
      // not weaken the read-only navigation proof.
      const localized = page.locator('a[href^="/reviews/"]').first();
      if (await localized.count() === 0) return false;
      await localized.click();
      await expect(page).toHaveURL(/\/reviews\/[0-9a-f-]+$/);
      return true;
    }
    await open.click();
    await expect(page).toHaveURL(/\/reviews\/[0-9a-f-]+$/);
    return true;
  }

  test("legs 1/4/8/11/12 — workspace renders trace, immutable read and comparison", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviewer workspace row in this environment");
    await expect(page.getByRole("heading", { name: /Finding trace chain/i })).toBeVisible();
    await expect(page.getByText(/Read-only submitted version/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
    const timeline = page.getByText(/Timeline — audit trail/i);
    if (await timeline.count()) await expect(timeline.first()).toBeVisible();
  });

  test("leg 17 — no claim/reassign control is invented", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviewer workspace row in this environment");
    await expect(page.getByRole("button", { name: /claim|reassign/i })).toHaveCount(0);
  });

  test("leg 18 — workspace preserves RTL, theme, and 412px reflow", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.setViewportSize({ width: 412, height: 915 });
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviewer workspace row in this environment");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: /سلسلة تتبع|Finding trace chain/i })).toBeVisible();
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
      // The closed RTL drawer is intentionally translated off-canvas; measure only
      // visible workspace content so the assertion tracks user-visible reflow.
      const overflowDetails = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const overflowing = [...document.querySelectorAll<HTMLElement>("*")]
          .filter((element) => !element.closest(".ax-shell__nav"))
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.right > viewport + 1 || rect.left < -1)
          .slice(0, 12)
          .map(({ element, rect }) => ({
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            text: (element.textContent ?? "").trim().slice(0, 80),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }));
        const overflow = overflowing.reduce((max, item) => Math.max(max, item.right - viewport, -item.left, 0), 0);
        return { overflow, overflowing };
      });
      expect(overflowDetails.overflow, `${theme} RTL workspace overflows at 412px: ${JSON.stringify(overflowDetails.overflowing)}`).toBeLessThanOrEqual(1);
    }
  });
});
