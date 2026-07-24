import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const pageSource = read("src/app/(app)/operations/page.tsx");
const mapSource = read("src/app/(app)/operations/OperationsMapWorkspace.tsx");
const previewSource = read("src/app/(app)/operations/OperationsPreview.tsx");
const filterSource = read("src/app/(app)/operations/OperationsScopeFilter.tsx");
const loadingSource = read("src/app/(app)/operations/loading.tsx");
const cssSource = read("src/app/(app)/operations/operations.module.css");
const livePageSource = read("src/app/(app)/operations/live/page.tsx");
const liveShellSource = read("src/app/(app)/operations/live/LiveOps.tsx");
const liveMapSource = read("src/app/(app)/operations/live/LiveMapInner.tsx");
const liveLoadingSource = read("src/app/(app)/operations/live/loading.tsx");
const liveCssSource = read("src/app/(app)/operations/live/live.module.css");

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 composition contract", () => {
  test("renders exactly five governed KPI cards with two explicit decision blocks", () => {
    expect(pageSource.match(/<article className=\{styles\.kpiCard\}>/g)).toHaveLength(5);
    for (const label of ["Active Visits", "On the Way", "Executing", "Submitted Today", "Active Alerts"]) {
      expect(pageSource).toContain(`"${label}"`);
    }
    expect(pageSource.match(/"Unavailable — decision required"/g)).toHaveLength(2);
    expect(pageSource.match(/<div className=\{styles\.kpiValue\}>/g)).toHaveLength(2);
    expect(cssSource).not.toContain(".kpiUnavailable");
    expect(pageSource).toContain("Grain, source and Riyadh day boundary require sponsor decision");
    expect(pageSource).toContain("Taxonomy and deduplication require sponsor decision");
  });

  test("keeps Operations Map and National Performance as two primary views", () => {
    expect(pageSource).toContain('"Operations Map"');
    expect(pageSource).toContain('"National Performance"');
    expect(pageSource).toContain('view === "map"');
    expect(pageSource).toContain('view === "performance"');
    expect(filterSource).toContain('params.set("view", "performance")');
    expect(pageSource).toContain("<OverrideQueue");
    expect(pageSource).toContain("<CancellationQueue");
    expect(pageSource).toContain("<OpsExport");
    expect(pageSource).toContain("<MonitoringTable");
  });

  test("synchronizes map and accessible list without governed-looking risk shading", () => {
    expect(mapSource).toContain("selectedId");
    expect(mapSource).toContain("onMarkerClick={selectFromMap}");
    expect(mapSource).toContain('aria-pressed={selectedId === entry.id}');
    expect(mapSource).toContain('role="status" aria-live="polite"');
    expect(mapSource).toContain("<OperationsPreview");
    expect(previewSource).toContain('role="dialog"');
    expect(previewSource).toContain('aria-modal="true"');
    expect(previewSource).toContain('event.key === "Escape"');
    expect(previewSource).toContain("restoreRef.current?.focus()");
    expect(pageSource).toContain("Raw risk score");
    expect(pageSource).toContain("RLS-visible rank");
    expect(mapSource).not.toContain("regionPostures");
    expect(pageSource).not.toContain("regionPostures");
    expect(pageSource).not.toContain("BAND_TONE");
    expect(pageSource).toContain('"RLS-visible rank"');
  });

  test("does not introduce a refresh cadence and supplies bounded loading and responsive states", () => {
    expect(pageSource).not.toContain("auto-refreshes every 30 s");
    expect(pageSource).not.toContain("setInterval");
    expect(mapSource).not.toContain("setInterval");
    expect(filterSource).not.toContain("setInterval");
    expect(loadingSource.match(/length: 5/)).not.toBeNull();
    const tabletRule = cssSource.match(/@media \(max-width: 1100px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(tabletRule).not.toContain(".kpiGrid");
    expect(cssSource).toContain("@media (max-width: 430px)");
    expect(cssSource).toContain("@media (max-width: 340px)");
  });

  test("adds neutral regional map drill and a fail-closed direct-route boundary", () => {
    expect(pageSource.match(/<OperationsMapWorkspace/g)).toHaveLength(2);
    expect(pageSource).toContain('"Regional performance map"');
    expect(pageSource).toContain("regionalMapEntries");
    expect(pageSource).toContain('tone: "neutral"');
    expect(pageSource).toContain("buildShellNavigation(routeRoleKeys)");
    expect(pageSource).toContain('.find(item => item.href === "/operations")');
    expect(pageSource).toContain("operationsDestination?.enabled === true");
    expect(pageSource).not.toContain("operationsRoleKeys");
    expect(pageSource).toContain('"Operations access required"');
    expect(pageSource.indexOf("if (!mayViewOperations)")).toBeLessThan(pageSource.indexOf("await Promise.all(["));
  });

  test("keeps sponsor-facing Center copy, equal KPI typography and non-underlined local actions", () => {
    expect(pageSource).toContain('"National inspection activity and decisions"');
    expect(pageSource).not.toContain('"SCR-WEB-500 · SB12 · operational state ≠ workflow status (FND-002)"');
    expect(cssSource).toContain("font-size: clamp(1.125rem, 1.45vw, 1.5rem)");
    expect(cssSource).toContain("overflow-wrap: anywhere");
    expect(cssSource).toContain(".page :global(a.sq-link)");
    expect(cssSource).toContain("text-decoration: none");
    expect(cssSource).toContain(".page :global(a.sq-link:focus-visible)");
  });
});

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 Live composition contract", () => {
  test("derives direct-route access before reads and keeps the page GET-only", () => {
    expect(livePageSource).toContain("getVerifiedUser(sb)");
    expect(livePageSource).toContain("buildShellNavigation(routeRoleKeys)");
    expect(livePageSource).toContain('.find(item => item.href === "/operations")');
    expect(livePageSource.indexOf("if (!mayViewOperations)")).toBeLessThan(livePageSource.indexOf("await Promise.all(["));
    expect(livePageSource).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  test("renders bounded markers and states without route, ETA, GPS or refresh invention", () => {
    expect(livePageSource).toContain('"Projected route — not live GPS"');
    expect(livePageSource).toContain('"Staleness cadence not yet configured — showing last-observed time only."');
    expect(livePageSource).toContain('"Live map could not load"');
    expect(livePageSource).toContain('"No active visits in your scope right now"');
    expect(livePageSource).toContain('"No inspectors currently active"');
    expect(livePageSource).toContain('"Live map unavailable — basemap provider failed."');
    expect(liveMapSource).not.toContain("LineString");
    expect(liveMapSource).not.toContain("setInterval");
    expect(liveMapSource).not.toContain("ROUTE_SOURCE");
    expect(liveMapSource).not.toContain("etaMin");
    expect(liveMapSource).not.toContain("flyTo");
  });

  test("provides synchronized list, wallboard, loading disclosure and bounded responsive rules", () => {
    expect(liveShellSource).toContain('aria-pressed={selectedId === inspector.id}');
    expect(liveShellSource).toContain("onProviderFailure={markProviderFailed}");
    expect(liveShellSource).toContain("noScopeRows || hasNoPositions");
    expect(liveShellSource).toContain("noScopeRows ? s.noScope : s.noPositions");
    expect(liveShellSource).not.toContain('noScopeRows ? (\\n            <EmptyState');
    expect(liveShellSource).toContain("wallboard ? styles.wallboard");
    expect(liveLoadingSource).toContain("Projected route — not live GPS");
    expect(liveCssSource).toContain("@media (max-width: 1024px)");
    expect(liveCssSource).toContain("@media (max-width: 430px)");
    expect(liveCssSource).toContain("@media (max-width: 340px)");
    expect(liveCssSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(liveCssSource).toContain("inset-inline");
    expect(liveCssSource).toContain('[dir="rtl"]');
  });
});

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 runtime", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("authorized Operations user can switch both real-system views", async ({ page }) => {
    await page.goto("/operations");
    await expect(page.getByRole("heading", { name: "Operations Center", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Operations Center views" })).toBeVisible();
    await expect(page.locator('[data-testid="operations-kpi-grid"] article')).toHaveCount(5);
    await expect(page.getByText("Unavailable — decision required", { exact: true })).toHaveCount(2);

    await page.getByRole("link", { name: "National Performance", exact: true }).click();
    await expect(page).toHaveURL(/\/operations\?view=performance/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "National → region drill", exact: true })).toBeVisible();

    const mapViewLink = page.getByRole("link", { name: "Operations Map", exact: true });
    await expect(mapViewLink).toHaveAttribute("href", "/operations");
    await page.goto("/operations");
    await expect(page.getByRole("heading", { name: "Operations Map", exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test("planner direct-route access matches the accepted shared navigation contract", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/operations");
    await expect(page.getByRole("heading", { name: "Operations Center", exact: true })).toBeVisible();
    await expect(page.getByTestId("operations-kpi-grid")).toBeVisible();
    await context.close();
  });

  test("map and list selections open dismissible inspector and factory previews", async ({ page }) => {
    await page.goto("/operations");
    const inspectorTrigger = page.locator('button[data-entry-kind="visit"][data-has-inspector="true"]').first();
    await expect(inspectorTrigger).toBeVisible();
    await inspectorTrigger.click();
    await expect(page.getByTestId("operations-inspector-drawer")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open full visit", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("operations-inspector-drawer")).toHaveCount(0);
    await expect(inspectorTrigger).toBeFocused();

    await page.goto("/operations?view=performance");
    const factoryTrigger = page.locator('button[data-entry-kind="factory"]').first();
    await expect(factoryTrigger).toBeVisible();
    await factoryTrigger.click();
    const factoryCard = page.getByTestId("operations-factory-quick-card");
    await expect(factoryCard).toBeVisible();
    await expect(factoryCard.getByText("Raw risk score", { exact: true })).toBeVisible();
    await expect(factoryCard.getByText("RLS-visible rank", { exact: true })).toBeVisible();
    await expect(factoryCard.getByRole("link", { name: "Open Factory 360", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await expect(page.getByTestId("operations-factory-quick-card")).toHaveCount(0);
  });

  test("five Center KPI values do not overflow at the 1024 acceptance width", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/operations");
    const cards = page.locator('[data-testid="operations-kpi-grid"] article');
    await expect(cards).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      const overflow = await cards.nth(index).evaluate(element => ({
        horizontal: element.scrollWidth > element.clientWidth,
        vertical: element.scrollHeight > element.clientHeight,
      }));
      expect(overflow).toEqual({ horizontal: false, vertical: false });
    }
  });

  test("Operations Live exposes the bounded disclaimer, freshness and accessible list", async ({ page }) => {
    await page.goto("/operations/live");
    await expect(page.getByText("Projected route — not live GPS", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Staleness cadence not yet configured — showing last-observed time only.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText("Last observed:", { exact: false })).toBeVisible();
    const firstInspector = page.locator('aside[aria-labelledby="live-inspector-list-title"] button').first();
    if (await firstInspector.count()) {
      await firstInspector.click();
      await expect(firstInspector).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("planner Operations Live access matches the canonical navigation contract", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/operations/live");
    await expect(page.getByTestId("operations-live")).toBeVisible();
    await expect(page.getByText("Projected route — not live GPS", { exact: true }).first()).toBeVisible();
    await context.close();
  });

  test("wallboard is a real route state and keeps the non-GPS disclosure", async ({ page }) => {
    await page.goto("/operations/live?wallboard=1");
    await expect(page.getByRole("link", { name: "Exit wallboard", exact: true })).toBeVisible();
    await expect(page.getByText("Projected route — not live GPS", { exact: true }).first()).toBeVisible();
  });

  test("basemap provider failure withdraws only the map and keeps operational context", async ({ page }) => {
    await page.route(/mapbox/, route => route.abort());
    await page.goto("/operations/live");
    await expect(page.getByText("Live map unavailable — basemap provider failed.", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText("Projected route — not live GPS", { exact: true }).first()).toBeVisible();
  });
});
