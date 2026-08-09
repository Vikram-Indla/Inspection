import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath, PERSONAS } from "./personas";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";
import { login, rest, must } from "./live-rest";

// CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish workspace.
// Acceptance: DSG-020 (complete plan/child visits/blockers/notifications/atomic
// publication), DSG-A11Y-001, DSG-CODE-001. Requirements: M01-009/010/029/030/031,
// M02-012, FND-001/003/004/011/013, RBAC-007.
// The M1–M6 describes are READ-ONLY — publish is never clicked; atomic
// all-or-nothing publication is proven at the DB layer + the guarded RPC. The
// M7 describe below IS mutating by design (real publishes against throwaway
// factories with far-future windows). Runtime evidence is supplementary to the
// functional assertions (.claude/rules/tests.md).
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

// Canonical-target discovery. The supervision boundary requires exactly one
// industrial licence per target (TARGET-AMBIGUOUS otherwise) and CR/licence
// writes are governed to compliance/security/workflow admins, so tests draw
// targets from the live canonical registry set instead of fabricating rows:
//   busy — single-licence, located, WITH an active periodic visit (duplicate)
//   free — single-licence, located, WITHOUT an active periodic visit
const ACTIVE_PERIODIC = "visit_type=eq.periodic&planning_status=in.(draft,validated,pending_supervision,published,returned)";
async function canonicalTargetPools(jwt: string, userId: string): Promise<{ busy: string[]; free: string[] }> {
  const licences = must(await rest(
    "GET",
    "industrial_licenses?select=factory_id&commercial_registration_id=not.is.null&limit=5000",
    jwt,
  ), "licence registry") as { factory_id: string }[];
  const licenceCount = new Map<string, number>();
  for (const row of licences) licenceCount.set(row.factory_id, (licenceCount.get(row.factory_id) ?? 0) + 1);
  const singles = [...licenceCount.keys()].filter(id => licenceCount.get(id) === 1);
  if (singles.length === 0) return { busy: [], free: [] };
  // Planning writes are region-scoped (planning_closure_factory_in_scope), so
  // only targets inside the acting planner's scope are usable.
  const [profile] = must(await rest("GET", `profiles?select=region&user_id=eq.${userId}`, jwt), "planner profile") as { region: string | null }[];
  const region = profile?.region?.trim() ?? "";
  const regionFilter = region && region !== "National" ? `&region=eq.${encodeURIComponent(region)}` : "";
  const located = must(await rest(
    "GET",
    `factories?select=id&id=in.(${singles.join(",")})&official_lat=not.is.null&official_lng=not.is.null&is_temporary=eq.false${regionFilter}`,
    jwt,
  ), "located canonical factories") as { id: string }[];
  const active = must(await rest("GET", `visits?select=factory_id&${ACTIVE_PERIODIC}&limit=5000`, jwt), "active periodic visits") as { factory_id: string }[];
  const busySet = new Set(active.map(v => v.factory_id));
  const busy: string[] = [];
  const free: string[] = [];
  for (const f of located) (busySet.has(f.id) ? busy : free).push(f.id);
  return { busy, free };
}

test.describe("CD-025 review workspace (DSG-020)", () => {
  test("renders the blocker-first IA: context → readiness → targets → evidence → ledger → action", async ({ page }) => {
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    // staged, nothing-persisted honesty (no plan record yet)
    await expect(page.getByText(/nothing is saved until you submit it for supervision/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Readiness$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Targets & proposed visits/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assignment evidence", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Supervision submission ledger/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Corrections & supervision submission/i })).toBeVisible();
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
    await expect(readiness.locator(".sq-lozenge--success, .badge-compliant, .sq-lozenge--critical, .badge-critical")).toBeVisible({ timeout: 15000 });
    // Publish reflects that state: enabled iff readiness is clear.
    const ready = await readiness.locator(".sq-lozenge--success, .badge-compliant").count();
    const publish = page.getByRole("button", { name: /Submit plan and create|Submission blocked/i });
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
    // Supervision reconciliation: no assignment happens at submission at all —
    // the truthful copy names the Supervisor as the assigning authority.
    await expect(page.locator(".sq-overline", { hasText: /No preference — Supervisor assigns/i }).first()).toBeVisible();
    await expect(page.getByText(/No automatic assignment is made/i).first()).toBeVisible();
    await expect(page.getByText(/round-robin/i)).toHaveCount(0);
    await expect(page.getByText(/contact support/i)).toHaveCount(0);
  });

  test("publish is a single native button; when blocked it exposes a described-by disabled reason (DSG-A11Y-001)", async ({ page }) => {
    test.setTimeout(120_000);
    await stageSelection(page);
    await page.goto("/planning/bulk/review");
    const publish = page.getByRole("button", { name: /Submit plan and create|Submission blocked/i });
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
  // submission returns the authoritative plan ID (drives the read-only plan link), never a hard redirect
  expect(actions).toContain('sb.rpc("submit_bulk_plan_for_supervision"');
  expect(actions).toContain("return { ok: true, planId:");
  expect(actions).not.toContain('redirect("/visits")');
  // readiness preview exists and is a preview only (RPC remains authoritative)
  expect(actions).toContain("export async function validateBulkPlan");
  // no invented support/escalation destination in operator-facing copy
  expect(actions).not.toContain("contact support");
  // the guarded RPC returns the plan id and holds the supervision boundary
  const migration = SRC("../../supabase/migrations/20260729024000_bulk_supervision_lifecycle.sql");
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
    // Canonical-target reconciliation: the review workspace hydrates only
    // factories with a canonical industrial licence, so every staged id must
    // come from the licenced registry set.
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const pools = await canonicalTargetPools(planner.jwt, planner.userId);
    test.skip(pools.busy.length < 2, "staging lacks licenced located factories with active periodic visits");
    test.skip(pools.free.length < 1, "staging lacks a licenced located factory without an active periodic visit");
    const ids = [pools.busy[0], pools.busy[1], pools.free[0]];
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
    const publish = page.getByRole("button", { name: /Submit plan and create|Submission blocked/i });
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
    await expect(page.getByText(/couldn.t load this draft/i)).toBeVisible();
    await expect(page.getByText(/No factories selected/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish/i })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// M7 — optional zero-many packages (PLN-CON-003), accepted-subset publish
// (PLN-CON-007), capability-gated publish + lookups-driven config.
// Mutating tests use dedicated throwaway factories PER TEST (publish marks a
// factory with an active visit forever) and far-future windows so the single
// staging Inspector is never double-booked. The capability-gate + NULL-package
// tests require migration 20260721180000 (applied to staging).
test.describe("M7 — optional packages, accepted-subset publish, capability gate", () => {
  let plannerJwt: string;
  let plannerUserId: string;
  const fac: Record<string, { id: string; name: string }> = {};

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    plannerJwt = planner.jwt;
    plannerUserId = planner.userId;
    // The supervision RPC requires one canonical target identity per factory
    // (exactly one industrial licence joined to a CR — TARGET-AMBIGUOUS
    // otherwise), planning writes are region-scoped, and the canonical tables
    // are governed writes no e2e persona holds. Staging currently offers ONE
    // free in-scope canonical target, so every M7 test shares it in rotation:
    // each mutating test cancels the rows it created before handing over,
    // returning the target to the free pool for the next test and run.
    const pools = await canonicalTargetPools(plannerJwt, plannerUserId);
    if (pools.free.length < 1) return;
    const [row] = must(await rest("GET", `factories?select=id,name&id=eq.${pools.free[0]}`, plannerJwt), "M7 canonical target") as { id: string; name: string }[];
    if (!row) return;
    for (const key of ["warn", "multi", "raceA", "rev", "zero"]) fac[key] = row;
  });

  test.beforeEach(() => {
    test.skip(Object.keys(fac).length === 0, "staging lacks a free in-scope canonical target for the M7 suite");
  });

  async function releaseTarget() {
    if (!plannerJwt || Object.keys(fac).length === 0) return;
    await rest("PATCH",
      `visits?factory_id=eq.${fac.warn.id}&planning_status=in.(draft,pending_supervision)&visit_type=eq.periodic&created_by=not.is.null`,
      plannerJwt, { planning_status: "cancelled" }, "return=minimal");
  }
  test.afterEach(async () => { await releaseTarget(); });
  test.afterAll(async () => { await releaseTarget(); });

  async function stageReview(page: import("@playwright/test").Page, ids: string[]) {
    await page.addInitScript(sel => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify(sel)); }, ids);
    await page.goto("/planning/bulk/review");
    const dayOffset = 6000 + Math.floor(Math.random() * 20000);
    const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
    const end = new Date(Date.now() + dayOffset * 86400e3 + 3600e3).toISOString().slice(0, 16);
    const dt = page.locator('input[type="datetime-local"]');
    await dt.nth(0).fill(start);
    await dt.nth(1).fill(end);
  }
  async function uncheckAllPackages(page: import("@playwright/test").Page) {
    const boxes = page.locator('input[type="checkbox"][value]');
    await expect(boxes.first()).toBeVisible();
    for (const box of await boxes.all()) {
      if (await box.isChecked()) await box.uncheck();
    }
  }
  async function latestBulkPlan() {
    return (must(await rest("GET", `visit_plans?created_by=eq.${plannerUserId}&method=eq.bulk&order=created_at.desc&limit=1&select=id,status`, plannerJwt), "latest bulk plan"))[0];
  }

  test("zero packages is an honest warning, not a blocker; preparation hint is shown (PLN-CON-003)", async ({ page }) => {
    await stageReview(page, [fac.warn.id]);
    await uncheckAllPackages(page);
    await expect(page.getByText(/chooses an eligible checklist during preparation/i).first()).toBeVisible();
    // The readiness rail names it as a WARNING; publish is NOT gated by it.
    await expect(page.getByText(/No inspection checklist selected/i)).toBeVisible({ timeout: 15000 });
    const publish = page.getByRole("button", { name: /Submit plan and create|Submission blocked/i });
    await expect(publish).toBeEnabled({ timeout: 15000 });
    await expect(publish).toContainText(/create 1 /);
  });

  test("every selected package lands on visit_packages with an immutable snapshot", async ({ page }) => {
    await stageReview(page, [fac.multi.id]);
    // Check EVERY rendered package checkbox (DOM-driven: staging currently has
    // exactly one effective package; the assertions scale up automatically
    // when more are seeded). Default = first package already checked.
    const boxes = page.locator('input[type="checkbox"][value]');
    await expect(boxes.first()).toBeVisible();
    const expectedIds: string[] = [];
    for (const box of await boxes.all()) {
      expectedIds.push((await box.getAttribute("value"))!);
      if (!(await box.isChecked())) await box.check();
    }
    expect(expectedIds.length).toBeGreaterThan(0);
    // Governed priority flows through the lookups-driven selector.
    await page.getByLabel(/^Priority$/i).selectOption("high");
    const publish = page.getByRole("button", { name: /Submit plan and create/i });
    await expect(publish).toBeEnabled({ timeout: 15000 });
    await publish.click();
    await expect(page.getByText("Plan submitted for supervision", { exact: true })).toBeVisible({ timeout: 30000 });

    const plan = await latestBulkPlan();
    expect(plan.status).toBe("pending_supervision");
    const visits = must(await rest("GET", `visits?visit_plan_id=eq.${plan.id}&select=id,package_version_id,priority,factory_id`, plannerJwt), "plan visits");
    expect(visits).toHaveLength(1);
    expect(visits[0].factory_id).toBe(fac.multi.id);
    expect(visits[0].package_version_id).toBe(expectedIds[0]); // first = primary (backward compat)
    expect(visits[0].priority).toBe("high");
    const links = must(await rest("GET", `visit_packages?visit_id=eq.${visits[0].id}&select=package_version_id,snapshot,added_by`, plannerJwt), "visit_packages links");
    expect(links).toHaveLength(expectedIds.length);
    expect(links.map((l: { package_version_id: string }) => l.package_version_id).sort()).toEqual([...expectedIds].sort());
    for (const l of links) {
      expect(l.snapshot.package_version_id).toBe(l.package_version_id);
      expect(l.snapshot.code).toBeTruthy();
      expect(l.snapshot.status).toMatch(/published|locked/);
      expect(l.snapshot.captured_at).toBeTruthy();
    }
  });

  test("authoritative publish re-check: a row that turns ineligible at publish is dropped and NAMED (PLN-CON-007)", async ({ page }) => {
    // Single-row variant of the accepted-subset race: staging has exactly one
    // Inspector, so a two-row plan in one shared window can never arm. The
    // same server path is exercised — the publish-time partition re-computes
    // eligibility, drops the row the client believed eligible, and names it.
    await stageReview(page, [fac.raceA.id]);
    // Wait until the preview finds the row eligible and publish is armed.
    const publish = page.getByRole("button", { name: /Submit plan and create 1 /i });
    await expect(publish).toBeEnabled({ timeout: 15000 });
    // NOW raceA gains an active periodic visit — between the preview and the
    // commit. The client cannot know; the server partition must drop it.
    const racePlan = must(await rest("POST", "visit_plans", plannerJwt, { method: "single", status: "draft", created_by: plannerUserId }), "race plan")[0];
    must(await rest("POST", "visits", plannerJwt, {
      visit_plan_id: racePlan.id, factory_id: fac.raceA.id, visit_type: "periodic",
      execution_mode: "physical", planning_status: "draft",
      window_start: new Date(Date.now() + 9000 * 86400e3).toISOString(),
      window_end: new Date(Date.now() + 9000 * 86400e3 + 3600e3).toISOString(),
    }), "race visit");
    await publish.click();
    // The authoritative re-check drops the only row and names it with its
    // reason; NOTHING commits (no RPC call, no plan, no extra visit).
    await expect(page.getByText(/Every selected row is ineligible at the authoritative re-check/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(new RegExp(fac.raceA.name.slice(0, 20)))).toBeVisible();
    await expect(page.getByText(/duplicate_active_visit/i)).toBeVisible();
    const visits = must(await rest("GET",
      `visits?factory_id=eq.${fac.raceA.id}&planning_status=in.(draft,validated,pending_supervision,published,returned)&select=id,planning_status`,
      plannerJwt), "raceA visits");
    expect(visits).toHaveLength(1); // only the sacrificial REST-created draft
  });

  test("reviewer persona (publish capability, no planner role) publishes (migration 20260721180000)", async ({ browser }) => {
    test.setTimeout(180_000);
    // Sign the reviewer in through the real /login UI instead of replaying
    // playwright/.auth/reviewer.json: refresh-token rotation makes a replayed
    // state intermittently land on /login, while the UI journey is exactly
    // what auth.setup proves for every persona.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(PERSONAS.reviewer.email);
    await passwordField(page).fill(PERSONAS.reviewer.password);
    await submitCredentials(page);
    await page.waitForURL(url => url.pathname.startsWith(PERSONAS.reviewer.home), { timeout: 40_000 });
    // Fresh sessions default to Arabic; pin English like auth.setup does so
    // the governed copy matchers below stay deterministic.
    const origin = new URL(page.url()).origin;
    await context.addCookies([
      { name: "locale", value: "en", url: origin },
      { name: "login_locale", value: "en", url: origin },
    ]);
    await stageReview(page, [fac.rev.id]);
    const publish = page.getByRole("button", { name: /Submit plan and create/i });
    await expect(publish).toBeEnabled({ timeout: 15000 });
    await publish.click();
    await expect(page.getByText("Plan submitted for supervision", { exact: true })).toBeVisible({ timeout: 30000 });
    await context.close();
  });

  test("zero-package publish proceeds (RPC NULL package, migration 20260721180000)", async ({ page }) => {
    await stageReview(page, [fac.zero.id]);
    await uncheckAllPackages(page);
    const publish = page.getByRole("button", { name: /Submit plan and create/i });
    await expect(publish).toBeEnabled({ timeout: 15000 });
    await publish.click();
    await expect(page.getByText("Plan submitted for supervision", { exact: true })).toBeVisible({ timeout: 30000 });
    const plan = await latestBulkPlan();
    const visits = must(await rest("GET", `visits?visit_plan_id=eq.${plan.id}&select=id,package_version_id`, plannerJwt), "zero-package visits");
    expect(visits).toHaveLength(1);
    expect(visits[0].package_version_id).toBeNull();
    const links = must(await rest("GET", `visit_packages?visit_id=eq.${visits[0].id}`, plannerJwt), "zero-package links");
    expect(links).toHaveLength(0);
  });
});
