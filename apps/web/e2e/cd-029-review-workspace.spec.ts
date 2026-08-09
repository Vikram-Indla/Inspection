import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { storageStatePath } from "./personas";

// CD-029 / SCR-WEB-310 — Level 2 Review Workspace.
// The source checks protect server-side integrity that a read-only browser run
// cannot safely mutate. The live checks only inspect the workspace and never
// submit a decision. Integrity guards that moved into the canonical database
// transactions (start_review / decide_review) are asserted in their migration,
// the same deterministic-source-truth pattern as cd-028.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const REPO_FILE = (rel: string) => {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = join(dir, rel);
    if (existsSync(p)) return readFileSync(p, "utf8");
    dir = dirname(dir);
  }
  throw new Error(`${rel} not found above ${process.cwd()}`);
};
const ACTIONS = "src/app/(app)/reviews/[id]/actions.ts";
const PAGE = "src/app/(app)/reviews/[id]/page.tsx";
const PANEL = "src/app/(app)/reviews/[id]/DecisionPanel.tsx";
const TRACE = "src/app/(app)/reviews/[id]/FindingTraceChain.tsx";
const REVIEW_RPCS = "supabase/migrations/20260729004841_execution_supervisor_review_authority.sql";

test.describe("CD-029 server wiring — integrity guards", () => {
  test("leg 3 — startReview binds version to inspection and latest submission", () => {
    const src = SRC(ACTIONS);
    expect(src).toMatch(/from\("inspections"\)[\s\S]*submission_versions\(id, version_number\)/);
    expect(src).toContain("ins.submission_versions.find");
    expect(src).toContain("Only the latest submitted version can be started");
    expect(src).toMatch(/ins\.submission_versions[\s\S]*sort\(\(a, b\) => b\.version_number - a\.version_number\)/);
    expect(src).toContain('if (ins.status !== "submitted")');
    // the binding is re-proven inside the canonical transaction, which owns
    // the row locks — a stale/tampered form cannot skip it
    const rpc = REPO_FILE(REVIEW_RPCS);
    expect(rpc).toContain("REVIEW-START-STATE");
    expect(rpc).toContain("REVIEW-START-VERSION");
  });

  test("legs 13/14 — decision and return scope are allow-listed server-side", () => {
    const src = SRC(ACTIONS);
    expect(src).toContain('const validDecisions = ["approve", "return", "reject"]');
    expect(src).toContain("validSectionKeys");
    expect(src).toContain("invalidSections.length > 0");
    expect(src).toContain('if (current.decided_at || current.status !== "under_review")');
    const rpc = REPO_FILE(REVIEW_RPCS);
    // open-state and scope membership are re-checked under the transaction's
    // own lock, not just in the action's convenience pre-read
    expect(rpc).toContain("where id = p_review for update");
    expect(rpc).toContain("REVIEW-DECIDE-STATE");
    expect(rpc).toContain("REVIEW-DECIDE-SECTIONS");
    expect(rpc).toMatch(/where id = p_review and status = 'under_review' and decided_at is null/);
  });

  test("legs 3/15/16 — state transitions require an affected row", () => {
    const rpc = REPO_FILE(REVIEW_RPCS);
    // both writes of the decision transaction raise (and so roll back) when
    // their row was claimed by a concurrent run — no silent zero-row success
    expect(rpc.match(/raise serialization_failure using message = 'REVIEW-DECIDE-RACE'/g)?.length).toBeGreaterThanOrEqual(2);
    expect(rpc).toContain("REVIEW-START-RACE");
    const src = SRC(ACTIONS);
    expect(src).toContain("This review is no longer open. Refresh before deciding.");
  });

  test("read failures fail closed instead of becoming a false no-row or skipped notification", () => {
    const src = SRC(ACTIONS);
    expect(src).toContain("const REVIEW_READ_ERROR");
    expect(src).toContain("aggregateError");
    expect(src).toContain("currentReadError");
    // the inspector notification now lives inside the decision transaction:
    // the recipient read and the insert commit or roll back with the decision
    const rpc = REPO_FILE(REVIEW_RPCS);
    expect(rpc).toContain("select a.inspector_id into v_inspector");
    expect(rpc).toContain("insert into public.notifications(");
    expect(rpc).toContain("'review_decision', v_inspector");
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
    const open = page.getByRole("link", { name: /open review/i }).first();
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
    // the record regions sit behind the CLASS-CONTRACT tab switcher; the
    // comparison panel (and its Scope Rail heading) renders on its tab
    await page.getByRole("tab", { name: /Version comparison|مقارنة/i }).click();
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
      // the shell toggle persists an explicit mode plus the resolved theme;
      // both keys are written so the head script and the post-hydration
      // toggle agree, exactly as the product does
      await page.evaluate(value => {
        localStorage.setItem("saqeel-theme-mode", value);
        localStorage.setItem("saqeel-theme", value);
      }, theme);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.getByRole("tab", { name: /Version comparison|مقارنة/i }).click();
      await expect(page.getByRole("heading", { name: /شريط النطاق الكاشف للتلاعب|Tamper-evident Scope Rail/i })).toBeVisible();
      // The closed RTL drawer is intentionally translated off-canvas; measure only
      // visible workspace content so the assertion tracks user-visible reflow.
      // Elements inside a designed horizontal scroll region (the record tab
      // strip, table wraps) legitimately extend past the viewport and scroll
      // within their own bounded container, so they are not page overflow.
      const overflowDetails = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const inScrollRegion = (element: HTMLElement): boolean => {
          for (let node = element.parentElement; node; node = node.parentElement) {
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === "auto" || overflowX === "scroll") return true;
          }
          return false;
        };
        const overflowing = [...document.querySelectorAll<HTMLElement>("*")]
          .filter((element) => !element.closest(".sq-shell__nav"))
          .filter((element) => !inScrollRegion(element))
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
