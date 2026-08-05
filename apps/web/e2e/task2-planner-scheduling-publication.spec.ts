import { test, expect, chromium, type Browser, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { evidenceDirectory } from "./evidence-path";

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
  await page.waitForURL((url) => url.pathname.startsWith(homePath) || url.pathname.startsWith("/dashboard"), { timeout: 40_000 });
  if (!new URL(page.url()).pathname.startsWith(homePath)) {
    await page.goto(home);
    await page.waitForURL((url) => url.pathname.startsWith(homePath));
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

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});
test.afterAll(async () => {
  await browser.close();
});

test("P1 planner2 selects establishment, schedules a visit, saves a draft, then submits for supervision", async () => {
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
  const start = new Date(Date.now() + 10 * 86_400_000);
  const end = new Date(start.getTime() + 4 * 3_600_000);
  const iso = (d: Date) => d.toISOString().slice(0, 16);
  await page.locator("#wizard-window-start").fill(iso(start));
  await page.locator("#wizard-window-end").fill(iso(end));

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
  await page.waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 20_000 });
  publishedVisitRef = page.url();
  await capture(page, "submitted-for-supervision");
  expect(publishedVisitRef).toContain("submitted=");

  await page.context().close();
});

test("P2 planner2 conflict feedback — duplicate active visit is blocked at submit", async () => {
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
  await Promise.race([
    expect(page.getByText(/Visit approved, assigned, and released/i)).toBeVisible({ timeout: 15_000 }),
    expect(row).toHaveCount(0, { timeout: 15_000 }),
  ]);
  await capture(page, "visit-published");
  await page.context().close();
});

test("P4 supervisor2 conflict feedback — inspector double-booking is refused at approve", async () => {
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
  await plannerPage.locator("#wizard-window-start").fill(iso(new Date("2026-08-02T07:00:00.000Z")));
  await plannerPage.locator("#wizard-window-end").fill(iso(new Date("2026-08-02T10:00:00.000Z")));
  await plannerPage.getByRole("button", { name: /Submit for supervision/i }).click();
  // Re-running this journey against already-seeded state can find the
  // conflict visit already pending supervision from a prior pass — the
  // planner-side duplicate block (M02-012, see P2) is then expected, not a
  // failure; either way the pending request already exists for supervisor2.
  await Promise.race([
    plannerPage.waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 20_000 }),
    expect(plannerPage.locator(".alert-critical").first()).toContainText(/active visit already exists/i, { timeout: 20_000 }),
  ]);
  await plannerPage.context().close();

  const supPage = await login(browser, "supervisor2@mim.gov.sa", "/planning/supervision");
  const row = supPage.getByRole("region", { name: /Supervision request/i }).filter({ hasText: CONFLICT_FACTORY });
  const finalInspector = row.getByLabel(/Final Inspector/i);
  await finalInspector.selectOption({ value: "a4000000-0000-4000-8000-000000000002" }); // inspector2
  await row.getByRole("button", { name: /Approve & release/i }).click();
  await expect(row.getByRole("alert")).toContainText(/already booked in this window/i, { timeout: 15_000 });
  await capture(supPage, "conflict-inspector-unavailable");
  await supPage.context().close();
});

test("P5 downstream visibility — published visit shows in Planning list and Visit management", async () => {
  const page = await login(browser, "planner2@mim.gov.sa", "/planning");
  await page.goto("/planning?tab=published");
  await expect(page.getByTestId("planning-visit-table")).toContainText(HAPPY_FACTORY, { timeout: 15_000 });
  await capture(page, "downstream-planning-list-published");
  await page.goto("/visits");
  await expect(page.locator("body")).toContainText(HAPPY_FACTORY, { timeout: 15_000 });
  await capture(page, "downstream-visit-management");
  await page.context().close();
});
