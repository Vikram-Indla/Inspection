import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";

test.use({ storageState: storageStatePath("planner") });
test.describe.configure({ mode: "serial" });

const ALL_REGIONS_CT = encodeURIComponent(JSON.stringify({ k: "g", c: "all", n: [{ k: "c", f: "region", o: "neq", v: "__none__" }] }));
const TEST_WINDOW = () => {
  const dayOffset = 6000 + Math.floor(Math.random() * 1000);
  const start = new Date(Date.now() + dayOffset * 86400e3).toISOString().slice(0, 16);
  const end = new Date(Date.now() + dayOffset * 86400e3 + 2 * 3600e3).toISOString().slice(0, 16);
  return { start, end };
};

let plannerJwt = "";
let plannerUserId = "";
let twoFactories: string[] = [];
let negativeFactories: string[] = [];
let publishedPlanId = "";
let publishedVisitIds: string[] = [];

async function createFactory(suffix: string, i: number) {
  return must(await rest("POST", "factories", plannerJwt, {
    factory_code: `R3-QA-CERT-CAP-${suffix}-${Date.now()}-${i}`,
    name: `R3 QA Capacity ${suffix} ${i}`,
    cr_number: `R3-CAP-${suffix}-${Date.now()}-${i}`,
    region: "Riyadh", city: "Riyadh",
    official_lat: 24.70 + i / 1000, official_lng: 46.70 + i / 1000,
  }), `create ${suffix} factory`)[0].id as string;
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

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  plannerJwt = planner.jwt;
  plannerUserId = planner.userId;
  twoFactories = [await createFactory("TWO", 1), await createFactory("TWO", 2)];
  negativeFactories = [];
  for (let i = 1; i <= 5; i++) negativeFactories.push(await createFactory("CAPACITY-NEG", i));
});

test("R3 two-factory same-window bulk publish creates assignments and visits", async ({ page }) => {
  await page.goto("/locale?set=en");
  await stageReview(page, twoFactories);
  const publish = page.getByRole("button", { name: /Publish plan and create 2 /i });
  await expect(publish).toBeEnabled({ timeout: 20000 });
  await publish.click();
  await expect(page.getByText("Plan published", { exact: true })).toBeVisible({ timeout: 30000 });

  const plans = must(await rest("GET", `visit_plans?created_by=eq.${plannerUserId}&method=eq.bulk&order=created_at.desc&limit=1&select=id,status`, plannerJwt), "published plan");
  publishedPlanId = plans[0].id;
  expect(plans[0].status).toBe("published");
  const visits = must(await rest("GET", `visits?visit_plan_id=eq.${publishedPlanId}&select=id,factory_id,planning_status,operational_state,visit_plan_id`, plannerJwt), "generated visits");
  expect(visits).toHaveLength(2);
  publishedVisitIds = visits.map((v: { id: string }) => v.id);
  expect(visits.map((v: { factory_id: string }) => v.factory_id).sort()).toEqual([...twoFactories].sort());
  expect(visits.every((v: { planning_status: string; operational_state: string; visit_plan_id: string }) => v.planning_status === "published" && v.operational_state === "new" && v.visit_plan_id === publishedPlanId)).toBe(true);
  const assignments = must(await rest("GET", `assignments?visit_id=in.(${publishedVisitIds.join(",")})&select=visit_id,inspector_id`, plannerJwt), "assignments");
  expect(assignments).toHaveLength(2);
  expect(new Set(assignments.map((a: { inspector_id: string }) => a.inspector_id)).size).toBe(2);
  const audit = must(await rest("GET", `audit_events?object_id=eq.${publishedPlanId}&select=action,object_type,occurred_at,requirement_refs&order=occurred_at.desc`, plannerJwt), "publish audit");
  expect(audit.some((e: { action: string; object_type: string }) => e.object_type === "visit_plans" && e.action === "INSERT")).toBe(true);
});

test("R3 capacity guard blocks a plan requiring more inspectors than the pool", async ({ page }) => {
  await page.goto("/locale?set=en");
  await stageReview(page, negativeFactories);
  const publish = page.getByRole("button", { name: /Publish plan and create|Publish blocked/i });
  await expect(page.getByText(/no eligible Inspector available|no day in the window has remaining daily capacity/i).first()).toBeVisible({ timeout: 20000 });
  await expect(publish).toBeDisabled();
  await expect(page.getByText(/Publish blocked|Disabled:/i).first()).toBeVisible();
});

test.afterAll(async () => {
  // IDs are retained in the external R3 cleanup ledger; no direct cleanup here
  // so the final evidence query can capture before/after state atomically.
});
