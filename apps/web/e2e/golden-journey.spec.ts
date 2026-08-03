import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS, goldenInspectorPersona, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";
import { signAndConfirm } from "./sign-helper";
import {
  identifierField,
  passwordField,
  waitForCredentialsForm,
  submitCredentials,
} from "./login-helper";

// Golden journey B10 (B10-EV-001) driven entirely through the UI:
// plan -> publish -> assign -> startup -> execute -> submit v1 -> Level-2 RETURN
// (exact scope) -> correct -> resubmit v2 -> Level-2 APPROVE, with UI negative
// paths inline (publish blockers M01-040, submit blockers ERR-SUB-001) and
// decided-review lock (M06-009) asserted at the end. Server truth is verified
// over PostgREST with persona JWTs, exactly like the B10 evidence script.

test.describe.configure({ mode: "serial" });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const P2_LOGIN_STEP_TIMEOUT = 20_000;
const RECOVERY_VISIT_ID = process.env.GOLDEN_RECOVERY_VISIT_ID?.trim() ?? "";

let factory: { id: string; factory_code: string; name: string; official_lat: number; official_lng: number; geofence_radius_m: number };
let inspectorUserId: string;
// The controlled non-production Inspector identity is resolved through the
// private persona environment and must also be present in the Planner's live
// governed selector before P1 may assign it.
let inspectorCreds: { email: string; password: string };
let packageVersionId: string;
let scopeSectionKey: string; // section containing FS-101 — the exact return scope
let visitId: string;
let inspectionId: string;
let visitWindowStart: string;
let visitWindowEnd: string;
let visitWindowStartInput: string;
let visitWindowEndInput: string;
let recoveryCheckpoint: "before_checkin" | "after_checkin" | "inspection_started" | "submitted_v1" | "reviewing_v1" | "returned_v1" | "submitted_v2" | "reviewing_v2" | "approved_v2" | null = null;

async function pollRest<T>(fn: () => Promise<T | null>, label: string, tries = 15): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`timed out waiting for ${label}`);
}

function acceptedSeedGeofenceRadius(): number {
  const foundation = readFileSync(join(__dirname, "..", "..", "..", "supabase", "migrations", "0001_foundation.sql"), "utf8");
  const gisSeed = foundation.match(/\('gis',\s*'([^']+)'\s*,\s*'([^']+)'\)/);
  if (!gisSeed) throw new Error("accepted GIS seed configuration is missing");
  const settings = JSON.parse(gisSeed[1]) as { geofence_default_radius_m?: unknown };
  const radius = settings.geofence_default_radius_m;
  if (typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0 || !Number.isInteger(radius)) {
    throw new Error("accepted GIS seed must provide a positive integer geofence_default_radius_m");
  }
  if (!gisSeed[2]) throw new Error("accepted GIS seed must provide version provenance");
  return radius;
}

async function governedFixtureGeofenceRadius(plannerJwt: string): Promise<number> {
  const rows = must(await rest("GET",
    "engine_settings?engine=eq.gis&select=settings,version_label&limit=1",
    plannerJwt), "read governed GIS configuration") as Array<{
      settings: { geofence_default_radius_m?: unknown };
      version_label: string;
    }>;
  const liveRadius = rows[0]?.settings?.geofence_default_radius_m;
  if (typeof liveRadius === "number" && Number.isFinite(liveRadius) && liveRadius > 0 && Number.isInteger(liveRadius)) {
    if (!rows[0]?.version_label) throw new Error("governed GIS configuration must provide version provenance");
    return liveRadius;
  }
  return acceptedSeedGeofenceRadius();
}

async function retireOverlappingGoldenAssignments(plannerJwt: string, proposedStart: Date, proposedEnd: Date) {
  const rows = must(await rest("GET",
    `assignments?select=visit_id,visits!inner(id,planning_status,operational_state,window_start,window_end,factories!inner(factory_code))&inspector_id=eq.${inspectorUserId}&visits.planning_status=in.(published,returned)&visits.operational_state=eq.new&visits.window_start=lt.${proposedEnd.toISOString()}&visits.window_end=gt.${proposedStart.toISOString()}&visits.factories.factory_code=like.R3-QA-CERT-*`,
    plannerJwt), "read prior golden assignments") as Array<{
      visit_id: string;
      visits: { factories: { factory_code: string } };
    }>;

  for (const row of rows) {
    if (!row.visits.factories.factory_code.startsWith("R3-QA-CERT-")) {
      throw new Error("refusing to reschedule a non-golden assignment");
    }
    const end = new Date(proposedStart.getTime() - 60_000);
    const start = new Date(end.getTime() - 36e5);
    must(await rest("POST", "rpc/reschedule_published_visits_atomic", plannerJwt, {
      p_visit_ids: [row.visit_id],
      p_window_start: start.toISOString(),
      p_window_end: end.toISOString(),
      p_reason: "Controlled UAT golden-journey fixture rollover",
      p_idempotency_key: `golden-rollover-${row.visit_id}-${end.toISOString()}`,
      p_correlation_id: crypto.randomUUID(),
    }), `reschedule prior golden assignment ${row.visit_id}`);
  }
}

function freshGoldenWindow(now = new Date()): { start: string; end: string; startInput: string; endInput: string } {
  if (!Number.isFinite(now.getTime())) throw new Error("golden visit window requires a valid current time");
  const startDate = new Date(now);
  startDate.setUTCSeconds(0, 0);
  startDate.setUTCMinutes(startDate.getUTCMinutes() - 1);
  const endDate = new Date(startDate.getTime() + 90 * 60_000);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  return { start, end, startInput: start.slice(0, 16), endInput: end.slice(0, 16) };
}

// UI-login (SCR-PUB-010) for the controlled Inspector through the real form,
// matching auth.setup without depending on a generated storage-state file.
async function journeyInspectorPage(browser: { newContext: (o: object) => Promise<BrowserContext> }): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { latitude: Number(factory.official_lat ?? 24.7136), longitude: Number(factory.official_lng ?? 46.6753), accuracy: 5 },
  });
  lastContext = ctx;
  const page = await ctx.newPage();
  await test.step("P2 Inspector opens the governed login form", async () => {
    await page.goto("/login");
    await waitForCredentialsForm(page);
  }, { timeout: P2_LOGIN_STEP_TIMEOUT });
  await test.step("P2 Inspector submits controlled credentials", async () => {
    await identifierField(page).fill(inspectorCreds.email);
    await passwordField(page).fill(inspectorCreds.password);
    await submitCredentials(page);
  }, { timeout: P2_LOGIN_STEP_TIMEOUT });
  await test.step("P2 Inspector reaches the approved Dashboard landing", async () => {
    await page.waitForURL(url => url.pathname === "/dashboard", { timeout: P2_LOGIN_STEP_TIMEOUT });
    await expect(page.locator("#role-dashboard-summary")).toBeVisible({ timeout: P2_LOGIN_STEP_TIMEOUT });
    await expect(page.locator("main")).not.toContainText("ERR-AUTH", { timeout: P2_LOGIN_STEP_TIMEOUT });
  }, { timeout: P2_LOGIN_STEP_TIMEOUT });
  const origin = new URL(page.url()).origin;
  await ctx.addCookies([
    { name: "locale", value: "en", url: origin },
    { name: "login_locale", value: "en", url: origin },
  ]);
  await page.reload();
  return page;
}

async function journeySupervisorPage(browser: { newContext: (o: object) => Promise<BrowserContext> }): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({});
  lastContext = ctx;
  const page = await ctx.newPage();
  await test.step("P1.5 Supervisor authenticates through the governed login form", async () => {
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(PERSONAS.supervisor.email);
    await passwordField(page).fill(PERSONAS.supervisor.password);
    await submitCredentials(page);
    await page.waitForURL(url => url.pathname === "/dashboard", { timeout: P2_LOGIN_STEP_TIMEOUT });
    await expect(page.locator("#role-dashboard-summary")).toBeVisible({ timeout: P2_LOGIN_STEP_TIMEOUT });
    await expect(page.locator("main")).not.toContainText("ERR-AUTH", { timeout: P2_LOGIN_STEP_TIMEOUT });
  }, { timeout: P2_LOGIN_STEP_TIMEOUT });
  return page;
}

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  const fixtureGeofenceRadius = await governedFixtureGeofenceRadius(planner.jwt);

  // Resolve the identity from existing controlled test configuration. P1 then
  // proves this authenticated user is still exposed by the Planner selector;
  // stale or ineligible identities are never substituted silently.
  inspectorCreds = goldenInspectorPersona();
  const freshWindow = freshGoldenWindow();
  visitWindowStart = freshWindow.start;
  visitWindowEnd = freshWindow.end;
  visitWindowStartInput = freshWindow.startInput;
  visitWindowEndInput = freshWindow.endInput;
  const inspectorSession = await login(inspectorCreds.email, inspectorCreds.password);
  inspectorUserId = inspectorSession.userId;
  if (RECOVERY_VISIT_ID) {
    if (!UUID.test(RECOVERY_VISIT_ID)) throw new Error("GOLDEN_RECOVERY_VISIT_ID must be a UUID");
    const rows = must(await rest("GET",
      `visits?id=eq.${RECOVERY_VISIT_ID}&select=id,planning_status,operational_state,package_version_id,factories(id,factory_code,name,region,official_lat,official_lng,geofence_radius_m),assignments(inspector_id,status)`,
      planner.jwt), "read recovery visit") as Array<any>;
    if (rows.length !== 1) throw new Error("recovery visit must resolve to exactly one governed row");
    const row = rows[0];
    if (!row.factories?.factory_code?.startsWith("R3-QA-CERT-") || row.factories.region !== "Riyadh") throw new Error("recovery visit is not owned by the Riyadh golden dataset");
    if (row.planning_status !== "published" || !["on_the_way", "arrived", "executing", "submitted", "under_review"].includes(row.operational_state)) throw new Error("recovery visit is not at an approved P2 checkpoint");
    if (row.assignments?.length !== 1 || row.assignments[0].inspector_id !== inspectorUserId) throw new Error("recovery visit is not assigned only to the controlled Inspector");
    const journeys = must(await rest("GET", `journey_sessions?visit_id=eq.${RECOVERY_VISIT_ID}&select=id,status,inspector_id`, inspectorSession.jwt), "read recovery journey") as Array<any>;
    if (journeys.length !== 1 || journeys[0].inspector_id !== inspectorUserId) throw new Error("recovery visit has no single controlled journey");
    const checkpoint = `${row.operational_state}/${journeys[0].status}`;
    if (checkpoint === "on_the_way/on_journey") recoveryCheckpoint = "before_checkin";
    else if (checkpoint === "arrived/arrived") recoveryCheckpoint = "after_checkin";
    else if (["executing/completed", "submitted/completed", "under_review/completed"].includes(checkpoint)) {
      const inspections = must(await rest("GET",
        `inspections?visit_id=eq.${RECOVERY_VISIT_ID}&select=id,status,started_at,submission_versions(version_number),reviews(decision,returned_sections,decided_at)`,
        inspectorSession.jwt), "read recovery inspection") as Array<{ id: string; status: string; started_at: string | null; submission_versions: Array<{ version_number: number }>; reviews: Array<{ decision: string | null; returned_sections: string[] | null; decided_at: string | null }> }>;
      if (inspections.length !== 1 || !inspections[0].started_at) {
        throw new Error("recovery visit has no single controlled started inspection");
      }
      const versionNumbers = inspections[0].submission_versions.map(version => version.version_number).sort();
      if (inspections[0].status === "in_progress") recoveryCheckpoint = "inspection_started";
      else if (inspections[0].status === "submitted" && versionNumbers.join(",") === "1") {
        recoveryCheckpoint = "submitted_v1";
      } else if (inspections[0].status === "submitted" && versionNumbers.join(",") === "1,2") {
        recoveryCheckpoint = "submitted_v2";
      } else if (inspections[0].status === "under_review" && inspections[0].submission_versions.length === 1 && inspections[0].reviews.filter(review => !review.decided_at).length === 1) {
        recoveryCheckpoint = "reviewing_v1";
      } else if (inspections[0].status === "under_review" && versionNumbers.join(",") === "1,2" && inspections[0].reviews.filter(review => !review.decided_at).length === 1) {
        recoveryCheckpoint = "reviewing_v2";
      } else if (inspections[0].status === "returned" && inspections[0].submission_versions.length === 1) {
        const decidedReturns = inspections[0].reviews.filter(review => review.decision === "return" && !!review.decided_at);
        if (decidedReturns.length !== 1 || decidedReturns[0].returned_sections?.length !== 1) throw new Error("recovery returned v1 lacks one exact governed return scope");
        recoveryCheckpoint = "returned_v1";
      } else if (inspections[0].status === "approved" && versionNumbers.join(",") === "1,2" && inspections[0].reviews.filter(review => !!review.decided_at).length === 2) {
        recoveryCheckpoint = "approved_v2";
      } else {
        throw new Error("recovery inspection is not at a governed P2-P4 checkpoint");
      }
      inspectionId = inspections[0].id;
    }
    else throw new Error("recovery visit and journey are not at the same approved P2 checkpoint");
    const pkg = must(await rest("GET", `package_versions?id=eq.${row.package_version_id}&select=id,status,definition,packages(code)`, planner.jwt), "read recovery package")[0];
    const sections: { key: string; items?: string[] }[] = pkg?.definition?.sections ?? [];
    const scope = sections.find(section => (section.items ?? []).includes("FS-101"));
    if (pkg?.status !== "published" || pkg?.packages?.code !== "PKG-UAT-GOLDEN-FS101" || !scope) throw new Error("recovery visit does not use the governed published FS-101 package");
    factory = row.factories;
    packageVersionId = pkg.id;
    scopeSectionKey = scope.key;
    visitId = row.id;
    return;
  }
  await retireOverlappingGoldenAssignments(planner.jwt, new Date(visitWindowStart), new Date(visitWindowEnd));

  // M02-012 blocks publish while a factory has ANY active periodic visit. Picking
  // an existing shared factory races every other run (this suite's own retries,
  // the collaborator's own manual testing) against the same live project —
  // provision a dedicated throwaway factory per run instead so the journey
  // can never collide with concurrent activity.
  // Known app bug: Startup.tsx's GeoMap crashes (Leaflet reads .lat off null)
  // when a factory has no official coordinates. Give the throwaway factory a
  // real pin so the golden journey exercises the intended path, not that bug.
  const code = `R3-QA-CERT-${Date.now()}`;
  factory = must(await rest("POST", "factories", planner.jwt, {
    factory_code: code, name: `R3 QA Certification ${code}`,
    cr_number: `9999-${Date.now() % 1000000}`, region: "Riyadh", city: "Riyadh",
    official_lat: 24.7136, official_lng: 46.6753,
    geofence_radius_m: fixtureGeofenceRadius,
    risk_band: "low", risk_score: 10,
  }), "create sacrificial factory")[0];

  const pkg = must(await rest("GET",
    // Drift-robust (Phase 8 live cert): a newer published version with
    // published_at NULL sorts first in PostgREST desc order, and an expired
    // version is absent from the wizard's effective-window list. Mirror the
    // wizard filter so the journey always targets the current version.
    `package_versions?select=id,definition&status=eq.published&effective_from=lte.${new Date().toISOString().slice(0,10)}&or=(effective_to.is.null,effective_to.gte.${new Date().toISOString().slice(0,10)})&order=published_at.desc.nullslast&limit=1`, planner.jwt), "package")[0];
  packageVersionId = pkg.id;
  const sections: { key: string; items?: string[] }[] = pkg.definition.sections ?? [];
  const scope = sections.find(s => (s.items ?? []).includes("FS-101"));
  if (!scope) throw new Error("published package no longer contains FS-101 — journey fixture drifted");
  scopeSectionKey = scope.key;
});

// Closes the previous test's context before opening the next — leaving contexts
// open let Playwright's failure snapshot/trace pick an unrelated leftover page.
let lastContext: BrowserContext | null = null;
async function personaPage(browser: { newContext: (o: object) => Promise<BrowserContext> }, key: keyof typeof PERSONAS): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({
    storageState: storageStatePath(key),
    ...(key === "inspector" ? {
      permissions: ["geolocation"],
      geolocation: { latitude: Number(factory.official_lat ?? 24.7136), longitude: Number(factory.official_lng ?? 46.6753), accuracy: 5 },
    } : {}),
  });
  lastContext = ctx;
  return ctx.newPage();
}

async function fillWizard(page: Page) {
  await page.getByPlaceholder(/CR number|Industrial License/i).fill(factory.factory_code);
  await page.locator(`input[name="factory_id"][value="${factory.id}"]`).check();

  // Selecting the factory conditionally renders the license (M01-036) and location
  // (M01-038) steps in the same React commit; wait for that render to land before
  // probing for the license radio's presence, since .count() (unlike .fill/.click)
  // does not auto-wait and would otherwise race the state update.
  const locationHeading = page.getByText(/3 · Confirm location/);
  await locationHeading.waitFor();
  const locationPanel = locationHeading.locator("..");

  // License step (M01-036) — check the single radio if this factory carries a license.
  const licenseRadio = page.locator('input[name="license_number"]');
  if (await licenseRadio.count()) await licenseRadio.check();

  // Location step (M01-038 / DM-004) — governed external/Senaei coordinates
  // are read-only master data. Older/manual fixtures may still expose an
  // editable pin; preserve that path without injecting overrides into the
  // governed path.
  const plannerLat = locationPanel.locator('input[name="planner_lat"]');
  const plannerLng = locationPanel.locator('input[name="planner_lng"]');
  const [latEditors, lngEditors] = await Promise.all([plannerLat.count(), plannerLng.count()]);
  expect(latEditors, "location editor must expose both coordinates or neither").toBe(lngEditors);
  if (latEditors > 0) {
    await plannerLat.fill("24.7136");
    await plannerLng.fill("46.6753");
  } else {
    await expect(locationPanel.getByText(/Read-only.*location master data cannot be changed in Planning/i)).toBeVisible();
    await expect(locationPanel.getByText("Location confirmed", { exact: true })).toBeVisible();
    await expect(plannerLat).toHaveCount(0);
    await expect(plannerLng).toHaveCount(0);
  }
  await locationPanel.locator('input[name="location_confirmed"]').check();

  // Planning commit 7c904b8d ("optional zero-many packages") replaced the
  // single-select package picker with zero-many checkboxes; check the current
  // published version's box instead.
  await page.locator(`input[name="package_version_id"][value="${packageVersionId}"]`).check();
  // Window must CONTAIN now: EXE-JOURNEY-OUTSIDE-WINDOW (20260721140000,
  // governed engine_settings.execution.journey_start_timing='inside_visit_window')
  // blocks journey start outside [window_start, window_end], which retired the
  // old far-future-window trick. The same exact minute-aligned window used by
  // the narrowly scoped audited predecessor rollover is submitted here; the
  // application still performs its ordinary conflict and authorization checks.
  await page.locator('input[name="window_start"]').fill(visitWindowStartInput);
  await page.locator('input[name="window_end"]').fill(visitWindowEndInput);
}

test("NEG: publish without an inspector is blocked, work preserved (M01-040/M01-041)", async ({ browser }) => {
  const page = await personaPage(browser, "planner");
  await page.goto("/planning/single");
  await fillWizard(page);
  await page.getByRole("button", { name: /publish visit/i }).click();
  const validation = page.locator('.sq-validation[role="alert"]');
  await expect(validation).toBeVisible();
  await expect(validation).toContainText("M01-040");
  await expect(page).toHaveURL(/\/planning\/single/); // work preserved, no navigation
});

test("P1 planner: single visit publishes (M01-034/036/038/040/041)", async ({ browser }) => {
  test.skip(!!RECOVERY_VISIT_ID, "recovering the exact governed active P1 visit");
  const page = await personaPage(browser, "planner");
  await page.goto("/planning/single");
  await fillWizard(page);
  const inspectorSelect = page.locator('select[name="inspector_id"]');
  const eligibleInspectorIds = await inspectorSelect.locator('option:not([value=""])').evaluateAll(
    options => options.map(option => (option as HTMLOptionElement).value),
  );
  expect(eligibleInspectorIds.length, "Planner selector must expose an eligible Inspector").toBeGreaterThan(0);
  expect(
    eligibleInspectorIds,
    "controlled Inspector must remain eligible in the governed Planner selector",
  ).toContain(inspectorUserId);
  await inspectorSelect.selectOption(inspectorUserId);
  await page.getByRole("button", { name: /submit for supervision/i }).click();
  await page.waitForURL(url =>
    url.pathname === "/planning/supervision" && UUID.test(url.searchParams.get("submitted") ?? ""),
    { timeout: 20_000 },
  );
  visitId = new URL(page.url()).searchParams.get("submitted")!;

  const supervisor = await journeySupervisorPage(browser);
  await supervisor.goto(`/planning/supervision?submitted=${visitId}`);
  const exactRequest = supervisor.locator("section.sq-card").filter({
    has: supervisor.locator(`input[name="visit_id"][value="${visitId}"]`),
  });
  await expect(exactRequest, "the exact P1 visit must have one pending supervision request").toHaveCount(1);
  const finalInspector = exactRequest.locator('select[name="inspector_id"]');
  const supervisorEligibleInspectorIds = await finalInspector.locator('option:not([value=""])').evaluateAll(
    options => options.map(option => (option as HTMLOptionElement).value),
  );
  expect(supervisorEligibleInspectorIds, "Supervisor queue must expose the controlled Inspector").toContain(inspectorUserId);
  await finalInspector.selectOption(inspectorUserId);
  await expect(finalInspector).toHaveValue(inspectorUserId);
  await exactRequest.getByRole("button", { name: /approve & release/i }).click();
  await expect(exactRequest.getByRole("status")).toHaveText("Visit approved, assigned, and released.");
  const supervisorSession = await login(PERSONAS.supervisor.email, PERSONAS.supervisor.password);
  const released = must(await rest("GET",
    `visits?id=eq.${visitId}&select=planning_status,assignments(inspector_id)`, supervisorSession.jwt),
  "verify released visit") as Array<{ planning_status: string; assignments: Array<{ inspector_id: string }> }>;
  expect(released).toEqual([{ planning_status: "published", assignments: [{ inspector_id: inspectorUserId }] }]);
});

test("P2 inspector: startup gate order, geofenced check-in, workspace, submit v1", async ({ browser }) => {
  const page = await journeyInspectorPage(browser);

  if (["submitted_v1", "reviewing_v1", "returned_v1", "submitted_v2", "reviewing_v2", "approved_v2"].includes(recoveryCheckpoint ?? "")) {
    await page.goto(`/field/inspection/${inspectionId}`);
    if (recoveryCheckpoint === "submitted_v1") {
      await expect(page.getByRole("heading", { name: "Submitted — final submitted version.", exact: true, level: 2 })).toBeVisible();
    }
    const inspector = await login(inspectorCreds.email, inspectorCreds.password);
    const versions = must(await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.1`, inspector.jwt), "verify resumed submission v1");
    expect(versions).toHaveLength(1);
    return;
  }

  // Assigned visit is visible on the field dashboard (RBAC-009 scope)
  await test.step("P2 Inspector opens the governed field journey", async () => {
    await page.goto("/field");
    await page.waitForURL(url => url.pathname === "/field");
  }, { timeout: 20_000 });
  // The dashboard replacement renders only the single "next" visit as a link
  // (FAB / Open directions); per-assignment cards are plain surfaces, and
  // leftover far-future assignments from prior runs can hold the next slot.
  // Navigate directly — assignment visibility is covered by RBAC-009 reads.
  // (Live cert Phase 8: the a.sq-surface card selector was stale.)

  if (recoveryCheckpoint === "inspection_started") {
    await page.goto(`/field/inspection/${inspectionId}`);
    await page.waitForURL(`/field/inspection/${inspectionId}`);
  } else {
    // Startup: four steps, enabled strictly in order (SB05)
    await page.goto(`/field/${visitId}`);
    const step = (re: RegExp) => page.getByRole("button", { name: re });

  // READINESS LEG (TASK-EXECUTION-MODULE-001 Phase 3B, D-010) — depends on
  // migrations 20260721120000 (readiness RPCs) and 20260721130000 (journey
  // readiness guard) being applied to the test database. While they are NOT
  // applied remotely the preparation panel never renders (the page detects
  // the missing readiness schema and serves the legacy flow), so this leg is
  // conditional and every later assertion keeps validating the old flow. Once
  // applied, readiness is mandatory — EXE-READY-REQUIRED guards journey start
  // server-side — so this leg saves + confirms the preparation BEFORE any
  // package download or journey start, exactly like a real inspector.
  const prepPanel = page.getByTestId("pre-execution-panel");
  if (await prepPanel.count() && !(await page.getByTestId("pre-execution-ready").count())) {
    await expect(prepPanel).toBeVisible();
    // Pick the first available in-window day (days at cap render disabled).
    await prepPanel.getByTestId("prep-day-available").first().click();
    await prepPanel.getByTestId("prep-save").click();
    await expect(prepPanel.getByTestId("prep-status")).toContainText("Preparation saved", { timeout: 15_000 });
    await prepPanel.getByTestId("prep-confirm").click();
    await expect(page.getByTestId("pre-execution-ready")).toBeVisible({ timeout: 15_000 });
    // Confirm triggers a full reload (D-027 anomaly — see PreExecution.tsx):
    // Startup's gate is re-derived from server truth on the fresh document.
    // On a loaded shared checkout that fresh read can transiently error into
    // the M02-001 scope page ("Visit not found") while the machine is
    // saturated; give it a bounded reload-and-wait before asserting.
    for (let i = 0; i < 3; i++) {
      if (!(await page.getByRole("heading", { name: /Visit not found/i }).count())) break;
      await page.waitForTimeout(3_000);
      await page.reload();
      await page.waitForTimeout(2_000);
    }
    await expect(page.getByTestId("readiness-gate-reason")).toHaveCount(0, { timeout: 30_000 });
    await expect(step(/1 ·/)).toBeEnabled({ timeout: 30_000 });
  }

  if (recoveryCheckpoint !== "after_checkin") {
    await expect(step(/2 ·/)).toBeDisabled();
    await step(/1 ·/).click();
    await step(/2 ·/).click();
    await step(/3 ·/).click();
  }
  if (recoveryCheckpoint === "after_checkin") {
    await expect(page.getByRole("heading", { name: "Arrival evidence", exact: true, level: 5 })).toBeVisible();
  } else {
    // The measured distance badge is intentionally transient client state and
    // is asserted only during the live check-in that produced it.
    await expect(page.locator(".sq-lozenge--success, .badge-compliant", { hasText: "inside fence" })).toBeVisible();
  }

  // M04-045 release certification — queue a comment-only arrival record through
  // the real IndexedDB outbox, then prove the live replay persisted the visit
  // linkage, new enum value and evidence_note column before inspection creation.
  const arrivalNote = `G12 arrival replay ${visitId}`;
  const arrivalSurface = page
    .getByRole("heading", { name: "Arrival evidence", exact: true, level: 5 })
    .locator("..");
  // Obsolete-test fix (Cycle 2 completion pass): this UI's field/button copy
  // was relabeled by the already-merged iPad geofence-override work
  // (commit 62916ee) — "Arrival note"/"Queue arrival evidence" became
  // "Arrival comment"/"Save arrival evidence". The underlying M04-045
  // requirement (visit_id-linked evidence, inspection_id null before an
  // inspection exists) is unchanged and verified below via a live read —
  // only the stale selectors are fixed here, per field/[visitId]/page.tsx
  // (strings.arrivalComment / strings.arrivalSave / strings.arrivalSaved)
  // and src/lib/offline.ts's processOutbox evidence leg.
  await arrivalSurface.getByLabel("Arrival comment").fill(arrivalNote);
  await arrivalSurface.getByRole("button", { name: "Save arrival evidence" }).click();
  await expect(arrivalSurface).toContainText("saved or queued for sync");
  const arrivalInspector = await login(inspectorCreds.email, inspectorCreds.password);
  const arrivalEvidence = await pollRest(async () => {
    const { data } = await rest("GET",
      `evidence?select=id,visit_id,inspection_id,linked_type,evidence_note,storage_path&visit_id=eq.${visitId}&linked_type=eq.arrival`,
      arrivalInspector.jwt);
    return Array.isArray(data) && data.some((row: { evidence_note?: string }) => row.evidence_note === arrivalNote)
      ? data.find((row: { evidence_note?: string }) => row.evidence_note === arrivalNote)
      : null;
  }, "arrival evidence replay");
  expect(arrivalEvidence).toMatchObject({
    visit_id: visitId,
    inspection_id: null,
    linked_type: "arrival",
    evidence_note: arrivalNote,
  });

  // M03-010 — mandatory pre-start confirmations (rep present + location confirmed) gate step 4.
  const checkboxes = page.locator('input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await step(/4 ·/).click();
  await page.waitForURL(/\/field\/inspection\/[0-9a-f-]+/, { timeout: 20_000 });
    inspectionId = page.url().match(/\/field\/inspection\/([0-9a-f-]+)/)![1];
  }

  if (!RECOVERY_VISIT_ID) {
    // NEG: submit on a newly created inspection starts unanswered — ERR-SUB-001 keeps it
    // in progress. A governed recovery record may already contain answers and
    // must never be forced back into this fresh-state assertion.
    const refusalState = page.getByText(/^\d+ blocking issue\(s\) — submission will be refused$/);
    await expect(refusalState).toBeVisible();
    const blockerCount = Number((await refusalState.innerText()).match(/^\d+/)?.[0]);
    expect(blockerCount, "negative submit must expose a positive governed blocker count").toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Review & submit — final version" })).toHaveAttribute("aria-disabled", "true");
  }

  // 1x1 PNG — satisfies the mandatory-evidence gate on a non-compliant answer (DEC-006).
  const PIXEL_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

  // Answer every item; FS-101 non-compliant (drives the V-FS-09 path)
  const sectionsNav = page.getByRole("navigation", { name: "Inspection sections" });
  const sectionCount = await sectionsNav.getByRole("listitem").count();
  expect(sectionCount, "governed inspection must expose at least one section").toBeGreaterThan(0);
  const answeredCodes = new Set<string>();
  for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
    const titles = page.locator("p").filter({ hasText: /^[A-Z]{2}-\d+ ·/ });
    const titleCount = await titles.count();
    for (let i = 0; i < titleCount; i++) {
      const title = titles.nth(i);
      const code = (await title.innerText()).match(/^([A-Z]{2}-\d+) ·/)?.[1];
      expect(code, "rendered governed question must expose its item code").toBeTruthy();
      expect(answeredCodes.has(code!), `governed question ${code} must render exactly once`).toBe(false);
      answeredCodes.add(code!);
      const q = title.locator("..").locator("..");
      const target = code === "FS-101";
      const btn = q.getByRole("button", { name: target ? /^non compliant$/i : /^compliant$/i });
      await expect(btn, `governed question ${code} must expose one named response`).toHaveCount(1);
      await btn.click();
      await expect(btn).toHaveAttribute("aria-pressed", "true");

      if (target) {
      // Mandatory evidence (M04-199/evidence_rule) — resume idempotently when
      // this exact question already has enough governed photo evidence. A new
      // capture may use only the uniquely named mandatory-photo control;
      // replacement remains a separate, explicitly governed action.
      const evidenceState = q.getByText(/^\d+\/\d+ evidence$/);
      await expect(evidenceState, "FS-101 must expose one unambiguous governed evidence count").toHaveCount(1);
      const evidenceMatch = (await evidenceState.innerText()).match(/^(\d+)\/(\d+) evidence$/);
      expect(evidenceMatch, "FS-101 evidence count must use the governed current/required format").toBeTruthy();
      const attachedEvidence = Number(evidenceMatch![1]);
      const requiredEvidence = Number(evidenceMatch![2]);
      expect(requiredEvidence, "FS-101 must require positive governed evidence").toBeGreaterThan(0);
      if (attachedEvidence < requiredEvidence) {
        const mandatoryPhoto = q.getByLabel("Mandatory photo", { exact: true });
        await expect(mandatoryPhoto, "missing FS-101 evidence requires exactly one Mandatory photo control").toHaveCount(1);
        await expect(q.getByLabel("Replace", { exact: true }), "replacement must not be used to satisfy missing evidence").toHaveCount(0);
        await mandatoryPhoto.setInputFiles({ name: "fs-101.png", mimeType: "image/png", buffer: PIXEL_PNG });
        // M04-109 — attaching a photo opens an annotate-before-attach modal
        // (pen/highlight over the image) that blocks the rest of the page
        // until confirmed or discarded.
        const annotateDialog = page.getByRole("dialog", { name: /annotate photo/i });
        await annotateDialog.getByRole("button", { name: /attach evidence/i }).click();
        await expect(annotateDialog).toBeHidden();
        const ocrDialog = page.getByRole("dialog", { name: "Attach evidence · OCR scan", exact: true });
        await expect(ocrDialog).toBeVisible();
        await expect(ocrDialog).toContainText("Ready to attach as evidence");
        const attachReviewedEvidence = ocrDialog.getByRole("button", { name: "Attach evidence", exact: true });
        await expect(attachReviewedEvidence).toHaveCount(1);
        await attachReviewedEvidence.click();
        await expect(ocrDialog).toBeHidden();
        await expect(q).toContainText("1/1 evidence");
      } else {
        expect(attachedEvidence, "existing FS-101 evidence must satisfy the governed minimum").toBeGreaterThanOrEqual(requiredEvidence);
      }
      // Blocking action form (M04-171..184) — use the approved accessible
      // fields and the existing deterministic golden content. The governed due
      // date is product-generated from the configured action window; preserve it.
      const deterministicCorrection = "G10 Playwright golden journey — corrective action.";
      for (const name of ["Owner name*", "Owner role*", "Required correction*"]) {
        const field = q.getByRole("textbox", { name, exact: true });
        await expect(field, `required action field ${name} must render exactly once`).toHaveCount(1);
        await field.fill(deterministicCorrection);
        await field.blur();
      }
      const governedDueAt = q.getByRole("textbox", { name: "Due at*", exact: true });
      await expect(governedDueAt, "governed due date must render exactly once").toHaveCount(1);
      expect(await governedDueAt.inputValue(), "governed action-form due date must be preconfigured").toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
    if (sectionIndex < sectionCount - 1) await page.getByRole("button", { name: "Next section" }).click();
  }
  expect(answeredCodes.size, "golden package must render governed checklist items").toBeGreaterThan(0);
  expect([...answeredCodes].filter(code => code === "FS-101")).toHaveLength(1);

  const findingNarrative = page.getByRole("textbox", { name: "Finding narrative*", exact: true });
  await expect(findingNarrative, "required finding narrative must render exactly once").toHaveCount(1);
  await findingNarrative.fill("G10 Playwright golden journey — corrective action.");
  await findingNarrative.blur();
  await expect(page.getByTestId("finding-status-FS-101"), "finding must persist before final review is requested").toHaveText("Finding saved", { timeout: 30_000 });

  await expect(page.getByText("All blocking validations pass — ready to submit", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/^\d+ blocking issue\(s\) — submission will be refused$/)).toHaveCount(0);
  const finalSubmit = page.getByRole("button", { name: "Review & submit — final version" });
  await expect(finalSubmit).toHaveAttribute("aria-disabled", "false", { timeout: 30_000 });
  await finalSubmit.click();
  const finalReviewHeading = page.getByRole("heading", { name: "Final review", exact: true });
  await expect(finalReviewHeading).toBeVisible();
  const finalReview = finalReviewHeading.locator("..").locator("..");
  const confirmSubmit = finalReview.getByRole("button", { name: "Confirm and submit", exact: true });
  await expect(confirmSubmit).toBeEnabled();
  await confirmSubmit.click();
  await signAndConfirm(page); // DEC-009 acknowledgement gate
  // Server truth: v1 exists and inspection is submitted
  const inspector = await login(inspectorCreds.email, inspectorCreds.password);
  await pollRest(async () => {
    const { data } = await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.1`, inspector.jwt);
    return Array.isArray(data) && data.length === 1 ? data : null;
  }, "submission v1");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Submitted — final submitted version.", exact: true, level: 2 })).toBeVisible({ timeout: 30_000 });
});

test("P3 reviewer: RETURN with exact scope and mandatory reason (M06-006, STM-REV-003)", async ({ browser }) => {
  if (["returned_v1", "submitted_v2", "reviewing_v2", "approved_v2"].includes(recoveryCheckpoint ?? "")) {
    const reviewer = await login(PERSONAS.reviewer.email, PERSONAS.reviewer.password);
    const decided = must(await rest("GET", `reviews?select=decision,returned_sections&inspection_id=eq.${inspectionId}&decision=eq.return`, reviewer.jwt), "verify resumed return v1");
    expect(decided).toEqual([{ decision: "return", returned_sections: [scopeSectionKey] }]);
    return;
  }
  const page = await personaPage(browser, "reviewer");
  await page.goto(`/reviews/${inspectionId}`); // CD-028 scan-first: opening is read-only, changes nothing
  await expect(page.locator(".sq-table, table")).toContainText("FS-101");

  // CD-028 leg 5 — starting the review is now an explicit, audited action
  // (opening the workspace no longer creates the review as a side-effect).
  if (recoveryCheckpoint !== "reviewing_v1") {
    const startReview = page.getByRole("button", { name: "Start review", exact: true });
    await expect(startReview).toHaveCount(1);
    await startReview.click();
  }
  const returnDecision = page.locator('input[name="decision"][value="return"]');
  await expect(returnDecision).toHaveCount(1, { timeout: 40_000 });
  await returnDecision.check();
  const returnedSection = page.locator(`input[name="returned_section"][value="${scopeSectionKey}"]`);
  await expect(returnedSection).toHaveCount(1);
  await returnedSection.check();
  const returnReason = page.locator('textarea[name="reason"]');
  await expect(returnReason).toHaveCount(1);
  await returnReason.fill("FS-101 evidence insufficient — retag and re-shoot (G10 Playwright golden journey).");
  const reviewConfirmation = page.getByRole("button", { name: "Review confirmation", exact: true });
  await expect(reviewConfirmation).toBeEnabled();
  await reviewConfirmation.click();
  await expect(page.getByRole("heading", { name: "Review decision before recording", exact: true })).toBeVisible();
  const confirmReturn = page.getByRole("button", { name: "Confirm return", exact: true });
  await expect(confirmReturn).toBeEnabled();
  await confirmReturn.click();
  await page.waitForURL(url => url.pathname === `/reviews/${inspectionId}` && url.searchParams.get("decision") === "return", { timeout: 20_000 });
});

test("P4 inspector: correct only the returned scope, resubmit v2 (STM-COR-002, M06-043)", async ({ browser }) => {
  if (["submitted_v2", "reviewing_v2", "approved_v2"].includes(recoveryCheckpoint ?? "")) {
    const inspector = await login(inspectorCreds.email, inspectorCreds.password);
    const versions = must(await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.2`, inspector.jwt), "verify resumed submission v2");
    expect(versions).toHaveLength(1);
    return;
  }
  const page = await journeyInspectorPage(browser);
  await page.goto(`/field/inspection/${inspectionId}`);

  await expect(page.getByText(`Returned — correction scope: ${scopeSectionKey}.`, { exact: true })).toBeVisible();
  const openCorrection = page.getByRole("button", { name: "Open correction mode", exact: true });
  await expect(openCorrection).toHaveCount(1);
  await openCorrection.click();

  const q101Title = page.locator("p").filter({ hasText: /^FS-101 ·/ });
  await expect(q101Title, "returned FS-101 must remain uniquely addressable").toHaveCount(1);
  const q101 = q101Title.locator("..").locator("..");
  await q101.getByRole("button", { name: /^compliant$/i }).click();

  await expect(page.getByText("All blocking validations pass — ready to submit", { exact: true })).toBeVisible({ timeout: 30_000 });
  const resubmit = page.getByRole("button", { name: "Resubmit — version 2", exact: true });
  await expect(resubmit).toHaveAttribute("aria-disabled", "false", { timeout: 30_000 });
  await resubmit.click();
  const resubmitReviewHeading = page.getByRole("heading", { name: "Final review", exact: true });
  await expect(resubmitReviewHeading).toBeVisible();
  const resubmitReview = resubmitReviewHeading.locator("..").locator("..");
  const confirmResubmit = resubmitReview.getByRole("button", { name: "Confirm and submit", exact: true });
  await expect(confirmResubmit).toBeEnabled();
  await confirmResubmit.click();
  await signAndConfirm(page); // DEC-009 acknowledgement gate
  // Two immutable banners are legitimately on screen post-resubmit (locked
  // read-only sections + the submission confirmation) — scope to the one
  // this assertion actually cares about, not just "first".
  const inspector = await login(inspectorCreds.email, inspectorCreds.password);
  await pollRest(async () => {
    const { data } = await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.2`, inspector.jwt);
    return Array.isArray(data) && data.length === 1 ? data : null;
  }, "submission v2");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Submitted — final submitted version.", exact: true, level: 2 })).toBeVisible({ timeout: 30_000 });
});

test("P5 reviewer: APPROVE v2; decided reviews lock; v1 stays intact (M06-009)", async ({ browser }) => {
  const page = await personaPage(browser, "reviewer");
  await page.goto(`/reviews/${inspectionId}`);
  if (recoveryCheckpoint !== "approved_v2") {
    await expect(page.getByRole("tab", { name: "Prior decision: 1", exact: true })).toBeVisible();

    // CD-028 leg 5 — v2 review is started explicitly before the approve decision.
    if (recoveryCheckpoint !== "reviewing_v2") {
      const startReview = page.getByRole("button", { name: "Start review", exact: true });
      await expect(startReview).toHaveCount(1);
      await startReview.click();
    }
    const approveDecision = page.locator('input[name="decision"][value="approve"]');
    await expect(approveDecision).toHaveCount(1, { timeout: 40_000 });
    await approveDecision.check();
    const approveReason = page.locator('textarea[name="reason"]');
    await expect(approveReason).toHaveCount(1);
    await approveReason.fill("Corrected evidence adequate (G10 Playwright golden journey).");
    const reviewConfirmation = page.getByRole("button", { name: "Review confirmation", exact: true });
    await expect(reviewConfirmation).toBeEnabled();
    await reviewConfirmation.click();
    await expect(page.getByRole("heading", { name: "Review decision before recording", exact: true })).toBeVisible();
    const confirmApprove = page.getByRole("button", { name: "Confirm approve", exact: true });
    await expect(confirmApprove).toBeEnabled();
    await confirmApprove.click();
    await page.waitForURL(url => url.pathname === `/reviews/${inspectionId}` && url.searchParams.get("decision") === "approve", { timeout: 20_000 });
  }

  // Decided = locked: reopening the workspace offers no decision panel (M06-009)
  await page.goto(`/reviews/${inspectionId}`);
  await expect(page.getByText("No open decision")).toBeVisible();

  // Final server assertions — mirror of the B10 evidence script
  const reviewer = await login(PERSONAS.reviewer.email, PERSONAS.reviewer.password);
  const subs = must(await rest("GET",
    `submission_versions?select=version_number,snapshot&inspection_id=eq.${inspectionId}&order=version_number`, reviewer.jwt), "versions");
  expect(subs.map((s: { version_number: number }) => s.version_number)).toEqual([1, 2]);
  expect(subs[0].snapshot.answers["FS-101"], "v1 immutable — original non_compliant intact").toBe("non_compliant");
  expect(subs[1].snapshot.answers["FS-101"]).toBe("compliant");
  const revs = must(await rest("GET",
    `reviews?select=decision,returned_sections&inspection_id=eq.${inspectionId}&order=decided_at`, reviewer.jwt), "reviews");
  expect(revs.map((r: { decision: string }) => r.decision)).toEqual(["return", "approve"]);
  expect(revs[0].returned_sections).toEqual([scopeSectionKey]);

  const ins = must(await rest("GET", `inspections?select=status&id=eq.${inspectionId}`, reviewer.jwt), "inspection")[0];
  expect(ins.status).toBe("approved");
});
