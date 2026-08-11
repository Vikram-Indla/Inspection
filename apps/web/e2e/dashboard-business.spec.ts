import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
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
} from "../src/app/(app)/dashboard/metrics";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";
import { PERSONAS, storageStatePath } from "./personas";

const EVIDENCE_DIR = evidenceDirectory("dashboard-business-v1");

async function loginOps(page: import("@playwright/test").Page) {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(PERSONAS.ops.email);
  await passwordField(page).fill(PERSONAS.ops.password);
  await submitCredentials(page);
  await page.waitForURL(/\/dashboard/, { timeout: 40_000 });
}

test.describe("TASK-WEB-DASHBOARD-002 metric truth", () => {
  test("audit timeline query is bounded to scoped dashboard objects", () => {
    const source = readFileSync(join(process.cwd(), "src/features/dashboard/sources/audit.ts"), "utf8");
    expect(source).toContain("loadLatestAudit");
    expect(source).toContain('.in("object_id", group)');
    expect(source).toContain('.gte("occurred_at", fromIso)');
    expect(source).toContain('.lte("occurred_at", toIso)');
    expect(source).toContain("const TIMELINE_LIMIT = 12");
    expect(source).toContain(".limit(TIMELINE_LIMIT)");
    const sections = readFileSync(join(process.cwd(), "src/components/dashboard/dashboard-sections/dashboard-sections.tsx"), "utf8");
    expect(sections).toContain("fetchDashboardSnapshot");
  });

  test("30-day default uses Riyadh boundaries and truthful denominators", () => {
    const now = Date.parse("2026-07-13T12:00:00Z");
    const scope = parseDateScope(undefined, undefined, now);
    expect(scope.fromDate).toBe("2026-06-14");
    expect(scope.toDate).toBe("2026-07-13");

    const factory: FactoryRef = { id: "f1", name: "Factory", factory_code: "F-1", region: "Riyadh", city: "Riyadh", activity_class: "Food", risk_score: 80, risk_band: "high", is_temporary: false };
    const visits: VisitRow[] = [
      { id: "v1", planning_status: "published", operational_state: "submitted", window_start: "2026-07-13T06:00:00Z", window_end: "2026-07-13T08:00:00Z", priority: "high", cancellation_reason: null, created_at: "2026-07-01T00:00:00Z", factories: factory, factory_id: "f1", assignments: [{ inspector_id: "u1", profiles: { full_name: "Inspector" } }] },
      { id: "v2", planning_status: "published", operational_state: "executing", window_start: "2026-07-01T06:00:00Z", window_end: "2026-07-01T08:00:00Z", priority: null, cancellation_reason: null, created_at: "2026-07-01T00:00:00Z", factories: factory, factory_id: "f1", assignments: [{ inspector_id: "u1", profiles: { full_name: "Inspector" } }] },
    ];
    const inspections: InspectionRow[] = [{ id: "i1", visit_id: "v1", status: "approved", started_at: "2026-07-13T06:00:00Z", submitted_at: "2026-07-13T07:00:00Z", visits: { window_start: "2026-07-13T06:00:00Z", factories: factory, factory_id: "f1" } }];
    const reviews: ReviewRow[] = [{ id: "r1", inspection_id: "i1", status: "approved", decision: "approve", decided_at: "2026-07-13T08:00:00Z", inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { window_start: "2026-07-13T06:00:00Z", factories: factory, factory_id: "f1" } } }];
    const responses: ResponseRow[] = [
      { inspection_id: "i1", is_complete: true, response: { value: "compliant" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory, factory_id: "f1" } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
      { inspection_id: "i1", is_complete: true, response: { value: "non_compliant" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory, factory_id: "f1" } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
      { inspection_id: "i1", is_complete: true, response: { value: "na" }, inspections: { submitted_at: "2026-07-13T07:00:00Z", visits: { factories: factory, factory_id: "f1" } }, inspection_items: { regulation_clauses: { regulations: { title: "Safety", issuing_authority: "MIM" } } } },
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
  test.describe.configure({ timeout: 150_000 });
  test("operations persona lands on the two-view source-backed dashboard", async ({ page }) => {
    await loginOps(page);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      localStorage.setItem("saqeel-theme-mode", "dark");
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const perspective = page.getByRole("navigation", { name: "Dashboard perspective" });
    await expect(perspective.getByRole("link", { name: "Strategic View" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Updated", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compliance performance explorer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strategic intervention" })).toBeVisible();
    await expect(page.getByText("Not configured").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Why unavailable?" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Executive AI brief" })).toBeVisible();
    await expect(page.getByText("No brief has been generated for this scope yet.")).toBeVisible();

    await page.getByRole("button", { name: "How is this calculated?" }).first().click();
    const explain = page.getByRole("complementary");
    await expect(explain).toBeVisible();
    await expect(explain.getByText("Formula", { exact: true })).toBeVisible();
    await expect(explain.getByText("Formula version", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(explain).toBeHidden();

    const opsLink = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Operations Center" });
    await expect(opsLink).toHaveAttribute("href", /\/operations$/);
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-dark-desktop.png"), fullPage: true });

    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "light");
      localStorage.setItem("saqeel-theme-mode", "light");
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-light-desktop.png"), fullPage: true });
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      localStorage.setItem("saqeel-theme-mode", "dark");
    });
    await page.reload();

    await perspective.getByRole("link", { name: "Operational View" }).click();
    await expect(page).toHaveURL(/view=operational/);
    await expect(perspective.getByRole("link", { name: "Operational View" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Today's operations" })).toBeVisible();
    await expect(page.getByText(/high-priority visits are pending execution/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inspector capacity" })).toBeVisible();
    await expect(page.getByText("Today's planned visits")).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "operational-en-dark-desktop.png"), fullPage: true });
  });

  test.describe("scoped controls", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("entity search and region scope use real dashboard controls", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/dashboard?q=KPI+Verify");
    await expect(page.getByRole("heading", { name: /Search results for/ })).toBeVisible();

    const shellSearch = page.getByRole("combobox", { name: "Search factory, CR, license, inspection…" });
    await shellSearch.fill("KPI Verify");
    const listbox = page.getByRole("listbox", { name: "Global search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option").first().or(listbox.getByText("No results available to you"))).toBeVisible();
    await page.keyboard.press("Escape");

    const dateScope = page.getByRole("button", { name: "Date scope" });
    await expect(dateScope).toBeEnabled();

    const regionScope = page.getByRole("combobox", { name: "Region scope" });
    await expect(regionScope).toBeVisible();
    if (await regionScope.isEnabled()) {
      await regionScope.click();
      const regionOption = page.getByRole("option").nth(1);
      if (await regionOption.count()) {
        const label = (await regionOption.textContent())?.trim() ?? "";
        await regionOption.click();
        await expect(page).toHaveURL(/region=/);
        expect(label.length).toBeGreaterThan(0);
      } else {
        await page.keyboard.press("Escape");
      }
    }
  });

  test("Arabic RTL, mobile reflow, keyboard focus and theme remain operational", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      localStorage.setItem("saqeel-theme", "light");
      localStorage.setItem("saqeel-theme-mode", "light");
    });
    await page.goto("/locale?set=ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "الأداء الوطني" })).toBeVisible();

    const strategic = page.getByRole("link", { name: "المنظور الاستراتيجي" });
    await strategic.focus();
    await expect(strategic).toBeFocused();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "الوضع الداكن" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-ar-mobile.png"), fullPage: true });
  });
  });
});

test.describe("TASK-WEB-DASHBOARD-002 shared dashboard access", () => {
  test.describe("planner persona", () => {
    test.use({ storageState: storageStatePath("planner") });
    test("planner opens the shared dashboard scoped to the planner persona", async ({ page }) => {
      await page.goto("/locale?set=en");
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: "Planner", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
      await expect(page.getByText("Partial dashboard")).toHaveCount(0);
    });
  });

  test.describe("admin-only persona", () => {
    test.use({ storageState: storageStatePath("admin") });
    test("an admin-only persona receives the admin-scoped shared dashboard", async ({ page }) => {
      await page.goto("/locale?set=en");
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    });
  });
});
