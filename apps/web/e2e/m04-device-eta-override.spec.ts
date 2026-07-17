import { test, expect, type Page } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { assertOk, login, must, rest } from "./live-rest";

// TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001
// AC-0125/0130/0137/0156: complete field flow in explicit test-stub mode,
// plus browser-driven production fail-closed and no-GPS negative paths.
test.describe.configure({ mode: "serial" });
test.use({
  storageState: storageStatePath("inspector"),
  permissions: ["geolocation"],
  geolocation: { latitude: 24.735, longitude: 46.705 },
});

let inspectorJwt: string;
let inspectorUserId: string;
let stubVisitId: string;
let productionVisitId: string;
let noGpsVisitId: string;
let weakGpsVisitId: string;

async function poll<T>(read: () => Promise<T | null>, label: string, attempts = 15): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const value = await read();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function createVisit(planner: { jwt: string; userId: string }, factoryId: string, packageVersionId: string, suffix: string, dayOffset: number) {
  const plan = must(await rest("POST", "visit_plans", planner.jwt, {
    method: "single", status: "draft", created_by: planner.userId,
  }), `create ${suffix} plan`)[0];
  const windowStart = Date.now() + dayOffset * 86_400_000;
  const visit = must(await rest("POST", "visits", planner.jwt, {
    visit_plan_id: plan.id,
    factory_id: factoryId,
    visit_type: "periodic",
    execution_mode: "physical",
    planning_status: "published",
    window_start: new Date(windowStart).toISOString(),
    window_end: new Date(windowStart + 60_000).toISOString(),
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
  const factory = must(await rest("POST", "factories", planner.jwt, {
    factory_code: code,
    name: `M04 Integration ${code}`,
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

  // Keep the three fixtures far apart in the same broad collision-resistant
  // range used by the established golden/offline suites. Their one-minute
  // execution windows also exercise the ETA-duration warning deterministically.
  const baseDay = 100_000 + Math.floor(Math.random() * 40_000);
  stubVisitId = await createVisit(planner, factory.id, pkg.id, "stub", baseDay);
  productionVisitId = await createVisit(planner, factory.id, pkg.id, "production", baseDay + 2);
  noGpsVisitId = await createVisit(planner, factory.id, pkg.id, "no-GPS", baseDay + 4);
  weakGpsVisitId = await createVisit(planner, factory.id, pkg.id, "weak-GPS", baseDay + 6);
});

const step = (page: Page, n: number) => page.getByRole("button", { name: new RegExp(`^${n} ·`) });

test("test adapters complete device capture, initial/refreshed/offline ETA, warning and actual-coordinate override", async ({ page, context }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", error => pageErrors.push(error));
  await page.goto(`/field/${stubVisitId}`);
  await expect(page.getByTestId("field-test-stub-banner")).toContainText("not production");
  await step(page, 1).click();
  await step(page, 2).click();

  const device = page.getByTestId("field-device-readiness");
  await expect(device).toContainText("Device ID");
  await expect(device).toContainText("browser-reported");
  await expect(device).toContainText("App version");

  const route = page.getByTestId("route-estimate");
  await expect(route).toContainText("deterministic-test-routing", { timeout: 15_000 });
  await expect(route).toContainText(/ETA \d+ min/);
  await expect(route.getByRole("alert")).toContainText("exceeds the planned execution window");

  const initialJourney = await poll(async () => {
    const { data } = await rest("GET",
      `journey_sessions?select=id,device_id,device_os_version,application_version,eta_minutes,remaining_distance_m,routing_provider,route_estimate_mode,route_estimated_at&visit_id=eq.${stubVisitId}&order=started_at.desc&limit=1`,
      inspectorJwt);
    const row = Array.isArray(data) ? data[0] : null;
    return row?.eta_minutes != null ? row : null;
  }, "initial route estimate");
  expect(initialJourney.device_id).toMatch(/^field-/);
  expect(initialJourney.device_os_version).toContain("browser-reported");
  expect(initialJourney.application_version).toMatch(/^0\.1\.0/);
  expect(initialJourney.routing_provider).toBe("deterministic-test-routing");
  expect(initialJourney.route_estimate_mode).toBe("test_stub");
  expect(initialJourney.eta_minutes).toBeGreaterThan(0);
  expect(initialJourney.remaining_distance_m).toBeGreaterThan(0);

  const firstEstimateAt = initialJourney.route_estimated_at;
  await poll(async () => {
    const { data } = await rest("GET",
      `journey_sessions?select=route_estimated_at&visit_id=eq.${stubVisitId}&order=started_at.desc&limit=1`,
      inspectorJwt);
    const row = Array.isArray(data) ? data[0] : null;
    return row?.route_estimated_at && row.route_estimated_at !== firstEstimateAt ? row.route_estimated_at : null;
  }, "periodic route refresh", 12);

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(route).toContainText("showing the last known route estimate as stale", { timeout: 10_000 });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(route.getByRole("alert")).toContainText("exceeds the planned execution window", { timeout: 10_000 });
  expect(pageErrors).toEqual([]);

  await step(page, 3).click();
  const dialog = page.getByRole("alertdialog", { name: /Outside planned location/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Actual position");
  await expect(dialog).toContainText("TEST STUB");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await step(page, 3).click();
  await dialog.getByLabel("Override reason — mandatory").fill("Factory gate is at the observed coordinates");
  await dialog.getByRole("button", { name: "Confirm governed override" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Override approved · actual coordinates recorded/).first()).toBeVisible();

  const overrideRows = await poll(async () => {
    const { data } = await rest("GET",
      `geo_events?select=kind,observed_lat,observed_lng,device_id,device_os_version,application_version,geofence_result,override_reason,integration_mode,approval_provider&visit_id=eq.${stubVisitId}&kind=in.(override,arrival)&order=occurred_at.desc`,
      inspectorJwt);
    return Array.isArray(data) && data.some(row => row.kind === "override") ? data : null;
  }, "override geo events");
  const override = overrideRows.find((row: { kind: string }) => row.kind === "override");
  expect(override).toMatchObject({
    geofence_result: "override",
    integration_mode: "test_stub",
    approval_provider: "simulated-operations-approval",
    override_reason: "Factory gate is at the observed coordinates",
  });
  expect(Number(override.observed_lat)).toBeCloseTo(24.735, 5);
  expect(Number(override.observed_lng)).toBeCloseTo(46.705, 5);
  expect(override.device_id).toBe(initialJourney.device_id);

  await page.getByLabel("Factory representative is present").check();
  await page.getByLabel("Location confirmed — this is the correct factory").check();
  await step(page, 4).click();
  await page.waitForURL(/\/field\/inspection\/[0-9a-f-]+/, { timeout: 20_000 });
});

test("production mode exposes unavailable integrations and never self-approves outside-fence check-in", async ({ page }) => {
  await page.goto(`/field/${productionVisitId}?integrationMode=production`);
  await expect(page.getByTestId("field-test-stub-banner")).toHaveCount(0);
  await step(page, 1).click();
  await step(page, 2).click();
  await expect(page.getByTestId("route-estimate")).toContainText("Routing provider unavailable", { timeout: 15_000 });
  await step(page, 3).click();

  const dialog = page.getByRole("alertdialog", { name: /Outside planned location/i });
  await dialog.getByLabel("Override reason — mandatory").fill("Production provider must decide");
  await dialog.getByRole("button", { name: "Confirm governed override" }).click();
  await expect(dialog.getByRole("alert")).toContainText("approval integration is unavailable");
  await expect(step(page, 4)).toBeDisabled();

  const { data: journeys } = await rest("GET",
    `journey_sessions?select=eta_minutes,routing_provider,route_estimate_mode&visit_id=eq.${productionVisitId}`,
    inspectorJwt);
  expect(journeys?.[0]).toMatchObject({ eta_minutes: null, routing_provider: null, route_estimate_mode: null });
  const { data: overrides } = await rest("GET",
    `geo_events?select=id&visit_id=eq.${productionVisitId}&kind=eq.override`, inspectorJwt);
  expect(overrides).toEqual([]);
});

test("production mode with unavailable GPS remains blocked and records no synthetic check-in", async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto(`/field/${noGpsVisitId}?integrationMode=production`);
  await step(page, 1).click();
  await step(page, 2).click();
  await step(page, 3).click();
  await expect(page.getByText(/GPS unavailable — check-in remains blocked/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(step(page, 4)).toBeDisabled();
  const { data: checkins } = await rest("GET",
    `geo_events?select=id&visit_id=eq.${noGpsVisitId}&kind=eq.checkin`, inspectorJwt);
  expect(checkins).toEqual([]);
});

test("weak GPS accuracy blocks check-in before any location event is written", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 24.735, longitude: 46.705, accuracy: 100 });
  await page.goto(`/field/${weakGpsVisitId}?integrationMode=production`);
  await step(page, 1).click();
  await step(page, 2).click();
  await step(page, 3).click();
  await expect(page.getByText(/BLOCKED: accuracy ±100m > 25m required/)).toBeVisible({ timeout: 10_000 });
  await expect(step(page, 4)).toBeDisabled();
  const { data: checkins } = await rest("GET",
    `geo_events?select=id&visit_id=eq.${weakGpsVisitId}&kind=eq.checkin`, inspectorJwt);
  expect(checkins).toEqual([]);
});
