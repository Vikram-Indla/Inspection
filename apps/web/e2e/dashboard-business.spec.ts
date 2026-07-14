import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardMetrics,
  complianceBreakdown,
  parseDateScope,
  riyadhTodayScope,
  type FactoryRef,
  type InspectionRow,
  type ResponseRow,
  type ReviewRow,
  type VisitRow,
} from "../src/app/dashboard/metrics";
import { waitForCredentialsForm, submitCredentials } from "./login-helper";
import { storageStatePath } from "./personas";

const OPS = { email: "ops@mim.gov.sa", password: "MimOps!2026" };
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/dashboard-business-v1");

async function loginOps(page: import("@playwright/test").Page) {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await page.locator("#email").fill(OPS.email);
  await page.locator("#pw").fill(OPS.password);
  await submitCredentials(page);
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

test.describe("TASK-WEB-DASHBOARD-002 metric truth", () => {
  test("30-day default uses Riyadh boundaries and truthful denominators", () => {
    const now = Date.parse("2026-07-13T12:00:00Z");
    const scope = parseDateScope(undefined, undefined, now);
    expect(scope.fromDate).toBe("2026-06-14");
    expect(scope.toDate).toBe("2026-07-13");

    const factory: FactoryRef = { id: "f1", name: "Factory", factory_code: "F-1", region: "Riyadh", city: "Riyadh", activity_class: "Food", risk_score: 80, risk_band: "high", is_temporary: false };
    const visits: VisitRow[] = [
      { id: "v1", planning_status: "published", operational_state: "submitted", window_start: "2026-07-13T06:00:00Z", window_end: "2026-07-13T08:00:00Z", priority: "high", cancellation_reason: null, created_at: "2026-07-01T00:00:00Z", factories: factory, assignments: [{ inspector_id: "u1", profiles: { full_name: "Inspector" } }] },
      { id: "v2", planning_status: "published", operational_state: "executing", window_start: "2026-07-01T06:00:00Z", window_end: "2026-07-01T08:00:00Z", priority: null, cancellation_reason: null, created_at: "2026-07-01T00:00:00Z", factories: factory, assignments: [{ inspector_id: "u1", profiles: { full_name: "Inspector" } }] },
    ];
    const inspections: InspectionRow[] = [{ id: "i1", visit_id: "v1", status: "approved", started_at: "2026-07-13T06:00:00Z", submitted_at: "2026-07-13T07:00:00Z", visits: { window_start: "2026-07-13T06:00:00Z", factories: factory } }];
    const reviews: ReviewRow[] = [{ id: "r1", inspection_id: "i1", status: "approved", decision: "approve", decided_at: "2026-07-13T08:00:00Z", inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { window_start: "2026-07-13T06:00:00Z", factories: factory } } }];
    const responses: ResponseRow[] = [
      { inspection_id: "i1", is_complete: true, response: { value: "compliant" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
      { inspection_id: "i1", is_complete: true, response: { value: "non_compliant" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
      { inspection_id: "i1", is_complete: true, response: { value: "na" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
    ];
    const metrics = buildDashboardMetrics({ visits, inspections, reviews, responses, violations: [], geo: [], audit: [], factories: [factory], sla: { review_business_days: 3, calendar: { days: "Sun-Thu" } }, scope, today: riyadhTodayScope(now), region: "", nowMs: now });
    expect(metrics.strategic.complianceRate).toBe(50);
    expect(metrics.strategic.answeredForCompliance).toBe(2);
    expect(metrics.strategic.approvalRate).toBe(100);
    expect(metrics.operational.overdueRows.map(row => row.id)).toEqual(["v2"]);
    expect(metrics.operational.workload[0]).toMatchObject({ assigned: 2, active: 1, completed: 1, overdue: 1 });
    expect(complianceBreakdown(metrics.strategic.scopedResponses, "authority", "Unknown")).toEqual([{ label: "MIM", compliant: 1, nonCompliant: 1, total: 2, rate: 50 }]);
  });
});

test.describe("TASK-WEB-DASHBOARD-002 runtime", () => {
  test("operations persona lands on the two-view source-backed dashboard", async ({ page }) => {
    await loginOps(page);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.evaluate(() => localStorage.setItem("saqeel-theme", "dark"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Strategic View" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Target not configured", { exact: true })).toBeVisible();
    await expect(page.getByText("National compliance rate", { exact: true })).toBeVisible();
    await expect(page.getByText(/Last 30 days/)).toBeVisible();
    await expect(page.getByText(/No generated recommendation or forecast/)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Operations Center" })).toHaveAttribute("href", "/operations");
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-dark-desktop.png"), fullPage: true });
    await page.evaluate(() => localStorage.setItem("saqeel-theme", "light"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-light-desktop.png"), fullPage: true });
    await page.evaluate(() => localStorage.setItem("saqeel-theme", "dark"));
    await page.reload();

    await page.getByRole("tab", { name: "Operational View" }).click();
    await expect(page).toHaveURL(/view=operational/);
    await expect(page.getByRole("tab", { name: "Operational View" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Today's planned visits", { exact: true })).toBeVisible();
    await expect(page.getByText("SLA breach rate", { exact: true })).toBeVisible();
    await expect(page.getByText(/relative, not absolute capacity/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alert source coverage" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Planning-to-review operational timeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /GPS override records/ })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "operational-en-dark-desktop.png"), fullPage: true });
  });

  test("entity search and region scope use real dashboard controls", async ({ page }) => {
    await loginOps(page);
    const search = page.getByRole("searchbox", { name: "Search factories, visits and inspections" });
    await search.fill("KPI Verify");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page).toHaveURL(/q=KPI\+Verify/);
    await expect(page.getByRole("heading", { name: /Search results for/ })).toBeVisible();
    await expect(page.getByText(/KPI Verify/).first()).toBeVisible();

    await page.getByRole("combobox", { name: "Region" }).selectOption("Verification Fixtures");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page).toHaveURL(/region=Verification\+Fixtures/);
    await expect(page.getByText(/Scope: .*Verification Fixtures/)).toBeVisible();
  });

  test("Arabic RTL, mobile reflow, keyboard focus and theme remain operational", async ({ page }) => {
    await loginOps(page);
    await page.goto("/locale?set=ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("tab", { name: "المنظور الاستراتيجي" })).toBeVisible();
    await page.getByRole("tab", { name: "المنظور الاستراتيجي" }).focus();
    await expect(page.getByRole("tab", { name: "المنظور الاستراتيجي" })).toBeFocused();
    const themeButton = page.getByRole("button", { name: /الوضع (الفاتح|الداكن)/ });
    const offeredTheme = await themeButton.getAttribute("aria-label");
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", offeredTheme?.includes("الفاتح") ? "light" : "dark");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-ar-mobile.png"), fullPage: true });
  });
});

test.describe("TASK-WEB-DASHBOARD-002 route authorization", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("a non-dashboard persona cannot open the dashboard by URL", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/planning/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toHaveCount(0);
  });
});
