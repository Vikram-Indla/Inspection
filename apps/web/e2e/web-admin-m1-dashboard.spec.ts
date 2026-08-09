import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KPI_DEFINITIONS } from "../src/lib/dashboard-kpi/registry";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath, type PersonaKey } from "./personas";

// TASK-WEB-ADMIN-PHASE1-PLAN-001-M1 · WA-M1-AC-001..005
// Updated 2026-08-08 for the shared role-scoped Dashboard (post PR #182 revamp):
// every governed role lands on /dashboard (see src/lib/role-home.ts); data
// scoping moved from route denial to the RLS-scoped snapshot API.
const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

const snapshotRoute = source("src/app/api/dashboard/snapshot/route.ts");
const personaLoader = source("src/features/dashboard/sources/persona.ts");
const dashboardRole = source("src/lib/dashboard-role.ts");
const dashboardSections = source("src/components/dashboard/dashboard-sections/dashboard-sections.tsx");
const dashboardSnapshot = source("src/features/dashboard/snapshot.ts");
const metricStrip = source("src/features/dashboard/strip.ts");
const roleHome = source("src/lib/role-home.ts");
const strategicView = source("src/components/dashboard/strategic-view/strategic-view.tsx");
const operationalView = source("src/components/dashboard/operational-view/operational-view.tsx");
const opsMap = source("src/app/(app)/operations/OpsMap.tsx");
const geoMap = source("src/components/GeoMap.tsx");
const dashboardCopy = source("src/i18n/locales/en/dashboard.json");
const EVIDENCE_DIR = evidenceDirectory("web-admin-m1-dashboard");

const withoutLocale = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";

async function setPresentation(
  page: Page,
  locale: "en" | "ar",
  theme: "light" | "dark",
) {
  // /locale?set= may redirect to a host alias (localhost vs 127.0.0.1), and
  // localStorage is origin-scoped — return to the baseURL origin before
  // persisting the explicit theme choice. Both keys are written because the
  // shell theme toggle's mode key wins over the legacy resolved key and
  // rewrites it on mount.
  await page.goto(`/locale?set=${locale}`);
  await page.goto("/dashboard");
  await page.evaluate((value) => {
    localStorage.setItem("saqeel-theme", value);
    localStorage.setItem("saqeel-theme-mode", value);
  }, theme);
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

const perspectiveNav = (page: Page) => page.getByRole("navigation", { name: "Dashboard perspective" });

test.describe("WA-M1-AC-001/002/005 source truth and negative contracts", () => {
  test("the snapshot API admits every canonical role through the user-scoped client only", () => {
    expect(snapshotRoute).toContain("getVerifiedUser(sb)");
    expect(snapshotRoute).toContain("{ status: 401 }");
    expect(snapshotRoute).toContain("{ status: 403 }");
    expect(snapshotRoute).toContain("const sb = await supabaseServer()");
    expect(snapshotRoute).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE|bypassRls/i);
    expect(personaLoader).toContain('.eq("user_id", userId)');
    expect(personaLoader).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE/i);
    expect(dashboardRole).toContain('["supervisor", "ops", "leadership", "reviewer"]');
    expect(dashboardRole).toContain('roles.has("inspector")');
    expect(dashboardRole).toContain('roles.has("planner")');
    expect(dashboardRole).toContain('"admin", "compliance_admin"');
    expect(dashboardRole).toContain("return null");
    for (const role of ["admin", "planner", "supervisor", "inspector", "ops", "leadership"]) {
      expect(roleHome).toContain(`["${role}", "/dashboard"]`);
    }
  });

  test("partial source state is propagated and cannot coexist with the overall Live state", () => {
    expect(dashboardSnapshot).toContain("failedSources");
    expect(dashboardSnapshot).toContain('visits.failed && "visits"');
    expect(dashboardSnapshot).toContain('audit.failed && "audit"');
    expect(dashboardSections).toContain("snapshot.failedSources.map(key => dashboard.source[key])");
    expect(dashboardSections).toContain("partialSources.length ?");
    expect(dashboardSections).toContain('sourceStatus: partialSources.length ? "partial" : "live"');
    expect(metricStrip).toContain('if (!partialSources.length || metric.sourceStatus !== "live") return metric;');
    expect(metricStrip).toContain('sourceStatus: "partial"');
  });

  test("the shared GeoMap owned by Operations remains fail-closed when unavailable", () => {
    expect(opsMap).toContain('dynamic(() => import("@/components/GeoMap"), { ssr: false })');
    expect(opsMap).toContain("<GeoMap");
    expect(geoMap).toContain('data-map-provider="mapbox"');
    expect(geoMap).toContain('data-map-provider={failed ? "mapbox-failed" : "mapbox-unavailable"}');
    expect(geoMap).toContain('role="status"');
    expect(geoMap).toContain("Map unavailable");
    expect(geoMap).not.toMatch(/service[_-]?role/i);
  });

  test("no Dashboard verification action points to a missing in-page anchor", () => {
    for (const file of [dashboardSections, strategicView, operationalView]) {
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

    // STR-KPI-009/010 graduated to implemented via tested code releases; the
    // registry must still carry the governed formula and an explanatory note
    // proving no threshold or identity was invented.
    for (const metricId of ["STR-KPI-009", "STR-KPI-010"]) {
      const definition = KPI_DEFINITIONS.find((candidate) => candidate.metricId === metricId);
      expect(definition?.implementation, metricId).toBe("implemented");
      expect(definition?.formula, `${metricId} must state its governed formula`).toBeTruthy();
      expect(definition?.note, `${metricId} must explain why it is computable`).toBeTruthy();
    }

    expect(dashboardCopy).toContain(
      "The repository does not store a governed official violation issue date. No quarterly series is inferred.",
    );
    expect(dashboardCopy).toContain(
      "No generated claim is shown until a configured provider returns evidence-linked output for this scope.",
    );
    expect(dashboardCopy).toContain("no governed annual target is configured");
  });
});

test.describe("WA-M1-AC-001/003 shared Dashboard runtime", () => {
  test.use({ storageState: storageStatePath("ops") });

  test.beforeEach(async ({ page }) => {
    await setPresentation(page, "en", "light");
  });

  test("Strategic and Operational direct URLs are truthful and preserve filter state", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/dashboard?view=strategic&group=city&q=not-a-real-record");
    await expect(perspectiveNav(page)).toBeVisible();
    await expect(perspectiveNav(page).getByRole("link", { name: "Strategic View" }))
      .toHaveAttribute("aria-current", "page");
    await expect(perspectiveNav(page).getByRole("link", { name: "Operational View" }))
      .not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Search results for/ })).toBeVisible();
    await expect(page.getByText("Scoped to your access").first()).toBeVisible();

    await perspectiveNav(page).getByRole("link", { name: "Operational View" }).click();
    await expect(page).toHaveURL(/view=operational/);
    expect(new URL(page.url()).searchParams.get("group")).toBe("city");
    expect(new URL(page.url()).searchParams.get("q")).toBe("not-a-real-record");
    await expect(perspectiveNav(page).getByRole("link", { name: "Operational View" }))
      .toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Today's operations" })).toBeVisible();

    await page.goto("/dashboard?view=strategic");
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "strategic-en-light-1440.png"), fullPage: true });

    await page.goto("/dashboard?view=operational");
    await expect(page.getByRole("heading", { name: "Today's operations" })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "operational-en-light-1440.png"), fullPage: true });
  });

  test("an unsupported Analytics URL is explicitly blocked rather than silently becoming Strategic", async ({ page }) => {
    await page.goto("/dashboard?view=analytics");
    await expect(page).toHaveURL(/view=analytics/);
    await expect(page.getByRole("heading", { name: "Dashboard view not configured" })).toBeVisible();
    await expect(perspectiveNav(page)).toHaveCount(0);
    await expect(page.locator("#dashboard-role-summary")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "National performance" })).toHaveCount(0);
    const strategicAction = page.getByRole("link", { name: "Strategic View" });
    const operationalAction = page.getByRole("link", { name: "Operational View" });
    await expect(strategicAction).toBeVisible();
    await expect(operationalAction).toBeVisible();
    expect(withoutLocale(new URL(await strategicAction.evaluate((el: HTMLAnchorElement) => el.href)).pathname)).toBe("/dashboard");
    await page.screenshot({ path: join(EVIDENCE_DIR, "analytics-blocked-en-light-1440.png"), fullPage: true });
  });

  test("Strategic renders canonical panels and honest DEC-028 statuses", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compliance performance explorer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strategic intervention" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enforcement action trend" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Provider output withheld" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strategic requirement coverage" })).toBeVisible();
    await expect(page.getByText(/No quarterly series is inferred/)).toBeVisible();
    await expect(page.getByText(/No generated claim is shown until a configured provider/)).toBeVisible();
    await expect(page.getByText("Unavailable", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Not configured", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Decision required", { exact: true }).first()).toBeVisible();
  });

  test("Operational renders canonical panels and blocked policy statuses", async ({ page }) => {
    await page.goto("/dashboard?view=operational");
    await expect(page.getByRole("heading", { name: "Operational priorities" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's operations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operational requirement coverage" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inspector capacity" })).toBeVisible();
    await expect(page.getByText("Not configured", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Unavailable", { exact: true }).first()).toBeVisible();
  });

  test("every rendered in-page link resolves to a real target", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();
    const anchors = page.locator('a[href^="#"]');
    for (let index = 0; index < await anchors.count(); index += 1) {
      const href = await anchors.nth(index).getAttribute("href");
      expect(href).toMatch(/^#[A-Za-z][\w:.-]*$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
  });
});

// Governed 2026-08-03: every canonical role lands on the shared Dashboard.
// The former per-role route denial is superseded; the boundary that remains is
// that each role sees only its own persona projection over RLS-scoped data.
const personaProjections: { persona: PersonaKey; summary: string }[] = [
  { persona: "planner", summary: "Planner" },
  { persona: "reviewer", summary: "Supervisor" },
  { persona: "admin", summary: "Admin" },
  { persona: "inspector", summary: "Inspector" },
];

for (const { persona, summary } of personaProjections) {
  test.describe(`WA-M1-AC-002 ${persona} role-scoped projection`, () => {
    test.use({ storageState: storageStatePath(persona) });

    test(`${persona} opens the shared Dashboard scoped to the ${summary} projection`, async ({ page }) => {
      await setPresentation(page, "en", "light");
      await page.goto("/dashboard");
      await expect(page.locator("#dashboard-role-summary")).toHaveText(summary, { timeout: 30_000 });
      await expect(page.getByText("Scoped to your access").first()).toBeVisible();
      expect(withoutLocale(new URL(page.url()).pathname)).toBe("/dashboard");
    });
  });
}

test("WA-M1-AC-002 unauthenticated Dashboard access returns to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL((url) => withoutLocale(url.pathname).startsWith("/login"), { timeout: 20_000 });
  expect(withoutLocale(new URL(page.url()).pathname)).toMatch(/^\/login/);
});

test.describe("WA-M1-AC-004 Dashboard RTL, responsive and accessibility", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("EN/AR strategic and operational views reflow at every required viewport", async ({ page }) => {
    test.setTimeout(240_000);
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
      await expect(page.locator("html")).toHaveAttribute("lang", item.locale);
      await expect(page.locator("html")).toHaveAttribute("dir", item.locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", item.theme);
      const landmark = item.view === "strategic" ? "#dashboard-national-performance" : "#dashboard-todays-operations";
      await expect(page.locator(landmark)).toBeVisible({ timeout: 30_000 });
      await expectNoHorizontalOverflow(page, `${item.locale}/${item.theme}/${item.view}/${item.width}`);
      await page.screenshot({
        path: join(EVIDENCE_DIR, `${item.view}-${item.locale}-${item.theme}-${item.width}.png`),
        fullPage: true,
      });
    }
  });

  test("perspective links, methodology panel, focus restoration and Axe remain accessible", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "en", "light");
    await page.goto("/dashboard?view=strategic");
    await expect(page.getByRole("heading", { name: "National performance" })).toBeVisible();

    const strategic = perspectiveNav(page).getByRole("link", { name: "Strategic View" });
    const operational = perspectiveNav(page).getByRole("link", { name: "Operational View" });
    await strategic.focus();
    await expect(strategic).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(operational).toBeFocused();

    const methodology = page.getByRole("button", { name: /How is this calculated\?|Why unavailable\?/ }).first();
    await methodology.click();
    const panel = page.getByRole("complementary");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(methodology).toBeFocused();

    const results = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
