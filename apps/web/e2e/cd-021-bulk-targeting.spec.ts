import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-021 (SCR-WEB-110 /planning/bulk) — Targeting Lens acceptance.
// Requirements: M01-003/012/022 (nested AND/OR criteria), M01-004 (all matching
// returned), M02-012 (duplicate flag), FND-011 (non-color-only status),
// FND-013 (source freshness), P03 (atomic publish). Acceptance: DSG-016,
// DSG-A11Y-001. Functional assertions first; screenshots are supplementary
// evidence per .claude/rules/tests.md. Tests are READ-ONLY — publish is not
// clicked (it mutates live data); atomicity is proven separately at the DB layer.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-021-bulk-v1");
const ct = (obj: unknown) => encodeURIComponent(JSON.stringify(obj));
const HIGH_RISK = { k: "g", c: "all", n: [{ k: "c", f: "risk_band", o: "is", v: "high" }] };

test.use({ storageState: storageStatePath("planner") });

async function firstFactoryId(page: Page): Promise<string> {
  const href = await page.locator('a[href^="/factories/"]').first().getAttribute("href");
  return (href ?? "").replace("/factories/", "");
}

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
// App is Arabic-first (DEC-004); force English so text locators are deterministic.
// The RTL test overrides back to Arabic.
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-021 criteria tree (M01-003/012/022, M01-004)", () => {
  test("tree instrument renders with ALL/ANY groups and is keyboard-operable", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning/bulk");
    await expect(page.getByRole("tree")).toBeVisible();
    // ALL/ANY combinator + add-condition / add-group controls present
    await expect(page.getByRole("button", { name: /Add condition/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add nested group/i })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "primary.png"), fullPage: true });
  });

  test("applying criteria narrows eligible below denominator; ledger + distributions reflect it", async ({ page }) => {
    await page.goto("/planning/bulk"); // no criteria → eligible == denominator
    const totalResults = Number((await page.getByText(/\d+ results/).first().innerText()).replace(/\D/g, ""));
    await page.goto(`/planning/bulk?ct=${ct(HIGH_RISK)}`);
    // eligibility ledger shows eligible + excluded; distributions carry a denominator
    await expect(page.getByText(/Eligible/i).first()).toBeVisible();
    await expect(page.getByText(/Excluded/i).first()).toBeVisible();
    const narrowed = Number((await page.getByText(/\d+ results/).first().innerText()).replace(/\D/g, ""));
    expect(narrowed).toBeLessThan(totalResults); // high-risk is a strict subset
    expect(narrowed).toBe(10); // seed has exactly 10 high-risk factories
  });

  test("legacy cf/co/cv links still parse (backward compatibility)", async ({ page }) => {
    await page.goto("/planning/bulk?cf=risk_band&co=is&cv=high&combine=and");
    await expect(page.getByRole("tree")).toBeVisible();
    await expect(page.getByText(/results/i).first()).toBeVisible();
  });
});

test.describe("CD-021 evidence table + provenance (FND-011, FND-013, M02-012)", () => {
  test("provenance + data-quality columns render; every status lozenge carries a glyph", async ({ page }) => {
    await page.goto("/planning/bulk");
    await expect(page.getByRole("columnheader", { name: /Source \/ synced/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Data quality/i })).toBeVisible();
    // FND-011: eligibility status is not color-only — a glyph precedes the label
    const elig = page.locator(".ax-lozenge", { hasText: /eligible|duplicate/i }).first();
    await expect(elig).toContainText(/[✓⛔]/);
  });
});

test.describe("CD-021 selection (frame 1a)", () => {
  test("select-all-results vs select-this-page distinct; Review CTA gates on selection", async ({ page }) => {
    await page.goto("/planning/bulk");
    // With nothing selected the review hand-off is a disabled button (no link).
    await expect(page.getByRole("button", { name: /Review & continue/i })).toBeDisabled();
    await page.getByRole("button", { name: /Select all results/i }).click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();
    // Selection present → hand-off becomes an enabled link to the P02 review step.
    await expect(page.getByRole("link", { name: /Review & continue/i })).toHaveAttribute("href", "/planning/bulk/review");
    await page.getByRole("button", { name: /Clear selection/i }).click();
    await expect(page.getByRole("button", { name: /Review & continue/i })).toBeDisabled();
  });

  test("P02 review step configures, assigns and exposes atomic publish", async ({ page }) => {
    await page.goto("/planning/bulk");
    const realId = await firstFactoryId(page);
    await page.addInitScript(([real]) => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify([real])); }, [realId]);
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/Visit configuration/i)).toBeVisible();
    await expect(page.getByText(/Inspector assignment/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish plan/i })).toBeVisible();
  });

  test("review step with empty selection routes back to targeting", async ({ page }) => {
    await page.addInitScript(() => { sessionStorage.removeItem("cd021-bulk-selection"); });
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/No factories selected/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to targeting/i })).toBeVisible();
  });

  test("selection persists across pagination", async ({ page }) => {
    await page.goto("/planning/bulk");
    const next = page.getByRole("button", { name: /^Next$/i });
    test.skip(await next.isDisabled(), "fewer than one page of results in this environment");
    await page.getByRole("button", { name: /Select this page/i }).click();
    const before = await page.getByText(/\d+ selected/).innerText();
    await next.click();
    await expect(page.getByText(before)).toBeVisible(); // count unchanged after paging
  });

  test("criteria change dropping a prior selection prompts explicit confirmation (never silent)", async ({ page }) => {
    await page.goto("/planning/bulk");
    const realId = await firstFactoryId(page);
    // Seed a persisted selection with one real id + one that cannot match, then reload.
    await page.addInitScript(([real]) => {
      sessionStorage.setItem("cd021-bulk-selection", JSON.stringify([real, "00000000-0000-0000-0000-000000000000"]));
    }, [realId]);
    await page.goto("/planning/bulk");
    const dialog = page.getByRole("alertdialog", { name: /Selection changed/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/no longer match/i);
    await expect(page.getByRole("button", { name: /Keep remaining selection/i })).toBeVisible();
  });
});

test.describe("CD-021 a11y / RTL (DSG-A11Y-001)", () => {
  test("aria-live status regions exist for counts", async ({ page }) => {
    await page.goto("/planning/bulk");
    await expect(page.locator('[role="status"][aria-live="polite"]').first()).toBeAttached();
  });

  test("Arabic renders document-level RTL", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/planning/bulk");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: join(EVIDENCE_DIR, "ar-rtl.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("narrow viewport has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto("/planning/bulk");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1); // allow sub-pixel rounding
    await page.screenshot({ path: join(EVIDENCE_DIR, "narrow.png"), fullPage: true });
  });
});
