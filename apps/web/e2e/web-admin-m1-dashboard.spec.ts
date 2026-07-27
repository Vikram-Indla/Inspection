import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KPI_DEFINITIONS } from "../src/lib/dashboard-kpi/registry";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath, type PersonaKey } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

const dashboardPage = source("src/app/(app)/dashboard/page.tsx");
const dashboardView = source("src/app/(app)/dashboard/DashboardView.tsx");
const roleHome = source("src/lib/role-home.ts");
const regionalScope = source("src/app/(app)/dashboard/RegionalScope.tsx");
const decisionCanvas = source("src/app/(app)/dashboard/DecisionCanvas.tsx");
const geoMap = source("src/components/GeoMap.tsx");
const EVIDENCE_DIR = evidenceDirectory("web-admin-m1-dashboard");

async function setPresentation(
  page: Page,
  locale: "en" | "ar",
  theme: "light" | "dark",
) {
  await page.goto(`/locale?set=${locale}`);
  await page.evaluate((value) => localStorage.setItem("saqeel-theme", value), theme);
  await page.reload();
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // The closed mobile navigation is an intentionally transformed off-canvas
  // body child. The document root is the actual scroll container and must not
  // expose a horizontal scroll range.
  expect(overflow, `${label}: document overflow`).toBeLessThanOrEqual(1);
}

async function waitForMapEvidence(page: Page) {
  const provider = page.locator('[data-map-provider="mapbox"], [data-map-provider="mapbox-unavailable"]').first();
  await provider.waitFor({ state: "visible", timeout: 20_000 });
  if (await provider.getAttribute("data-map-provider") === "mapbox") {
    await expect(provider).toHaveAttribute("data-map-ready", "true", { timeout: 30_000 });
    await expect(provider.locator(".mapboxgl-canvas")).toBeVisible();
  }
}

test.describe("WA-M1-AC-001/002/005 source truth and negative contracts", () => {
  test("the route enforces the approved Operations/Leadership contract through the user-scoped client", () => {
    expect(dashboardPage).toContain('const dashboardRoleKeys = ["ops", "leadership"] as const');
    expect(dashboardPage).toContain('.eq("user_id", user.id)');
    expect(dashboardPage).toContain("if (!mayViewDashboard) redirect(\"/launch\")");
    expect(dashboardPage).toContain("const sb = await supabaseServer()");
    expect(dashboardPage).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE|bypassRls/i);
    expect(roleHome).toContain('["ops", "/dashboard"]');
    expect(roleHome).toContain('["leadership", "/dashboard"]');
    expect(roleHome).toContain('["planner", "/planning"]');
    expect(roleHome).toContain('["reviewer", "/reviews"]');
    expect(roleHome).not.toMatch(/\["(?:planner|reviewer|inspector|compliance_admin|form_admin|workflow_admin|security_admin|gis_admin|risk_owner)", "\/dashboard"\]/);
  });

  test("partial source state is propagated and cannot coexist with the overall Live state", () => {
    expect(dashboardPage).toContain("partialSources={partialSources}");
    expect(dashboardPage).not.toContain("partialSources={[]}");
    expect(dashboardView).toContain("partialSources.length");
    expect(dashboardView).toContain("Partial · ${partialSources.length} unavailable source");
    expect(dashboardView).toContain(": copy(locale,");
    expect(dashboardView).toContain("`Page generated ${refreshedAt} Riyadh`");
    expect(dashboardView).toContain('sourceStatus: "partial"');
  });

  test("the real shared GeoMap is mounted and its accessible unavailable state remains fail-closed", () => {
    expect(dashboardView).toContain("import DecisionCanvas");
    expect(dashboardView).toContain("<RegionalScope");
    expect(regionalScope).toContain("import DecisionCanvas");
    expect(regionalScope).toContain("<DecisionCanvas");
    expect(decisionCanvas).toContain('dynamic(() => import("@/components/GeoMap"), { ssr: false })');
    expect(decisionCanvas).toContain("<GeoMap");
    expect(geoMap).toContain('data-map-provider="mapbox"');
    expect(geoMap).toContain('data-map-provider="mapbox-unavailable"');
    expect(geoMap).toContain('role="status"');
    expect(geoMap).toContain("Map service unavailable");
  });

  test("no Dashboard verification action points to a missing in-page anchor", () => {
    for (const file of [dashboardPage, dashboardView, decisionCanvas]) {
      expect(file).not.toMatch(/href=["']#(?:compliance|violations|decisions)["']/);
      expect(file).not.toContain("Verify records");
    }
  });

  test("every DEC-028-dependent KPI remains non-live until its contract exists", () => {
    const expected: Record<string, "unavailable" | "not_configured" | "decision_required" | "deferred"> = {
      "STR-KPI-002": "unavailable",
      "STR-KPI-003": "decision_required",
      "STR-KPI-005": "unavailable",
      "STR-KPI-007": "not_configured",
      "STR-KPI-008": "not_configured",
      "STR-KPI-009": "decision_required",
      "STR-KPI-010": "decision_required",
      "STR-KPI-011": "unavailable",
      "STR-KPI-012": "not_configured",
      "OPS-KPI-002": "not_configured",
      "OPS-KPI-005": "deferred",
      "OPS-KPI-009": "not_configured",
    };

    for (const [metricId, status] of Object.entries(expected)) {
      const definition = KPI_DEFINITIONS.find((candidate) => candidate.metricId === metricId);
      expect(definition, metricId).toBeDefined();
      expect(definition?.implementation, metricId).toBe(status);
      expect(definition?.decisionRef || definition?.note, `${metricId} must explain its stop line`).toBeTruthy();
    }

    expect(dashboardView).toContain(
      "Risk and compliance thresholds, and coverage and repeat rules, are not configured. No substitute is used.",
    );
    expect(dashboardView).toContain("Classification policy is not configured; pins remain neutral.");
  });
});

test.describe("WA-M1-AC-001/003 Operations Dashboard runtime", () => {
  test.use({ storageState: storageStatePath("ops") });

  test.beforeEach(async ({ page }) => {
    await setPresentation(page, "en", "light");
  });

  test("Strategic and Operational direct URLs are truthful and preserve filter state", async ({ page }) => {
    await page.goto("/dashboard?view=strategic&group=city&q=not-a-real-record");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("tabpanel", { name: "Strategic View" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Strategic View" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Operational View" })).toHaveAttribute("aria-selected", "false");
    await expect(page.getByText(/RLS scoped/).first()).toBeVisible();

    await page.getByRole("tab", { name: "Operational View" }).click();
    await expect(page).toHaveURL(/view=operational/);
    expect(new URL(page.url()).searchParams.get("group")).toBe("city");
    expect(new URL(page.url()).searchParams.get("q")).toBe("not-a-real-record");
    await expect(page.getByRole("tabpanel", { name: "Operational View" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Operational View" })).toHaveAttribute("aria-selected", "true");

    await page.goto("/dashboard?view=strategic");
    await expect(page.getByRole("tabpanel", { name: "Strategic View" })).toBeVisible();
    await waitForMapEvidence(page);
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-light-1440.png"), fullPage: true });

    await page.goto("/dashboard?view=operational");
    await expect(page.getByRole("tabpanel", { name: "Operational View" })).toBeVisible();
    await waitForMapEvidence(page);
    await page.screenshot({ path: join(EVIDENCE_DIR, "operational-en-light-1440.png"), fullPage: true });
  });

  test("an unsupported Analytics URL is explicitly blocked rather than silently becoming Strategic", async ({ page }) => {
    await page.goto("/dashboard?view=analytics");
    await expect(page).toHaveURL(/view=analytics/);
    await expect(page.getByRole("heading", { name: "Dashboard view not configured" })).toBeVisible();
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await expect(page.getByText(/Live · refreshed/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Open Strategic View" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Operational View" })).toBeVisible();
    await expect(page.getByRole("tabpanel", { name: "Strategic View" })).toHaveCount(0);
    await expect(page.getByRole("tabpanel", { name: "Operational View" })).toHaveCount(0);
    await page.screenshot({ path: join(EVIDENCE_DIR, "analytics-blocked-en-light-1440.png"), fullPage: true });
  });

  test("Strategic renders the shared map boundary and honest DEC-028 statuses", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");
    const mapPanel = page.getByRole("region", { name: "National factory map" });
    await expect(mapPanel).toBeVisible();
    await expect(mapPanel.getByRole("button", { name: "Compliance classification" })).toBeDisabled();
    await expect(mapPanel.getByRole("button", { name: "Risk classification" })).toBeDisabled();
    await expect(mapPanel.getByText(/Classification policy is not configured/)).toBeVisible();

    const provider = mapPanel.locator('[data-map-provider="mapbox"], [data-map-provider="mapbox-unavailable"]');
    await expect(provider).toHaveCount(1, { timeout: 20_000 });
    const providerState = await provider.getAttribute("data-map-provider");
    expect(["mapbox", "mapbox-unavailable"]).toContain(providerState);
    if (providerState === "mapbox") {
      await expect(mapPanel.locator(".mapboxgl-map")).toBeVisible();
    } else {
      await expect(provider).toHaveAttribute("role", "status");
      await expect(provider).toContainText("Map service unavailable");
    }

    await expect(page.getByText("Unavailable", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Not configured", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Decision required", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/No substitute value is shown/)).toBeVisible();
  });

  test("Operational renders canonical panels and blocked policy statuses", async ({ page }) => {
    await page.goto("/dashboard?view=operational");
    await expect(page.getByRole("tabpanel", { name: "Operational View" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visit pipeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's schedule load" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live activity" })).toBeVisible();
    await expect(page.getByText("Not configured", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Unavailable", { exact: true }).first()).toBeVisible();
  });

  test("every rendered in-page link resolves to a real target", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");
    const anchors = page.locator('a[href^="#"]');
    for (let index = 0; index < await anchors.count(); index += 1) {
      const href = await anchors.nth(index).getAttribute("href");
      expect(href).toMatch(/^#[A-Za-z][\w:.-]*$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
  });
});

const deniedPersonas: { persona: PersonaKey; expectedHome: RegExp }[] = [
  { persona: "planner", expectedHome: /^\/planning/ },
  { persona: "reviewer", expectedHome: /^\/reviews/ },
  { persona: "admin", expectedHome: /^\/admin/ },
  { persona: "inspector", expectedHome: /^\/field/ },
];

for (const { persona, expectedHome } of deniedPersonas) {
  test.describe(`WA-M1-AC-002 ${persona} route denial`, () => {
    test.use({ storageState: storageStatePath(persona) });

    test(`${persona} cannot open the Operations/Leadership Dashboard`, async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForURL((url) => url.pathname !== "/dashboard", { timeout: 20_000 });
      expect(new URL(page.url()).pathname).toMatch(expectedHome);
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toHaveCount(0);
    });
  });
}

test("WA-M1-AC-002 unauthenticated Dashboard access returns to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 20_000 });
  expect(new URL(page.url()).pathname).toMatch(/^\/login/);
});

test.describe("WA-M1-AC-004 Dashboard RTL, responsive and accessibility", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("EN/AR strategic and operational views reflow at every required viewport", async ({ page }) => {
    test.setTimeout(180_000);
    const cases = [
      { locale: "en", theme: "light", view: "strategic", width: 1440, height: 900 },
      { locale: "en", theme: "dark", view: "operational", width: 1024, height: 768 },
      { locale: "ar", theme: "light", view: "strategic", width: 412, height: 915 },
      { locale: "ar", theme: "dark", view: "operational", width: 390, height: 844 },
      { locale: "en", theme: "dark", view: "strategic", width: 320, height: 800 },
    ] as const;

    for (const item of cases) {
      await page.setViewportSize({ width: item.width, height: item.height });
      await setPresentation(page, item.locale, item.theme);
      await page.goto(`/dashboard?view=${item.view}`);
      if (await page.locator("html").getAttribute("data-theme") !== item.theme) {
        await page.getByRole("button", { name: /Light mode|Dark mode|الوضع الفاتح|الوضع الداكن/ }).click();
      }
      await expect(page.locator("html")).toHaveAttribute("lang", item.locale);
      await expect(page.locator("html")).toHaveAttribute("dir", item.locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", item.theme);
      await expect(page.locator(`#dashboard-${item.view}`)).toBeVisible();
      await waitForMapEvidence(page);
      await expectNoHorizontalOverflow(page, `${item.locale}/${item.theme}/${item.view}/${item.width}`);
      await page.screenshot({
        path: join(EVIDENCE_DIR, `${item.view}-${item.locale}-${item.theme}-${item.width}.png`),
        fullPage: true,
      });
    }
  });

  test("tabs, methodology drawer, focus restoration and Axe remain accessible", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "en", "light");
    await page.goto("/dashboard?view=strategic");

    const strategic = page.getByRole("tab", { name: "Strategic View" });
    const operational = page.getByRole("tab", { name: "Operational View" });
    await strategic.focus();
    await expect(strategic).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(operational).toBeFocused();

    const methodology = page.getByRole("button", { name: /Methodology|Why unavailable/ }).first();
    await methodology.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(methodology).toBeFocused();

    const results = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude(".mapboxgl-map")
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
