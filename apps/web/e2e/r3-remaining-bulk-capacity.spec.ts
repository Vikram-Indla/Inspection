import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";

// R3 — remaining bulk capacity certification, restated on the supervision
// lifecycle (20260729024000 bulk submit, 20260729021000 per-visit decision).
// Bulk publishing no longer allocates inspectors planner-side; the capacity
// boundary the platform enforces today is the supervisor decision guard:
// an inspector already assigned inside the window is refused with
// PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE and nothing is published.
test.use({ storageState: storageStatePath("planner") });
test.describe.configure({ mode: "serial" });

const ALL_REGIONS_CT = encodeURIComponent(JSON.stringify({ k: "g", c: "all", n: [{ k: "c", f: "region", o: "neq", v: "__none__" }] }));
const TEST_WINDOW = () => {
  const dayOffset = 200 + Math.floor(Math.random() * 200);
  const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
  const end = new Date(Date.now() + dayOffset * 86400e3 + 2 * 3600e3).toISOString().slice(0, 16);
  return { start, end };
};

let plannerJwt = "";
let plannerUserId = "";
let supervisorJwt = "";
let twoFactories: string[] = [];
let publishedPlanId = "";
let visitA = "";
let visitB = "";
let inspectorOne = "";
let inspectorTwo = "";

// CR/licence writes are governed to compliance/security/workflow admins, so
// the two targets come from the live canonical registry: single-licence,
// located, inside the planner's region, without an active periodic visit
// (the same discovery contract as cd-025-plan-review-publish.spec.ts).
const ACTIVE_PERIODIC = "visit_type=eq.periodic&planning_status=in.(draft,validated,pending_supervision,published,returned)";
async function discoverFreeCanonicalTargets(count: number): Promise<string[]> {
  const licences = must(await rest("GET",
    "industrial_licenses?select=factory_id&commercial_registration_id=not.is.null&limit=5000",
    plannerJwt), "licence registry") as { factory_id: string }[];
  const licenceCount = new Map<string, number>();
  for (const row of licences) licenceCount.set(row.factory_id, (licenceCount.get(row.factory_id) ?? 0) + 1);
  const singles = [...licenceCount.keys()].filter(id => licenceCount.get(id) === 1);
  const [profile] = must(await rest("GET", `profiles?select=region&user_id=eq.${plannerUserId}`, plannerJwt), "planner profile") as { region: string | null }[];
  const region = profile?.region?.trim() ?? "";
  const regionFilter = region && region !== "National" ? `&region=eq.${encodeURIComponent(region)}` : "";
  const located = must(await rest("GET",
    `factories?select=id&id=in.(${singles.join(",")})&official_lat=not.is.null&official_lng=not.is.null&is_temporary=eq.false${regionFilter}`,
    plannerJwt), "located canonical factories") as { id: string }[];
  // Fixture hygiene (R3 cleanup ledger): synthetic runs left far-future
  // windows (2060+) squatting on the canonical registry. Only unmistakably
  // synthetic rows — periodic visits on these targets starting more than a
  // year out — are released, through the planner's own governed RLS scope;
  // near-term demo trail windows are never touched.
  const horizon = new Date(Date.now() + 365 * 86400e3).toISOString();
  const locatedIds = located.map(f => f.id);
  const farFuture = must(await rest("GET",
    `visits?select=id,factory_id&${ACTIVE_PERIODIC}&factory_id=in.(${locatedIds.join(",")})&window_start=gt.${horizon}`,
    plannerJwt), "far-future synthetic visits") as { id: string }[];
  for (const v of farFuture) {
    await rest("PATCH", `visits?id=eq.${v.id}`, plannerJwt, { planning_status: "cancelled" }, "return=minimal");
  }
  const elapsedUndecided = must(await rest("GET",
    `visits?select=id&visit_type=eq.periodic&planning_status=eq.pending_supervision&factory_id=in.(${locatedIds.join(",")})&window_end=lt.${new Date().toISOString()}`,
    plannerJwt), "elapsed undecided submissions") as { id: string }[];
  for (const v of elapsedUndecided) {
    await rest("POST", "rpc/decide_single_visit_supervision", supervisorJwt, {
      p_visit_id: v.id, p_decision: "reject", p_inspector_id: null, p_reason: "R3 hygiene — submission window already elapsed",
    });
  }
  const active = must(await rest("GET", `visits?select=factory_id&${ACTIVE_PERIODIC}&limit=5000`, plannerJwt), "active periodic visits") as { factory_id: string }[];
  const busySet = new Set(active.map(v => v.factory_id));
  const free = located.filter(f => !busySet.has(f.id)).map(f => f.id);
  expect(free.length, "canonical registry must hold two free targets in scope").toBeGreaterThanOrEqual(count);
  return free.slice(0, count);
}

async function stageReview(page: import("@playwright/test").Page, ids: string[]) {
  await page.addInitScript(sel => { sessionStorage.setItem("cd021-bulk-selection", JSON.stringify(sel)); }, ids);
  await page.goto(`/planning/bulk/review?ct=${ALL_REGIONS_CT}`);
  const { start, end } = TEST_WINDOW();
  const dt = page.locator('input[type="datetime-local"]');
  await dt.nth(0).fill(start);
  await dt.nth(1).fill(end);
  await expect(page.getByText(/Mandatory configuration is missing/i)).toHaveCount(0, { timeout: 20000 });
}

async function decide(visitId: string, inspectorId: string) {
  return rest("POST", "rpc/decide_single_visit_supervision", supervisorJwt, {
    p_visit_id: visitId, p_decision: "approve", p_inspector_id: inspectorId, p_reason: "R3 capacity certification",
  });
}

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  plannerJwt = planner.jwt;
  plannerUserId = planner.userId;
  supervisorJwt = (await login(PERSONAS.supervisor.email, PERSONAS.supervisor.password)).jwt;
  twoFactories = await discoverFreeCanonicalTargets(2);
  const pool = must(await rest("GET",
    "user_roles?role_key=eq.inspector&select=user_id&limit=10", supervisorJwt), "inspector pool") as { user_id: string }[];
  expect(pool.length).toBeGreaterThanOrEqual(2);
  inspectorOne = pool[0].user_id;
  inspectorTwo = pool[1].user_id;
});

test("R3 two-factory same-window bulk submit reaches supervision atomically", async ({ page }) => {
  await page.goto("/locale?set=en");
  await stageReview(page, twoFactories);
  const publish = page.getByRole("button", { name: /Submit plan and create 2 /i });
  await expect(publish).toBeEnabled({ timeout: 20000 });
  await publish.click();
  await expect(page.getByText("Plan submitted for supervision", { exact: true })).toBeVisible({ timeout: 30000 });

  const plans = must(await rest("GET", `visit_plans?created_by=eq.${plannerUserId}&method=eq.bulk&order=created_at.desc&limit=1&select=id,status`, plannerJwt), "submitted plan");
  publishedPlanId = plans[0].id;
  expect(plans[0].status).toBe("pending_supervision");
  const visits = must(await rest("GET", `visits?visit_plan_id=eq.${publishedPlanId}&select=id,factory_id,planning_status,operational_state,visit_plan_id`, plannerJwt), "staged visits");
  expect(visits).toHaveLength(2);
  expect(visits.map((v: { factory_id: string }) => v.factory_id).sort()).toEqual([...twoFactories].sort());
  expect(visits.every((v: { planning_status: string; operational_state: string }) => v.planning_status === "pending_supervision" && v.operational_state === "new")).toBe(true);
  visitA = visits[0].id;
  visitB = visits[1].id;
  const requests = must(await rest("GET", `planning_supervision_requests?visit_plan_id=eq.${publishedPlanId}&select=visit_id,status`, plannerJwt), "supervision requests");
  expect(requests).toHaveLength(2);
  expect(requests.every((r: { status: string }) => r.status === "pending")).toBe(true);
  const audit = must(await rest("GET", `audit_events?object_id=eq.${publishedPlanId}&select=action,object_type&order=occurred_at.desc`, plannerJwt), "submit audit");
  expect(audit.some((e: { action: string; object_type: string }) => e.object_type === "visit_plans" && e.action === "BULK_PLAN_SUBMITTED_FOR_SUPERVISION")).toBe(true);
});

test("R3 capacity guard refuses a second same-window approval for one inspector", async () => {
  const first = await decide(visitA, inspectorOne);
  expect(first.error, `approve visit A: ${first.error}`).toBeNull();

  const conflict = await decide(visitB, inspectorOne);
  expect(conflict.error ?? "").toContain("PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE");

  const untouched = must(await rest("GET", `visits?id=eq.${visitB}&select=planning_status`, plannerJwt), "blocked visit state")[0];
  expect(untouched.planning_status).toBe("pending_supervision");
  const assignments = must(await rest("GET", `assignments?visit_id=eq.${visitB}&select=visit_id`, supervisorJwt), "blocked visit assignments");
  expect(assignments).toEqual([]);
});

test("R3 distinct-inspector approvals publish the plan with one assignment each", async () => {
  const second = await decide(visitB, inspectorTwo);
  expect(second.error, `approve visit B: ${second.error}`).toBeNull();

  const visits = must(await rest("GET", `visits?visit_plan_id=eq.${publishedPlanId}&select=id,planning_status`, plannerJwt), "published visits");
  expect(visits.every((v: { planning_status: string }) => v.planning_status === "published")).toBe(true);
  const plan = must(await rest("GET", `visit_plans?id=eq.${publishedPlanId}&select=status`, plannerJwt), "published plan")[0];
  expect(plan.status).toBe("published");
  const assignments = must(await rest("GET", `assignments?visit_id=in.(${visitA},${visitB})&select=visit_id,inspector_id`, supervisorJwt), "assignments");
  expect(assignments).toHaveLength(2);
  expect(new Set(assignments.map((a: { inspector_id: string }) => a.inspector_id)).size).toBe(2);
});

test.afterAll(async () => {
  // IDs are retained in the external R3 cleanup ledger; no direct cleanup here
  // so the final evidence query can capture before/after state atomically.
});
