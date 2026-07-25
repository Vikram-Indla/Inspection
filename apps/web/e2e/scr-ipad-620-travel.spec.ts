import { test, expect, type Page } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";

// SCR-IPAD-620 — Field "Journey to Site" (Travel · live GPS · arrival range ·
// geofence display · navigation handoff). Design authority: P06A Physical
// Journey and Check-In. ENG-06 governs the geofence-radius default chain.
//
// This screen is DISPLAY-AND-NAVIGATE ONLY. The governed arrival check-in that
// unlocks inspection start — weak-GPS ±25m block, override request/approval,
// and the IMMUTABLE journey/arrival geo-event telemetry P06A requires — is owned
// by Startup.tsx (M04-004) and covered by m04-device-eta-override.spec.ts; it is
// deliberately NOT re-tested here.
//
// MUTATION SAFETY / ISOLATION: this is a LIVE, MUTATING test. It is EXPLICIT
// OPT-IN and DEFAULT-OFF — it runs only when PLAYWRIGHT_LIVE_E2E=1. In every
// other run (CI default, read-only review, the release G10 suite) the whole
// suite is skipped AND live-rest (which reads .env.local at import) is never
// loaded, so no database credential is touched and no fixture is created.
//
// It additionally REQUIRES an isolated/disposable backend: even when opted in,
// beforeAll fails closed unless PLAYWRIGHT_DISPOSABLE_BACKEND=1 is set to
// acknowledge the target Supabase is a throwaway/branch instance. This prevents
// the mutating fixtures from ever staging against a shared or production DB.
//
// It stages its own uniquely stamped fixtures (factories + plans + visits +
// assignments) via the acting persona's JWT so RLS stays under test, then in
// afterAll deletes every row it created in FK-safe order, checks each delete for
// errors, and re-queries to VERIFY the rows are gone — cleanup failures throw
// visibly and fail the suite rather than being swallowed.
//
// Covered (positive + negative + offline + permission):
//  1. Live route + honest geofence "in range", location freshness, native
//     navigation handoff to the OFFICIAL coordinates only, and truthful privacy
//     scope (this view stores nothing; the governed check-in records telemetry).
//  2. Offline honesty — connectivity banner appears and the road ETA reverts to
//     a dash instead of presenting the last figure as if current; it recovers
//     when connectivity returns.
//  3. Permission denied — geofence range degrades honestly, no fabricated fix.
//  4. No official coordinates on file — no route/geofence is shown.
//  5. RLS / not-found — an unknown visit id shows the scoped empty state.

// Explicit opt-in, default-off: the mutating suite runs ONLY under
// PLAYWRIGHT_LIVE_E2E=1. Anything else (unset, read-only review, CI default) skips.
const LIVE_E2E = process.env.PLAYWRIGHT_LIVE_E2E === "1";
// Fail-closed isolation guard: even when opted in, refuse to stage fixtures
// unless the operator acknowledges a disposable/throwaway backend.
const DISPOSABLE_BACKEND = process.env.PLAYWRIGHT_DISPOSABLE_BACKEND === "1";
const describe = LIVE_E2E ? test.describe : test.describe.skip;

// Deferred so a read-only review never loads live-rest's .env.local read.
type LiveRest = typeof import("./live-rest");

describe("SCR-IPAD-620 — Journey to Site (travel/GPS/geofence display)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({
    storageState: storageStatePath("inspector"),
    permissions: ["geolocation"],
    // On-site: identical to the official coordinates below, so the honest
    // straight-line range is inside any sane geofence radius (Arrived).
    geolocation: { latitude: 24.7136, longitude: 46.6753, accuracy: 8 },
  });

  let live: LiveRest | null = null;
  let plannerJwt: string;
  let inspectorUserId: string;
  let gpsVisitId: string; // factory WITH official coordinates
  let noCoordsVisitId: string; // factory WITHOUT official coordinates
  const createdVisitIds: string[] = [];
  const createdPlanIds: string[] = [];
  const createdFactoryIds: string[] = [];

  async function createVisit(
    plannerUserId: string,
    factoryId: string,
    packageVersionId: string,
    suffix: string,
    dayOffset: number,
  ) {
    const { rest, must, assertOk } = live!;
    const plan = must(await rest("POST", "visit_plans", plannerJwt, {
      method: "single", status: "draft", created_by: plannerUserId,
    }), `create ${suffix} plan`)[0];
    createdPlanIds.push(plan.id);
    const windowStart = Date.now() + dayOffset * 86_400_000;
    const visit = must(await rest("POST", "visits", plannerJwt, {
      visit_plan_id: plan.id,
      factory_id: factoryId,
      visit_type: "periodic",
      execution_mode: "physical",
      planning_status: "published",
      window_start: new Date(windowStart).toISOString(),
      window_end: new Date(windowStart + 60 * 60_000).toISOString(),
      package_version_id: packageVersionId,
    }), `create ${suffix} visit`)[0];
    createdVisitIds.push(visit.id);
    assertOk(await rest("POST", "assignments", plannerJwt, {
      visit_id: visit.id, inspector_id: inspectorUserId, method: "manual",
    }, "return=minimal"), `assign ${suffix} visit`);
    return visit.id as string;
  }

  test.beforeAll(async () => {
    // Isolation guard: never stage mutating fixtures against a shared/production
    // backend. Fail closed with an actionable message unless the operator has
    // acknowledged a disposable target.
    if (!DISPOSABLE_BACKEND) {
      throw new Error(
        "SCR-IPAD-620 live suite refuses to run: set PLAYWRIGHT_DISPOSABLE_BACKEND=1 " +
        "only when pointed at an isolated, throwaway Supabase (branch/local), never a shared DB.",
      );
    }
    live = await import("./live-rest");
    const { login, rest, must } = live;
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    plannerJwt = planner.jwt;
    inspectorUserId = inspector.userId;

    const stamp = Date.now();
    const withCoords = must(await rest("POST", "factories", plannerJwt, {
      factory_code: `IPAD620-GPS-${stamp}`,
      name: `IPAD620 GPS ${stamp}`,
      region: "Riyadh", city: "Riyadh",
      official_lat: 24.7136, official_lng: 46.6753,
      risk_band: "low", risk_score: 10,
    }), "create GPS factory")[0];
    createdFactoryIds.push(withCoords.id);
    const noCoords = must(await rest("POST", "factories", plannerJwt, {
      factory_code: `IPAD620-NOGPS-${stamp}`,
      name: `IPAD620 NoGPS ${stamp}`,
      region: "Riyadh", city: "Riyadh",
      official_lat: null, official_lng: null,
      risk_band: "low", risk_score: 10,
    }), "create no-coords factory")[0];
    createdFactoryIds.push(noCoords.id);
    const pkg = must(await rest("GET",
      "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1",
      plannerJwt), "published package")[0];

    const dayMs = 86_400_000;
    const maxOffsetDays = Math.floor((Date.UTC(2099, 11, 1) - Date.now()) / dayMs);
    const baseDay = 30 + Math.random() * (maxOffsetDays - 36);
    gpsVisitId = await createVisit(planner.userId, withCoords.id, pkg.id, "gps", baseDay);
    noCoordsVisitId = await createVisit(planner.userId, noCoords.id, pkg.id, "no-coords", baseDay + 2);
  });

  // Deterministic, VERIFIED cleanup: remove every row this spec created, in
  // FK-safe order (assignments → visits → plans → factories), then re-query to
  // confirm nothing remains. Every delete error and every surviving row is
  // collected and thrown — cleanup failures fail the suite visibly instead of
  // being swallowed. The travel screen itself writes nothing, so these fixtures
  // are the entire footprint.
  test.afterAll(async () => {
    if (!live || !plannerJwt) return;
    const { rest } = live;
    const inList = (ids: string[]) => ids.filter(Boolean).join(",");
    const failures: string[] = [];

    const del = async (label: string, path: string) => {
      const res = await rest("DELETE", path, plannerJwt, undefined, "return=minimal");
      if (res.error) failures.push(`delete ${label}: ${res.error}`);
    };
    const verifyGone = async (label: string, path: string) => {
      const res = await rest<unknown[]>("GET", path, plannerJwt);
      if (res.error) failures.push(`verify ${label}: ${res.error}`);
      else if (Array.isArray(res.data) && res.data.length) failures.push(`${label}: ${res.data.length} row(s) not cleaned up`);
    };

    if (createdVisitIds.length) {
      await del("assignments", `assignments?visit_id=in.(${inList(createdVisitIds)})`);
      await del("visits", `visits?id=in.(${inList(createdVisitIds)})`);
    }
    if (createdPlanIds.length) await del("visit_plans", `visit_plans?id=in.(${inList(createdPlanIds)})`);
    if (createdFactoryIds.length) await del("factories", `factories?id=in.(${inList(createdFactoryIds)})`);

    if (createdVisitIds.length) {
      await verifyGone("assignments", `assignments?select=visit_id&visit_id=in.(${inList(createdVisitIds)})`);
      await verifyGone("visits", `visits?select=id&id=in.(${inList(createdVisitIds)})`);
    }
    if (createdPlanIds.length) await verifyGone("visit_plans", `visit_plans?select=id&id=in.(${inList(createdPlanIds)})`);
    if (createdFactoryIds.length) await verifyGone("factories", `factories?select=id&id=in.(${inList(createdFactoryIds)})`);

    if (failures.length) throw new Error(`SCR-IPAD-620 fixture cleanup failed:\n- ${failures.join("\n- ")}`);
  });

  async function gotoTravel(page: Page, visitId: string) {
    const pageErrors: Error[] = [];
    page.on("pageerror", error => pageErrors.push(error));
    await page.goto(`/field/${visitId}/travel`);
    return pageErrors;
  }

  test("live journey shows honest geofence range, freshness, a navigation handoff, and truthful privacy scope", async ({ page }) => {
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

    // Truthful privacy scope: the VIEW stores nothing, but it does NOT claim the
    // journey is untracked — arrival telemetry is recorded by the governed
    // check-in as immutable geo events (P06A).
    await expect(page.getByText(/the view itself stores nothing/i)).toBeVisible();
    await expect(page.getByText(/recorded by the governed check-in as immutable geo events/i)).toBeVisible();

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
});
