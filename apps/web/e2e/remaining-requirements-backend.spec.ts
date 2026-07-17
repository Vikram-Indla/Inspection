import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { storageStatePath } from "./personas";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test.describe("TASK-G11 remaining-requirements backend contracts", () => {
  test("M02-039 has a real visit map route with factory and authorized inspector positions", () => {
    const page = read("src/app/visits/map/page.tsx");
    const map = read("src/app/visits/map/VisitMap.tsx");
    expect(page).toContain('from("geo_events")');
    expect(page).toContain("official_lat");
    expect(map).toContain("latest inspector position");
    expect(map).toContain("/visits/${v.id}");
  });

  test("M04 field journey captures device, provider ETA, override and arrival evidence", () => {
    const startup = read("src/app/field/[visitId]/Startup.tsx");
    const route = read("src/app/api/routing/eta/route.ts");
    const offline = read("src/lib/offline.ts");
    expect(startup).toContain("device_info: capturedDevice");
    expect(startup).toContain('fetch("/api/routing/eta"');
    // Obsolete-test fix (Cycle 2 completion pass): the override geo_events
    // kind was already specialized to "geo_override_request" by the
    // already-merged 62916ee ("feat(ipad): govern geofence overrides") —
    // confirmed present and functioning via requestGpsOverride() in
    // Startup.tsx. The bare "override" literal never existed as its own
    // kind value; only this substring assertion was stale.
    expect(startup).toContain('kind: "geo_override_request"');
    expect(startup).toContain('linked_type: "arrival"');
    expect(startup).not.toContain("demo coordinates substituted");
    expect(route).toContain("GOOGLE_MAPS_ROUTES_API_KEY");
    expect(route).toContain("TRAFFIC_AWARE");
    expect(offline).toContain("row.evidence_note = op.evidence_note");
  });

  test("M07 schema is source-owned, role-scoped and risk history is reproducible", () => {
    const migration = read("../../supabase/migrations/20260716210000_remaining_requirements_backend.sql");
    const dossier = read("src/app/factories/[id]/page.tsx");
    expect(migration).toContain("license_issue_date date");
    expect(migration).toContain("cr_owner_details text");
    expect(migration).toContain("create table if not exists factory_risk_snapshots");
    expect(migration).toContain("create or replace function recalculate_factory_risk");
    expect(migration).toContain("Risk driver % must be between 0 and 100");
    expect(migration).toContain("create policy fdocs_read");
    expect(dossier).toContain("FactorySpatialMap");
    expect(dossier).toContain("canSeeSensitiveHistory");
    expect(dossier).toContain("Source registry synced");
    expect(dossier).toContain("Penalty issued");
  });
});

test.describe("TASK-G11 arrival evidence live replay", () => {
  test.use({
    storageState: storageStatePath("inspector"),
    permissions: ["geolocation"],
    geolocation: { latitude: 25.0698, longitude: 45.5722, accuracy: 5 },
  });
  test("M04-012/043/045 persists device, arrival and visit-linked evidence through normal RLS", async ({ page }) => {
    test.skip(process.env.RUN_G11_LIVE_REPLAY !== "1", "opt-in destructive live evidence replay");
    await page.goto("/locale?set=en");
    const fix = await page.evaluate(() => new Promise<Pick<GeolocationCoordinates, "latitude" | "longitude" | "accuracy">>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
        reject,
        { enableHighAccuracy: true, timeout: 4_000 },
      )));
    expect(fix).toEqual({ latitude: 25.0698, longitude: 45.5722, accuracy: 5 });
    await page.goto("/field/b6b524c9-14f9-4b74-ae7c-ddb65580acad");
    await expect(page.getByRole("heading", { name: /Readiness/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /1 · Download package/i }).click();
    await page.getByRole("button", { name: /2 · Start journey/i }).click();
    await expect(page.getByText(/Journey started — telemetry active/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /3 · Geofence check-in/i }).click();
    await expect(page.getByRole("heading", { name: /Arrival evidence/i })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Arrival comment").fill("G11 arrival replay 2026-07-16 b6b524c9");
    await page.getByRole("button", { name: /Save arrival evidence/i }).click();
    await expect(page.locator(".ax-lozenge--success").filter({ hasText: /Arrival evidence saved or queued for sync/i })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("TASK-G11 GPS override live negative path", () => {
  test.use({
    storageState: storageStatePath("inspector"),
    permissions: ["geolocation"],
    geolocation: { latitude: 25.0798, longitude: 45.5722, accuracy: 5 },
  });
  test("M04-043 requires a reason and persists the actual outside-fence coordinates", async ({ page }) => {
    test.skip(process.env.RUN_G11_LIVE_REPLAY !== "1", "opt-in destructive live override replay");
    await page.goto("/locale?set=en");
    await page.goto("/field/e00f3359-61af-4eff-9aec-5e51fc195181");
    await expect(page.getByRole("heading", { name: /Readiness/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /1 · Download package/i }).click();
    await page.getByRole("button", { name: /2 · Start journey/i }).click();
    await expect(page.getByText(/Journey started — telemetry active/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /3 · Geofence check-in/i }).click();
    await expect(page.getByRole("heading", { name: /Outside the planned location/i })).toBeVisible();
    const confirm = page.getByRole("button", { name: /Confirm and use actual coordinates/i });
    await expect(confirm).toBeDisabled();
    await page.getByLabel(/Override reason — mandatory/i).fill("G11 controlled outside-fence override replay");
    await confirm.click();
    await expect(page.getByRole("heading", { name: /Arrival evidence/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Outside-location override confirmed and audited/i)).toBeVisible();
  });
});

test.describe("TASK-G11 remaining-requirements live read paths", () => {
  test.describe("planner", () => {
    test.use({ storageState: storageStatePath("planner") });
    test("M02-039 visit map renders its region filter, map and list equivalent", async ({ page }) => {
      await page.goto("/locale?set=en");
      await page.goto("/visits/map");
      await expect(page.getByRole("heading", { name: /Visit management — map/i })).toBeVisible();
      await expect(page.getByLabel("Region")).toBeVisible();
      await expect(page.locator(".leaflet-container")).toBeVisible();
      await expect(page.locator("table.ax-table")).toBeVisible();
    });
  });

  test.describe("inspector", () => {
    test.use({ storageState: storageStatePath("inspector") });
    test("M04 startup reads the migrated journey contract without mutation", async ({ page }) => {
      await page.goto("/locale?set=en");
      await page.goto("/field");
      const startLink = page.locator('a[href^="/field/"]:not([href^="/field/inspection/"])').first();
      if (await startLink.count() === 0) test.skip(true, "no startable assigned Visit in this environment");
      await startLink.click();
      await expect(page.getByRole("heading", { name: /Readiness/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Device information \(M04-012\)/i)).toBeVisible();
      await expect(page.getByText(/Road-network ETA \(M04-017\/024\)/i)).toBeVisible();
    });
  });
});
