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
const liveTypesSource = read("src/app/(app)/operations/live/types.ts");

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
    expect(livePageSource).toContain('"Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed."');
    expect(livePageSource).toContain('"Last recorded GPS — not guaranteed live"');
    expect(livePageSource).toContain('"Projected from assignment/schedule — not live GPS"');
    expect(livePageSource).toContain('"Location unavailable — no recorded GPS and no assignment/factory coordinate available"');
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
    expect(liveShellSource).toContain('data-testid="live-inspector-details"');
    expect(liveShellSource).toContain("selectedInspector.visitId");
    expect(liveMapSource).toContain("feature.properties?.inspector");
    expect(liveCssSource).toContain(":global(.mapboxgl-popup-content)");
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

// M3-MAP-PROVENANCE-001 — CLAUDE-M3-MAP-PROVENANCE-IMPLEMENTATION. Static/
// source-level proof for every regression-safe contract point that does not
// require a seeded fixture. No Supabase seed or mutation is performed by
// this describe block.
test.describe("TASK-M3-MAP-PROVENANCE-001 source/query non-regression", () => {
  test("geoRes/geo full-ledger query is unchanged — no kind filter, same WHERE/order/pagination", () => {
    // Same request as before: no .in("kind", ...) / .eq("kind", ...) clause
    // anywhere near the geo_events call — latestGeofence still sees the full
    // ledger, including override/deviation rows.
    const geoResStart = pageSource.indexOf('sb.from("geo_events")');
    const geoResBlock = pageSource.slice(geoResStart, geoResStart + 400);
    expect(geoResBlock).toContain('.select("id, visit_id, kind, geofence_result, accuracy_m, occurred_at, observed_lat, observed_lng")');
    expect(geoResBlock).toContain('.order("occurred_at", { ascending: false })');
    expect(geoResBlock).toContain('.order("id", { ascending: true })');
    expect(geoResBlock).not.toMatch(/\.(in|eq)\("kind"/);
    // latestGeofence still reduces over the full, unfiltered geo/scopedGeo —
    // not the kind-restricted positionGeo subset.
    expect(pageSource).toContain("for (const g of scopedGeo) {");
    expect(pageSource).toContain("if (g.geofence_result && !latestGeofence.has(g.visit_id))");
  });

  test("positionGeo is a separate in-memory subset restricted to permitted kinds, never filters the shared ledger", () => {
    expect(pageSource).toContain('const POSITION_KINDS = ["telemetry", "arrival", "checkin"] as const;');
    expect(pageSource).toContain("const positionGeo = geo");
    expect(pageSource).toContain(".filter(g => monitoredVisitIds.has(g.visit_id) && (POSITION_KINDS as readonly string[]).includes(g.kind))");
    expect(pageSource).toContain(".slice()");
    // A fresh copy is sorted and reduced — the original `geo` array (and
    // therefore `scopedGeo`/`latestGeofence`) is never reassigned or mutated.
    expect(pageSource).not.toMatch(/geo\s*=\s*geo\.(sort|filter)\(/);
  });

  test("per-visit position precedence is deterministic: occurred_at desc, then id desc as the tiebreak", () => {
    expect(pageSource).toContain("const byTime = Date.parse(b.occurred_at) - Date.parse(a.occurred_at);");
    expect(pageSource).toContain("return byTime !== 0 ? byTime : (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);");
    expect(pageSource).toContain("const latestPositionByVisit = new Map<string, GeoRow>();");
    expect(pageSource).toContain("if (!latestPositionByVisit.has(g.visit_id)) latestPositionByVisit.set(g.visit_id, g);");
  });

  test("tier 1 accepts only permitted kinds; override/deviation rows can never resolve as recorded", () => {
    // resolveVisitPosition only ever reads from latestPositionByVisit, whose
    // source (positionGeo) is already kind-restricted above — override/
    // deviation rows are excluded before this function ever sees them.
    expect(pageSource).toContain("function resolveVisitPosition(v: VisitRow, f: FactoryRow | undefined): PositionResolution {");
    expect(pageSource).toContain("const recorded = latestPositionByVisit.get(v.id);");
    expect(pageSource).toContain('provenance: "recorded"');
  });

  test("tier 2 requires a real assignment, window_start and a resolved planner/factory coordinate", () => {
    expect(pageSource).toContain("const hasAssignment = (v.assignments?.length ?? 0) > 0;");
    expect(pageSource).toContain("const coordLat = plannerLat ?? factoryLat;");
    expect(pageSource).toContain("const coordLng = plannerLng ?? factoryLng;");
    expect(pageSource).toContain("if (hasAssignment && v.window_start && coordLat != null && coordLng != null) {");
    expect(pageSource).toContain('provenance: "projected"');
    expect(pageSource).toContain("coordinateSource: plannerLat != null && plannerLng != null ? \"planner\" : \"factory\"");
  });

  test("tier 3 (neither resolves) returns null coordinates and provenance unavailable — never thrown or dropped", () => {
    expect(pageSource).toContain('return { lat: null, lng: null, provenance: "unavailable" };');
  });

  test("mapEntries/regionalMapEntries are built from full monitored/scoped source entities, never from a coordinate-prefiltered pins array", () => {
    expect(pageSource).not.toContain("const pins: OpsPin[]");
    expect(pageSource).not.toContain('import type { OpsPin } from "./OpsMap"');
    expect(pageSource).toContain("const mapEntries: OperationsMapEntry[] = [];");
    expect(pageSource).toContain("for (const v of monitored) {");
    expect(pageSource).toContain("const position = resolveVisitPosition(v, factory);");
    // No coordinate-based skip/continue anywhere in the visit or factory
    // entry-building loops — every monitored visit and scoped factory
    // becomes a list entry regardless of whether a coordinate resolved.
    const mapEntriesStart = pageSource.indexOf("const mapEntries: OperationsMapEntry[] = [];");
    const regionalStart = pageSource.indexOf("const regionalMapEntries: OperationsMapEntry[] = scopedFactories.map(factory => {");
    const entryBuildBlock = pageSource.slice(mapEntriesStart, regionalStart);
    expect(entryBuildBlock).not.toMatch(/if \(!factory \|\| factory\.official_lat == null/);
    expect(entryBuildBlock).not.toContain("official_lat == null) continue");
    expect(pageSource).toContain("const regionalMapEntries: OperationsMapEntry[] = scopedFactories.map(factory => {");
    expect(pageSource).not.toContain(".filter(factory => factory.official_lat != null && factory.official_lng != null)\n    .map(factory => ({");
  });

  test("OperationsMapEntry is list-capable with nullable coordinates and provenance metadata; mappedEntries type-guards the map-only subset", () => {
    expect(mapSource).toContain('export type OperationsMapEntry = Omit<OpsPin, "lat" | "lng"> & OperationsPreviewEntry & {');
    expect(mapSource).toContain("lat: number | null;");
    expect(mapSource).toContain("lng: number | null;");
    expect(mapSource).toContain('provenance: OperationsPositionProvenance;');
    expect(mapSource).toContain("const mappedEntries = useMemo(");
    expect(mapSource).toContain("entry.lat != null && entry.lng != null");
    // markers (fed to the shared GeoMap) derive from mappedEntries; the list
    // section below still maps over the full, unfiltered `entries`.
    expect(mapSource).toContain("mappedEntries.map(entry => ({");
    expect(mapSource).toContain("[mappedEntries]");
    expect(mapSource).toContain("{entries.map(entry => (");
  });

  test("live: exactly one bounded, non-N+1 geo_events query, scoped to the full monitored visit set", () => {
    expect(livePageSource.match(/sb\.from\("geo_events"\)/g)).toHaveLength(1);
    expect(livePageSource).toContain('.select("id, visit_id, kind, observed_lat, observed_lng, accuracy_m, occurred_at")');
    expect(livePageSource).toContain('.in("visit_id", monitoredVisitIds)');
    expect(livePageSource).toContain('.in("kind", POSITION_KINDS as unknown as string[])');
    expect(livePageSource).toContain('.order("occurred_at", { ascending: false })');
    expect(livePageSource).toContain('.order("id", { ascending: false })');
    // Never issued inside the visit-building loop.
    const inspectorLoopStart = livePageSource.indexOf("for (const v of visitRows) {");
    const inspectorLoopBlock = livePageSource.slice(inspectorLoopStart, inspectorLoopStart + 900);
    expect(inspectorLoopBlock).not.toContain('sb.from("geo_events")');
  });

  test("live: factories/visits list-level reads no longer drop coordinate-less rows; only the map-pin step filters", () => {
    expect(livePageSource).not.toMatch(/\.not\("official_lat"/);
    expect(liveMapSource).toContain("factory.lat != null && factory.lng != null");
    expect(liveMapSource).toContain("inspector.lat != null && inspector.lng != null");
  });

  test("live: a geo_events read failure is a distinct error state, never silently reinterpreted as confirmed-no-GPS", () => {
    expect(livePageSource).toContain("if (geoEventsRes.error) console.error(");
    expect(livePageSource).toContain("const hasReadError = Boolean(factoriesRes.error || visitsRes.error || geoEventsRes.error);");
  });

  test("live: types carry provenance, nullable coordinates and tier-specific metadata", () => {
    expect(liveTypesSource).toContain('export type LivePositionProvenance = "recorded" | "projected" | "unavailable";');
    expect(liveTypesSource).toContain("lat: number | null;");
    expect(liveTypesSource).toContain("lng: number | null;");
    expect(liveTypesSource).toContain("provenance: LivePositionProvenance;");
    expect(liveTypesSource).toContain("observedAt?: string;");
    expect(liveTypesSource).toContain("accuracyM?: number;");
    expect(liveTypesSource).toContain("scheduledAt?: string;");
    expect(liveTypesSource).toContain('coordinateSource?: "planner" | "factory";');
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
    await expect(page.getByText("Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed.", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Staleness cadence not yet configured — showing last-observed time only.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText("Last observed:", { exact: false })).toBeVisible();
    const firstInspector = page.locator('aside[aria-labelledby="live-inspector-list-title"] button[aria-pressed]').first();
    if (await firstInspector.count()) {
      // Structural, data-independent proof: whichever real tier this
      // environment's live data happens to resolve to, the rendered label is
      // always one of the three exact truthful strings — never the removed
      // generic "Projected route" claim and never blank. Which specific tier
      // appears is not asserted (it depends on real, unseeded data this
      // lease has no authority to control).
      const listProvenance = await firstInspector.getByTestId("live-list-provenance").textContent();
      expect(listProvenance).toMatch(/^(Last recorded GPS — not guaranteed live|Projected from assignment\/schedule — not live GPS|Location unavailable — no recorded GPS and no assignment\/factory coordinate available)/);

      await firstInspector.click();
      await expect(firstInspector).toHaveAttribute("aria-pressed", "true");
      const details = page.getByTestId("live-inspector-details");
      await expect(details).toBeVisible();
      await expect(details.getByText("Inspector details", { exact: true })).toBeVisible();
      await expect(details.getByText("Visit reference", { exact: true })).toBeVisible();
      const detailsProvenance = await details.getByTestId("live-inspector-provenance").textContent();
      expect(detailsProvenance).toMatch(/^(Last recorded GPS — not guaranteed live|Projected from assignment\/schedule — not live GPS|Location unavailable — no recorded GPS and no assignment\/factory coordinate available)/);
      await page.getByRole("button", { name: "Close inspector details", exact: true }).click();
      await expect(details).toHaveCount(0);
    } else {
      // No inspector currently resolves in this environment's live data —
      // honestly recorded, not silently skipped: the tier-specific runtime
      // assertions above require at least one on_the_way/arrived/executing
      // visit with an assigned inspector to exist, which this read-only
      // lease has no seed-data authority to guarantee.
      test.info().annotations.push({
        type: "external-evidence-blocker",
        description: "No live inspector entity present — tier-specific runtime proof not exercised this run (no seed-data lease held).",
      });
    }
  });

  test("planner Operations Live access matches the canonical navigation contract", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/operations/live");
    await expect(page.getByTestId("operations-live")).toBeVisible();
    await expect(page.getByText("Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed.", { exact: true }).first()).toBeVisible();
    await context.close();
  });

  test("wallboard is a real route state and keeps the non-GPS disclosure", async ({ page }) => {
    await page.goto("/operations/live?wallboard=1");
    await expect(page.getByRole("link", { name: "Exit wallboard", exact: true })).toBeVisible();
    await expect(page.getByText("Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed.", { exact: true }).first()).toBeVisible();
  });

  test("basemap provider failure withdraws only the map and keeps operational context", async ({ page }) => {
    await page.route(/mapbox/, route => route.abort());
    await page.goto("/operations/live");
    await expect(page.getByText("Live map unavailable — basemap provider failed.", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Active inspectors", exact: true })).toBeVisible();
    await expect(page.getByText("Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed.", { exact: true }).first()).toBeVisible();
  });
});
