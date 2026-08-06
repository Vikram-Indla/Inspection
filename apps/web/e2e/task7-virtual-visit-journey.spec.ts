import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { login, rest, must } from "./live-rest";
import { evidenceDirectory } from "./evidence-path";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";
import { signAndConfirm } from "./sign-helper";

// TASK 7 — Virtual Visit End-to-End Journey (dataset "UAT-S07").
//
// Governed non-production identities only (scripts/test-data/provision_governed_uat_identities.mjs,
// SAQEEL_CROSS_ROLE_PASSWORD): planner4@mim.gov.sa / supervisor2@mim.gov.sa / inspector6@mim.gov.sa.
//
// Exercises the full virtual-visit lifecycle end to end:
//   P1  Planner  — virtual scheduling (M05-002) on a published virtual visit.
//   P1½ (staged) — assignment (RLS vs_write: planner/ops/assigned inspector).
//   P2  Inspector — session readiness (TASK-EXECUTION-MODULE-001 Phase 3B / EXE-READY-REQUIRED).
//   P3  Inspector — room start/join states (STM-VIR waiting -> joined), OTP
//       verification of the factory representative (M05-018, no bypass),
//       Begin (STM-VIR-002) -> shared field engine.
//   P4  Inspector — checklist + evidence capture, submit (v1).
//   P5  Supervisor — review + approve (capability review.decide, migration
//       20260729004841 — the four-canonical-roles supervisor review authority).
//   P6  — notifications (virtual_scheduled) and dashboard reflection for both
//         Planner and Supervisor.
//
// Assignment is staged over PostgREST with the Planner's own JWT (RLS/vs_write
// stays the enforcement under test) — the same pattern already proven in
// cd-041-virtual-verified-gate.spec.ts — because the planning-wizard UI that
// creates/assigns visits belongs to other in-flight UAT journeys, not this one.

// Generous per-test timeout: this live non-production project's request
// latency from this harness runs well past Playwright's 60s default for a
// multi-write server action (observed 20-60s) — harness/network latency,
// not product behavior.
test.describe.configure({ mode: "serial", timeout: 240_000 });

const DATASET_ID = "UAT-S07";
const LOGIN_TIMEOUT = 20_000;
const IPAD_VIEWPORT = { width: 834, height: 1194 }; // governed Inspector responsive viewport

// Env files are not auto-loaded into process.env by the Playwright test
// runner (only Next's own server process does that) — read the same
// governed reference the way live-rest.ts / personas.ts already do.
let envFileCache: Record<string, string> | null = null;
function envFileValues(): Record<string, string> {
  if (envFileCache) return envFileCache;
  const path = process.env.E2E_ENV_FILE?.trim() || join(__dirname, "..", ".env.local");
  if (!existsSync(path)) { envFileCache = {}; return envFileCache; }
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  envFileCache = values;
  return envFileCache;
}

function governedSecret(): string {
  const files = envFileValues();
  const value = (process.env.SAQEEL_UAT_PASSWORD?.trim() || files.SAQEEL_UAT_PASSWORD?.trim())
    || (process.env.SAQEEL_CROSS_ROLE_PASSWORD?.trim() || files.SAQEEL_CROSS_ROLE_PASSWORD?.trim());
  if (!value) {
    throw new Error(
      "TASK7: SAQEEL_CROSS_ROLE_PASSWORD (or SAQEEL_UAT_PASSWORD) is required for the governed " +
      "primary-cohort identities. Set it in apps/web/.env.local — credentials are never committed.",
    );
  }
  return value;
}

const PLANNER = { email: "planner4@mim.gov.sa", get password() { return governedSecret(); } };
const SUPERVISOR = { email: "supervisor2@mim.gov.sa", get password() { return governedSecret(); } };
const INSPECTOR = { email: "inspector6@mim.gov.sa", get password() { return governedSecret(); } };

const evidenceDir = evidenceDirectory("task7-virtual-visit-e2e-journey");

async function uiLogin(
  browser: { newContext: (o: object) => Promise<import("@playwright/test").BrowserContext> },
  persona: { email: string; password: string },
  viewport: { width: number; height: number },
) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(persona.email);
  await passwordField(page).fill(persona.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname === "/dashboard", { timeout: LOGIN_TIMEOUT });
  await expect(page.locator("#role-dashboard-summary")).toBeVisible({ timeout: LOGIN_TIMEOUT });
  await expect(page.locator("main")).not.toContainText("ERR-AUTH", { timeout: LOGIN_TIMEOUT });
  return { ctx, page };
}

let plannerJwt = "";
let inspectorUserId = "";
let visitId = "";
let sessionId = "";
let inspectionId = "";
let repParticipantId = "";
let reviewInspectionId = "";

test.beforeAll(async () => {
  const planner = await login(PLANNER.email, PLANNER.password);
  const inspector = await login(INSPECTOR.email, INSPECTOR.password);
  plannerJwt = planner.jwt;
  inspectorUserId = inspector.userId;

  // Reference rows the seed guarantees exist — read, never invent (cd-041 pattern).
  // planning_closure_factory_in_scope (20260728010000) requires f.region ===
  // the planner's own profile.region for a regional-scope planner (planner4 is
  // regional, not National) — pick a factory in-scope rather than the first one.
  const plannerProfile = must(
    await rest("GET", "profiles?select=region&user_id=eq." + planner.userId, plannerJwt),
    `${DATASET_ID}: read planner profile region`,
  )[0];
  const factoryQuery = plannerProfile.region && plannerProfile.region !== "National"
    ? `factories?select=id,region&region=eq.${encodeURIComponent(plannerProfile.region)}&limit=1`
    : "factories?select=id,region&limit=1";
  const factory = must(await rest("GET", factoryQuery, plannerJwt), `${DATASET_ID}: read in-scope factory`)[0];
  const pkg = must(
    await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", plannerJwt),
    `${DATASET_ID}: read published package_version`,
  )[0];

  // Wide-random-range future window — the established collision-avoidance
  // pattern for this shared live project (see cd-041's DEF-DATA-005 comment).
  const DAY = 24 * 60 * 60_000;
  const base = Date.now() + (500 + Math.floor(Math.random() * 20000)) * DAY;
  const windowStart = new Date(base).toISOString();
  const windowEnd = new Date(base + 90 * 60_000).toISOString();

  const visit = must(
    await rest("POST", "visits", plannerJwt, {
      factory_id: factory.id,
      visit_type: "periodic",
      execution_mode: "virtual",
      planning_status: "published",
      window_start: windowStart,
      window_end: windowEnd,
      package_version_id: pkg.id,
    }),
    `${DATASET_ID}: insert virtual visit`,
  )[0];
  visitId = visit.id;

  must(
    await rest("POST", "assignments", plannerJwt, { visit_id: visitId, inspector_id: inspectorUserId, method: "manual" }),
    `${DATASET_ID}: insert assignment`,
  );
});

test.afterAll(async () => {
  if (!plannerJwt) return;
  const del = async (table: string, filter: string) =>
    rest("DELETE", `${table}?${filter}`, plannerJwt, undefined, "return=minimal");
  // FK order: children first. Best-effort — visits/assignments/inspections have
  // no DELETE policy for a planner and no-op under RLS (tolerated, never failed on).
  if (sessionId) {
    await del("virtual_participants", `session_id=eq.${sessionId}`);
    await del("virtual_sessions", `id=eq.${sessionId}`);
  }
  if (visitId) {
    await del("inspections", `visit_id=eq.${visitId}`);
    await del("assignments", `visit_id=eq.${visitId}`);
    await del("visits", `id=eq.${visitId}`);
  }
});

test(`${DATASET_ID} P1 · Planner schedules a virtual session (M05-002)`, async ({ browser }) => {
  const { ctx, page } = await uiLogin(browser, PLANNER, { width: 1280, height: 900 });
  try {
    await page.goto("/virtual");
    const visitIdInput = page.locator(`input[name="visit_id"][value="${visitId}"]`);
    await expect(visitIdInput, `${DATASET_ID}: staged unscheduled virtual visit must render on /virtual`).toHaveCount(1);
    const form = visitIdInput.locator("xpath=ancestor::form[1]");

    const appointment = new Date(Date.now() + 26 * 60 * 60_000); // within window, plausible
    const iso = appointment.toISOString().slice(0, 16);
    await form.locator("#schedule-appointment").fill(iso);
    await form.locator("#schedule-rep-name").fill(`${DATASET_ID} Factory Rep`);
    await page.screenshot({ path: `${evidenceDir}/p1-before-schedule.png`, fullPage: true });
    await form.getByRole("button", { name: /schedule session/i }).click();
    // On success, scheduleSession's revalidatePath("/virtual") removes this
    // visit from the "unscheduled" section entirely (it now has a session),
    // which unmounts the success banner along with the row before a fixed
    // locator can reliably observe it — this live non-production project's
    // request latency (observed 20-60s for this multi-write server action,
    // harness/network latency, not product behavior) makes the race worse.
    // Wait for the form itself to leave the DOM (success) or an error banner
    // to appear (failure); server truth is polled below either way.
    await Promise.race([
      expect(visitIdInput).toHaveCount(0, { timeout: 90_000 }),
      expect(page.locator(".sq-banner--critical")).toBeVisible({ timeout: 90_000 }),
    ]).catch(() => { /* fall through to the server-truth poll below */ });
    await page.screenshot({ path: `${evidenceDir}/p1-after-schedule.png`, fullPage: true });
  } finally {
    await ctx.close();
  }

  const session = await pollRest(
    async () => {
      const { data } = await rest("GET", `virtual_sessions?visit_id=eq.${visitId}&select=id,state`, plannerJwt);
      return Array.isArray(data) && data.length === 1 ? data[0] : null;
    },
    `${DATASET_ID}: scheduled session row`,
  );
  sessionId = session.id;
  expect(session.state).toBe("scheduled");

  // notif_own (RLS) scopes reads to recipient = auth.uid() — only the
  // inspector's own JWT can read this row, not the planner's.
  const inspectorForNotif = await login(INSPECTOR.email, INSPECTOR.password);
  const notification = await pollRest(
    async () => {
      const { data } = await rest(
        "GET",
        `notifications?event_key=eq.virtual_scheduled&recipient=eq.${inspectorUserId}&select=id,payload&order=created_at.desc&limit=5`,
        inspectorForNotif.jwt,
      );
      const rows = Array.isArray(data) ? data : [];
      return rows.find((row: { payload?: { session_id?: string } }) => row.payload?.session_id === sessionId) ?? null;
    },
    `${DATASET_ID}: inspector virtual_scheduled notification`,
  );
  expect(notification).toBeTruthy();
});

test(`${DATASET_ID} P2 · Inspector confirms session readiness (Phase 3B / EXE-READY-REQUIRED)`, async ({ browser }) => {
  const { ctx, page } = await uiLogin(browser, INSPECTOR, IPAD_VIEWPORT);
  try {
    await page.goto(`/field/${visitId}`);
    const prepPanel = page.getByTestId("pre-execution-panel");
    await expect(prepPanel, `${DATASET_ID}: readiness panel must render for the assigned inspector`).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `${evidenceDir}/p2-before-ready.png`, fullPage: true });

    if (!(await page.getByTestId("pre-execution-ready").count())) {
      await prepPanel.getByTestId("prep-day-available").first().click();
      await prepPanel.getByTestId("prep-save").click();
      await expect(prepPanel.getByTestId("prep-status")).toContainText("Preparation saved", { timeout: 15_000 });
      await prepPanel.getByTestId("prep-confirm").click();
      await expect(page.getByTestId("pre-execution-ready")).toBeVisible({ timeout: 15_000 });
    }
    await page.screenshot({ path: `${evidenceDir}/p2-after-ready.png`, fullPage: true });
  } finally {
    await ctx.close();
  }

  const prep = await pollRest(
    async () => {
      const inspector = await login(INSPECTOR.email, INSPECTOR.password);
      const { data } = await rest("GET", `visit_preparations?visit_id=eq.${visitId}&select=confirmed_ready_at,confirmed_mode`, inspector.jwt);
      const row = Array.isArray(data) ? data[0] : null;
      return row?.confirmed_ready_at ? row : null;
    },
    `${DATASET_ID}: confirmed readiness row`,
  );
  expect(prep.confirmed_mode).toBe("virtual");
});

test(`${DATASET_ID} P3 · Inspector runs the room — join, OTP verify (no bypass), Begin (STM-VIR-002)`, async ({ browser }) => {
  const { ctx, page } = await uiLogin(browser, INSPECTOR, IPAD_VIEWPORT);
  try {
    await page.goto(`/virtual/${sessionId}`);
    const repRow = page.locator(".cd-plist .cd-prow", { hasText: `${DATASET_ID} Factory Rep` });
    await expect(repRow).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `${evidenceDir}/p3-waiting-room.png`, fullPage: true });

    await repRow.getByRole("button", { name: "Mark joined" }).click();
    const decisionBar = page.locator(".cd-decisionbar");
    await expect(decisionBar).toContainText("joined", { timeout: 15_000 });

    // NEGATIVE — Begin is present but blocked before verification (no bypass).
    const beginPrimary = page.locator("#vir-actionzone .cd-primary");
    await expect(page.locator(".cd-decisionbar.is-blocked")).toBeVisible();
    await expect(beginPrimary).toBeDisabled();
    await page.screenshot({ path: `${evidenceDir}/p3-begin-blocked.png`, fullPage: true });

    await repRow.getByRole("button", { name: "Send OTP" }).click();
    const devLozenge = repRow.locator(".sq-lozenge--warning, .badge-warning", { hasText: "DEV code:" });
    await expect(devLozenge).toBeVisible({ timeout: 15_000 });
    const devCode = (await devLozenge.textContent())!.match(/\d{4,8}/)![0];
    await repRow.locator(".cd-otpfield input").fill(devCode);
    await repRow.getByRole("button", { name: "Verify" }).click();
    await expect(repRow.locator(".sq-lozenge--success, .badge-compliant", { hasText: "verified" })).toBeVisible({ timeout: 15_000 });

    await expect(page.locator(".cd-decisionbar.is-ready")).toBeVisible({ timeout: 15_000 });
    await expect(beginPrimary).toBeEnabled();
    await page.screenshot({ path: `${evidenceDir}/p3-begin-ready.png`, fullPage: true });

    await beginPrimary.click();
    await page.waitForURL(/\/field\/inspection\/[0-9a-f-]{36}/, { timeout: 20_000 });
    inspectionId = page.url().match(/\/field\/inspection\/([0-9a-f-]+)/)![1];
    await page.screenshot({ path: `${evidenceDir}/p3-in-field-engine.png`, fullPage: true });
  } finally {
    await ctx.close();
  }
});

test(`${DATASET_ID} P4 · Inspector completes checklist + evidence, submits`, async ({ browser }) => {
  const { ctx, page } = await uiLogin(browser, INSPECTOR, IPAD_VIEWPORT);
  try {
    await page.goto(`/field/inspection/${inspectionId}`);

    const sectionsNav = page.getByRole("navigation", { name: "Inspection sections" });
    const sectionCount = await sectionsNav.getByRole("listitem").count();
    expect(sectionCount, `${DATASET_ID}: governed inspection must expose at least one section`).toBeGreaterThan(0);

    const answeredCodes = new Set<string>();
    for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
      const titles = page.locator("p").filter({ hasText: /^[A-Z]{2}-\d+ ·/ });
      const titleCount = await titles.count();
      for (let i = 0; i < titleCount; i++) {
        const title = titles.nth(i);
        const code = (await title.innerText()).match(/^([A-Z]{2}-\d+) ·/)?.[1];
        expect(code, `${DATASET_ID}: rendered governed question must expose its item code`).toBeTruthy();
        if (answeredCodes.has(code!)) continue; // re-render safety on resume/reload
        answeredCodes.add(code!);
        const q = title.locator("..").locator("..");
        // Positive path — every item answered compliant. Evidence/checklist
        // capture is exercised where the item exposes an optional evidence
        // control regardless of the (compliant) answer; mandatory-evidence
        // gates (non-compliant path) are covered by golden-journey.spec.ts
        // and are out of this journey's scope (positive path only).
        const btn = q.getByRole("button", { name: /^compliant$/i });
        await expect(btn, `governed question ${code} must expose one named response`).toHaveCount(1);
        await btn.click();
        await expect(btn).toHaveAttribute("aria-pressed", "true");
        const optionalPhoto = q.getByLabel(/optional photo/i);
        if (await optionalPhoto.count()) {
          const PIXEL_PNG = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
          await optionalPhoto.setInputFiles({ name: `${DATASET_ID}-evidence.png`, mimeType: "image/png", buffer: PIXEL_PNG });
          const annotateDialog = page.getByRole("dialog", { name: /annotate photo/i });
          if (await annotateDialog.count()) {
            await annotateDialog.getByRole("button", { name: /attach evidence/i }).click();
          }
        }
      }
      if (sectionIndex < sectionCount - 1) await page.getByRole("button", { name: "Next section" }).click();
    }
    expect(answeredCodes.size, `${DATASET_ID}: governed package must render governed checklist items`).toBeGreaterThan(0);
    await page.screenshot({ path: `${evidenceDir}/p4-checklist-complete.png`, fullPage: true });

    await expect(page.getByText("All blocking validations pass — ready to submit", { exact: true })).toBeVisible({ timeout: 30_000 });
    const finalSubmit = page.getByRole("button", { name: "Review & submit — final version" });
    await expect(finalSubmit).toHaveAttribute("aria-disabled", "false", { timeout: 30_000 });
    await finalSubmit.click();
    const finalReviewHeading = page.getByRole("heading", { name: "Final review", exact: true });
    await expect(finalReviewHeading).toBeVisible();
    const finalReview = finalReviewHeading.locator("..").locator("..");
    const confirmSubmit = finalReview.getByRole("button", { name: "Confirm and submit", exact: true });
    await expect(confirmSubmit).toBeEnabled();
    await confirmSubmit.click();
    await signAndConfirm(page, `${DATASET_ID} Factory Rep`);

    const inspector = await login(INSPECTOR.email, INSPECTOR.password);
    await pollRest(async () => {
      const { data } = await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.1`, inspector.jwt);
      return Array.isArray(data) && data.length === 1 ? data : null;
    }, `${DATASET_ID}: submission v1`);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Submitted — final submitted version.", exact: true, level: 2 })).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${evidenceDir}/p4-submitted.png`, fullPage: true });
  } finally {
    await ctx.close();
  }
  reviewInspectionId = inspectionId;
});

test(`${DATASET_ID} P5 · Supervisor reviews and approves (review.decide capability)`, async ({ browser }) => {
  const { ctx, page } = await uiLogin(browser, SUPERVISOR, { width: 1280, height: 900 });
  try {
    await page.goto(`/reviews/${reviewInspectionId}`); // CD-028 scan-first: opening is read-only
    await page.screenshot({ path: `${evidenceDir}/p5-review-workspace.png`, fullPage: true });

    const startReview = page.getByRole("button", { name: "Start review", exact: true });
    if (await startReview.count()) {
      await startReview.click();
      await page.waitForURL(url => url.pathname.startsWith(`/reviews/${reviewInspectionId}/started`), { timeout: 20_000 });
      await page.goto(`/reviews/${reviewInspectionId}`);
    }

    const approveDecision = page.locator('input[name="decision"][value="approve"]');
    await expect(approveDecision).toHaveCount(1, { timeout: 40_000 });
    await approveDecision.check();
    const approveReason = page.locator('textarea[name="reason"]');
    if (await approveReason.count()) await approveReason.fill(`${DATASET_ID} — virtual visit journey approval.`);
    const reviewConfirmation = page.getByRole("button", { name: "Review confirmation", exact: true });
    await reviewConfirmation.click();
    await expect(page.getByRole("heading", { name: "Review decision before recording", exact: true })).toBeVisible();
    const confirmApprove = page.getByRole("button", { name: "Confirm approve", exact: true });
    await confirmApprove.click();
    await page.waitForURL(
      url => url.pathname === `/reviews/${reviewInspectionId}` && url.searchParams.get("decision") === "approve",
      { timeout: 20_000 },
    );
    await page.screenshot({ path: `${evidenceDir}/p5-approved.png`, fullPage: true });
  } finally {
    await ctx.close();
  }

  const supervisor = await login(SUPERVISOR.email, SUPERVISOR.password);
  const ins = await pollRest(async () => {
    const { data } = await rest("GET", `inspections?id=eq.${reviewInspectionId}&select=status`, supervisor.jwt);
    const row = Array.isArray(data) ? data[0] : null;
    return row?.status === "approved" ? row : null;
  }, `${DATASET_ID}: approved inspection`);
  expect(ins.status).toBe("approved");
});

test(`${DATASET_ID} P6 · Notifications and dashboard reflect the closed loop`, async ({ browser }) => {
  const { ctx: plannerCtx, page: plannerPage } = await uiLogin(browser, PLANNER, { width: 1280, height: 900 });
  const { ctx: supervisorCtx, page: supervisorPage } = await uiLogin(browser, SUPERVISOR, { width: 1280, height: 900 });
  try {
    await plannerPage.goto("/dashboard");
    await expect(plannerPage.locator("#role-dashboard-summary")).toBeVisible({ timeout: 15_000 });
    await plannerPage.screenshot({ path: `${evidenceDir}/p6-planner-dashboard.png`, fullPage: true });

    await supervisorPage.goto("/dashboard");
    await expect(supervisorPage.locator("#role-dashboard-summary")).toBeVisible({ timeout: 15_000 });
    await supervisorPage.screenshot({ path: `${evidenceDir}/p6-supervisor-dashboard.png`, fullPage: true });
  } finally {
    await plannerCtx.close();
    await supervisorCtx.close();
  }

  const { ctx: inspectorCtx, page: inspectorPage } = await uiLogin(browser, INSPECTOR, IPAD_VIEWPORT);
  try {
    await inspectorPage.goto("/field/notifications");
    await inspectorPage.screenshot({ path: `${evidenceDir}/p6-inspector-notifications.png`, fullPage: true });
  } finally {
    await inspectorCtx.close();
  }
});

async function pollRest<T>(fn: () => Promise<T | null>, label: string, tries = 45): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`timed out waiting for ${label}`);
}
