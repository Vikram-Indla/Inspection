import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";

const EVIDENCE_DIR = evidenceDirectory("single-v2");

// CD-022 · SCR-WEB-120 · DSG-017/DSG-A11Y-001. Identity Confidence Lens for
// /planning/single: server-side graded search (EXACT/SIMILAR NAME/DEGRADED),
// selection-time duplicate warning parity with the publish-time M02-012
// block, keyboard/focus-transfer, and work preservation on a blocked
// publish. Fixtures are dedicated throwaway factories per run (same reason
// golden-journey.spec.ts and cd-023-immediate-authority-bar.spec.ts use
// their own — a shared factory races every other suite/manual run against
// the same live project).

test.describe("CD-022 graded identity search", () => {
  test.use({ storageState: storageStatePath("planner") });

  let exactFactory: { id: string; cr_number: string; name: string };
  let similarNameFactory: { id: string; name: string; cr_number: string };
  let degradedFactory: { id: string; name: string; cr_number: string };
  let duplicateFactory: { id: string; cr_number: string; name: string };
  let retryFactory: { id: string; cr_number: string; name: string };
  let draftFactory: { id: string; cr_number: string; name: string };
  // Canonical v2 fixtures (PLN-REQ-020/021/024): one CR with TWO industrial
  // licences → two plants/factories. Written with the admin JWT because the
  // canonical tables are admin-governed (planner reads, never writes).
  let multiCr: { id: string; cr_number: string };
  let multiLicA: { id: string; license_number: string; plant_number: string };
  let multiLicB: { id: string; license_number: string };
  let multiFactoryA: { id: string; name: string };
  let multiFactoryB: { id: string; name: string };
  let canonicalPortfolioAvailable = false;
  let plannerJwt: string;
  let plannerUserId: string;

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    plannerJwt = planner.jwt;
    plannerUserId = planner.userId;
    const admin = await login(PERSONAS.admin.email, PERSONAS.admin.password);
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    draftFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-DRAFT-${suffix}`, name: `CD-022 Draft Resume ${suffix}`,
      cr_number: `CR-DRAFT-${suffix}`, license_number: `LIC-DRAFT-${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.73, official_lng: 46.7,
    }), "draft-resume factory")[0];

    // Canonical portfolio: one CR, two licences → two plants (factories).
    // The canonical tables are governed writes (compliance/security/workflow
    // admin only); the four-canonical-roles reconciliation left every e2e
    // persona outside that set, so when staging refuses the staging writes the
    // canonical-portfolio tests skip honestly instead of failing the suite.
    multiFactoryA = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-MLA-${suffix}`, name: `CD022 Multi Licence Alpha ${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.74, official_lng: 46.71,
    }), "multi-licence factory A")[0];
    multiFactoryB = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-MLB-${suffix}`, name: `CD022 Multi Licence Beta ${suffix}`,
      region: "Jeddah", city: "Jeddah", official_lat: 21.49, official_lng: 39.19,
    }), "multi-licence factory B")[0];
    try {
      multiCr = must(await rest("POST", "commercial_registrations", admin.jwt, {
        cr_number: `CD022-CR-MULTI-${suffix}`, legal_name_en: `CD022 Multi Licence Holdings ${suffix}`, status: "active",
      }), "multi-licence CR")[0];
      multiLicA = must(await rest("POST", "industrial_licenses", admin.jwt, {
        commercial_registration_id: multiCr.id, factory_id: multiFactoryA.id,
        license_number: `CD022-LIC-A-${suffix}`, plant_number: `CD022-PLANT-A-${suffix}`, status: "active",
      }), "multi-licence A")[0];
      multiLicB = must(await rest("POST", "industrial_licenses", admin.jwt, {
        commercial_registration_id: multiCr.id, factory_id: multiFactoryB.id,
        license_number: `CD022-LIC-B-${suffix}`, status: "active",
      }), "multi-licence B")[0];
      canonicalPortfolioAvailable = true;
    } catch (error) {
      console.warn(`[cd-022] canonical portfolio unavailable: ${(error as Error).message}`);
      canonicalPortfolioAvailable = false;
    }

    retryFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-RETRY-${suffix}`, name: `CD-022 Retry Idempotence ${suffix}`,
      cr_number: `CR-RETRY-${suffix}`, license_number: `LIC-RETRY-${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.72, official_lng: 46.69,
    }), "retry-idempotence factory")[0];

    exactFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-EXACT-${suffix}`, name: `CD-022 Exact Match ${suffix}`,
      cr_number: `CR-EXACT-${suffix}`, license_number: `LIC-EXACT-${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.7136, official_lng: 46.6753,
    }), "exact-match factory")[0];

    similarNameFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-SIMILAR-${suffix}`, name: `CD022 Similar Steelworks ${suffix}`,
      cr_number: `CR-SIMILAR-${suffix}`, license_number: `LIC-SIMILAR-${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.7, official_lng: 46.7,
    }), "similar-name factory")[0];

    // DEGRADED: no license_number, no official coordinates.
    degradedFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-DEGRADED-${suffix}`, name: `CD022 Degraded Record ${suffix}`,
      cr_number: `CR-DEGRADED-${suffix}`, region: "Riyadh", city: "Riyadh",
    }), "degraded factory")[0];

    duplicateFactory = must(await rest("POST", "factories", planner.jwt, {
      factory_code: `CD022-DUP-${suffix}`, name: `CD022 Duplicate Guard ${suffix}`,
      cr_number: `CR-DUP-${suffix}`, license_number: `LIC-DUP-${suffix}`,
      region: "Riyadh", city: "Riyadh", official_lat: 24.71, official_lng: 46.68,
    }), "duplicate-guard factory")[0];
    // Pre-existing active visit for the duplicate-guard factory (draft is
    // enough — M02-012 blocks on draft/published/returned).
    const pkg = must(await rest("GET", "package_versions?select=id&status=in.(published,locked)&limit=1", planner.jwt), "published package")[0];
    const { data: plan } = await rest("POST", "visit_plans", planner.jwt, { method: "single", status: "draft", created_by: planner.userId });
    const planId = (plan as { id: string }[])[0].id;
    await rest("POST", "visits", planner.jwt, {
      visit_plan_id: planId, factory_id: duplicateFactory.id, visit_type: "periodic",
      execution_mode: "physical", planning_status: "draft",
      window_start: new Date(Date.now() + 500 * 86400e3).toISOString(),
      window_end: new Date(Date.now() + 500 * 86400e3 + 3600e3).toISOString(),
      package_version_id: pkg.id,
    });
  });

  async function search(page: Page, term: string) {
    await page.goto("/planning/single");
    await page.getByPlaceholder(/CR number|Industrial License/i).fill(term);
    await page.waitForURL(/[?&]q=/);
  }

  test("EXACT badge only on governed identifier equality; rule text shown (M01-035)", async ({ page }) => {
    await search(page, exactFactory.cr_number);
    const row = page.locator("li", { hasText: exactFactory.name });
    await expect(row.locator(".badge-compliant", { hasText: "EXACT" })).toBeVisible();
  });

  test("name search is a new leg — SIMILAR NAME always shows the differing identifier", async ({ page }) => {
    // Search by the unique name (the CR/code/license do not contain it). A
    // unique term keeps this live fixture isolated from accumulated historical
    // rows while still exercising the name-only SIMILAR NAME path.
    await search(page, similarNameFactory.name);
    const row = page.locator("li", { hasText: similarNameFactory.name });
    await expect(row.locator(".badge-warning", { hasText: "SIMILAR NAME" })).toBeVisible();
    await row.locator('input[type="radio"]').check();
    // The dossier always discloses the real (differing) identifier — scope to
    // the dossier region since the compact row label also shows the CR.
    const dossier = page.locator('[role="region"]', { hasText: similarNameFactory.name });
    await expect(dossier.locator("bdi", { hasText: similarNameFactory.cr_number })).toBeVisible();
  });

  test("DEGRADED flag independent of match grade — missing license/coordinates", async ({ page }) => {
    await search(page, degradedFactory.cr_number);
    const row = page.locator("li", { hasText: degradedFactory.name });
    await expect(row.locator(".badge-compliant", { hasText: "EXACT" })).toBeVisible();
    await expect(row.locator(".badge-critical", { hasText: "DEGRADED RECORD" })).toBeVisible();
  });

  test("canonical licence search resolves CR → licence → plant portfolio (PLN-REQ-021)", async ({ page }) => {
    test.skip(!canonicalPortfolioAvailable, "canonical registry writes are governed to admin roles no e2e persona holds");
    await search(page, multiLicA.license_number);
    // CR identity card with every licence/plant under it
    await expect(page.getByText(multiCr.cr_number)).toBeVisible();
    const row = page.locator("li", { hasText: multiLicA.license_number });
    await expect(row).toBeVisible();
    await expect(row).toContainText(multiLicA.plant_number);
    await row.locator('input[name="licence_id"]').check();
    // Selecting the licence shows the registered plant profile (read-only) —
    // scoped to the profile region since the licence row also names the factory.
    await expect(page.locator('div[role="region"]', { hasText: multiFactoryA.name })).toBeVisible();
  });

  test("canonical plant search resolves the same target (PLN-REQ-021)", async ({ page }) => {
    test.skip(!canonicalPortfolioAvailable, "canonical registry writes are governed to admin roles no e2e persona holds");
    await search(page, multiLicA.plant_number);
    await expect(page.getByText(multiCr.cr_number)).toBeVisible();
    await expect(page.locator("li", { hasText: multiLicA.license_number })).toBeVisible();
  });

  test("multi-licence CR requires an explicit licence/plant selection — CR-level continuation is blocked (PLN-REQ-022)", async ({ page }) => {
    test.skip(!canonicalPortfolioAvailable, "canonical registry writes are governed to admin roles no e2e persona holds");
    await search(page, multiCr.cr_number);
    // CR identity + every licence/plant listed
    await expect(page.getByText(multiCr.cr_number)).toBeVisible();
    await expect(page.locator("li", { hasText: multiLicA.license_number })).toBeVisible();
    await expect(page.locator("li", { hasText: multiLicB.license_number })).toBeVisible();
    // Explicit eligibility state: a single visit targets one plant, never the CR
    await expect(page.getByText(/select one license \/ plant to continue/i)).toBeVisible();
    // Nothing continues (and publish stays disabled) until a licence is picked
    await expect(page.getByRole("button", { name: /Submit for supervision/i })).toBeDisabled();
    await expect(page.locator('input[name="location_confirmed"]')).toHaveCount(0);
    await page.locator("li", { hasText: multiLicB.license_number }).locator('input[name="licence_id"]').check();
    await expect(page.locator('div[role="region"]', { hasText: multiFactoryB.name })).toBeVisible();
    await expect(page.locator('input[name="location_confirmed"]')).toBeVisible();
  });

  test("Factory 360 handoff prefills and preselects the canonical target with source recorded (PLN-REQ-024)", async ({ page }) => {
    test.skip(!canonicalPortfolioAvailable, "canonical registry writes are governed to admin roles no e2e persona holds");
    await page.goto(`/planning/single?cr=${encodeURIComponent(multiCr.cr_number)}&license=${encodeURIComponent(multiLicA.license_number)}&plant=${encodeURIComponent(multiLicA.plant_number)}&factory=${multiFactoryA.id}&source=factory360`);
    await expect(page.getByText(/prefilled from Factory 360/i)).toBeVisible();
    await expect(page.locator(`input[name="licence_id"][value="${multiLicA.id}"]`)).toBeChecked();
    await expect(page.locator('div[role="region"]', { hasText: multiFactoryA.name })).toBeVisible();
    // The handoff source rides the form into the publish path
    await expect(page.locator('input[name="source_channel"]')).toHaveValue("factory360");
  });

  test("save draft → resume via ?plan= hydrates target + config; publish consumes the draft (PLN-REQ-020/022/023)", async ({ page }) => {
    test.setTimeout(240_000);
    await search(page, draftFactory.cr_number);
    const row = page.locator("li", { hasText: draftFactory.name });
    await row.locator('input[type="radio"]').check();
    await page.locator('input[name="license_number"]').check();
    await page.locator('input[name="location_confirmed"]').check();
    const dayOffset = 6000 + Math.floor(Math.random() * 20000);
    const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
    const end = new Date(Date.now() + dayOffset * 86400e3 + 3600e3).toISOString().slice(0, 16);
    await page.locator('input[name="window_start"]').fill(start);
    await page.locator('input[name="window_end"]').fill(end);
    await page.locator('select[name="inspector_id"]').selectOption("");
    await page.locator('textarea[name="notes"]').fill("Draft resume note");

    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(page.getByText(/draft saved/i)).toBeVisible();
    const planId = await page.locator('input[name="resume_visit_plan_id"]').inputValue();
    expect(planId).toMatch(/^[0-9a-f-]{36}$/);
    const staged = must(await rest("GET", `visit_plans?id=eq.${planId}&select=status,method,draft_version,source_channel`, plannerJwt), "saved draft row");
    expect(staged[0].status).toBe("draft");
    expect(staged[0].method).toBe("single");
    expect(staged[0].source_channel).toBe("planning.single");

    // Resume: target + config hydrate from draft_payload; the location gate
    // is deliberately re-confirmed by the planner (it also unlocks the
    // config section whose hydrated values are asserted below).
    await page.goto(`/planning/single?plan=${planId}`);
    await expect(page.getByText(/draft restored/i)).toBeVisible();
    await page.locator('input[name="location_confirmed"]').check();
    await expect(page.locator('textarea[name="notes"]')).toHaveValue("Draft resume note");
    await expect(page.locator('input[name="window_start"]')).toHaveValue(start);
    await page.getByRole("button", { name: /Submit for supervision/i }).click();
    await expect(page).toHaveURL(/\/planning\/supervision\?submitted=[0-9a-f-]+/, { timeout: 120_000 });

    // Publish consumed the draft (no second plan) and targeting/provenance
    // metadata landed on the plan criteria + visit row (PLN-REQ-023).
    const planAfter = must(await rest("GET", `visit_plans?id=eq.${planId}&select=status,source_channel,criteria`, plannerJwt), "plan after draft publish");
    expect(planAfter).toHaveLength(1);
    expect(planAfter[0].status).toBe("pending_supervision");
    expect(planAfter[0].source_channel).toBe("planning.single");
    expect(planAfter[0].criteria?.target?.cr_number).toBe(draftFactory.cr_number);
    const visitAfter = must(await rest("GET", `visits?visit_plan_id=eq.${planId}&select=source_channel,internal_reference`, plannerJwt), "visit after draft publish");
    expect(visitAfter).toHaveLength(1);
    expect(visitAfter[0].source_channel).toBe("planning.single");
    expect(visitAfter[0].internal_reference).toContain(draftFactory.cr_number);
  });

  test("duplicate warning at selection matches the publish-time M02-012 block (parity, not just a UI echo)", async ({ page }) => {
    await search(page, duplicateFactory.cr_number);
    const row = page.locator("li", { hasText: duplicateFactory.name });
    await row.locator('input[type="radio"]').check();
    // Selection-time warning (informational, does not block continuing) —
    // must name the conflicting visit (parity with the publish-time block's
    // own visit-ID text), not just a generic message.
    const warning = page.locator(".alert-warning", { hasText: /active visit already exists/i });
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/status:\s*draft/i);
    await expect(warning.locator("a")).toBeVisible();
    await expect(warning.locator("a")).toHaveAttribute("href", /\/visits\/[0-9a-f-]+/);
    // The same rule is still a hard block at publish (M02-012 unchanged).
    await page.locator('input[name="license_number"]').check();
    await page.locator('input[name="location_confirmed"]').check();
    const dayOffset = 2000 + Math.floor(Math.random() * 20000);
    const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
    const end = new Date(Date.now() + dayOffset * 86400e3 + 3600e3).toISOString().slice(0, 16);
    await page.locator('input[name="window_start"]').fill(start);
    await page.locator('input[name="window_end"]').fill(end);
    await page.locator('select[name="inspector_id"]').selectOption("");
    await page.getByRole("button", { name: /Submit for supervision/i }).click();
    await expect(page.locator('div[role="alert"]').filter({ hasText: /active visit already exists/i })).toBeVisible();
  });

  test("blocked publish preserves entered work and transfers focus to the error (M01-041, DSG-A11Y-001)", async ({ page }) => {
    // Supervision reconciliation: the inspector is a proposal now (M01-040
    // retired), so the deterministic blocker is the duplicate-active rule —
    // the same publish-time guard the parity test proves.
    await search(page, duplicateFactory.cr_number);
    const row = page.locator("li", { hasText: duplicateFactory.name });
    await row.locator('input[type="radio"]').check();
    await page.locator('input[name="license_number"]').check();
    await page.locator('input[name="location_confirmed"]').check();
    await page.locator('textarea[name="notes"]').fill("Preserved planner note");
    const dayOffset = 3000 + Math.floor(Math.random() * 20000);
    const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
    const end = new Date(Date.now() + dayOffset * 86400e3 + 3600e3).toISOString().slice(0, 16);
    await page.locator('input[name="window_start"]').fill(start);
    await page.locator('input[name="window_end"]').fill(end);
    await page.getByRole("button", { name: /Submit for supervision/i }).click();
    const alert = page.locator('div[role="alert"]').filter({ hasText: /active visit already exists/i });
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    // Work preserved — the note is still there after the blocked-publish re-render.
    await expect(page.locator('textarea[name="notes"]')).toHaveValue("Preserved planner note");
    await expect(page.locator("body")).not.toContainText(/PGRST|violates row-level|duplicate key/i);
  });

  test("resumable retry keyed by visit_plan_id never creates a second visit; an unowned resume id fails closed (M01-042)", async ({ page }) => {
    test.setTimeout(240_000);
    // Simulate "a prior attempt already created the plan, then something
    // failed before the visit was written" by staging the plan directly via
    // REST, then handing the UI that plan's id as its resume_visit_plan_id
    // (exactly what actions.ts sets in `state.resumeId` after a real partial
    // failure — this reaches the same server code path without needing to
    // force a live mid-flight DB failure).
    const staged = must(await rest("POST", "visit_plans", plannerJwt, { method: "single", status: "draft", created_by: plannerUserId }), "stage plan for resume");
    const planId = staged[0].id as string;

    await search(page, retryFactory.cr_number);
    const row = page.locator("li", { hasText: retryFactory.name });
    await row.locator('input[type="radio"]').check();
    await page.locator('input[name="license_number"]').check();
    await page.locator('input[name="location_confirmed"]').check();
    const dayOffset = 4000 + Math.floor(Math.random() * 20000);
    const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
    const end = new Date(Date.now() + dayOffset * 86400e3 + 3600e3).toISOString().slice(0, 16);
    await page.locator('input[name="window_start"]').fill(start);
    await page.locator('input[name="window_end"]').fill(end);
    await page.locator('select[name="inspector_id"]').selectOption("");
    // Inject the staged plan id as the resume field — this is what the
    // server would have set itself after a real partial failure.
    await page.locator('input[name="resume_visit_plan_id"]').evaluate((el: HTMLInputElement, id: string) => { el.value = id; }, planId);
    await page.getByRole("button", { name: /Submit for supervision/i }).click();
    await expect(page).toHaveURL(/\/planning\/supervision\?submitted=[0-9a-f-]+/, { timeout: 120_000 });

    const plansAfterFirst = must(await rest("GET", `visit_plans?id=eq.${planId}&select=id`, plannerJwt), "plans after first submit");
    expect(plansAfterFirst).toHaveLength(1); // resumed, not duplicated
    const visitsAfterFirst = must(await rest("GET", `visits?visit_plan_id=eq.${planId}&select=id`, plannerJwt), "visits after first submit");
    expect(visitsAfterFirst).toHaveLength(1);

    // Fail-closed: a resumeId that does not resolve to a plan owned by this
    // user must never fall through to a fresh insert.
    const foreignId = "00000000-0000-4000-8000-000000000000";
    const plansBeforeForeign = must(await rest("GET", `visit_plans?select=id&created_by=eq.${plannerUserId}`, plannerJwt), "plans before foreign resume");
    await search(page, retryFactory.cr_number);
    await page.locator("li", { hasText: retryFactory.name }).locator('input[type="radio"]').check();
    await page.locator('input[name="license_number"]').check();
    await page.locator('input[name="location_confirmed"]').check();
    await page.locator('input[name="window_start"]').fill(start);
    await page.locator('input[name="window_end"]').fill(end);
    await page.locator('select[name="inspector_id"]').selectOption("");
    await page.locator('input[name="resume_visit_plan_id"]').evaluate((el: HTMLInputElement, id: string) => { el.value = id; }, foreignId);
    await page.getByRole("button", { name: /Submit for supervision/i }).click();
    await expect(page.locator('div[role="alert"]').first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/PGRST|violates row-level|duplicate key/i);
    const plansAfterForeign = must(await rest("GET", `visit_plans?select=id&created_by=eq.${plannerUserId}`, plannerJwt), "plans after foreign resume");
    expect(plansAfterForeign.length).toBe(plansBeforeForeign.length); // no fresh plan silently created
  });

  test("keyboard-only: search, select via radio, confirm gates, reach publish without a mouse", async ({ page }) => {
    await search(page, exactFactory.cr_number);
    const row = page.locator("li", { hasText: exactFactory.name });
    await row.locator('input[type="radio"]').focus();
    await page.keyboard.press("Space");
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    await page.locator('input[name="license_number"]').focus();
    await page.keyboard.press("Space");
    await page.locator('input[name="location_confirmed"]').focus();
    await page.keyboard.press("Space");
    await expect(page.locator('input[name="package_version_id"][type="checkbox"]').first()).toBeVisible();
  });

  test("dark/light × EN/AR × desktop/narrow evidence has no horizontal overflow", async ({ page }) => {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    for (const locale of ["en", "ar"] as const) {
      for (const theme of ["dark", "light"] as const) {
        for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "narrow", width: 420, height: 900 }]) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`/locale?set=${locale}`);
          await page.goto("/planning/single");
          await page.evaluate(mode => {
            localStorage.setItem("saqeel-theme", mode);
          }, theme);
          await page.reload();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
          await page.screenshot({ path: join(EVIDENCE_DIR, `${locale}-${theme}-${viewport.name}.png`), fullPage: true });
        }
      }
    }
  });
});

test.describe("CD-022 authorization boundary", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("inspector is denied the single-visit wizard before any identity data renders (RBAC-009/010)", async ({ page }) => {
    // Planning convergence: planning_access_class() = inspector now fails
    // closed in place (the earlier channel redirect retired with the shared
    // access model). The boundary is identical: no identity search, no wizard.
    await page.goto("/planning/single");
    await expect(page.getByText(/You don.t have permission/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/CR number|Industrial License/i)).toHaveCount(0);
  });
});

test.describe("CD-022 authorization boundary — admin class", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("admin class is denied (planning.create.single is not an admin default)", async ({ page }) => {
    await page.goto("/planning/single");
    await expect(page.getByText(/You don.t have permission|ليست لديك الصلاحية/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/CR number|Industrial License/i)).toHaveCount(0);
  });
});

test.describe("CD-022 authorization boundary — business staff", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("business staff outside the Planner read contract are denied the identity search UI", async ({ page }) => {
    await page.goto("/planning/single");
    await expect(page.getByText(/You don.t have permission/i).first()).toBeVisible();
    await expect(page.getByText(/Only planning staff can use Plan a single visit/i)).toBeVisible();
    await expect(page.getByPlaceholder(/CR number|Industrial License/i)).toHaveCount(0);
  });
});

test("CD-022 supervision submission and duplicate reads fail closed behind the shared atomic boundary", () => {
  const action = readFileSync(join(process.cwd(), "src/app/(app)/planning/single/actions.ts"), "utf8");
  const duplicate = readFileSync(join(process.cwd(), "src/app/(app)/planning/single/duplicate.ts"), "utf8");
  const resolver = readFileSync(join(process.cwd(), "src/lib/planning/factory-resolver.ts"), "utf8");
  const supervisionMigration = readFileSync(join(process.cwd(), "../..", "supabase/migrations/20260729021000_single_visit_supervision_lifecycle.sql"), "utf8");
  expect(action).toContain('sb.rpc("submit_single_visit_for_supervision"');
  // saveSingleDraft deliberately inserts/updates a draft visit_plan
  // (status 'draft'); the PUBLISH path itself never writes visit rows, target
  // provenance or package snapshots outside the atomic RPC.
  expect(action).not.toContain('.from("visits").insert');
  expect(action).not.toContain('.from("visits")\n    .update');
  expect(action).not.toContain('.from("visit_packages").insert');
  expect(action).toContain("p_target: canonicalTarget");
  expect(action).toContain("p_package_version_ids: package_version_ids");
  expect(action).toContain('.eq("method", "single").eq("status", "draft")');
  expect(action).toContain("saveSingleDraft");
  expect(resolver).toContain("resolveHandoffTarget");
  expect(duplicate).toContain("unavailable: true");
  expect(supervisionMigration).toContain("PLANNING-SUPERVISION-DUPLICATE");
  expect(supervisionMigration).toContain("PLANNING-SUPERVISION-CANONICAL-TARGET");
  expect(supervisionMigration).toContain("insert into public.visit_packages");
  expect(supervisionMigration).toContain("planning_supervision_requested");
  expect(supervisionMigration).toContain("SINGLE_VISIT_SUBMITTED_FOR_SUPERVISION");
});
