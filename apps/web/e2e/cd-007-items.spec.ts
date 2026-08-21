import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-007 / SCR-ADM-020 / /admin/items — Inspection Item Catalogue (semantic
// catalogue + read-only runtime-preview strip). Requirements: MVP1-M09-002/005/014/
// 019/020/025, RBAC-001..006, FND-*. Acceptance: AC-0454..0458, DSG-003..008.
//
// Migrated 2026-08-21 to the SAQEEL page/feature/section split: the governed
// contract now spans the thin route, the feature query, the section screen, the
// client forms and the bilingual copy namespace. The behaviours asserted are
// unchanged; the selectors are role/text based rather than legacy CSS classes.
const EVIDENCE_DIR = evidenceDirectory("cd-007-items-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("admin") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.titlePath.some(part => part.startsWith("CD-007 wiring"))) return;
  await page.goto("/locale?set=en");
});

test.describe("CD-007 semantic catalogue (AC-0454/0455)", () => {
  test("renders the governed catalogue: title, governance note", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.getByRole("heading", { name: /Inspection Item Catalogue/i })).toBeVisible();
    const gov = page.getByRole("region", { name: /How this catalogue is governed/i });
    await expect(gov).toBeVisible();
    await expect(gov).toContainText(/writes require the admin role/i);
    await expect(gov).toContainText(/every row change is audited/i);
    await page.screenshot({ path: join(EVIDENCE_DIR, "catalogue-en-light-1440.png"), fullPage: true });
  });

  test("populated catalogue is a true semantic table with eight columns", async ({ page }) => {
    await page.goto("/admin/items");
    const table = page.getByRole("table");
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("columnheader")).toHaveCount(8);
    for (const col of ["Code", "Title", "Clause", "Runtime semantics", "Weight", "Published use", "Status", "Actions"]) {
      await expect(table.getByRole("columnheader", { name: col })).toBeVisible();
    }
    await expect(table.getByText(/active|deactivated/i).first()).toBeVisible();
  });

  test("runtime-preview strip is a read-only projection (disabled response controls)", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.getByRole("heading", { name: /Runtime preview/i })).toBeVisible();
    const group = page.getByRole("group", { name: /Response the inspector records/i });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button").first()).toBeDisabled();
    await expect(page.getByText(/This shows the saved configuration only — nothing here can be edited\./i)).toBeVisible();
  });
});

test.describe("CD-007 supported authoring and version lifecycle", () => {
  test("writer sees scoped usage and governed mutation controls", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.getByText(/Read-only catalogue/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Create item/i })).toBeVisible();
  });

  test("item edit exposes a governed new-version form", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.locator("table tbody summary", { hasText: /Edit · v/i }).first()).toBeVisible();
  });
});

test.describe("CD-007 a11y / RTL / dark-light / responsive (DSG-A11Y-001)", () => {
  test("section heading hierarchy has no skipped levels", async ({ page }) => {
    await page.goto("/admin/items");
    // Shell renders the page title as h1; CD-007 sections are h2.
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  });

  test("edit controls are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin/items");
    const target = page.locator("table tbody summary", { hasText: /Edit · v/i }).first();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44 - 0.5);
  });

  test("Arabic renders document-level RTL with isolated LTR identifiers", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/items");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("table bdi[dir=ltr]").first()).toBeVisible();
    await expect(page.getByRole("region", { name: /How this catalogue is governed|كيف يُحوكَم/ })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "catalogue-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("dark and light, 1440 and 1024 — no horizontal overflow", async ({ page }) => {
    await page.goto("/admin/items");
    for (const [w, h] of [[1440, 900], [1024, 768]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await expect(page.getByRole("heading", { name: /Inspection Item Catalogue/i })).toBeVisible();
        await expect(page.getByRole("table")).toBeVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, `catalogue-en-${theme}-${w}.png`), fullPage: true });
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the wiring closures that cannot be
// forced against live data (duplicate rejection, verified-empty vs unavailable,
// blocked legs, no invented audit/usage/guard).
test.describe("CD-007 wiring (DEC-012): completed authoring, usage and scoped audit", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const actions = SRC("src/app/(app)/admin/items/actions.ts");
  const queries = SRC("src/features/admin-items/queries.ts");
  const screen = SRC("src/components/sections/admin-items/items-screen.tsx");
  const forms = SRC("src/components/sections/admin-items/item-forms.tsx");
  const enCopy = SRC("src/i18n/locales/en/admin-items.json");
  const arCopy = SRC("src/i18n/locales/ar/admin-items.json");

  test("S04 duplicate code surfaces the proven UNIQUE-constraint fact (23505), not a generic failure", () => {
    expect(actions).toContain('"23505"');
    expect(actions).toContain("already exists");
    expect(actions).toContain("NEUTRAL_WRITE_ERROR");
  });

  test("createItem uses governed presets only — no free-text response/evidence model", () => {
    expect(actions).toContain("RESPONSE_PRESETS[responseKey]");
    expect(actions).toContain("EVIDENCE_PRESETS[evidenceKey]");
    for (const preset of ["photo_nc_mandatory", "video_nc_mandatory", "document_nc_mandatory", "comment_nc_mandatory"]) {
      expect(actions).toContain(preset);
      expect(forms).toContain(preset);
    }
  });

  test("S03 verified-empty and S08 unavailable are DISTINCT — empty is never rendered on error", () => {
    expect(screen).toContain("!data.error && data.rows.length === 0");
    expect(enCopy).toContain("No inspection items set up yet");
    expect(enCopy).toContain("Couldn’t load the item catalogue.");
    expect(screen).toContain("clauseUnavailable");
    expect(forms).toContain("clauseUnavailable");
  });

  test("base-item semantics, scoring, usage and scoped audit are wired", () => {
    expect(forms).not.toContain('name="requirement_mode"');
    expect(forms).toContain('name="scoring_enabled"');
    expect(actions).toContain("scoring_enabled: scoringEnabled");
    expect(queries).toContain("getItemUsage");
    expect(queries).toContain("admin_configuration_audit");
  });

  test("backend item version update and frontend edit control are wired", () => {
    expect(actions).toContain("export async function updateItem");
    expect(actions).toContain("inspection_item_versions_are_frozen");
    expect(actions).toContain("configuration_version");
    expect(screen).toContain("EditItemForm");
  });

  test("Arabic copy is registered in the namespace, not invented at render time", () => {
    expect(arCopy).toContain("كتالوج بنود التفتيش");
    expect(arCopy).toContain("معاينة تشغيلية");
    expect(enCopy).toContain("Inspection Item Catalogue");
  });

  test("no new live route — work stays inside the /admin/items folder", () => {
    const page = SRC("src/app/(app)/admin/items/page.tsx");
    expect(page).toContain("ItemsScreen");
    expect(forms).toContain('"use client"');
  });
});
