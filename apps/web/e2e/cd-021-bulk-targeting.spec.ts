import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-021 remediation (DEC-012 audit CODEX_AUDIT_CD-021.md, 2026-07-14): 8
// confirmed FAIL findings, fixed. These tests cover the reachable ones —
// finding 7 (per-source failure isolation) requires a live query-fault
// injection this suite has no harness for and is not claimed here.

// CD-021 (SCR-WEB-110 /planning/bulk) — Targeting Lens acceptance.
// Requirements: M01-003/012/022 (nested AND/OR criteria), M01-004 (all matching
// returned), M02-012 (duplicate flag), FND-011 (non-color-only status),
// FND-013 (source freshness), P03 (atomic publish). Acceptance: DSG-016,
// DSG-A11Y-001. Functional assertions first; screenshots are supplementary
// evidence per .claude/rules/tests.md. Tests are READ-ONLY — publish is not
// clicked (it mutates live data); atomicity is proven separately at the DB layer.
const EVIDENCE_DIR = evidenceDirectory("cd-021-bulk-v1");
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
    // The live risk engine may legitimately move every factory out of the high
    // band; assert evaluated narrowing, not a frozen fixture distribution.
    expect(narrowed).toBeGreaterThanOrEqual(0);
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
  test("factory profile opens without destroying criteria or selection context", async ({ page }) => {
    await page.goto("/planning/bulk");
    const city = (await page.locator("tbody tr").first().locator("td").nth(3).innerText()).trim();
    expect(city).not.toBe("—");
    const cityCriterion = { k: "g", c: "all", n: [{ k: "c", f: "city", o: "is", v: city }] };
    await page.goto(`/planning/bulk?ct=${ct(cityCriterion)}`);
    const profile = page.locator('a[href^="/factories/"]').first();
    await expect(profile).toHaveAttribute("target", "_blank");
    await expect(profile).toHaveAttribute("rel", /noreferrer|noopener/);
    await expect(page).toHaveURL(/ct=/);
  });

  test("select-all-results vs select-this-page distinct; Review CTA gates on selection", async ({ page }) => {
    await page.goto("/planning/bulk");
    // With nothing selected the review hand-off is a disabled button (no link).
    await expect(page.getByRole("button", { name: /Review & continue/i })).toBeDisabled();
    // select-all-results now requires the typed-count confirm (finding 4).
    await page.getByRole("button", { name: /Select all results/i }).click();
    const count = Number((await page.getByText(/\d+ results/).first().innerText()).replace(/\D/g, ""));
    const dialog = page.getByRole("alertdialog", { name: /Confirm select all/i });
    await dialog.getByLabel(/Type the count to confirm/i).fill(String(count));
    await dialog.getByRole("button", { name: /^Select all \d+$/ }).click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();
    // Selection present → hand-off becomes an enabled link to the P02 review step.
    await expect(page.getByRole("link", { name: /Review & continue/i })).toHaveAttribute("href", "/planning/bulk/review");
    await page.getByRole("button", { name: /Clear selection/i }).click();
    await expect(page.getByRole("button", { name: /Review & continue/i })).toBeDisabled();
  });

  // CD-025 (SCR-WEB-150 / P03): the review step is now the staged Plan Review &
  // Publish workspace — blocker-first readiness, targets table and the Publish
  // Consequence Ledger, with a single publish action. Read-only assertions.
  test("CD-025 review workspace shows readiness, ledger and the single publish action", async ({ page }) => {
    await page.goto("/planning/bulk");
    const realId = await firstFactoryId(page);
    await page.addInitScript(([real]) => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify([real])); }, [realId]);
    await page.goto("/planning/bulk/review");
    await expect(page.getByRole("heading", { name: /Readiness/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Targets & proposed visits/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publish consequence ledger/i })).toBeVisible();
    // Single publish control — enabled (ready) or disabled (blocked), never absent.
    await expect(page.getByRole("button", { name: /Publish plan and create|Publish blocked/i })).toBeVisible();
    // Truthful automatic-assignment copy — the stale "round-robin" claim is gone.
    await expect(page.getByText(/round-robin/i)).toHaveCount(0);
  });

  test("review step with empty selection routes back to targeting", async ({ page }) => {
    await page.addInitScript(() => { sessionStorage.removeItem("cd021-bulk-selection"); });
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/No factories selected/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to targeting/i })).toBeVisible();
  });

  test("review step distinguishes an out-of-scope selection from empty or unavailable data", async ({ page }) => {
    await page.goto("/planning/bulk");
    const realId = await firstFactoryId(page);
    await page.addInitScript(([real]) => {
      sessionStorage.setItem("cd021-bulk-selection", JSON.stringify([real, "00000000-0000-4000-8000-000000000000"]));
    }, [realId]);
    await page.goto("/planning/bulk/review");
    await expect(page.getByRole("heading", { name: /no longer fully in scope/i })).toBeVisible();
    await expect(page.getByText(/could not be read in your current scope/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publish consequence ledger/i })).toHaveCount(0);
    await expect(page.getByText(/temporarily unavailable/i)).toHaveCount(0);
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

test("CD-021 publish boundary revalidates inside one transaction and follows STM-PLAN-001/002", () => {
  const action = readFileSync(join(process.cwd(), "src/app/planning/bulk/actions.ts"), "utf8");
  const migration = readFileSync(join(process.cwd(), "../..", "supabase/migrations/20260714091727_planning_publish_guards.sql"), "utf8");
  expect(action).toContain('sb.rpc("publish_bulk_plan"');
  expect(migration).toContain("not has_role('planner')");
  expect(migration).toContain("bulk publish duplicate active visit");
  expect(migration).toContain("set status = 'validated'");
  expect(migration).toContain("where id = v_plan_id and status = 'validated'");
  expect(migration).not.toContain("p_auto_pool[");
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

// DEC-012 remediation coverage (CODEX_AUDIT_CD-021.md findings 1-4)
test.describe("CD-021 remediation — invalid criteria never silently drops (ERR-PLN-001, finding 1)", () => {
  test("empty-value condition blocks Apply with a role=alert banner, never silently applies", async ({ page }) => {
    await page.goto("/planning/bulk"); // default builder ships one blank condition
    await page.getByRole("button", { name: /^Apply criteria$/i }).click();
    // Scope to the banner, not Next's own `#__next-route-announcer__` (also role=alert).
    const alert = page.locator('[role="alert"].ax-banner');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/incomplete/i);
    // still on /planning/bulk — the blocked submit never navigated
    await expect(page).toHaveURL(/\/planning\/bulk$/);
  });

  test("malformed ct query param shows a distinct alert instead of silently matching everything", async ({ page }) => {
    await page.goto("/planning/bulk?ct=not-json");
    const alert = page.locator('[role="alert"].ax-banner');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/could not be read/i);
  });

  test("mixed valid and blank ct leaves fail closed as invalid, never silently narrowing criteria", async ({ page }) => {
    const mixed = encodeURIComponent(JSON.stringify({
      k: "g", c: "all", n: [
        { k: "c", f: "region", o: "is", v: "Riyadh" },
        { k: "c", f: "city", o: "is", v: "" },
      ],
    }));
    await page.goto(`/planning/bulk?ct=${mixed}`);
    const alert = page.locator('[role="alert"].ax-banner');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/could not be read/i);
  });
});

test.describe("CD-021 remediation — focus condition contribution highlight (finding 2)", () => {
  test("focusing a condition's contribution badge announces its count in the ledger", async ({ page }) => {
    await page.goto(`/planning/bulk?ct=${ct(HIGH_RISK)}`);
    // The button's accessible name toggles between the contribution count and
    // "Clear focus" on click — match both states with one stable locator.
    const badge = page.getByRole("button", { name: /match this condition alone|clear focus/i }).first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute("aria-pressed", "false");
    await badge.click();
    await expect(badge).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/from focused condition/i)).toBeVisible();
    await badge.click();
    await expect(badge).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("CD-021 remediation — select-all typed-count confirmation (finding 4)", () => {
  test("select-all-results requires typing the exact count before it commits", async ({ page }) => {
    await page.goto("/planning/bulk");
    await page.getByRole("button", { name: /Select all results/i }).click();
    const dialog = page.getByRole("alertdialog", { name: /Confirm select all/i });
    await expect(dialog).toBeVisible();
    const confirmBtn = dialog.getByRole("button", { name: /^Select all \d+$/ });
    await expect(confirmBtn).toBeDisabled();
    const count = Number((await page.getByText(/\d+ results/).first().innerText()).replace(/\D/g, ""));
    await dialog.getByLabel(/Type the count to confirm/i).fill(String(count));
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await expect(dialog).not.toBeVisible();
    // Selected count is <= the confirmed result count — duplicate-flagged rows
    // are excluded from select-all (existing M02-012 behavior), so it need not
    // equal the typed number exactly, only be a real, non-zero selection.
    const selectedText = await page.getByText(/\d+ selected/).innerText();
    const selectedCount = Number(selectedText.replace(/\D/g, ""));
    expect(selectedCount).toBeGreaterThan(0);
    expect(selectedCount).toBeLessThanOrEqual(count);
  });
});

test.describe("CD-021 remediation — Planner-only role guard (finding 8)", () => {
  test.use({ storageState: storageStatePath("inspector") });
  test("non-planner sees the unauthorized state, not the targeting UI, on both bulk routes", async ({ page }) => {
    await page.goto("/planning/bulk");
    await expect(page.getByText(/Authorized role required/i)).toBeVisible();
    await expect(page.getByRole("tree")).toHaveCount(0);
    // CD-025 review route: independent Planner denial (RBAC-007). Navigation is
    // not authorization; the review workspace never renders for a non-Planner.
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/access to review this plan/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publish consequence ledger/i })).toHaveCount(0);
  });
});
