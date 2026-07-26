import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const pageSource = read("src/app/(app)/operations/page.tsx");
const mapSource = read("src/app/(app)/operations/OperationsMapWorkspace.tsx");
const previewSource = read("src/app/(app)/operations/OperationsPreview.tsx");
const filterSource = read("src/app/(app)/operations/OperationsScopeFilter.tsx");
const monitoringSource = read("src/app/(app)/operations/Monitoring.tsx");
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
    expect(monitoringSource).not.toContain("setInterval");
    expect(monitoringSource).not.toContain("fetchMonitoringRows(");
    expect(loadingSource.match(/length: 5/)).not.toBeNull();
    const tabletRule = cssSource.match(/@media \(max-width: 1100px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(tabletRule).not.toContain(".kpiGrid");
    expect(cssSource).toContain("@media (max-width: 430px)");
    expect(cssSource).toContain("@media (max-width: 340px)");
    expect(cssSource).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(cssSource).toContain("grid-column: span 3");
  });

  test("adds neutral regional map drill and a fail-closed direct-route boundary", () => {
    expect(pageSource.match(/<OperationsMapWorkspace/g)).toHaveLength(2);
    expect(pageSource).toContain('"Regional performance map"');
    expect(pageSource).toContain("regionalMapEntries");
    expect(pageSource).toContain('tone: "neutral"');
    expect(pageSource).toContain("buildShellNavigation(routeRoleKeys)");
    expect(pageSource).toContain('.find(item => item.href === "/operations")');
    expect(pageSource).toContain("operationsDestination?.enabled === true");
    expect(pageSource).toContain("BUSINESS_ROLE_KEYS.includes(role)");
    expect(pageSource).not.toContain("FIELD_CHANNEL_ROLE_KEYS");
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

  test("scopes every widget — visits, factories, override and cancellation queues — to the caller's authorized geography [positive: unassigned region keeps existing RLS grant]", () => {
    expect(pageSource).toContain('.from("profiles")');
    expect(pageSource).toContain('.select("region")');
    expect(pageSource).toContain("resolveRegionId(authorizedScope || null)");
    expect(pageSource).toContain("if (!authorizedScope) return true");
    expect(pageSource).toContain("inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null)");
    expect(pageSource).toContain("inAuthorizedGeography(factory.region, factory.city)");
    expect(pageSource.indexOf('.from("profiles")')).toBeGreaterThan(pageSource.indexOf("if (!mayViewOperations)"));
    expect(pageSource).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  test("[negative: out-of-region] visits, override and cancellation rows outside the authorized region are excluded and disclosed, never silently dropped", () => {
    expect(pageSource).toContain("outOfScopeVisitCount");
    expect(pageSource).toMatch(
      /inAuthorizedGeography\(\s*row\.visits\?\.factories\?\.region \?\? null,\s*row\.visits\?\.factories\?\.city \?\? null,\s*\)/,
    );
    expect(pageSource).toContain("outOfScopeOverrideCount");
    expect(pageSource).toContain("outOfScopeCancellationCount");
    expect(pageSource).toContain("outOfScopeRecordCount = outOfScopeVisitCount + outOfScopeOverrideCount + outOfScopeCancellationCount");
    expect(pageSource).toContain("outOfScopeRecordCount > 0");
    expect(pageSource).toContain(
      "visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))",
    );
    expect(pageSource).toContain("visits(factories(name, region, city");
  });

  test("[positive: partial-source retry] a failed source degrades only its own banner and offers a real same-route retry, never a dead affordance", () => {
    expect(pageSource).toContain("loadErrors.length > 0");
    expect(pageSource).toContain('href="/operations">{t("ops.err.retry"');
    expect(pageSource).not.toContain('{t("ops.err.retry", "retry")}.');
    // Every read is independently tolerant — one rejected promise cannot throw
    // before the page renders the other, healthy widgets (Promise.all resolves
    // per-call PostgrestSingleResponse objects with their own .error, it does
    // not reject the whole batch on a single query failure).
    expect(pageSource).toContain("visitsRes.error && \"visit monitoring\"");
    expect(pageSource).toContain("cancelError.message.includes(\"cancellation_requests\")");
  });

  test("[FND-002 positive/negative] operational_state and planning_status remain two distinct state machines, never conflated into one gate", () => {
    // Positive: the operational-state KPI board counts ALL visits by
    // operational_state alone — filtering that count by planning_status was a
    // proven regression (previously zeroed the cards) and must not return.
    expect(pageSource).toContain("const counts = Object.fromEntries(states.map(s => [s, visits.filter(v => v.operational_state === s).length]))");
    // Negative: an active on_the_way/arrived/executing journey remains
    // monitored even if its planning window/status has lapsed — operational
    // state is not gated behind workflow status.
    expect(pageSource).toContain('(v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state))');
    expect(pageSource).toContain("planning_status and operational_state are separate state");
  });
});

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 Live composition contract", () => {
  test("derives direct-route access before reads and keeps the page GET-only", () => {
    expect(livePageSource).toContain("getVerifiedUser(sb)");
    expect(livePageSource).toContain("buildShellNavigation(routeRoleKeys)");
    expect(livePageSource).toContain('.find(item => item.href === "/operations")');
    expect(livePageSource).toContain("BUSINESS_ROLE_KEYS.includes(role)");
    expect(livePageSource).not.toContain("FIELD_CHANNEL_ROLE_KEYS");
    expect(livePageSource.indexOf("if (!mayViewOperations)")).toBeLessThan(livePageSource.indexOf("await Promise.all(["));
    expect(livePageSource).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  test("renders bounded markers and states without route, ETA, GPS or refresh invention", () => {
    expect(livePageSource).toContain('"Recorded positions — not live GPS"');
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
    expect(livePageSource).toContain("isTestFixtureEstablishment(factory)");
    expect(livePageSource).toContain("startsAt <= observedAt.getTime()");
    expect(livePageSource).toContain("sourceInspectorName(");
    expect(livePageSource).toContain("activeFactoryIds.has(factory.id)");
    expect(livePageSource).toContain('"Recorded inspector position marker"');
    expect(livePageSource).not.toContain("function hash01");
    expect(livePageSource).not.toContain("originLat");
    expect(livePageSource).toContain("latestPositionByVisit.get(v.id)");
    expect(livePageSource).toContain("integration_mode.eq.production");
    expect(livePageSource).toContain('.lte("occurred_at", observedAt.toISOString())');
    expect(liveShellSource).toContain('<bdi dir="auto">{inspector.inspector}</bdi>');
    expect(liveShellSource).toContain('data-live-since dateTime={inspector.sinceAt}');
  });

  test("provides synchronized list, wallboard, loading disclosure and bounded responsive rules", () => {
    expect(liveShellSource).toContain('aria-pressed={selectedId === inspector.id}');
    expect(liveShellSource).toContain('data-testid="live-inspector-details"');
    expect(liveShellSource).toContain("selectedInspector.visitId");
    expect(liveMapSource).toContain("feature.properties?.inspector");
    expect(liveCssSource).toContain(":global(.mapboxgl-popup-content)");
    expect(liveShellSource).toContain("onProviderFailure={markProviderFailed}");
    expect(liveShellSource).toContain("noScopeRows || hasNoPositions");
    expect(liveShellSource).toContain("noScopeRows ? s.noScope : s.noPositions");
    expect(liveShellSource).not.toContain('noScopeRows ? (\\n            <EmptyState');
    expect(liveShellSource).toContain("wallboard ? styles.wallboard");
    expect(liveLoadingSource).toContain("Recorded positions — not live GPS");
    expect(liveCssSource).toContain("@media (max-width: 1024px)");
    expect(liveCssSource).toContain("@media (max-width: 430px)");
    expect(liveCssSource).toContain("@media (max-width: 340px)");
    expect(liveCssSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(liveCssSource).toContain("inset-inline");
    expect(liveCssSource).toContain('[dir="rtl"]');
  });

  test("scopes reads to the caller's authorized geography and discloses out-of-scope exclusions separately", () => {
    expect(livePageSource).toContain('.from("profiles")');
    expect(livePageSource).toContain('.select("region")');
    expect(livePageSource).toContain("resolveRegionId(authorizedScope || null)");
    expect(livePageSource).toContain("if (!authorizedScope) return true");
    expect(livePageSource).toContain("inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null)");
    expect(livePageSource).toContain("outOfScopeRecordCount");
    expect(livePageSource.indexOf('.from("profiles")')).toBeGreaterThan(livePageSource.indexOf("if (!mayViewOperations)"));
    expect(liveShellSource).toContain("outOfScopeRecordCount");
    expect(liveShellSource).toContain("s.outOfScopeGeography");
  });

  test("carries per-position source and observation time and a read-only permitted visit handoff", () => {
    expect(livePageSource).toContain("kind");
    expect(livePageSource).toContain("positionSourceLabel");
    expect(livePageSource).toContain("positionObservedAt: position?.occurred_at ?? null");
    expect(liveShellSource).toContain("s.positionSourceField");
    expect(liveShellSource).toContain("s.positionObservedField");
    expect(liveShellSource).toContain("selectedInspector.positionObservedAt");
    expect(liveShellSource).toContain(
      'href={`/visits/${selectedInspector.visitId}`}',
    );
    expect(liveShellSource).not.toMatch(/\.(insert|update|upsert|delete)\(/);
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

  test("Inspector retains read access after field-shell convergence", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    for (const route of ["/operations", "/operations/live"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: "Operations access required", exact: true })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /Operations Center|Live Operations/ }).first()).toBeVisible();
    }
    await context.close();
  });

  test("an authenticated admin-only persona is denied both Operations routes before data content", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("admin") });
    const page = await context.newPage();
    for (const route of ["/operations", "/operations/live"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: "Operations access required", exact: true })).toBeVisible();
      await expect(page.getByTestId("operations-kpi-grid")).toHaveCount(0);
      await expect(page.getByTestId("operations-live")).toHaveCount(0);
    }
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
    await expect(page.getByText(/(?:Recorded positions — not live GPS|Last recorded position — not guaranteed live)/)).toHaveCount(2);
    await expect(page.getByText("Staleness cadence not yet configured — showing last-observed time only.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText("Snapshot generated:", { exact: false })).toBeVisible();
    await expect(page.getByText(/Verification fixtures and future-dated visit windows are excluded/)).toBeVisible();
    await expect(page.getByText(/G10 Golden Journey|M04 Governed Integration|KPI Verify|F360 Runtime/)).toHaveCount(0);
    const firstInspector = page.locator('aside[aria-labelledby="live-inspector-list-title"] button[aria-pressed]').first();
    if (await firstInspector.count()) {
      await expect(firstInspector.locator('bdi[dir="auto"]')).toBeVisible();
      const observedAt = Date.parse(await page.getByTestId("live-snapshot-at").getAttribute("datetime") ?? "");
      const visibleSinceValues = await page.locator("time[data-live-since]").evaluateAll(nodes =>
        nodes.map(node => Date.parse(node.getAttribute("datetime") ?? "")),
      );
      expect(visibleSinceValues.length).toBeGreaterThan(0);
      for (const sinceAt of visibleSinceValues) expect(sinceAt).toBeLessThanOrEqual(observedAt);
      await firstInspector.click();
      await expect(firstInspector).toHaveAttribute("aria-pressed", "true");
      const details = page.getByTestId("live-inspector-details");
      await expect(details).toBeVisible();
      await expect(details.getByText("Inspector details", { exact: true })).toBeVisible();
      await expect(details.getByText("Visit reference", { exact: true })).toBeVisible();
      await expect(details.getByText("Position source", { exact: true })).toBeVisible();
      await expect(details.getByText("Position observed", { exact: true })).toBeVisible();
      const openVisitLink = details.getByRole("link", { name: "Open visit record", exact: true });
      await expect(openVisitLink).toBeVisible();
      await expect(openVisitLink).toHaveAttribute("href", /^\/visits\/.+/);
      await page.getByRole("button", { name: "Close inspector details", exact: true }).click();
      await expect(details).toHaveCount(0);
    }
  });

  test("planner Operations Live access matches the canonical navigation contract", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/operations/live");
    await expect(page.getByTestId("operations-live")).toBeVisible();
    await expect(page.getByText(/(?:Recorded positions — not live GPS|Last recorded position — not guaranteed live)/).first()).toBeVisible();
    await context.close();
  });

  test("Inspector Operations reflows across the unified responsive width continuum", async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    const matrix = [
      { width: 320, height: 800, locale: "en", theme: "light" },
      { width: 375, height: 812, locale: "ar", theme: "dark" },
      { width: 390, height: 844, locale: "en", theme: "dark" },
      { width: 768, height: 1024, locale: "ar", theme: "light" },
      { width: 1024, height: 768, locale: "en", theme: "light" },
      { width: 1280, height: 800, locale: "ar", theme: "dark" },
      { width: 1440, height: 900, locale: "en", theme: "dark" },
      { width: 1920, height: 1080, locale: "ar", theme: "light" },
    ] as const;

    for (const state of matrix) {
      await page.setViewportSize({ width: state.width, height: state.height });
      await page.goto(`/locale?set=${state.locale}`);
      await page.evaluate(theme => localStorage.setItem("saqeel-theme", theme), state.theme);
      await page.goto("/operations");
      await expect(page.getByTestId("operations-kpi-grid")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${state.width}px ${state.locale}/${state.theme}`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });

  test("wallboard is a real route state and keeps the non-GPS disclosure", async ({ page }) => {
    await page.goto("/operations/live?wallboard=1");
    await expect(page.getByRole("link", { name: "Exit wallboard", exact: true })).toBeVisible();
    await expect(page.getByText(/(?:Recorded positions — not live GPS|Last recorded position — not guaranteed live)/).first()).toBeVisible();
  });

  test("Arabic Live Operations is complete, RTL and uses localized operational labels", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/operations/live");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "العمليات المباشرة — المملكة العربية السعودية", exact: true })).toBeVisible();
    await expect(page.getByText("مواقع مسجّلة — ليست تتبعاً مباشراً عبر GPS", { exact: true })).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "المفتشون النشطون", exact: true })).toBeVisible();
    await expect(page.getByText("مفتشون في الطريق", { exact: true })).toBeVisible();
    await expect(page.getByText("مصانع قيد المتابعة", { exact: true })).toBeVisible();
    await expect(page.getByLabel("إجماليات العمليات المباشرة")).toBeVisible();
    await expect(page.getByText("وقت إنشاء اللقطة:", { exact: false })).toBeVisible();
  });

  test("Arabic Operations Center localizes the primary views and governed KPI frame", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/operations");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("link", { name: "خريطة العمليات", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "الأداء الوطني", exact: true })).toBeVisible();
    await expect(page.getByText("الزيارات النشطة", { exact: true })).toBeVisible();
    await expect(page.getByText("التنبيهات النشطة", { exact: true })).toBeVisible();
    await expect(page.getByText("غير متاح — يتطلب قراراً", { exact: true })).toHaveCount(2);
  });

  test("basemap provider failure withdraws only the map and keeps operational context", async ({ page }) => {
    await page.route(/mapbox/, route => route.abort());
    await page.goto("/operations/live");
    await expect(page.getByText("Live map unavailable — basemap provider failed.", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText(/(?:Recorded positions — not live GPS|Last recorded position — not guaranteed live)/).first()).toBeVisible();
  });
});
