import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-030 / SCR-WEB-320 / P11 — Version Comparison (route-neutral compare mode
// inside /reviews/:id). Signature: the Tamper-evident Scope Rail classifies each
// changed answer against the STORED returned scope (reviews.returned_sections),
// never inferred from the diff. Acceptance: DSG-025, DSG-A11Y-001;
// WIRING_MAP_CD-030 legs 1–17.
//
// READ-ONLY: this spec never clicks Start review or a decision control — both
// mutate live data. It proves rendered behaviour + deterministic source truth
// (.claude/rules/tests.md — a screenshot alone is not evidence). Seeded review
// data is environment-dependent, so per-row classification is asserted against
// the component's own source logic; live navigation asserts structure + a11y.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const CMP = "src/app/reviews/[id]/VersionCompare.tsx";
const PAGE = "src/app/reviews/[id]/page.tsx";
const LOADING = "src/app/reviews/[id]/loading.tsx";
const STALE = "src/app/reviews/[id]/stale-check.ts";
const RBAC = "../../supabase/migrations/20260715160000_cd030_review_scope_rbac.sql";

// Open the first workspace from the queue; skip the test if the env has no rows.
async function openFirstWorkspace(page: Page): Promise<boolean> {
  await page.goto("/reviews");
  const open = page.getByRole("link", { name: /open workspace/i }).first();
  if (await open.count() === 0) return false;
  await open.click();
  await expect(page).toHaveURL(/\/reviews\/[0-9a-f-]+$/);
  return true;
}

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-030 source truth — scope authority, unavailable ≠ unchanged, navigation-only", () => {
  test("legs 4/5/6 — classification uses STORED returned scope, never the diff", () => {
    const src = SRC(CMP);
    // Authority is returnedScope (stored section keys); expected/unexpected split
    // is membership in that scope — not derived from whether the answer changed.
    expect(src).toMatch(/returnedScope\.includes\(sect\.key\)\s*\?\s*"expected"\s*:\s*"unexpected"/);
    // Server passes the stored scope from the last decided return.
    const page = SRC(PAGE);
    expect(page).toMatch(/returned_sections/);
    expect(page).toMatch(/decidedReturns\[decidedReturns\.length - 1\]/);
  });

  test("leg 6/9 — an unknown/unscoped change is 'unavailable', NEVER 'unchanged'", () => {
    const src = SRC(CMP);
    // Only an unchanged (a===b) row is 'unchanged'. A change with no scope or no
    // known section falls to 'unavailable'.
    expect(src).toMatch(/if\s*\(!changed\)\s*\{\s*category = "unchanged"/);
    expect(src).toMatch(/returnedScope == null \|\| !sect[\s\S]*?category = "unavailable"/);
  });

  test("legs 7/8/host — accept/merge action does NOT exist (HANDOFF_BLOCKED_ACCEPT)", () => {
    const src = SRC(CMP);
    // Navigation-only: no server action / mutation is imported or invoked by the
    // compare surface, and it declares no form action. (The words "accept/merge"
    // appear only in the doc comment explaining why the action is absent.)
    expect(src).not.toMatch(/useActionState|['"]use server['"]|\.insert\(|\.update\(|action=\{/);
    // The only interactive controls are disclosure buttons and scroll-to buttons.
    expect(src).not.toMatch(/<button[^>]*type="submit"/);
  });

  test("legs 7/8/9 — evidence/package/metadata comparisons are explicitly unavailable", () => {
    const page = SRC(PAGE);
    expect(page).toMatch(/unavailEvidence/);
    expect(page).toMatch(/unavailPackage/);
    expect(page).toMatch(/unavailMetadata/);
    expect(page).toMatch(/HANDOFF_BLOCKED_MEDIADIFF/);
  });

  test("leg 15 (S07) — a degraded version source is stated, never silently omitted", () => {
    const page = SRC(PAGE);
    // The fetch error is captured and distinguished from a genuine not-found.
    expect(page).toMatch(/error:\s*insErr/);
    expect(page).toMatch(/insErr\s*\?/);
    // Missing submission_versions (latest undefined) renders an explicit
    // unavailable banner in place of the comparison surface, not nothing.
    expect(page).toMatch(/latest\s*\?\s*\(\s*\n?\s*<VersionCompare/);
    expect(page).toMatch(/sourceUnavailable/);
  });

  test("S11 — a route-level loading skeleton exists for /reviews/:id", () => {
    const loading = SRC(LOADING);
    expect(loading).toMatch(/role="status"/);
    expect(loading).toMatch(/aria-busy="true"/);
  });

  test("S08 — a newer version submitted mid-view is detected and flagged, role=alert", () => {
    const cmp = SRC(CMP);
    const stale = SRC(STALE);
    // Real DB read of the max version on record — not a guessed freshness window.
    expect(stale).toMatch(/order\("version_number",\s*\{\s*ascending:\s*false\s*\}\)/);
    // Polled periodically and compared against the version this surface loaded with.
    expect(cmp).toMatch(/setInterval\(check,\s*STALE_POLL_MS\)/);
    expect(cmp).toMatch(/n\s*>\s*latest/);
    expect(cmp).toMatch(/role="alert"/);
    const page = SRC(PAGE);
    expect(page).toMatch(/staleTitle:\s*t\(/);
    expect(page).toMatch(/staleBody:\s*t\(/);
    expect(page).toMatch(/staleRefresh:\s*t\(/);
  });

  test("leg 1/16 — authorized roles have submission-version read scope and malformed return scopes are rejected by DB shape", () => {
    const rbac = SRC(RBAC);
    expect(rbac).toMatch(/has_any_role\(array\['reviewer','auditor','ops','planner','leadership'\]\)/);
    expect(rbac).toMatch(/reviews_returned_sections_array_check/);
    const page = SRC(PAGE);
    expect(page).toMatch(/\.maybeSingle\(\)/);
    expect(page).toMatch(/outside your permitted scope/);
  });
});

test.describe("CD-030 reviewer — live compare surface (legs 1,3,10,11,17)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("leg 1/11 — compare mode lives inside /reviews/:id (no dedicated /compare route)", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page).not.toHaveURL(/\/compare/);
    await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
  });

  test("leg 4 — the returned-scope authority is always stated (stored, not inferred)", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
    // Either a scope is on record, or the honest no-scope statement — never silent.
    const authority = await page.getByText(/Returned-scope authority \(stored\)/i).count();
    const noScope = await page.getByText(/No returned scope on record/i).count();
    expect(authority + noScope).toBeGreaterThan(0);
  });

  test("leg 10/12 — comparison is navigation-only (no accept/merge control)", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page.getByText(/navigation-only/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /accept changes|merge/i })).toHaveCount(0);
  });

  test("leg 3/17 — version selectors render; scope rail is keyboard disclosure", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    const single = await page.getByText(/No prior version to compare/i).count();
    test.skip(single > 0, "single-version inspection — no-prior state (leg 13) covered elsewhere");
    // explicit from/to selectors
    await expect(page.locator("#cmp-from")).toBeVisible();
    await expect(page.locator("#cmp-to")).toBeVisible();
    // scope-rail categories are native disclosure buttons (aria-expanded)
    const disclosure = page.locator('button[aria-expanded]');
    expect(await disclosure.count()).toBeGreaterThan(0);
    const first = disclosure.first();
    const before = await first.getAttribute("aria-expanded");
    await first.click();
    await expect(first).not.toHaveAttribute("aria-expanded", String(before));
  });

  test("leg 12/13 — rail navigation focuses the changed answer, and no-prior is a live status", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
    const rail = page.locator('div[aria-label*="Tamper-evident Scope Rail"]');
    const target = rail.locator("li button").first();
    if (await target.count() === 0) {
      await expect(page.getByRole("status").filter({ hasText: /No prior version to compare/i })).toHaveCount(1);
      return;
    }
    const key = (await target.locator(".ax-numeric").innerText()).trim();
    const row = page.locator(`#cmp-${key}`);
    await expect(target).toBeVisible();
    await target.click();
    await expect(row).toBeFocused();
  });

  test("legs 7/8/9 — 'not derived in the runtime' unavailable block is present", async ({ page }) => {
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page.getByText(/Comparisons not derived in the runtime/i)).toBeVisible();
    await expect(page.getByText(/never 'unchanged'|not equal/i).first()).toBeVisible();
  });
});

test.describe("CD-030 accessibility / RTL (leg 17, DSG-A11Y-001)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("Arabic/RTL — the workspace renders under dir=rtl", async ({ page }) => {
    await page.goto("/locale?set=ar");
    const opened = await openFirstWorkspace(page);
    test.skip(!opened, "no reviews in this environment to open");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
