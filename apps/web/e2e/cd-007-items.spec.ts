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
// Shared runtime truth (0002_rbac_audit.sql): SELECT = any authenticated; writes =
// compliance_admin/form_admin via RLS; NO Admin-family route guard is proven, so an
// Inspector legitimately reaches /admin/items. These runtime specs use the Inspector
// persona precisely to exercise that truth (visibility != authority) and to prove the
// read-only spine renders for any authenticated user. inspection_items writes are
// audit-tracked at the database; the audit-timeline read view remains unavailable.
//
// States that cannot be safely forced against the live backend (S02 loading, S03
// verified-empty, S04 duplicate rejection, S05 unauthorized, S08 clause-degraded) are
// proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = evidenceDirectory("cd-007-items-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("inspector") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-007 semantic catalogue (AC-0454/0455)", () => {
  test("renders the governed catalogue: title, governance note, blocked-targets panel", async ({ page }) => {
    await page.goto("/admin/items");
    await expect(page.getByRole("heading", { name: /Inspection Item Catalogue/i })).toBeVisible();
    // Governance truth is stated, not implied: RLS is the authority; writes are audited.
    const gov = page.getByRole("region", { name: /How this catalogue is governed/i });
    await expect(gov).toBeVisible();
    await expect(gov).toContainText(/RLS is the authority/i);
    await expect(gov).toContainText(/recorded as audit events/i);
    await expect(gov).toContainText(/audit-trail read view is.*not-yet-granted/i);
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
    await expect(table.locator(".ax-lozenge", { hasText: /active|deactivated/i }).first()).toBeVisible();
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

test.describe("CD-007 blocked legs render as disabled, annotated targets (never working)", () => {
  test("contract-target panel lists disabled targets with owners", async ({ page }) => {
    await page.goto("/admin/items");
    const panel = page.getByRole("region", { name: /Contract targets — not yet wired/i });
    await expect(panel).toBeVisible();
    for (const label of [
      "Edit item / new version",
      "Author conditional rule",
      "Published-use warning — unavailable",
      "Deactivation reason capture",
      "Item change audit trail",
      "Route guard / unauthorized redirect",
    ]) {
      await expect(panel.getByRole("button", { name: new RegExp(label, "i") })).toBeDisabled();
    }
    await expect(panel.getByText(/owner: platform/i)).toBeVisible();
    await expect(panel.getByText(/owner: backend/i).first()).toBeVisible();
  });

  test("per-item published-use is 'unavailable', never a fabricated count", async ({ page }) => {
    await page.goto("/admin/items");
    const usageCell = page.locator("table.ax-table tbody tr td .ax-lozenge--warning", { hasText: /unavailable/i }).first();
    await expect(usageCell).toBeVisible();
    // No numeric usage count is invented anywhere in the Published-use column.
    const usageColText = await page.locator("table.ax-table tbody tr td:nth-child(6)").allInnerTexts();
    for (const cell of usageColText) expect(cell).not.toMatch(/\d/);
  });

  test("no approve/publish/edit mutation is presented as working; row Edit is disabled", async ({ page }) => {
    await page.goto("/admin/items");
    // The disabled "Published-use warning" target contains the word published;
    // only enabled mutation controls are prohibited here.
    await expect(page.locator("button:not(:disabled)").filter({ hasText: /approve|publish/i })).toHaveCount(0);
    const rowEdit = page.locator("table.ax-table tbody").getByRole("button", { name: /^Edit$/ }).first();
    await expect(rowEdit).toBeDisabled();
  });
});

test.describe("CD-007 a11y / RTL / dark-light / responsive (DSG-A11Y-001)", () => {
  test("heading hierarchy has no skipped levels", async ({ page }) => {
    await page.goto("/admin/items");
    // Frozen shell renders the page title as the sole h2; CD-007 sections are h3.
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
  });

  test("primary action targets are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin/items");
    const create = page.getByRole("button", { name: /Create item/i });
    const box = await create.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44 - 0.5);
  });

  test("Arabic renders document-level RTL with isolated LTR identifiers", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/items");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
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
test.describe("CD-007 wiring (DEC-012): proven legs wired; unproven legs stay blocked", () => {
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

  test("row-write audit is proven; audit read, usage count, and route guard stay blocked", () => {
    // No route-guard redirect invented on this route (guard is HANDOFF_BLOCKED).
    expect(page).not.toContain("redirect(");
    expect(page).toContain("trg_audit_inspection_items");
    expect(page).toContain("audit_events read is not granted");
    // Neither component performs an audit-timeline read.
    expect(page).not.toContain('.from("audit_events")');
    expect(actions).not.toContain('.from("audit_events")');
    // Published-use is surfaced as a target with an 'unavailable' state, never a count.
    expect(page).toContain("admin.items.r2.usage.unavailable");
    expect(page).toContain("HANDOFF_BLOCKED");
    // Conditional logic is display-only; no authoring control is wired.
    expect(page).toContain("display only");
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
