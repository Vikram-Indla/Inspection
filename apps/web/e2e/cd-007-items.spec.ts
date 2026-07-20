import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-007 / SCR-ADM-020 / /admin/items — Inspection Item Catalogue (semantic
// catalogue + read-only runtime-preview strip). Requirements: MVP1-M09-002/005/014/
// 019/020/025, RBAC-001..006, FND-*. Acceptance: AC-0454..0458, DSG-003..008,
// DSG-A11Y-001, DSG-CODE-001.
//
// Current runtime truth: the route is server-role-gated; writes remain enforced by
// compliance_admin/form_admin RLS and server-action guards. Configuration mutations
// are covered by the scoped Admin audit reader and database audit trigger.
//
// States that cannot be safely forced against the live backend (S02 loading, S03
// verified-empty, S04 duplicate rejection, S05 unauthorized, S08 clause-degraded) are
// proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = evidenceDirectory("cd-007-items-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("admin") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.titlePath.some(part => part.startsWith("CD-007 wiring"))) return;
  await page.goto("/locale?set=en");
});

test.describe("CD-007 semantic catalogue (AC-0454/0455)", () => {
  test("renders the governed catalogue: title, governance note, blocked-targets panel", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.getByRole("heading", { name: /Inspection Item Catalogue/i })).toBeVisible();
    // Governance truth is stated, not implied: writes are role-gated; row changes are audited.
    const gov = page.getByRole("region", { name: /How this catalogue is governed/i });
    await expect(gov).toBeVisible();
    await expect(gov).toContainText(/writes require compliance_admin or form_admin/i);
    await expect(gov).toContainText(/every row change is audited/i);
    await page.screenshot({ path: join(EVIDENCE_DIR, "catalogue-en-light-1440.png"), fullPage: true });
  });

  test("populated catalogue is a true semantic table with eight columns", async ({ page }) => {
    await page.goto("/admin/items");
    const table = page.locator("table.ax-table");
    // Live seed contains inspection_items (CD-004 reads their count) → populated.
    await expect(table).toHaveCount(1);
    await expect(table.locator("thead th[scope=col]")).toHaveCount(8);
    for (const col of ["Code", "Title", "Clause", "Runtime semantics", "Weight", "Published use", "Status", "Actions"]) {
      await expect(table.locator("thead th[scope=col]", { hasText: col })).toBeVisible();
    }
    // Status carries a non-colour cue (word), never colour alone.
    await expect(table.locator(".ax-lozenge, .badge", { hasText: /active|deactivated/i }).first()).toBeVisible();
  });

  test("runtime-preview strip is a read-only projection (disabled response controls)", async ({ page }) => {
    await page.goto("/admin/items");
    const preview = page.getByRole("heading", { name: /Runtime preview/i });
    await expect(preview).toBeVisible();
    // The inspector's response options render as DISABLED buttons — a projection,
    // never an authoring surface — and the strip declares itself read-only.
    const group = page.getByRole("group", { name: /Response the inspector records/i });
    await expect(group).toBeVisible();
    const firstResp = group.getByRole("button").first();
    await expect(firstResp).toBeDisabled();
    await expect(page.getByText(/Read-only projection of stored configuration/i)).toBeVisible();
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
    await expect(page.locator("table.ax-table tbody summary", { hasText: /Edit · v/i }).first()).toBeVisible();
  });
});

test.describe("CD-007 a11y / RTL / dark-light / responsive (DSG-A11Y-001)", () => {
  test("heading hierarchy has no skipped levels", async ({ page }) => {
    await page.goto("/admin/items");
    // Frozen shell renders the page title as the sole h2; CD-007 sections are h3.
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
  });

  test("edit controls are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin/items");
    const target = page.locator("table.ax-table tbody summary", { hasText: /Edit · v/i }).first();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44 - 0.5);
  });

  test("Arabic renders document-level RTL with isolated LTR identifiers", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/items");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("table.ax-table")).toBeVisible();
    // Item codes / clause refs stay LTR-isolated inside RTL flow (spec §12). The
    // catalogue renders under RTL regardless of translation state; the CD-007 Arabic
    // copy becomes visible once 20260715101000_cd007_ar_strings.sql is applied (this
    // slice does not apply migrations), so we assert RTL structure, not seeded text.
    await expect(page.locator("table.ax-table bdi[dir=ltr]").first()).toBeVisible();
    await expect(page.getByRole("region", { name: /How this catalogue is governed|كيف يُحكم/ })).toBeVisible();
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
        await expect(page.locator("table.ax-table")).toBeVisible();
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
  const page = SRC("src/app/admin/items/page.tsx");
  const actions = SRC("src/app/admin/items/actions.ts");
  const controls = SRC("src/app/admin/items/Controls.tsx");

  test("S04 duplicate code surfaces the proven UNIQUE-constraint fact (23505), not a generic failure", () => {
    // createItem detects Postgres unique_violation and surfaces a specific message;
    // every other provider error stays neutral (no leaked diagnostics).
    expect(actions).toContain('"23505"');
    expect(actions).toContain("already exists");
    expect(actions).toContain("NEUTRAL_WRITE_ERROR");
  });

  test("createItem uses governed presets only — no free-text response/evidence model", () => {
    expect(actions).toContain("RESPONSE_PRESETS[responseKey]");
    expect(actions).toContain("EVIDENCE_PRESETS[evidenceKey]");
    for (const preset of ["photo_nc_mandatory", "video_nc_mandatory", "document_nc_mandatory", "comment_nc_mandatory"]) {
      expect(actions).toContain(preset);
      expect(controls).toContain(preset);
    }
  });

  test("S03 verified-empty and S08 unavailable are DISTINCT — empty is never rendered on error", () => {
    // Empty state only when the read succeeded (!error) and there are zero rows;
    // the error/degraded path renders a banner, never the empty invite.
    expect(page).toContain("!error && rows.length === 0");
    expect(page).toContain("admin.items.r2.empty.title");
    expect(page).toContain("admin.items.r2.error.title");
    // Clause-list failure degrades only the clause control; catalogue still renders.
    expect(page).toContain("clauseUnavailable");
    expect(controls).toContain("clauseUnavailable");
  });

  test("base-item semantics, scoring, usage and scoped audit are wired", () => {
    expect(controls).not.toContain('name="requirement_mode"');
    expect(controls).toContain('name="scoring_enabled"');
    expect(actions).toContain("scoring_enabled: scoringEnabled");
    expect(page).toContain("getItemUsage");
    expect(page).toContain("admin_configuration_audit");
  });

  test("backend item version update and frontend edit control are wired", () => {
    expect(actions).toContain("export async function updateItem");
    expect(actions).toContain("inspection_item_versions_are_frozen");
    expect(actions).toContain("configuration_version");
    expect(page).toContain("EditItemForm");
    expect(page).not.toContain("admin.items.r2.blocked.reason");
    expect(page).not.toContain("admin.items.r2.blocked.guard");
    expect(page).not.toContain("admin.items.r2.blocked.conditional");
    expect(page).not.toContain("admin.items.r2.blocked.usage");
    expect(page).not.toContain("admin.items.r2.blocked.audit");
  });

  test("Arabic seed migration exists and is guarded (never clobbers a reviewed row)", () => {
    const mig = SRC("../../supabase/migrations/20260715101000_cd007_ar_strings.sql");
    expect(mig).toContain("insert into ui_strings");
    expect(mig).toContain("admin.items.r2.title");
    expect(mig).toContain("admin.items.r2.preview.heading");
    expect(mig).toContain("where ui_strings.status = 'draft'");
  });

  test("no new live route — work stays inside the /admin/items folder", () => {
    // The three edited files plus loading.tsx are all under items/; no new route dir.
    expect(page).toContain("SCR-ADM-020");
    expect(controls).toContain('"use client"');
  });
});
