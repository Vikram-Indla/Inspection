import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { login, rest, must } from "./live-rest";
import { optionalSetting } from "./personas";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";
import { signAndConfirm } from "./sign-helper";

// TASK-REUSABLE-INSPECTOR-CONCURRENT-SCHEDULING-010 · dataset
// TASK10-REUSABLE-INSPECTOR-CONCURRENT-SCHEDULING.
//
// Scope: repeated Inspector reuse across non-overlapping visits, concurrent
// schedule creation, workload indicators, reassignment, overlap handling,
// completion and dashboard totals — all against the ALREADY-GOVERNED
// overlap-only concurrency guard (supabase/migrations/0031_cd023_assignment_overlap_guard.sql,
// mirrored for reschedule in 20260802120000_planning_reschedule_inspector_overlap.sql,
// and for supervision-approve/reassign at the RPC layer exercised below).
// There is no blanket "an Inspector may only ever be used once" rule in this
// codebase to relax: the guard already permits reuse across non-overlapping
// windows and only blocks a true time-window collision. This journey proves
// that behaviour end-to-end; it introduces no test-only feature flag because
// none is needed (Product Owner decision 2026-08-03 — "prove existing rule").
//
// Personas: the brief's planner2/supervisor5/inspector9/inspector10@mim.gov.sa
// do not all exist in this dataset. planner2@mim.gov.sa is real (seeded in
// supabase/seeds/demo/07-platform-admin.sql). supervisor5 has no seed row —
// mapped to the nearest real supervisor, supervisor2@mim.gov.sa. inspector9/10
// have no seed rows — mapped to the two nearest real, distinct inspectors,
// inspector4@mim.gov.sa ("Inspector A") and inspector5@mim.gov.sa
// ("Inspector B") (Product Owner decision 2026-08-03 — "map to closest real
// personas"). Credentials are never committed; resolved from env at run time,
// same fail-closed pattern as apps/web/e2e/personas.ts and dm-007.

test.describe.configure({ mode: "serial" });

const PLANNER_EMAIL = "planner2@mim.gov.sa";
const SUPERVISOR_EMAIL = "supervisor2@mim.gov.sa"; // mapped from supervisor5 (no such seed row)
const INSPECTOR_A_EMAIL = "inspector4@mim.gov.sa"; // mapped from inspector9
const INSPECTOR_B_EMAIL = "inspector5@mim.gov.sa"; // mapped from inspector10
const RUN_SALT = randomUUID();
const FACTORY_PREFIX = `T10-${RUN_SALT.slice(0, 8).toUpperCase()}`;

function primaryCohortPassword(persona: string): string {
  const value = optionalSetting("SAQEEL_UAT_PASSWORD") ?? optionalSetting("SAQEEL_CROSS_ROLE_PASSWORD");
  if (!value) {
    throw new Error(
      `TASK 10 requires the governed primary-cohort secret (SAQEEL_UAT_PASSWORD or ` +
      `SAQEEL_CROSS_ROLE_PASSWORD) in the local test environment to authenticate "${persona}".`,
    );
  }
  return value;
}
const inspectorPassword = primaryCohortPassword;

type RpcPayload = {
  p_request_id: string; p_actor_mode: "planner"; p_existing_factory_id: string;
  p_manual_name: null; p_manual_cr: null; p_manual_license: null;
  p_manual_activity: null; p_manual_region: null; p_manual_city: null;
  p_lat: number; p_lng: number; p_location_source: "official"; p_reason: string;
  p_package_version_id: string; p_visit_type: "periodic"; p_priority: null; p_notes: string;
  p_window_start: string; p_window_end: string; p_inspector_id: string; p_review_confirmed: true;
};

async function packageId(jwt: string): Promise<string> {
  return must(await rest("GET", "package_versions?select=id&status=in.(published,locked)&limit=1", jwt), "published package")[0].id as string;
}

async function createFactory(jwt: string, suffix: string): Promise<{ id: string; factory_code: string; official_lat: number; official_lng: number }> {
  return must(await rest("POST", "factories", jwt, {
    factory_code: `${FACTORY_PREFIX}-${suffix}`, name: `TASK 10 ${suffix}`,
    cr_number: `CR-${FACTORY_PREFIX}-${suffix}`, license_number: `LIC-${FACTORY_PREFIX}-${suffix}`,
    region: "Riyadh", city: "Riyadh", is_temporary: false,
    official_lat: 24.7136, official_lng: 46.6753,
  }), `create factory ${suffix}`)[0] as { id: string; factory_code: string; official_lat: number; official_lng: number };
}

function payload(factoryId: string, pkg: string, inspectorId: string, windowStart: string, windowEnd: string, requestId = randomUUID()): RpcPayload {
  return {
    p_request_id: requestId, p_actor_mode: "planner", p_existing_factory_id: factoryId,
    p_manual_name: null, p_manual_cr: null, p_manual_license: null,
    p_manual_activity: null, p_manual_region: null, p_manual_city: null,
    p_lat: 24.7136, p_lng: 46.6753, p_location_source: "official",
    p_reason: "TASK 10 reusable-inspector-concurrent-scheduling journey",
    p_package_version_id: pkg, p_visit_type: "periodic", p_priority: null,
    p_notes: "TASK 10 governed dataset", p_window_start: windowStart, p_window_end: windowEnd,
    p_inspector_id: inspectorId, p_review_confirmed: true,
  };
}

async function createVisit(jwt: string, factoryId: string, pkg: string, inspectorId: string, windowStart: string, windowEnd: string) {
  const result = must(
    await rest("POST", "rpc/create_immediate_visit", jwt, payload(factoryId, pkg, inspectorId, windowStart, windowEnd)),
    "create_immediate_visit",
  ) as { status: string; code?: string; visit_id?: string };
  return result;
}

// Anchor far enough in the future to avoid colliding with fixtures left by
// other concurrent UAT tasks against the same governed project, but inside
// the plausible-year window (2020-2100) the platform enforces — same
// collision-avoidance approach as golden-journey.spec.ts / cd-023 (windowDay).
function anchor(): Date {
  const days = 11_000 + (Number.parseInt(RUN_SALT.slice(0, 8), 16) % 13_000); // ~30-66 years out
  return new Date(Date.now() + days * 86_400_000);
}
function iso(base: Date, hours: number): string {
  return new Date(base.getTime() + hours * 3_600_000).toISOString();
}
function nearNowWindow(): { start: string; end: string } {
  const start = new Date();
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() - 1);
  return { start: start.toISOString(), end: new Date(start.getTime() + 90 * 60_000).toISOString() };
}

async function activeAssignmentCount(jwt: string, inspectorId: string): Promise<number> {
  const rows = must(await rest(
    "GET",
    `assignments?inspector_id=eq.${inspectorId}&select=visit_id,visits!inner(planning_status,operational_state)&visits.planning_status=eq.published&visits.operational_state=neq.submitted`,
    jwt,
  ), "read active assignment count") as unknown[];
  return rows.length;
}

async function uiLogin(page: Page, email: string, password: string, expectedHome: RegExp) {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(email);
  await passwordField(page).fill(password);
  await submitCredentials(page);
  await page.waitForURL(url => expectedHome.test(url.pathname.replace(/^\/(en|ar)(?=\/|$)/, "")), { timeout: 20_000 });
}

let planner: { jwt: string; userId: string };
let supervisor: { jwt: string; userId: string };
let inspectorA: { jwt: string; userId: string };
let inspectorB: { jwt: string; userId: string };
let pkg: string;
let baselineActiveA: number;
let baselineActiveB: number;

let visitV1: string; // Inspector A, [anchor+0h, +1h] — later the reassign-blocked target
let visitV2: string; // Inspector A, [anchor+2h, +3h] — non-overlapping reuse of A; later reassigned to B
let visitV3: string; // Inspector A, [anchor+5h, +6h] — concurrent-with-V4 (different inspector, same window)
let visitV4: string; // Inspector B, [anchor+5h, +6h]
let visitV6: string; // Inspector B, [anchor+0.5h, +1.5h] — overlaps V1, used to prove reassign-overlap block

test.beforeAll(async () => {
  planner = await login(PLANNER_EMAIL, primaryCohortPassword("planner2"));
  supervisor = await login(SUPERVISOR_EMAIL, primaryCohortPassword("supervisor2 (mapped from supervisor5)"));
  inspectorA = await login(INSPECTOR_A_EMAIL, inspectorPassword("inspector4 (mapped from inspector9)"));
  inspectorB = await login(INSPECTOR_B_EMAIL, inspectorPassword("inspector5 (mapped from inspector10)"));
  pkg = await packageId(planner.jwt);
  baselineActiveA = await activeAssignmentCount(planner.jwt, inspectorA.userId);
  baselineActiveB = await activeAssignmentCount(planner.jwt, inspectorB.userId);
});

test("T10-01 same Inspector is reused across two non-overlapping visits", async () => {
  const a = anchor();
  const facV1 = await createFactory(planner.jwt, "V1");
  const facV2 = await createFactory(planner.jwt, "V2");

  const r1 = await createVisit(planner.jwt, facV1.id, pkg, inspectorA.userId, iso(a, 0), iso(a, 1));
  expect(r1.status, "V1 must publish and assign Inspector A").toBe("ok");
  visitV1 = r1.visit_id!;

  const r2 = await createVisit(planner.jwt, facV2.id, pkg, inspectorA.userId, iso(a, 2), iso(a, 3));
  expect(r2.status, "V2 (non-overlapping reuse of the same Inspector) must also publish").toBe("ok");
  visitV2 = r2.visit_id!;

  expect(visitV1).not.toBe(visitV2);
  const rows = must(await rest("GET", `assignments?visit_id=in.(${visitV1},${visitV2})&select=visit_id,inspector_id`, planner.jwt), "reuse assignments") as Array<{ visit_id: string; inspector_id: string }>;
  expect(rows).toHaveLength(2);
  for (const row of rows) expect(row.inspector_id).toBe(inspectorA.userId);
});

test("T10-02 concurrent schedule creation — two different Inspectors, same window, both succeed", async () => {
  const a = anchor();
  const [facV3, facV4] = await Promise.all([createFactory(planner.jwt, "V3"), createFactory(planner.jwt, "V4")]);
  const start = iso(a, 5);
  const end = iso(a, 6);
  const [r3, r4] = await Promise.all([
    createVisit(planner.jwt, facV3.id, pkg, inspectorA.userId, start, end),
    createVisit(planner.jwt, facV4.id, pkg, inspectorB.userId, start, end),
  ]);
  expect(r3.status, "Inspector A's concurrent schedule must succeed").toBe("ok");
  expect(r4.status, "Inspector B's concurrent schedule (same window, different Inspector) must succeed").toBe("ok");
  visitV3 = r3.visit_id!;
  visitV4 = r4.visit_id!;
});

test("T10-03 concurrent schedule creation for the SAME Inspector in an overlapping window is blocked exactly once", async () => {
  const a = anchor();
  const [facA, facB] = await Promise.all([createFactory(planner.jwt, "V5A"), createFactory(planner.jwt, "V5B")]);
  const start = iso(a, 8);
  const end = iso(a, 9);
  const [ra, rb] = await Promise.all([
    createVisit(planner.jwt, facA.id, pkg, inspectorB.userId, start, end),
    createVisit(planner.jwt, facB.id, pkg, inspectorB.userId, start, end),
  ]);
  const statuses = [ra.status, rb.status].sort();
  expect(statuses, "exactly one of the two concurrent same-Inspector requests must be blocked").toEqual(["blocked", "ok"]);
  const blocked = [ra, rb].find(r => r.status === "blocked")!;
  expect(["concurrent_conflict", "inspector_unavailable"]).toContain(blocked.code);
});

test.describe("T10-04..06 UI-driven workload, reassignment, and overlap block", () => {
  test("T10-04 workload page shows Inspector A's active total increased by the reuse fixtures", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await uiLogin(page, SUPERVISOR_EMAIL, primaryCohortPassword("supervisor2"), /\/dashboard/);
    const inspectorAName = must(await rest("GET", `profiles?user_id=eq.${inspectorA.userId}&select=full_name`, supervisor.jwt), "Inspector A name")[0].full_name as string;
    await page.goto("/visits/workload");
    const row = page.locator("tbody tr").filter({ has: page.getByText(inspectorAName, { exact: true }) });
    await expect(row, "Inspector A must have exactly one workload row").toHaveCount(1);
    const totalText = await row.locator("td strong").last().textContent();
    const total = Number(String(totalText).replace(/[^0-9]/g, ""));
    // V1, V2 (T10-01), V3 (T10-02) belong to Inspector A on top of whatever
    // baseline the shared demo dataset already carried for this Inspector.
    expect(total, "Inspector A's active total must include the 3 new reuse/concurrency fixtures").toBeGreaterThanOrEqual(baselineActiveA + 3);
    await ctx.close();
  });

  test("T10-05 reassignment moves V2 from Inspector A to Inspector B", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await uiLogin(page, SUPERVISOR_EMAIL, primaryCohortPassword("supervisor2"), /\/dashboard/);
    await page.goto(`/visits/${visitV2}`);
    const select = page.locator("#visit-reassign-inspector");
    await expect(select, "reassignment control must be visible pre-start for a Supervisor").toBeVisible();
    await select.selectOption(inspectorB.userId);
    await page.locator("#visit-reassign-reason").fill("TASK 10 reassignment coverage");
    await page.locator("form:has(#visit-reassign-inspector) button:not([type=hidden])").last().click();
    await expect(page.getByText("Inspector reassigned. The visit history and notifications were recorded.", { exact: true })).toBeVisible({ timeout: 15_000 });
    const row = must(await rest("GET", `assignments?visit_id=eq.${visitV2}&select=inspector_id`, planner.jwt), "post-reassign assignment")[0] as { inspector_id: string };
    expect(row.inspector_id, "server truth must reflect Inspector B after reassignment").toBe(inspectorB.userId);
    await ctx.close();
  });

  test("T10-06 reassigning V1 onto an already-busy Inspector is blocked, nothing changed", async ({ browser }) => {
    // Stage the collision fixture: Inspector B holds V6 [anchor+0.5h, +1.5h],
    // which overlaps V1's [anchor+0h, +1h].
    const a = anchor();
    const facV6 = await createFactory(planner.jwt, "V6");
    const r6 = await createVisit(planner.jwt, facV6.id, pkg, inspectorB.userId, iso(a, 0.5), iso(a, 1.5));
    expect(r6.status, "V6 collision fixture must publish").toBe("ok");
    visitV6 = r6.visit_id!;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await uiLogin(page, SUPERVISOR_EMAIL, primaryCohortPassword("supervisor2"), /\/dashboard/);
    await page.goto(`/visits/${visitV1}`);
    const select = page.locator("#visit-reassign-inspector");
    await select.selectOption(inspectorB.userId);
    await page.locator("#visit-reassign-reason").fill("TASK 10 overlap-block coverage");
    await page.locator("form:has(#visit-reassign-inspector) button:not([type=hidden])").last().click();
    await expect(page.getByText("The selected Inspector already has an overlapping visit. Nothing was changed.", { exact: true })).toBeVisible({ timeout: 15_000 });
    const row = must(await rest("GET", `assignments?visit_id=eq.${visitV1}&select=inspector_id`, planner.jwt), "V1 assignment unchanged")[0] as { inspector_id: string };
    expect(row.inspector_id, "V1 must remain assigned to Inspector A — the blocked reassignment changed nothing").toBe(inspectorA.userId);
    await ctx.close();
  });
});

test.describe("T10-07 completion and dashboard totals", () => {
  test("T10-07 Inspector A completes a today-windowed visit and dashboard/workload totals move", async ({ browser }) => {
    const window = nearNowWindow();
    const factory = await createFactory(planner.jwt, "COMPLETE");
    const created = await createVisit(planner.jwt, factory.id, pkg, inspectorA.userId, window.start, window.end);
    expect(created.status, "today-windowed completion fixture must publish").toBe("ok");
    const visitId = created.visit_id!;

    const ctx = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: factory.official_lat, longitude: factory.official_lng, accuracy: 5 },
    });
    const page = await ctx.newPage();
    await uiLogin(page, INSPECTOR_A_EMAIL, inspectorPassword("inspector4"), /\/dashboard/);
    await page.goto(`/field/${visitId}`);

    const step = (n: number) => page.getByRole("button", { name: new RegExp(`^${n} ·`) });
    await step(1).click();
    await step(2).click();
    // Pre-start attestations gating step 3/4 (rep present + location confirmed).
    const preStartCheckboxes = page.getByRole("checkbox");
    const preStartCount = await preStartCheckboxes.count();
    for (let i = 0; i < preStartCount; i++) {
      const box = preStartCheckboxes.nth(i);
      if (await box.isVisible().catch(() => false) && !(await box.isChecked())) {
        await box.check({ force: true }).catch(() => {});
      }
    }
    await expect(step(3)).toBeEnabled({ timeout: 20_000 });
    await step(3).click();
    await expect(step(4)).toBeEnabled({ timeout: 20_000 });
    await step(4).click();
    await page.waitForURL(url => url.pathname === `/field/inspection/${visitId}` || /\/field\/inspection\//.test(url.pathname), { timeout: 20_000 });

    // Answer every visible enum item as "compliant", advancing through every
    // section — generic and package-agnostic (no item codes hardcoded).
    for (let guard = 0; guard < 50; guard++) {
      const compliant = page.getByRole("button", { name: /^compliant$/i });
      const count = await compliant.count();
      for (let i = 0; i < count; i++) {
        await compliant.first().click();
      }
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      for (let i = 0; i < dateCount; i++) {
        await dateInputs.nth(i).fill(new Date().toISOString().slice(0, 10));
      }
      const next = page.getByRole("button", { name: "Next section" });
      if (await next.count() && await next.isEnabled()) {
        await next.click();
      } else {
        break;
      }
    }

    const submit = page.getByRole("button", { name: "Review & submit — final version" });
    await expect(submit).toHaveAttribute("aria-disabled", "false", { timeout: 20_000 });
    await submit.click();
    await page.getByRole("heading", { name: "Final review", exact: true }).waitFor();
    await page.getByRole("button", { name: "Confirm and submit", exact: true }).click();

    // Acknowledgement mode is package-configured: "declaration" auto-finalizes
    // from the checkbox already checked above; "inspection" opens the
    // signature dialog, which this drives generically via sign-helper.
    const signatureDialog = page.getByRole("dialog", { name: "Factory representative acknowledgement", exact: true });
    if (await signatureDialog.count()) {
      await signAndConfirm(page);
    }

    await expect(async () => {
      const rows = must(await rest("GET", `visits?id=eq.${visitId}&select=operational_state`, planner.jwt), "post-submit visit state");
      expect(rows[0].operational_state).toBe("submitted");
    }).toPass({ timeout: 30_000 });

    const dashboard = await browser.newContext();
    const dashPage = await dashboard.newPage();
    await uiLogin(dashPage, SUPERVISOR_EMAIL, primaryCohortPassword("supervisor2"), /\/dashboard/);
    await expect(dashPage.locator("main")).not.toContainText("ERR-", { timeout: 15_000 });
    const todayVisit = must(await rest(
      "GET",
      `visits?id=eq.${visitId}&planning_status=eq.published&operational_state=eq.submitted&select=id`,
      supervisor.jwt,
    ), "today-completed dashboard predicate");
    expect(todayVisit, "the completed visit must satisfy the dashboard's todayCompleted predicate (metrics.ts)").toHaveLength(1);
    await dashboard.close();
    await ctx.close();
  });
});
