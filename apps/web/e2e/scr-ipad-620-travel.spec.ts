import { test, expect, type Page } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { assertOk, login, must, rest } from "./live-rest";

// SCR-IPAD-620 — Field "Journey to Site" (Travel · live GPS · arrival range ·
// geofence display · navigation handoff). Design authority: P06A Physical
// Journey and Check-In. ENG-06 governs the geofence-radius default chain.
//
// This screen is DISPLAY-AND-NAVIGATE ONLY. The governed arrival check-in that
// unlocks inspection start — weak-GPS ±25m block, override request/approval —
// is owned by Startup.tsx (M04-004) and is covered by
// m04-device-eta-override.spec.ts; it is deliberately NOT re-tested here.
//
// Covered (positive + negative + offline + permission):
//  1. Live route + honest geofence "in range", location freshness, native
//     navigation handoff to the OFFICIAL coordinates only.
//  2. Offline honesty — connectivity banner appears and the road ETA reverts to
//     a dash instead of presenting the last figure as if current; it recovers
//     when connectivity returns.
//  3. Permission denied — geofence range degrades honestly, no fabricated fix.
//  4. No official coordinates on file — no route/geofence is shown.
//  5. RLS / not-found — an unknown visit id shows the scoped empty state.
test.describe.configure({ mode: "serial" });
test.use({
  storageState: storageStatePath("inspector"),
  permissions: ["geolocation"],
  // On-site: identical to the official coordinates below, so the honest
  // straight-line range is inside any sane geofence radius (Arrived).
  geolocation: { latitude: 24.7136, longitude: 46.6753, accuracy: 8 },
});

let inspectorUserId: string;
let gpsVisitId: string; // factory WITH official coordinates
let noCoordsVisitId: string; // factory WITHOUT official coordinates

async function createVisit(
  planner: { jwt: string; userId: string },
  factoryId: string,
  packageVersionId: string,
  suffix: string,
  dayOffset: number,
) {
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
    window_end: new Date(windowStart + 60 * 60_000).toISOString(),
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
  inspectorUserId = inspector.userId;

  const stamp = Date.now();
  const withCoords = must(await rest("POST", "factories", planner.jwt, {
    factory_code: `IPAD620-GPS-${stamp}`,
    name: `IPAD620 GPS ${stamp}`,
    region: "Riyadh", city: "Riyadh",
    official_lat: 24.7136, official_lng: 46.6753,
    risk_band: "low", risk_score: 10,
  }), "create GPS factory")[0];
  const noCoords = must(await rest("POST", "factories", planner.jwt, {
    factory_code: `IPAD620-NOGPS-${stamp}`,
    name: `IPAD620 NoGPS ${stamp}`,
    region: "Riyadh", city: "Riyadh",
    official_lat: null, official_lng: null,
    risk_band: "low", risk_score: 10,
  }), "create no-coords factory")[0];
  const pkg = must(await rest("GET",
    "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1",
    planner.jwt), "published package")[0];

  const dayMs = 86_400_000;
  const maxOffsetDays = Math.floor((Date.UTC(2099, 11, 1) - Date.now()) / dayMs);
  const baseDay = 30 + Math.random() * (maxOffsetDays - 36);
  gpsVisitId = await createVisit(planner, withCoords.id, pkg.id, "gps", baseDay);
  noCoordsVisitId = await createVisit(planner, noCoords.id, pkg.id, "no-coords", baseDay + 2);
});

async function gotoTravel(page: Page, visitId: string) {
  const pageErrors: Error[] = [];
  page.on("pageerror", error => pageErrors.push(error));
  await page.goto(`/field/${visitId}/travel`);
  return pageErrors;
}

test("live journey shows honest geofence range, freshness and a navigation handoff to the official coordinates", async ({ page }) => {
  const pageErrors = await gotoTravel(page, gpsVisitId);

  await expect(page.getByRole("heading", { name: "Journey to Site" })).toBeVisible();

  // Honest geofence range: on-site coordinates → "in range" note is shown and
  // the header state reads Arrived (display only — it does not record arrival).
  await expect(page.getByText(/arrival can be confirmed at check-in/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Arrived")).toBeVisible();

  // Location freshness renders once a real fix exists (device GPS).
  await expect(page.getByTestId("travel-freshness")).toContainText(/just now|\d+s ago/, { timeout: 15_000 });

  // Native navigation handoff targets the OFFICIAL coordinates only.
  const maps = page.getByTestId("travel-open-maps");
  await expect(maps).toBeVisible();
  await expect(maps).toHaveAttribute("href", "https://maps.apple.com/?daddr=24.7136,46.6753&dirflg=d");

  // Privacy scope is stated; this screen records nothing.
  await expect(page.getByText(/does not record or store your position/i)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("offline reverts the road ETA to a dash instead of showing a stale figure, then recovers", async ({ page, context }) => {
  await gotoTravel(page, gpsVisitId);
  const eta = page.getByTestId("travel-eta");

  // Live route ETA (Mapbox Directions is wired in this environment).
  await expect(eta).toHaveText(/\d+ min/, { timeout: 30_000 });

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));

  // Connectivity is surfaced, and the road ETA no longer presents the last
  // value as current — it honestly reverts to a dash. GPS/geofence stay live.
  await expect(page.getByText(/Offline — the live route ETA can't refresh/i)).toBeVisible({ timeout: 10_000 });
  await expect(eta).toHaveText("—");
  await expect(page.getByText(/arrival can be confirmed at check-in/i)).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(eta).toHaveText(/\d+ min/, { timeout: 30_000 });
});

test("permission denied degrades the geofence honestly without a fabricated fix", async ({ page, context }) => {
  await context.clearPermissions();
  const pageErrors = await gotoTravel(page, gpsVisitId);

  await expect(page.getByText(/Location access is unavailable/i)).toBeVisible({ timeout: 15_000 });
  // No fabricated fix → no freshness stat is claimed.
  await expect(page.getByTestId("travel-freshness")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("no official coordinates on file shows no route or geofence", async ({ page }) => {
  const pageErrors = await gotoTravel(page, noCoordsVisitId);

  await expect(page.getByText("No official location on file")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("travel-open-maps")).toHaveCount(0);
  await expect(page.getByText(/arrival can be confirmed at check-in/i)).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("an out-of-scope visit id resolves to the scoped not-found state (RLS)", async ({ page }) => {
  const pageErrors = await gotoTravel(page, "00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("Visit not found")).toBeVisible({ timeout: 15_000 });
  expect(pageErrors).toEqual([]);
});
