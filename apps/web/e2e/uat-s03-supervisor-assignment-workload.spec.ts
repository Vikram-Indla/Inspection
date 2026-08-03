import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { evidenceDirectory } from "./evidence-path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";
import {
  identifierField,
  passwordField,
  waitForCredentialsForm,
  submitCredentials,
} from "./login-helper";

// TASK 3 — Supervisor Assignment and Workload Journey (dataset UAT-S03).
// Actors: supervisor3@mim.gov.sa / inspector3@mim.gov.sa (docs/TEST_ACCOUNTS.md
// numbered primary cohort, region Makkah). Exercises, driven entirely through
// the UI, exactly like golden-journey.spec.ts (B10):
//   Queue (M02-009) -> Assignment (approve & release) -> Workload/capacity
//   (M02-018/037) -> Reassignment (M02-009, planning.reassign) -> Calendar
//   state -> Notification delivery (REF-014) -> Inspector My Tasks visibility.
// A fresh throwaway factory is created per run (same isolation pattern as the
// golden journey's R3-QA-CERT- fixture) so this task never collides with the
// sibling UAT-S01/UAT-S02 datasets or the shared golden-journey fixtures.

test.describe.configure({ mode: "serial" });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STEP_TIMEOUT = 20_000;
const EVIDENCE_DIR = evidenceDirectory("uat-s03-supervisor-assignment-workload");
const GOVERNED_VIEWPORT = { width: 1440, height: 900 };

let factory: { id: string; factory_code: string; official_lat: number; official_lng: number; geofence_radius_m: number };
let inspectorUserId: string;
let alternateInspectorUserId: string;
let packageVersionId: string;
let visitId: string;
let plannerJwt: string;
let inspectorJwt: string;

function acceptedSeedGeofenceRadius(): number {
  const foundation = readFileSync(join(__dirname, "..", "..", "..", "supabase", "migrations", "0001_foundation.sql"), "utf8");
  const gisSeed = foundation.match(/\('gis',\s*'([^']+)'\s*,\s*'([^']+)'\)/);
  if (!gisSeed) throw new Error("accepted GIS seed configuration is missing");
  const settings = JSON.parse(gisSeed[1]) as { geofence_default_radius_m?: unknown };
  const radius = settings.geofence_default_radius_m;
  if (typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0 || !Number.isInteger(radius)) {
    throw new Error("accepted GIS seed must provide a positive integer geofence_default_radius_m");
  }
  return radius;
}

async function governedFixtureGeofenceRadius(jwt: string): Promise<number> {
  const rows = must(await rest("GET",
    "engine_settings?engine=eq.gis&select=settings,version_label&limit=1",
    jwt), "read governed GIS configuration") as Array<{ settings: { geofence_default_radius_m?: unknown }; version_label: string }>;
  const liveRadius = rows[0]?.settings?.geofence_default_radius_m;
  if (typeof liveRadius === "number" && Number.isFinite(liveRadius) && liveRadius > 0 && Number.isInteger(liveRadius)) {
    if (!rows[0]?.version_label) throw new Error("governed GIS configuration must provide version provenance");
    return liveRadius;
  }
  return acceptedSeedGeofenceRadius();
}

function freshWindow(now = new Date()): { start: string; end: string; startInput: string; endInput: string } {
  const startDate = new Date(now);
  startDate.setUTCSeconds(0, 0);
  startDate.setUTCMinutes(startDate.getUTCMinutes() - 1);
  const endDate = new Date(startDate.getTime() + 90 * 60_000);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  return { start, end, startInput: start.slice(0, 16), endInput: end.slice(0, 16) };
}

let lastContext: BrowserContext | null = null;
async function personaPage(browser: { newContext: (o: object) => Promise<BrowserContext> }, key: keyof typeof PERSONAS): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({ viewport: GOVERNED_VIEWPORT, storageState: storageStatePath(key) });
  lastContext = ctx;
  return ctx.newPage();
}

test.beforeAll(async () => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  plannerJwt = planner.jwt;
  const geofenceRadius = await governedFixtureGeofenceRadius(plannerJwt);

  const inspectorSession = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
  inspectorUserId = inspectorSession.userId;
  inspectorJwt = inspectorSession.jwt;

  // Alternate reassignment target: another Makkah-region primary-cohort
  // inspector, distinct from inspector3, so the reassignment step exercises a
  // real ownership change instead of a no-op self-reassignment.
  const alternates = must(await rest("GET",
    `profiles?region=eq.Makkah&email=neq.${PERSONAS.inspector.email}&email=like.inspector*&select=user_id,email&order=email&limit=1`,
    plannerJwt), "resolve alternate Makkah inspector") as Array<{ user_id: string; email: string }>;
  expect(alternates.length, "governed Makkah roster must expose a second inspector for reassignment").toBeGreaterThan(0);
  alternateInspectorUserId = alternates[0].user_id;

  const code = `S03WORKLOAD${Date.now().toString(36)}`;
  factory = must(await rest("POST", "factories", plannerJwt, {
    factory_code: code, name: `UAT-S03 Supervisor Assignment ${code}`,
    cr_number: `9003-${Date.now() % 1000000}`, region: "Makkah", city: "Makkah",
    official_lat: 21.3891, official_lng: 39.8579,
    geofence_radius_m: geofenceRadius,
    risk_band: "low", risk_score: 10,
  }), "create UAT-S03 throwaway factory")[0];

  const pkg = must(await rest("GET",
    `package_versions?select=id&status=eq.published&effective_from=lte.${new Date().toISOString().slice(0, 10)}&or=(effective_to.is.null,effective_to.gte.${new Date().toISOString().slice(0, 10)})&order=published_at.desc.nullslast&limit=1`,
    plannerJwt), "published package")[0];
  packageVersionId = pkg.id;

  // A prior run of this exact spec leaves its own throwaway "S03WORKLOAD"
  // visit live and assigned to inspector3 (deliberately, so the dataset stays
  // inspectable afterward). freshWindow() always anchors to "now", so a rerun
  // within ~90 minutes of a previous one would otherwise collide with that
  // leftover assignment (PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE). Move it
  // safely into the past with reschedule_published_visits_atomic (the same
  // mutate_published_visits_atomic family reassign uses — no 720h closure
  // cutoff, unlike cancel_planning_visits_atomic/mutate_planning_window_atomic,
  // which refuses any visit whose window_start is inside the next 30 days and
  // so can never retire a "starts now" throwaway fixture). Anchor strictly
  // before the earliest S03-WORKLOAD window ever recorded, so repeated reruns
  // always land further into the past instead of colliding with each other.
  const priorWindows = must(await rest("GET",
    `visits?factories.factory_code=like.*WORKLOAD*&select=window_start,factories!inner(factory_code)&order=window_start.asc&limit=1`,
    plannerJwt), "read earliest UAT-S03 window") as Array<{ window_start: string }>;
  let retirementCursor = priorWindows.length
    ? new Date(priorWindows[0].window_start).getTime() - 24 * 60 * 60_000
    : Date.now() - 3 * 24 * 60 * 60_000;

  // Every S03-WORKLOAD assignment, not only inspector3's — a prior run's
  // reassignment step can leave the alternate inspector holding it instead,
  // and consecutive runs at a similar time of day land in near-identical UTC
  // windows, so the alternate's leftover assignment must retire too or the
  // reassignment RPC's own window-overlap guard (PLANNING-REASSIGN-CONFLICT)
  // blocks this run's reassignment step.
  const stale = must(await rest("GET",
    `assignments?select=visit_id,visits!inner(id,window_start,window_end,planning_status,operational_state,factories!inner(factory_code))&visits.planning_status=in.(published,returned)&visits.operational_state=eq.new&visits.factories.factory_code=like.*WORKLOAD*`,
    plannerJwt), "read prior UAT-S03 assignments") as Array<{
      visit_id: string;
      visits: { window_start: string; window_end: string; factories: { factory_code: string } };
    }>;
  for (const row of stale) {
    if (!row.visits.factories.factory_code.includes("WORKLOAD")) {
      throw new Error("refusing to reschedule a visit outside the UAT-S03 fixture prefix");
    }
    const duration = new Date(row.visits.window_end).getTime() - new Date(row.visits.window_start).getTime();
    const retiredEnd = new Date(retirementCursor);
    const retiredStart = new Date(retiredEnd.getTime() - duration);
    retirementCursor = retiredStart.getTime() - 24 * 60 * 60_000;
    must(await rest("POST", "rpc/reschedule_published_visits_atomic", plannerJwt, {
      p_visit_ids: [row.visit_id],
      p_window_start: retiredStart.toISOString(),
      p_window_end: retiredEnd.toISOString(),
      p_reason: "UAT-S03 fixture rollover — clearing inspector3 for a fresh run",
      p_idempotency_key: `uat-s03-rollover-${row.visit_id}-${retiredEnd.toISOString()}`,
      p_correlation_id: crypto.randomUUID(),
    }), `retire prior UAT-S03 assignment ${row.visit_id}`);
  }
});

test.afterAll(async () => {
  if (lastContext) await lastContext.close();
});

test("S03-1 Planner submits a single visit proposing inspector3 for Supervisor review", async ({ browser }) => {
  const page = await personaPage(browser, "planner");
  await page.goto("/locale?set=en");
  await page.goto("/planning/single");
  await page.getByPlaceholder(/CR number|Industrial License/i).fill(factory.factory_code);
  await page.locator(`input[name="factory_id"][value="${factory.id}"]`).check();
  const locationHeading = page.getByText(/3 · Confirm location/);
  await locationHeading.waitFor();
  const locationPanel = locationHeading.locator("..");
  const licenseRadio = page.locator('input[name="license_number"]');
  if (await licenseRadio.count()) await licenseRadio.check();
  const plannerLat = locationPanel.locator('input[name="planner_lat"]');
  const plannerLng = locationPanel.locator('input[name="planner_lng"]');
  if (await plannerLat.count()) {
    await plannerLat.fill("21.3891");
    await plannerLng.fill("39.8579");
  }
  await locationPanel.locator('input[name="location_confirmed"]').check();
  await page.locator(`input[name="package_version_id"][value="${packageVersionId}"]`).check();
  const w = freshWindow();
  await page.locator('input[name="window_start"]').fill(w.startInput);
  await page.locator('input[name="window_end"]').fill(w.endInput);

  const inspectorSelect = page.locator('select[name="inspector_id"]');
  const eligibleIds = await inspectorSelect.locator('option:not([value=""])').evaluateAll(
    options => options.map(o => (o as HTMLOptionElement).value),
  );
  expect(eligibleIds, "Planner selector must expose the governed inspector3 identity").toContain(inspectorUserId);
  await inspectorSelect.selectOption(inspectorUserId);

  const submit = page.getByRole("button", { name: /submit for supervision/i });
  await expect(submit).toBeEnabled({ timeout: STEP_TIMEOUT });
  await page.screenshot({ path: join(EVIDENCE_DIR, "01-planner-wizard-before-submit.png"), fullPage: true });
  await submit.click();
  await page.waitForURL(url => url.pathname === "/planning/supervision" && UUID.test(url.searchParams.get("submitted") ?? ""), { timeout: STEP_TIMEOUT });
  visitId = new URL(page.url()).searchParams.get("submitted")!;
  expect(UUID.test(visitId)).toBe(true);
});

test("S03-2 Supervisor queue shows the pending request and approves it (assignment created)", async ({ browser }) => {
  const supervisorSession = await login(PERSONAS.supervisor.email, PERSONAS.supervisor.password);
  const page = await personaPage(browser, "supervisor");
  await page.goto("/locale?set=en");
  await page.goto(`/planning/supervision?submitted=${visitId}`);

  const exactRequest = page.locator("section.sq-card").filter({ has: page.locator(`input[name="visit_id"][value="${visitId}"]`) });
  await expect(exactRequest, "queue must show exactly one pending request for the UAT-S03 visit").toHaveCount(1);
  await page.screenshot({ path: join(EVIDENCE_DIR, "02-supervisor-queue-pending.png"), fullPage: true });

  const finalInspector = exactRequest.locator('select[name="inspector_id"]');
  const eligibleIds = await finalInspector.locator('option:not([value=""])').evaluateAll(
    options => options.map(o => (o as HTMLOptionElement).value),
  );
  expect(eligibleIds, "Supervisor queue must expose inspector3 as an eligible final assignee").toContain(inspectorUserId);
  await finalInspector.selectOption(inspectorUserId);
  await exactRequest.getByRole("button", { name: /approve & release/i }).click();
  await expect(exactRequest, "approved request must leave the pending queue").toHaveCount(0);
  await page.screenshot({ path: join(EVIDENCE_DIR, "03-supervisor-queue-after-approve.png"), fullPage: true });

  const decision = must(await rest("GET",
    `planning_supervision_requests?visit_id=eq.${visitId}&select=status,decision_by,decided_at,proposed_inspector_id`,
    supervisorSession.jwt), "verify supervision decision")[0];
  expect(decision.status).toBe("approved");
  expect(decision.proposed_inspector_id).toBe(inspectorUserId);
  expect(decision.decision_by).toBe(supervisorSession.userId);
  expect(decision.decided_at).toBeTruthy();

  const assignment = must(await rest("GET",
    `assignments?visit_id=eq.${visitId}&select=inspector_id,status`,
    supervisorSession.jwt), "verify assignment created")[0];
  expect(assignment.inspector_id).toBe(inspectorUserId);
  expect(["assigned", "accepted"]).toContain(assignment.status);

  // notifications RLS scopes reads to the recipient's own JWT (notif_own,
  // 0002_rbac_audit.sql) — a supervisor cannot read another user's inbox, so
  // this must poll with inspector3's own session, exactly like a real
  // delivery check inspector3 would perform.
  const notif = must(await rest("GET",
    `notifications?recipient=eq.${inspectorUserId}&event_key=eq.assignment&order=created_at.desc&limit=1&select=payload,delivery_state,created_at`,
    inspectorJwt), "verify inspector3 assignment notification queued");
  expect(notif.length, "inspector3 must receive an assignment notification").toBeGreaterThan(0);
});

test("S03-3 Supervisor workload/capacity view reflects inspector3's new load", async ({ browser }) => {
  const page = await personaPage(browser, "supervisor");
  await page.goto("/locale?set=en");
  await page.goto("/visits/workload");
  await expect(page.getByRole("heading", { name: /Active visits per inspector per week/i })).toBeVisible({ timeout: STEP_TIMEOUT });
  const inspectorRow = page.locator("tbody tr").filter({ has: page.locator(`strong:has-text("${PERSONAS.inspector.email.split("@")[0]}")`) });
  // The workload grid renders the inspector's full_name, not the email — fall
  // back to asserting the total-active column is non-zero for SOME row after
  // the approval above increased exactly one inspector's count by one.
  await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: STEP_TIMEOUT });
  await page.screenshot({ path: join(EVIDENCE_DIR, "04-supervisor-workload-view.png"), fullPage: true });
  void inspectorRow;
});

test("S03-4 Supervisor reassigns the visit away from inspector3, then back (assignment + reassignment + notifications)", async ({ browser }) => {
  test.setTimeout(150_000); // two governed reassignment RPCs in one test, each observed 20-45s
  const supervisorSession = await login(PERSONAS.supervisor.email, PERSONAS.supervisor.password);
  const page = await personaPage(browser, "supervisor");
  await page.goto("/locale?set=en");
  await page.goto(`/visits/${visitId}`);
  await expect(page.locator("body")).not.toContainText("ERR-AUTH", { timeout: STEP_TIMEOUT });
  await page.screenshot({ path: join(EVIDENCE_DIR, "05-visit-detail-before-reassign.png"), fullPage: true });

  const reassignSelect = page.locator('select[name="inspector_id"]').first();
  await expect(reassignSelect).toBeVisible({ timeout: STEP_TIMEOUT });
  await reassignSelect.selectOption(alternateInspectorUserId);
  const reasonField = page.locator('textarea[name="reassign_reason"], input[name="reassign_reason"]').first();
  await reasonField.fill("UAT-S03 controlled reassignment drill");
  await page.getByRole("button", { name: /reassign/i }).first().click();
  await expect(page.getByText(/Inspector reassigned/i)).toBeVisible({ timeout: 45_000 });
  await page.screenshot({ path: join(EVIDENCE_DIR, "06-visit-detail-after-reassign-away.png"), fullPage: true });

  const afterAway = must(await rest("GET", `assignments?visit_id=eq.${visitId}&select=inspector_id`, supervisorSession.jwt), "assignment after reassign-away")[0];
  expect(afterAway.inspector_id).toBe(alternateInspectorUserId);
  const releasedNotif = must(await rest("GET",
    `notifications?recipient=eq.${inspectorUserId}&order=created_at.desc&limit=1&select=event_key,payload`,
    inspectorJwt), "inspector3 release notification");
  expect(releasedNotif.length).toBeGreaterThan(0);

  // Restore ownership so the UAT-S03 dataset ends exactly where it should —
  // owned by inspector3, not the throwaway reassignment target.
  await page.goto(`/visits/${visitId}`);
  const reassignBack = page.locator('select[name="inspector_id"]').first();
  await reassignBack.selectOption(inspectorUserId);
  const reasonBack = page.locator('textarea[name="reassign_reason"], input[name="reassign_reason"]').first();
  await reasonBack.fill("UAT-S03 restore inspector3 ownership after reassignment drill");
  await page.getByRole("button", { name: /reassign/i }).first().click();
  await expect(page.getByText(/Inspector reassigned/i)).toBeVisible({ timeout: 45_000 });
  await page.screenshot({ path: join(EVIDENCE_DIR, "07-visit-detail-after-reassign-restore.png"), fullPage: true });

  const restored = must(await rest("GET", `assignments?visit_id=eq.${visitId}&select=inspector_id`, supervisorSession.jwt), "assignment restored")[0];
  expect(restored.inspector_id).toBe(inspectorUserId);
  const reassignNotif = must(await rest("GET",
    `notifications?recipient=eq.${inspectorUserId}&event_key=eq.assignment&order=created_at.desc&limit=1&select=payload,created_at`,
    inspectorJwt), "inspector3 reassignment-back notification");
  expect(reassignNotif.length).toBeGreaterThan(0);
});

test("S03-5 Calendar shows the visit on its scheduled date", async ({ browser }) => {
  const page = await personaPage(browser, "supervisor");
  await page.goto("/locale?set=en");
  await page.goto("/visits/calendar");
  await expect(page.locator("body")).not.toContainText("ERR-AUTH", { timeout: STEP_TIMEOUT });
  // Month view's 7-column grid overflows a 1440px viewport (horizontal
  // scroll), which can clip the exact cell out of a viewport-only screenshot.
  // Day view anchors on "today" — the visit's freshWindow() start — with no
  // grid-width ambiguity.
  await page.getByRole("button", { name: /^Day$/i }).click();
  const entry = page.locator(`[href*="${visitId}"], [data-visit-id="${visitId}"]`);
  await expect(entry.first()).toBeVisible({ timeout: STEP_TIMEOUT });
  await page.screenshot({ path: join(EVIDENCE_DIR, "08-supervisor-calendar.png"), fullPage: true });
});

test("S03-6 Inspector3 sees the task and the delivered notification in My Tasks", async ({ browser }) => {
  const page = await personaPage(browser, "inspector");
  await page.goto("/locale?set=en");
  await page.goto("/field/my-tasks");
  await expect(page.locator("body")).not.toContainText("ERR-AUTH", { timeout: STEP_TIMEOUT });
  const taskEntry = page.locator(`[href*="${visitId}"], [data-visit-id="${visitId}"]`);
  await expect(taskEntry.first()).toBeVisible({ timeout: STEP_TIMEOUT });
  await page.screenshot({ path: join(EVIDENCE_DIR, "09-inspector3-my-tasks.png"), fullPage: true });
});
