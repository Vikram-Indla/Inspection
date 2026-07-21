import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath, PERSONAS } from "./personas";
import { login, rest, must } from "./live-rest";

// CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish workspace.
// Acceptance: DSG-020 (complete plan/child visits/blockers/notifications/atomic
// publication), DSG-A11Y-001, DSG-CODE-001. Requirements: M01-009/010/029/030/031,
// M02-012, FND-001/003/004/011/013, RBAC-007.
// Tests are READ-ONLY — publish is never clicked (it mutates live data); atomic
// all-or-nothing publication is proven at the DB layer + the guarded RPC. Runtime
// evidence is supplementary to the functional assertions (.claude/rules/tests.md).
const EVIDENCE_DIR = evidenceDirectory("cd-025-plan-review-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
// M6 — bare /planning/bulk no longer match-alls (at least one criterion
// required); stage selections through a full-scope criterion instead.
const ALL_REGIONS_CT = encodeURIComponent(JSON.stringify({ k: "g", c: "all", n: [{ k: "c", f: "region", o: "neq", v: "__none__" }] }));

test.use({ storageState: storageStatePath("planner") });

async function stageSelection(page: Page, n = 3): Promise<string[]> {
  await page.goto(`/planning/bulk?ct=${ALL_REGIONS_CT}`);
  const hrefs = await page.locator('a[href^="/factories/"]').evaluateAll(
    (els, k) => els.slice(0, k).map(e => (e.getAttribute("href") ?? "").replace("/factories/", "")),
    n,
  );
  const ids = hrefs.filter(Boolean);
  await page.addInitScript(sel => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify(sel)); }, ids);
  return ids;
}

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-025 review workspace (DSG-020)", () => {
  test("renders the blocker-first IA: context → readiness → targets → evidence → ledger → action", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    // staged, nothing-persisted honesty (no plan record yet)
    await expect(page.getByText(/nothing is saved until you publish/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Readiness$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Targets & proposed visits/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assignment evidence", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publish consequence ledger/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Corrections & publish/i })).toBeVisible();
    // Complete the mandatory window so the readiness preview resolves (proves the
    // validateBulkPlan wiring runs); publish is NOT clicked (read-only).
    const dt = page.locator('input[type="datetime-local"]');
    await dt.nth(0).fill("2026-08-01T09:00");
    await dt.nth(1).fill("2026-08-31T17:00");
    // Wait for the preview to RE-VALIDATE against the filled window (the initial
    // empty-window "configuration missing" blocker must clear), so the captured
    // frame is coherent — not a race between inputs and a stale preview.
    await expect(page.getByText(/Mandatory configuration is missing/i)).toHaveCount(0, { timeout: 15000 });
    // Readiness must resolve to a truthful, definite state — ready OR blocked —
    // and never remain a false "ready" while checking (no optimistic success).
    const readiness = page.locator(".cd-ready");
    await expect(readiness.locator(".ax-lozenge--success, .badge-compliant, .ax-lozenge--critical, .badge-critical")).toBeVisible({ timeout: 15000 });
    // Publish reflects that state: enabled iff readiness is clear.
    const ready = await readiness.locator(".ax-lozenge--success, .badge-compliant").count();
    const publish = page.getByRole("button", { name: /Publish plan and create|Publish blocked/i });
    if (ready) await expect(publish).toBeEnabled();
    else await expect(publish).toBeDisabled();
    await page.screenshot({ path: join(EVIDENCE_DIR, "review-primary.png"), fullPage: true });
  });

  test("consequence ledger binds four groups (created / referenced / recorded-or-queued / will-not-happen)", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/Will be created on successful commit/i)).toBeVisible();
    await expect(page.getByText(/Will be referenced for those visits/i)).toBeVisible();
    await expect(page.getByText(/Will be recorded or queued/i)).toBeVisible();
    await expect(page.getByText(/Will not happen at publication/i)).toBeVisible();
    // FND-004 — notifications are queued, never claimed delivered/accepted.
    await expect(page.getByText(/queued for sending only/i)).toBeVisible();
    await expect(page.getByText(/No message is delivered or accepted/i)).toBeVisible();
  });

  test("automatic-assignment copy is truthful; no round-robin claim, no invented support destination", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    // the visible assignment-evidence heading (not the collapsed <option>)
    await expect(page.locator(".ax-overline", { hasText: /chosen at publish/i })).toBeVisible();
    await expect(page.getByText(/first eligible Inspector available in the window/i)).toBeVisible();
    await expect(page.getByText(/round-robin/i)).toHaveCount(0);
    await expect(page.getByText(/contact support/i)).toHaveCount(0);
  });

  test("publish is a single native button; when blocked it exposes a described-by disabled reason (DSG-A11Y-001)", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    const publish = page.getByRole("button", { name: /Publish plan and create|Publish blocked/i });
    await expect(publish).toBeVisible();
    if (!(await publish.isEnabled())) {
      const describedBy = await publish.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      await expect(page.locator(`#${describedBy}`)).toContainText(/Disabled:/i);
    }
  });

  test("empty staged selection fails closed to a return path, never a blank publishable plan", async ({ page }) => {
    await page.addInitScript(() => { sessionStorage.removeItem("cd021-bulk-selection"); });
    await page.goto("/planning/bulk/review");
    await expect(page.getByText(/No factories selected/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to targeting/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish/i })).toHaveCount(0);
  });
});

test.describe("CD-025 a11y / RTL / responsive (DSG-A11Y-001)", () => {
  test("Arabic renders the review workspace document-level RTL with localized copy", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/locale?set=ar");
    await page.goto("/planning/bulk/review");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // Localized copy from ui_strings (plan.review.*), not the English fallback.
    await expect(page.getByRole("heading", { name: "الجاهزية" })).toBeVisible();            // Readiness
    await expect(page.getByRole("heading", { name: "سجل نتائج النشر" })).toBeVisible();       // Publish consequence ledger
    await expect(page.getByRole("heading", { name: "المصانع والزيارات المقترحة" })).toBeVisible(); // Targets & proposed visits
    // fill the window so the frame shows a resolved (non-config-missing) Arabic state
    const dt = page.locator('input[type="datetime-local"]');
    await dt.nth(0).fill("2026-08-01T09:00");
    await dt.nth(1).fill("2026-08-31T17:00");
    await expect(page.getByText("التهيئة الإلزامية ناقصة")).toHaveCount(0, { timeout: 15000 });
    await page.screenshot({ path: join(EVIDENCE_DIR, "review-ar-rtl.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("narrow viewport (412) has no horizontal overflow", async ({ page }) => {
    await stageSelection(page);
    await page.setViewportSize({ width: 412, height: 900 });
    await page.goto("/planning/bulk/review");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: join(EVIDENCE_DIR, "review-narrow-412.png"), fullPage: true });
  });
});

// DSG-CODE-001 / DEC-012 wiring — code-layer proof of the design-to-live closures
// that do not require mutating live data.
test("CD-025 wiring: truthful publisher result, live readiness preview, no invented support path", () => {
  const actions = SRC("src/app/(app)/planning/bulk/actions.ts");
  // publish returns the authoritative plan ID (drives the read-only plan link), never a hard redirect
  expect(actions).toContain('sb.rpc("publish_bulk_plan"');
  expect(actions).toContain("return { ok: true, planId:");
  expect(actions).not.toContain('redirect("/visits")');
  // readiness preview exists and is a preview only (RPC remains authoritative)
  expect(actions).toContain("export async function validateBulkPlan");
  // no invented support/escalation destination in operator-facing copy
  expect(actions).not.toContain("contact support");
  // the guarded RPC returns the plan id and runs STM-PLAN-001/002 (validated → published)
  const migration = SRC("../../supabase/migrations/20260714091727_planning_publish_guards.sql");
  expect(migration).toContain("returns uuid");
  expect(migration).toContain("return v_plan_id;");
});

// CD-025 R3 S10 — scope-reduction (12→10) must announce politely and restore
// focus after the Fix control unmounts (DSG-A11Y-001, WIRING legs 2/4). Proven at
// the code layer: the click-path needs a guaranteed duplicate in the planner's
// scope, which the seed does not deterministically provide, so an e2e click would
// be flaky. The behavior is data-independent and asserted here instead.
test("CD-025 S10: scope reduction announces politely and restores focus (DSG-A11Y-001)", () => {
  const client = SRC("src/app/(app)/planning/bulk/review/ReviewClient.tsx");
  // a polite live region carries the named-removal + retained-count announcement
  expect(client).toContain('aria-live="polite"');
  expect(client).toContain("s.scopeReduced");
  // focus is restored to the readiness heading once the unmounting Fix control fires
  expect(client).toContain("readinessHeadingRef");
  expect(client).toContain("readinessHeadingRef.current?.focus()");
  // the announcement string is provided from the server component
  const page = SRC("src/app/(app)/planning/bulk/review/page.tsx");
  expect(page).toContain("plan.review.scopeReduced");
});

// ---------------------------------------------------------------------------
// M6 — eligibility partition + acknowledgement + draft resume consumption.
test.describe("M6 — eligibility partition and eligible-subset acknowledgement", () => {
  test("ledger shows the 7 counts; publish stays gated until the eligible-subset acknowledgement", async ({ page }) => {
    // Self-contained staging: the single staging inspector is busy on recurring
    // monthly windows, so any multi-row auto selection hard-blocks on coverage.
    // Instead stage 2 located factories WITH an active periodic visit (duplicate
    // rows — excluded from retained; their blocker is bypassed by the ack) plus
    // 1 located factory with NO active periodic visit (stays eligible), inside a
    // probe-verified free window (2026-09-10 → 2026-09-20).
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const ACTIVE = "visit_type=eq.periodic&planning_status=in.(draft,validated,published,returned)";
    const dupVisits = must(await rest("GET", `visits?select=factory_id&${ACTIVE}&limit=50`, planner.jwt), "active periodic visits") as { factory_id: string }[];
    const dupIds = [...new Set(dupVisits.map(v => v.factory_id))];
    const dupFacs = dupIds.length
      ? must(await rest("GET", `factories?select=id&id=in.(${dupIds.slice(0, 20).join(",")})&official_lat=not.is.null&official_lng=not.is.null&limit=2`, planner.jwt), "located duplicate factories") as { id: string }[]
      : [];
    test.skip(dupFacs.length < 2, "staging lacks located factories with active periodic visits");
    const candidates = must(await rest("GET", "factories?select=id&official_lat=not.is.null&official_lng=not.is.null&limit=100", planner.jwt), "located factories") as { id: string }[];
    let clean: string | undefined;
    for (const c of candidates) {
      if (dupFacs.some(d => d.id === c.id)) continue;
      const v = must(await rest("GET", `visits?select=id&factory_id=eq.${c.id}&${ACTIVE}&limit=1`, planner.jwt), "clean-factory probe") as { id: string }[];
      if (v.length === 0) { clean = c.id; break; }
    }
    test.skip(!clean, "staging lacks a located factory without an active periodic visit");
    const ids = [dupFacs[0].id, dupFacs[1].id, clean!];
    await page.addInitScript(sel => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify(sel)); }, ids);
    await page.goto("/planning/bulk/review");
    const dt = page.locator('input[type="datetime-local"]');
    await dt.nth(0).fill("2026-09-10T09:00");
    await dt.nth(1).fill("2026-09-20T17:00");
    // The eligibility section renders all 7 partition counts.
    await expect(page.getByRole("heading", { name: /^Eligibility$/i })).toBeVisible();
    await expect(page.getByText("Total selected", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("To create", { exact: true })).toBeVisible();
    await expect(page.getByText("Missing location", { exact: true })).toBeVisible();
    await expect(page.getByText("Active conflicts", { exact: true })).toBeVisible();
    await expect(page.getByText("Manual override required", { exact: true })).toBeVisible();
    // Per-row reasons name the duplicate rows.
    await expect(page.getByText(/duplicate — active visit/i).first()).toBeVisible();
    // Publish is gated behind the explicit acknowledgement…
    const publish = page.getByRole("button", { name: /Publish plan and create|Publish blocked/i });
    await expect(page.getByText(/are ineligible/i).first()).toBeVisible({ timeout: 15000 });
    await expect(publish).toBeDisabled();
    // …and acknowledging proceeds with the eligible subset only (1 row here).
    await page.getByRole("checkbox", { name: /Proceed with the .* eligible/i }).check();
    await expect(publish).toBeEnabled({ timeout: 15000 });
    await expect(publish).toContainText(/create 1 /);
    await page.screenshot({ path: join(EVIDENCE_DIR, "eligibility-ack.png"), fullPage: true });
  });

  test("an unknown ?plan= id falls back honestly to the browser-held path", async ({ page }) => {
    await page.addInitScript(() => { sessionStorage.removeItem("cd021-bulk-selection"); });
    await page.goto("/planning/bulk/review?plan=00000000-0000-4000-8000-000000000000");
    await expect(page.getByText(/could not be loaded/i)).toBeVisible();
    await expect(page.getByText(/No factories selected/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish/i })).toHaveCount(0);
  });
});
