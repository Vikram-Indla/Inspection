import { test, expect, type Page } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { assertOk, login, must, rest } from "./live-rest";

// TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 +
// TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003
// AC-0125/0130/0137/0152..0156: production device and Mapbox ETA wiring,
// explicit offline-stale behavior, governed Inspector -> Operations approval,
// and fail-closed GPS negative paths. No simulated self-approval remains.
test.use({
  storageState: storageStatePath("inspector"),
  permissions: ["geolocation"],
  geolocation: { latitude: 24.735, longitude: 46.705, accuracy: 5 },
});

let inspectorJwt: string;
let inspectorUserId: string;
let plannerJwt: string;
let plannerUserId: string;
let factoryId: string;
let packageVersionId: string;
let governedVisitId: string;
let noGpsVisitId: string;
let weakGpsVisitId: string;
let factoryName: string;

async function releaseInspectorWindow(visitId: string) {
  assertOk(await rest("PATCH", `visits?id=eq.${visitId}`, plannerJwt, {
    planning_status: "cancelled",
  }, "return=minimal"), `release window for visit ${visitId}`);
}

async function poll<T>(read: () => Promise<T | null>, label: string, attempts = 20): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const value = await read();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function createVisit(
  planner: { jwt: string; userId: string },
  factoryId: string,
  packageVersionId: string,
  suffix: string,
  hoursBeforeNow: number,
) {
  const plan = must(await rest("POST", "visit_plans", planner.jwt, {
    method: "single", status: "draft", created_by: planner.userId,
  }), `create ${suffix} plan`)[0];
  const windowStart = Date.now() - hoursBeforeNow * 3_600_000;
  const visit = must(await rest("POST", "visits", planner.jwt, {
    visit_plan_id: plan.id,
    factory_id: factoryId,
    visit_type: "periodic",
    execution_mode: "physical",
    planning_status: "published",
    window_start: new Date(windowStart).toISOString(),
    window_end: new Date(windowStart + 12 * 3_600_000).toISOString(),
    package_version_id: packageVersionId,
  }), `create ${suffix} visit`)[0];
  assertOk(await rest("POST", "assignments", planner.jwt, {
    visit_id: visit.id, inspector_id: inspectorUserId, method: "manual",
  }, "return=minimal"), `assign ${suffix} visit`);
  return visit.id as string;
}

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
  inspectorJwt = inspector.jwt;
  inspectorUserId = inspector.userId;

  const code = `M04-E2E-${Date.now()}`;
  factoryName = `M04 Governed Integration ${code}`;
  const factory = must(await rest("POST", "factories", planner.jwt, {
    factory_code: code,
    name: factoryName,
    region: "Riyadh",
    city: "Riyadh",
    official_lat: 24.7136,
    official_lng: 46.6753,
    risk_band: "low",
    risk_score: 10,
  }), "create M04 factory")[0];
  const pkg = must(await rest("GET",
    "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1",
    planner.jwt), "published package")[0];

  plannerJwt = planner.jwt;
  plannerUserId = planner.userId;
  factoryId = factory.id;
  packageVersionId = pkg.id;

  // Stale fixtures from an interrupted run keep holding the inspector window
  // (CD-023 overlap guard); release every still-live window before staging.
  const lingering = must(await rest("GET",
    `visits?select=id,assignments!inner(inspector_id)&assignments.inspector_id=eq.${inspectorUserId}&planning_status=in.(draft,published,returned)&window_end=gt.${new Date(Date.now() - 86_400_000).toISOString()}`,
    plannerJwt), "list lingering inspector windows") as { id: string }[];
  for (const visit of lingering) await releaseInspectorWindow(visit.id);

  // The atomic start path (D-015, 20260721093000) only admits a journey while
  // now() sits inside [window_start, window_end], and the CD-023 overlap guard
  // refuses a second live assignment over the same inspector window — so each
  // test creates its own in-window fixture after the previous one releases the
  // window through a governed planning cancellation.
  governedVisitId = await createVisit(planner, factoryId, packageVersionId, "governed", 1);
});

const step = (page: Page, n: number) => page.getByRole("button", { name: new RegExp(`^${n} ·`) });

async function completeReadinessLeg(page: Page) {
  const prepPanel = page.getByTestId("pre-execution-panel");
  if ((await prepPanel.count()) && !(await page.getByTestId("pre-execution-ready").count())) {
    await prepPanel.getByTestId("prep-day-available").first().click();
    await prepPanel.getByTestId("prep-save").click();
    await expect(prepPanel.getByTestId("prep-status")).toContainText("Preparation saved", { timeout: 15_000 });
    await prepPanel.getByTestId("prep-confirm").click();
    await expect(page.getByTestId("pre-execution-ready")).toBeVisible({ timeout: 15_000 });
  }
}

test("production device/Mapbox ETA survives offline as stale and outside arrival requires independent Operations approval", async ({ page, context, browser }) => {
  test.setTimeout(240_000);
  const pageErrors: Error[] = [];
  page.on("pageerror", error => pageErrors.push(error));
  await page.goto(`/field/${governedVisitId}`);
  await completeReadinessLeg(page);
  await step(page, 1).click();
  await step(page, 2).click();

  const readiness = page.getByTestId("field-device-readiness");
  await expect(readiness).toContainText("Device information");
  await expect(readiness).toContainText("browser-reported");
  await expect(readiness).toContainText("app 0.1.0");

  const route = page.getByTestId("route-estimate");
  await expect(route).toContainText("mapbox_directions", { timeout: 30_000 });
  await expect(route).toContainText(/\d+ min · \d+ m/);

  const initialJourney = await poll(async () => {
    const { data } = await rest("GET",
      `journey_sessions?select=id,device_id,device_os_version,application_version,eta_minutes,remaining_distance_m,route_provider,routing_provider,route_estimate_mode,route_estimated_at&visit_id=eq.${governedVisitId}&order=started_at.desc&limit=1`,
      inspectorJwt);
    const row = Array.isArray(data) ? data[0] : null;
    return row?.eta_minutes != null ? row : null;
  }, "persisted production route estimate");
  expect(initialJourney.device_id).toMatch(/^field-/);
  expect(initialJourney.device_os_version).toContain("browser-reported");
  expect(initialJourney.application_version).toMatch(/^0\.1\.0/);
  expect(initialJourney.route_provider).toBe("mapbox_directions");
  expect(initialJourney.routing_provider).toBe("mapbox_directions");
  expect(initialJourney.route_estimate_mode).toBe("production");
  expect(initialJourney.eta_minutes).toBeGreaterThan(0);
  expect(initialJourney.remaining_distance_m).toBeGreaterThan(0);

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(route).toContainText("showing the last known route estimate as stale", { timeout: 10_000 });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(route).toContainText("mapbox_directions", { timeout: 30_000 });

  await step(page, 3).click();
  const requestPanel = page.getByRole("dialog", { name: /Outside the planned location/i });
  await expect(requestPanel).toBeVisible();
  await requestPanel.locator("select").selectOption("safety_security");
  await requestPanel.getByLabel("Explanation — mandatory").fill("Factory gate is reachable only from the captured safety access point");
  await requestPanel.getByRole("checkbox").check();
  await requestPanel.getByRole("button", { name: "Request Operations override" }).click();
  await expect(page.getByText(/Operations override pending/i)).toBeVisible({ timeout: 20_000 });
  await expect(step(page, 4)).toBeDisabled();

  const request = await poll(async () => {
    const { data } = await rest("GET",
      `geo_override_requests?select=id,status,requested_by,observed_lat,observed_lng,accuracy_m&visit_id=eq.${governedVisitId}&order=requested_at.desc&limit=1`,
      inspectorJwt);
    const row = Array.isArray(data) ? data[0] : null;
    return row?.status === "pending" ? row : null;
  }, "pending governed override");
  expect(request.requested_by).toBe(inspectorUserId);
  expect(Number(request.observed_lat)).toBeCloseTo(24.735, 5);
  expect(Number(request.observed_lng)).toBeCloseTo(46.705, 5);
  expect(Number(request.accuracy_m)).toBe(5);

  const opsContext = await browser.newContext({ storageState: storageStatePath("ops") });
  const opsPage = await opsContext.newPage();
  await opsPage.goto("/locale?set=en");
  await opsPage.goto("/operations");
  const queue = opsPage.getByRole("heading", { name: /Geofence override approvals/i }).locator("xpath=..");
  const requestCard = queue.locator(".sq-surface, .panel").filter({ hasText: factoryName }).first();
  await expect(requestCard).toBeVisible({ timeout: 30_000 });
  await expect(requestCard).toContainText("Safety/security photo exception declared");
  await requestCard.getByRole("button", { name: "Approve override" }).click();
  await expect(requestCard.getByRole("status")).toContainText("Decision saved", { timeout: 20_000 });
  await opsContext.close();

  await page.reload();
  await expect(page.getByText(/Operations override approved/i)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Factory representative is present").check();
  await page.getByLabel("Location confirmed — this is the correct factory").check();
  await expect(step(page, 4)).toBeEnabled();

  const { data: events } = await rest("GET",
    `geo_events?select=kind,observed_lat,observed_lng,geofence_result,override_reason&visit_id=eq.${governedVisitId}&kind=in.(override,arrival)&order=occurred_at.desc`,
    inspectorJwt);
  expect(events).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: "override", geofence_result: "override" }),
  ]));
  const decided = must(await rest("GET",
    `geo_override_requests?select=status,decision_event_id&visit_id=eq.${governedVisitId}&order=requested_at.desc&limit=1`,
    inspectorJwt), "read decided override")[0];
  expect(decided.status).toBe("approved");
  expect(decided.decision_event_id).toBeTruthy();
  const visit = must(await rest("GET",
    `visits?select=operational_state&id=eq.${governedVisitId}`,
    inspectorJwt), "read arrived visit")[0];
  expect(visit.operational_state).toBe("arrived");
  expect(pageErrors).toEqual([]);
});

test("unavailable GPS remains blocked and records no synthetic check-in", async ({ page, context }) => {
  test.setTimeout(120_000);
  await releaseInspectorWindow(governedVisitId);
  noGpsVisitId = await createVisit({ jwt: plannerJwt, userId: plannerUserId }, factoryId, packageVersionId, "no-GPS", 2);
  await context.clearPermissions();
  await page.goto(`/field/${noGpsVisitId}`);
  await completeReadinessLeg(page);
  await step(page, 1).click();
  await step(page, 2).click();
  await step(page, 3).click();
  await expect(page.getByText(/GPS unavailable — check-in remains blocked/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(step(page, 4)).toBeDisabled();
  const { data: checkins } = await rest("GET",
    `geo_events?select=id&visit_id=eq.${noGpsVisitId}&kind=eq.checkin`, inspectorJwt);
  expect(checkins).toEqual([]);
});

test("weak GPS accuracy blocks check-in before any location event is written", async ({ page, context }) => {
  test.setTimeout(120_000);
  await releaseInspectorWindow(noGpsVisitId);
  weakGpsVisitId = await createVisit({ jwt: plannerJwt, userId: plannerUserId }, factoryId, packageVersionId, "weak-GPS", 3);
  await context.setGeolocation({ latitude: 24.735, longitude: 46.705, accuracy: 100 });
  await page.goto(`/field/${weakGpsVisitId}`);
  await completeReadinessLeg(page);
  await step(page, 1).click();
  await step(page, 2).click();
  await step(page, 3).click();
  await expect(page.getByText(/BLOCKED: accuracy ±100m > 25m required/)).toBeVisible({ timeout: 10_000 });
  await expect(step(page, 4)).toBeDisabled();
  const { data: checkins } = await rest("GET",
    `geo_events?select=id&visit_id=eq.${weakGpsVisitId}&kind=eq.checkin`, inspectorJwt);
  expect(checkins).toEqual([]);
});
