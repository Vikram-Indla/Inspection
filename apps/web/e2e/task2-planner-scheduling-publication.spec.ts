import { test, expect, chromium, type Browser, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { login as restLogin, rest, must } from "./live-rest";

// TASK-2-PLANNER-SCHEDULING-PUBLICATION — dataset UAT-S02, roles planner2 /
// supervisor2 / inspector2 @mim.gov.sa. Exercises: establishment selection,
// map/list loading, new visit scheduling, conflict feedback (duplicate visit +
// inspector double-booking), inspector proposal, save draft, publish
// (Supervisor approve & release — PLN-SUP-001..003), notifications and
// downstream visibility (Planning list + Visit management).
//
// This spec authenticates directly against the real /login UI per persona
// (no shared storageState fixture) because the governed roleN@mim.gov.sa
// identities are outside apps/web/e2e/personas.ts's fixed five-persona set.

function readEnv(): Record<string, string> {
  const webRoot = resolve(__dirname, "..");
  const path = join(webRoot, ".env.local");
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const at = line.indexOf("=");
    values[line.slice(0, at)] = line.slice(at + 1);
  }
  return values;
}
const env = readEnv();
const password = (process.env.SAQEEL_CROSS_ROLE_PASSWORD ?? env.SAQEEL_CROSS_ROLE_PASSWORD ?? "").trim();
test.skip(!password, "SAQEEL_CROSS_ROLE_PASSWORD is not configured — see docs/TEST_ACCOUNTS.md");

const EVIDENCE_DIR = evidenceDirectory("task2-planner-scheduling-publication/rerun-20260804-final");
let shot = 0;
const capture = async (page: Page, label: string) => {
  shot += 1;
  await page.screenshot({ path: join(EVIDENCE_DIR, `${String(shot).padStart(2, "0")}-${label}.png`), fullPage: true });
};

async function login(browser: Browser, email: string, home: string): Promise<Page> {
  const homePath = home.split("?")[0];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto("/login");
  await page.locator("form.fl-form input.fl-in").first().waitFor();
  await page.locator("form.fl-form input.fl-in").first().fill(email);
  await page.locator("form.fl-form input.fl-pw-in").fill(password);
  await page.locator("form.fl-form button.fl-submit").click();
  const withoutLocale = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const arrived = (url: URL) => withoutLocale(url.pathname).startsWith(homePath) || withoutLocale(url.pathname).startsWith("/dashboard");
  await page.waitForURL(arrived, { timeout: 40_000 }).catch(async () => {
    await page.goto("/launch");
    await page.waitForURL(arrived, { timeout: 40_000 });
  });
  if (!withoutLocale(new URL(page.url()).pathname).startsWith(homePath)) {
    await page.goto(home);
    await page.waitForURL((url) => withoutLocale(url.pathname).startsWith(homePath));
  }
  await page.context().addCookies([
    { name: "locale", value: "en", url: new URL(page.url()).origin },
    { name: "login_locale", value: "en", url: new URL(page.url()).origin },
  ]);
  await page.reload();
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");
  return page;
}

test.describe.configure({ mode: "serial" });

let browser: Browser;
// Two isolated establishments, both under UAT-S02 planner2 region (Eastern):
// F-3301 for the happy path, F-3302 for the inspector-double-booking conflict.
// F-3301 was already consumed by an earlier debugging pass of this same
// journey (published with a placeholder inspector selector before it was
// hardened to select inspector2 by governed id) — F-3303 is untouched.
const HAPPY_CR = "4030-203303";
const CONFLICT_CR = "4030-203302";
const HAPPY_FACTORY = "Jubail Fertilizer Co.";
const CONFLICT_FACTORY = "Gulf Cables & Electrical";
let publishedVisitRef = "";

// One shared window: P1 publishes the happy visit inside it, and P4 submits
// the conflict factory into the SAME window so the supervisor-side
// double-booking refusal is guaranteed against this run's own booking, not
// against a stale pre-seeded date that has since slipped into the past.
const HAPPY_START = new Date(Date.now() + 10 * 86_400_000);
const HAPPY_END = new Date(HAPPY_START.getTime() + 4 * 3_600_000);

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: false });

  // Fixture rollover — a prior pass of this journey leaves its published /
  // pending visits live on the two dedicated factories, and the duplicate
  // guard (M02-012) would then block P1 before the journey starts. Retire
  // them through governed paths only: the supervisor rejects stale pending
  // submissions, the planner cancels their own remaining active plans.
  const planner = await restLogin("planner2@mim.gov.sa", password);
  const supervisor = await restLogin("supervisor2@mim.gov.sa", password);
  const factories = must(await rest("GET",
    `factories?select=id&cr_number=in.(${HAPPY_CR},${CONFLICT_CR})`, planner.jwt),
    "UAT-S02 fixture factories") as { id: string }[];
  if (factories.length) {
    const ids = factories.map(f => f.id).join(",");
    const active = must(await rest("GET",
      `visits?select=id,planning_status&factory_id=in.(${ids})&planning_status=in.(draft,validated,pending_supervision,published,returned)`,
      planner.jwt), "UAT-S02 active fixture visits") as { id: string; planning_status: string }[];
    for (const v of active) {
      if (v.planning_status === "pending_supervision") {
        await rest("POST", "rpc/decide_single_visit_supervision", supervisor.jwt, {
          p_visit_id: v.id, p_decision: "reject", p_inspector_id: null,
          p_reason: "UAT-S02 fixture rollover — clearing the dedicated factories for a fresh run",
        });
      } else {
        await rest("PATCH", `visits?id=eq.${v.id}`, planner.jwt, { planning_status: "cancelled" }, "return=minimal");
      }
    }
  }
});
test.afterAll(async () => {
  await browser.close();
});

test("P1 planner2 selects establishment, schedules a visit, saves a draft, then submits for supervision", async () => {
  test.setTimeout(240_000);
  const page = await login(browser, "planner2@mim.gov.sa", "/planning");
  await capture(page, "planner-home");

  await page.goto("/planning/single");
  await capture(page, "single-planning-empty");

  // Establishment selection — canonical CR search (map/list: location step
  // renders text by default, Map/Text toggle switches to Mapbox).
  await page.getByPlaceholder(/CR number, Industrial License/i).fill(HAPPY_CR);
  await page.waitForTimeout(400); // debounce
  await page.waitForURL((url) => url.searchParams.get("q") === HAPPY_CR);
  await expect(page.getByText("Commercial Registration")).toBeVisible();
  const licenceRadio = page.locator('input[name="licence_id"]').first();
  await licenceRadio.check();
  await capture(page, "establishment-selected");

  // Map/list loading — toggle the location map on.
  const mapToggle = page.getByRole("button", { name: /Map \/ Text/i });
  if (await mapToggle.count()) {
    await mapToggle.click();
    await page.waitForTimeout(1000);
    await capture(page, "location-map-loaded");
    await mapToggle.click(); // back to text for stable subsequent selectors
  }

  await page.locator('input[name="location_confirmed"]').check();

  // New visit scheduling — config step.
  const iso = (d: Date) => d.toISOString().slice(0, 16);
  await page.locator("#wizard-window-start").fill(iso(HAPPY_START));
  await page.locator("#wizard-window-end").fill(iso(HAPPY_END));

  // Inspector selection — planner proposes inspector2 (Supervisor confirms/replaces later).
  // Selecting by value (not label) — inspector2's full_name substring-matches
  // inspector20..29 in the same dropdown.
  await page.locator("#wizard-inspector").selectOption({ value: "a4000000-0000-4000-8000-000000000002" });
  await capture(page, "visit-configured");

  // Save draft.
  await page.getByRole("button", { name: /Save draft/i }).click();
  await expect(page.getByText(/Draft saved/i)).toBeVisible({ timeout: 15_000 });
  await capture(page, "draft-saved");

  // Publish path (planner submits; Supervisor releases — PLN-SUP-001/002).
  const submit = page.getByRole("button", { name: /Submit for supervision/i });
  await expect(submit).toBeEnabled();
  await submit.click();
  // Multi-write server action on the live non-production project — observed
  // 20-60s round-trips under load (same latency note as task7 P1).
  await page.waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 90_000 });
  publishedVisitRef = page.url();
  await capture(page, "submitted-for-supervision");
  expect(publishedVisitRef).toContain("submitted=");

  await page.context().close();
});

test("P2 planner2 conflict feedback — duplicate active visit is blocked at submit", async () => {
  test.setTimeout(240_000);
  const page = await login(browser, "planner2@mim.gov.sa", "/planning");
  await page.goto("/planning/single");
  await page.getByPlaceholder(/CR number, Industrial License/i).fill(HAPPY_CR);
  await page.waitForTimeout(400);
  await page.waitForURL((url) => url.searchParams.get("q") === HAPPY_CR);
  await page.locator('input[name="licence_id"]').first().check();
  await page.locator('input[name="location_confirmed"]').check();
  const start = new Date(Date.now() + 11 * 86_400_000);
  const end = new Date(start.getTime() + 4 * 3_600_000);
  const iso = (d: Date) => d.toISOString().slice(0, 16);
  await page.locator("#wizard-window-start").fill(iso(start));
  await page.locator("#wizard-window-end").fill(iso(end));
  await page.getByRole("button", { name: /Submit for supervision/i }).click();
  await expect(page.locator(".alert-critical").first()).toContainText(/active visit already exists/i, { timeout: 15_000 });
  await capture(page, "conflict-duplicate-visit-blocked");
  await page.context().close();
});

test("P3 supervisor2 reviews the queue, confirms an available inspector, and publishes (approve & release)", async () => {
  test.setTimeout(240_000);
  const page = await login(browser, "supervisor2@mim.gov.sa", "/planning/supervision");
  await capture(page, "supervision-queue");
  await expect(page.getByRole("region", { name: /Supervision request/i }).first()).toBeVisible({ timeout: 15_000 });

  const row = page.getByRole("region", { name: /Supervision request/i }).filter({ hasText: HAPPY_FACTORY });
  // inspector2's stable governed identity id (docs/TEST_ACCOUNTS.md /
  // scripts/test-data/provision_governed_uat_identities.mjs deterministic
  // id() helper) — select by value, never by label text, since inspector2's
  // full_name substring-matches inspector20..29 in the same dropdown.
  const INSPECTOR2_ID = "a4000000-0000-4000-8000-000000000002";
  const finalInspector = row.getByLabel(/Final Inspector/i);
  await finalInspector.selectOption({ value: INSPECTOR2_ID });
  await row.getByRole("button", { name: /Approve & release/i }).click();
  // A successful decision revalidates the server list, which can remove this
  // card from the DOM as part of the same refresh that would render its own
  // success text — wait for either signal rather than racing the refresh.
  const approvalOutcome = await Promise.race([
    expect(page.getByText(/Visit approved, assigned, and released/i)).toBeVisible({ timeout: 30_000 }).then(() => "confirmed" as const).catch(() => null),
    expect(row).toHaveCount(0, { timeout: 30_000 }).then(() => "released" as const).catch(() => null),
  ]);
  expect(approvalOutcome, "approval must confirm or release the queue card").not.toBeNull();
  await capture(page, "visit-published");
  await page.context().close();
});

test("P4 supervisor2 conflict feedback — inspector double-booking is refused at approve", async () => {
  test.setTimeout(240_000);
  // Planner side: submit a second, non-duplicate factory in a window that
  // overlaps inspector2's already-published assignment from P3/pre-seeded data.
  const plannerPage = await login(browser, "planner2@mim.gov.sa", "/planning");
  await plannerPage.goto("/planning/single");
  await plannerPage.getByPlaceholder(/CR number, Industrial License/i).fill(CONFLICT_CR);
  await plannerPage.waitForTimeout(400);
  await plannerPage.waitForURL((url) => url.searchParams.get("q") === CONFLICT_CR);
  await plannerPage.locator('input[name="licence_id"]').first().check();
  await plannerPage.locator('input[name="location_confirmed"]').check();
  const iso = (d: Date) => d.toISOString().slice(0, 16);
  await plannerPage.locator("#wizard-window-start").fill(iso(HAPPY_START));
  await plannerPage.locator("#wizard-window-end").fill(iso(HAPPY_END));
  await plannerPage.getByRole("button", { name: /Submit for supervision/i }).click();
  // Re-running this journey against already-seeded state can find the
  // conflict visit already pending supervision from a prior pass — the
  // planner-side duplicate block (M02-012, see P2) is then expected, not a
  // failure; either way the pending request already exists for supervisor2.
  const submissionOutcome = await Promise.race([
    plannerPage.waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 90_000 }).then(() => "submitted" as const).catch(() => null),
    expect(plannerPage.locator(".alert-critical").first()).toContainText(/active visit already exists/i, { timeout: 90_000 }).then(() => "duplicate-blocked" as const).catch(() => null),
  ]);
  expect(submissionOutcome, "conflict-factory submission must submit or be duplicate-blocked").not.toBeNull();
  await plannerPage.context().close();

  // INSP-715/716 moved the double-booking refusal UP into availability: the
  // queue's Final Inspector options come from list_available_supervision_
  // inspectors, which excludes anyone already booked in the window — inspector2
  // (booked by P3 in this same window) must not even be offered. The server
  // guard (PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE) is then proven
  // independently so a raced or forged approval is still refused.
  const INSPECTOR2_ID = "a4000000-0000-4000-8000-000000000002";
  const supPage = await login(browser, "supervisor2@mim.gov.sa", "/planning/supervision");
  const row = supPage.getByRole("region", { name: /Supervision request/i }).filter({ hasText: CONFLICT_FACTORY });
  await expect(row.first()).toBeVisible({ timeout: 20_000 });
  const finalInspector = row.getByLabel(/Final Inspector/i);
  await expect(finalInspector.locator(`option[value="${INSPECTOR2_ID}"]`)).toHaveCount(0);
  await capture(supPage, "conflict-inspector-unavailable");
  await supPage.context().close();

  const supervisor = await restLogin("supervisor2@mim.gov.sa", password);
  const pendingConflict = must(await rest("GET",
    `planning_supervision_requests?select=visit_id,visits!inner(factories!inner(cr_number))&status=eq.pending&visits.factories.cr_number=eq.${CONFLICT_CR}&order=submitted_at.desc&limit=1`,
    supervisor.jwt), "pending conflict supervision request") as { visit_id: string }[];
  expect(pendingConflict.length).toBe(1);
  const conflictVisitId = pendingConflict[0].visit_id;
  const refused = await rest("POST", "rpc/decide_single_visit_supervision", supervisor.jwt, {
    p_visit_id: conflictVisitId, p_decision: "approve", p_inspector_id: INSPECTOR2_ID,
    p_reason: "UAT-S02 double-booking negative — must be refused",
  });
  expect(refused.error ?? "").toContain("PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE");
  const untouched = must(await rest("GET",
    `visits?select=planning_status&id=eq.${conflictVisitId}`, supervisor.jwt), "conflict visit state")[0];
  expect(untouched.planning_status).toBe("pending_supervision");
  const assignments = must(await rest("GET",
    `assignments?visit_id=eq.${conflictVisitId}&select=visit_id`, supervisor.jwt), "conflict visit assignments");
  expect(assignments).toEqual([]);
});

test("P5 downstream visibility — published visit shows in Planning list and Visit management", async () => {
  test.setTimeout(240_000);
  const page = await login(browser, "planner2@mim.gov.sa", "/planning");
  await page.goto("/planning?tab=published");
  await expect(page.getByTestId("planning-visit-table")).toContainText(HAPPY_FACTORY, { timeout: 15_000 });
  await capture(page, "downstream-planning-list-published");
  await page.goto("/visits");
  await expect(page.locator("body")).toContainText(HAPPY_FACTORY, { timeout: 15_000 });
  await capture(page, "downstream-visit-management");
  await page.context().close();
});
