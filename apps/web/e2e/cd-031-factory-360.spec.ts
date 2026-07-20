import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-031 / SCR-WEB-400 / P12 — Factory 360 provenance-led dossier
// (/factories/:id). Signature: the Spatial Case Timeline — a source-labelled,
// list-equivalent, keyboard-operable narrative linking registered location
// context, inspections, findings/actions, review decisions and the current
// risk version. Requirement: MVP1-M07 (identity/risk/documents/reps/products/
// materials/workforce/history). Acceptance: DSG-026, DSG-A11Y-001;
// WIRING_MAP_CD-031 legs 1-18 plus 4b (risk-version history) and 4c (evidence
// timeline).
//
// READ-ONLY: this spec never submits AddDocument/AddRepresentative/AddProduct/
// AddMaterial/ToggleRepActive — those mutate live data. Per .claude/rules/
// tests.md a screenshot alone is not evidence, so unavailable/blocked/masked
// states are proven against the component's own source (deterministic) and
// live navigation proves structure + a11y against whatever the environment
// has actually seeded.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const PAGE = "src/app/(app)/factories/[id]/page.tsx";
const LOADING = "src/app/(app)/factories/[id]/loading.tsx";

async function openFirstFactory(page: Page): Promise<boolean> {
  await page.goto("/factories");
  // Prefer a source-synced registered factory. Immediate-visit temporary
  // factories intentionally have no official coordinates or risk history.
  const registeredRow = page.locator("tbody tr").filter({ hasNotText: /Unregistered factory/i }).first();
  const registeredLink = registeredRow.locator('a[href^="/factories/"]');
  const link = await registeredLink.count() ? registeredLink : page.locator('a[href^="/factories/"]').first();
  if (await link.count() === 0) return false;
  await link.click();
  await expect(page).toHaveURL(/\/factories\/[0-9a-f-]+$/);
  // Server-rendered dossier: wait for the signature section, not just the URL,
  // before querying anything else — the route is `dynamic = "force-dynamic"`.
  await expect(page.getByRole("heading", { name: /Spatial Case Timeline/i })).toBeVisible({ timeout: 15_000 });
  return true;
}

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-031 source truth — governed risk/spatial wiring, masking, isolation", () => {
  test("leg 4/4b/4c — risk drivers, version history and authorized evidence timeline use governed sources", () => {
    const src = SRC(PAGE);
    expect(src).toMatch(/from\("factory_risk_snapshots"\)/);
    expect(src).toMatch(/from\("evidence"\)/);
    expect(src).toMatch(/risk_drivers, risk_calculated_at/);
    expect(src).toMatch(/canSeeSensitiveHistory/);
  });

  test("leg 15/16 — official and observed points use the shared map boundary; no polygon is fabricated", () => {
    const src = SRC(PAGE);
    expect(src).toMatch(/FactorySpatialMap/);
    expect(src).toMatch(/from\("geo_events"\)/);
    const map = SRC("src/app/(app)/factories/[id]/FactorySpatialMap.tsx");
    expect(map).toMatch(/Industrial-license official location/);
    expect(map).toMatch(/overrideReason/);
    expect(map).not.toMatch(/Polygon|boundary_polygon/);
  });

  test("leg 11 — document preview is unavailable; storage_path stays a plain field, no signed URL/viewer", () => {
    const src = SRC(PAGE);
    expect(src).toMatch(/HANDOFF_BLOCKED_DOCUMENT_VIEWER/);
    expect(src).not.toMatch(/createSignedUrl|getPublicUrl/);
  });

  test("leg 12/18 — representative contact fields are masked for leadership only, never a page-level gate", () => {
    const src = SRC(PAGE);
    expect(src).toMatch(/HANDOFF_BLOCKED_ROLE/);
    expect(src).toMatch(/maskContacts\s*=\s*roles\.length > 0 && roles\.every\(r => r === "leadership"\)/);
    // Every other role still renders phone/email — masking is per-field, not per-page.
    expect(src).toMatch(/!maskContacts && <><td className="ax-numeric">\{r\.phone/);
  });

  test("leg 17 — one section's query error stays an isolated banner, never a whole-record failure", () => {
    const src = SRC(PAGE);
    // Four independent error flags, each rendered as its own banner in its own section.
    for (const flag of ["dErr", "rErr", "pErr", "mErr"]) {
      expect(src).toMatch(new RegExp(`${flag} && <div className="ax-banner ax-banner--critical"`));
    }
    expect(src).toMatch(/mapFactoryError\(dErr, "load"\)/);
    expect(src).toMatch(/mapFactoryError\(rErr, "load"\)/);
    expect(src).toMatch(/mapFactoryError\(pErr, "load"\)/);
    expect(src).toMatch(/mapFactoryError\(mErr, "load"\)/);
    expect(src).not.toMatch(/\{[drpm]Err\.message\}/);
    const actions = SRC("src/app/(app)/factories/[id]/actions.ts");
    expect(actions).toMatch(/mapFactoryError\(error, "update"\)/);
    expect(actions).not.toMatch(/return \{ error: error\.message \}/);
  });

  test("no invented staleness threshold — freshness is a plain fact, not a computed rule", () => {
    const src = SRC(PAGE);
    expect(src).not.toMatch(/is-stale/);
    expect(src).not.toMatch(/source_synced_at\s*<|Date\.now\(\)\s*-.*source_synced_at/);
  });

  test("S11 — a route-level loading skeleton exists for /factories/:id", () => {
    const loading = SRC(LOADING);
    expect(loading).toMatch(/aria-busy="true"/);
  });
});

test.describe("CD-031 planner — live dossier (legs 1,2,3,5-10,13,14,18)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("leg 1/2/3 — identity, provenance and risk summary render in the persistent aside", async ({ page }) => {
    const opened = await openFirstFactory(page);
    test.skip(!opened, "no factories in this environment to open");
    await expect(page.getByRole("heading", { name: /Spatial Case Timeline/i })).toBeVisible();
    await expect(page.getByText(/source .* synced/i).first()).toBeVisible();
  });

  test("leg 18 — the section strip is a real anchor list; pills are keyboard-focusable and >=48px", async ({ page }) => {
    const opened = await openFirstFactory(page);
    test.skip(!opened, "no factories in this environment to open");
    const pills = page.locator("a.cd-secitem");
    expect(await pills.count()).toBeGreaterThan(0);
    const first = pills.first();
    await first.focus();
    await expect(first).toBeFocused();
    const box = await first.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  });

  test("legs 4/15 — risk history and the official/observed map render from live sources", async ({ page }) => {
    const opened = await openFirstFactory(page);
    test.skip(!opened, "no factories in this environment to open");
    await expect(page.getByRole("heading", { name: /Factory health score and risk history/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Official, planned and observed locations/i })).toBeVisible();
    await expect(page.locator('[data-map-provider="mapbox"]').first()).toBeVisible();
  });

  test("leg 5-9 — the timeline renders as an ordered list (list-equivalent, not a decorative graph)", async ({ page }) => {
    const opened = await openFirstFactory(page);
    test.skip(!opened, "no factories in this environment to open");
    const timeline = page.locator("section#timeline");
    const populatedList = timeline.locator("ol.cd-timeline").filter({ has: page.locator("li") }).first();
    if (await populatedList.count()) await expect(populatedList).toBeVisible();
    else await expect(timeline.getByText(/No case events recorded/i)).toBeVisible();
  });
});

test.describe("CD-031 accessibility / RTL (leg 18, DSG-A11Y-001)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("Arabic/RTL — the dossier renders under dir=rtl with mixed-direction identity codes isolated", async ({ page }) => {
    await page.goto("/locale?set=ar");
    const opened = await openFirstFactory(page);
    test.skip(!opened, "no factories in this environment to open");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("bdi").first()).toBeVisible();
  });
});
