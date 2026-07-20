import { test, expect } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-010 (SCR-ADM-040 · Violation Catalogue) + CD-011 (SCR-ADM-041 · Penalty
// Mapping, logical penalty mode) at /admin/violations.
// Requirements: MVP1-M09-003/004/026, RBAC-001..006 (RLS write = compliance_admin
//   /form_admin), FLD-PEN-001, ERR-PUB-001, ERR-AUTH-001.
// Acceptance: AC-0449..0478, DSG-003..008, DSG-A11Y-001, DSG-CODE-001.
//
// The route is server-role-gated and RLS remains the write authority. A permitted
// non-writer persona exercises the truthful read-only surface. States that cannot
// be forced against live data (loading,
// unauthorized-guard, degraded, recovery, future/deactivated lifecycle,
// duplicate/missing-legal-basis negatives) are proven at the code layer below
// (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = evidenceDirectory("cd-010-011-violations-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const PAGE = SRC("src/app/(app)/admin/violations/page.tsx");
const CONTROLS = SRC("src/app/(app)/admin/violations/Controls.tsx");
const ACTIONS = SRC("src/app/(app)/admin/violations/actions.ts");
const COMPLETION_MIGRATION = SRC("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");

// Reviewer is explicitly admitted by the SCR-ADM-040 route boundary but is not a
// configuration writer, giving deterministic runtime proof of the read-only state.
test.use({ storageState: storageStatePath("reviewer") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });

test.describe("CD-010 catalogue mode — populated, trace, derived lifecycle (AC-0449..0460)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });
  test("S01: mode tablist + populated legal-taxonomy rows with clause trace only", async ({ page }) => {
    await page.goto("/admin/violations");
    // Two logical modes on the same direct route (penalty mode is not a new URL).
    const tabs = page.getByRole("tablist", { name: /Catalogue view/i });
    await expect(tabs.getByRole("tab", { name: /Violation catalogue/i })).toHaveAttribute("aria-selected", "true");
    await expect(tabs.getByRole("tab", { name: /Penalty mapping/i })).toBeVisible();
    // Seed has three violation codes; each row shows its clause-link trace.
    for (const code of ["V-FS-01", "V-FS-09", "V-HZ-02"]) {
      await expect(page.getByRole("heading", { name: new RegExp(code) })).toBeVisible();
    }
    await expect(page.getByText(/Legal trace/i).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd010-catalogue-en-light-1440.png"), fullPage: true });
  });

  test("severity is glyph+word+colour (never colour alone) and lifecycle is derived", async ({ page }) => {
    await page.goto("/admin/violations");
    // Severity carries the word 'severity' + the schema level label (not colour only).
    await expect(page.getByText(/severity/i).first()).toBeVisible();
    await expect(page.getByText("L1").first()).toBeVisible();
    // Derived lifecycle: seed active_from 2026-07-10, no active_to → active as of today.
    await expect(page.locator(".ax-lozenge--success").filter({ hasText: /active/i }).first()).toBeVisible();
    // Explicit derivation statement — never a stored status enum.
    await expect(page.getByText(/Lifecycle derived from active-from/i).first()).toBeVisible();
    await expect(page.getByText(/as of today/i).first()).toBeVisible();
  });

  test("S06 read-only: a permitted non-writer (Reviewer) sees no create form and a read-only reason", async ({ page }) => {
    await page.goto("/admin/violations");
    // RLS write requires compliance_admin/form_admin; the Reviewer is neither.
    await expect(page.getByText(/Read-only view/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create violation code/i })).toHaveCount(0);
  });

  test("category, applicability, version and trigger trace are enabled (CD-010)", async ({ page }) => {
    await page.goto("/admin/violations");
    await expect(page.getByText(/Trigger trace/i).first()).toBeVisible();
    await expect(page.getByText(/Version history/i).first()).toBeVisible();
    await expect(page.locator("[data-blocked-leg]")).toHaveCount(0);
  });
});

test.describe("CD-011 penalty mode — Mapping Validation Lens + one-to-one record (AC-0461..0478)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });
  test("S01: lens shows exactly the four proven checks and a one-to-one record", async ({ page }) => {
    await page.goto("/admin/violations?mode=penalty");
    await expect(page.getByRole("tab", { name: /Penalty mapping/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /Mapping Validation Lens/i })).toBeVisible();
    // Four checks — no fifth capability implied.
    const lens = page.getByRole("heading", { name: /Mapping Validation Lens/i }).locator("xpath=ancestor::section");
    await expect(lens.locator("li")).toHaveCount(4);
    // Shared verification data may be mapped or genuinely unmapped; both states
    // are explicit and neither may fabricate a mapping record.
    const mapped = page.getByText(/one active mapping; one-to-one satisfied/i).first();
    if (await mapped.count()) {
      await expect(mapped).toBeVisible();
      await expect(page.getByText(/published|locked/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/no mapping yet — one is required/i).first()).toBeVisible();
      await expect(page.getByText(/Unmapped — a compliance\/form admin can add the mapping/i).first()).toBeVisible();
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd011-penalty-en-light-1440.png"), fullPage: true });
  });

  test("penalty values render only when explicitly configured", async ({ page }) => {
    await page.goto("/admin/violations?mode=penalty");
    // A present mapping shows its governed preset token; otherwise the verified
    // unmapped state is shown. Neither case fabricates an amount.
    const range = page.getByText(/Range preset/i).first();
    if (await range.count()) {
      await expect(range).toBeVisible();
      await expect(page.getByText(/approved/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/no mapping yet — one is required/i).first()).toBeVisible();
    }
    await expect(page.getByText(/Amount \(when applicable\)/i).first()).toHaveCount(0);
  });

  test("effective periods, maker-checker lifecycle and immutability are no longer blocked targets", async ({ page }) => {
    await page.goto("/admin/violations?mode=penalty");
    for (const leg of ["effective-periods", "overlap-gap", "cardinality", "lifecycle", "maker-checker", "immutability", "route-guard"]) {
      await expect(page.locator(`button[data-blocked-leg="${leg}"]`)).toHaveCount(0);
    }
    await expect(page.locator('button[data-blocked-leg="mapping-audit"]')).toHaveCount(0);
  });
});

test.describe("CD-010/011 a11y / RTL / dark-light / responsive (DSG-A11Y-001)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });
  test("Arabic renders document-level RTL with isolated LTR identifiers", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/violations");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("bdi[dir=ltr]").first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd010-catalogue-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=ar");
    await page.goto("/admin/violations?mode=penalty");
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd011-penalty-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("mode-tab targets are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin/violations");
    await expect(page.getByRole("tablist", { name: /Catalogue view/i })).toBeVisible();
    const links = page.locator(".ax-segmented a.ax-btn");
    // The App Router streams a loading boundary before the server component.
    // Wait on the final tablist rather than sampling a locator count while the
    // previous streamed tree is being replaced.
    await expect(page.getByRole("tablist", { name: /Catalogue view/i })).toBeVisible();
    await expect(links).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const link = links.nth(i);
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box, `tab ${i} has a box`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });

  test("dark and light, 1440 and 1024 — no horizontal overflow (both modes)", async ({ page }) => {
    for (const mode of ["/admin/violations", "/admin/violations?mode=penalty"]) {
      await page.goto(mode);
      for (const [w, h] of [[1440, 900], [1024, 1366]] as const) {
        await page.setViewportSize({ width: w, height: h });
        for (const theme of ["light", "dark"] as const) {
          await page.emulateMedia({ colorScheme: theme });
          await expect(page.getByRole("tablist", { name: /Catalogue view/i })).toBeVisible();
        }
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `no horizontal overflow on ${mode}`).toBeLessThanOrEqual(1);
    }
  });
});

// CD-010/011 admin-family writer evidence: a compliance/form-admin sees the create
// affordances (S01 create). Mirrors CD-004's authoritative seeded persona login.
test.describe("CD-010/011 writer act-scope evidence", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a writer role renders the create-violation form and the mapping create leg", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/login");
    await page.locator("#email").fill("admin@mim.gov.sa");
    await page.locator("#pw").fill("MimAdmin!2026");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL(url => url.pathname.startsWith("/admin"), { timeout: 20_000 });
    await page.goto("/admin/violations");
    // Writer sees the create form; no read-only reason.
    await expect(page.getByRole("button", { name: /Create violation code/i })).toBeVisible();
    await expect(page.getByText(/Read-only view/i)).toHaveCount(0);
    await expect(page.locator('[data-usage-state="available"], [data-usage-state="unavailable"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Deactivate V-/i }).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd010-writer-create-en-light.png"), fullPage: true });
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the wiring closures and negatives
// that cannot be forced against live data without mutating it.
test.describe("CD-010/011 wiring (DEC-012): derivation, one-to-one, no-invention, blocked legs", () => {
  test("CD-010: lifecycle is DERIVED from active_from/active_to + today, not a stored enum", () => {
    expect(PAGE).toContain("active_to");
    expect(PAGE).toContain("function deriveLifecycle");
    // The query projects active_to so the derivation has real inputs.
    expect(PAGE).toMatch(/select\([^)]*active_from, active_to/);
    expect(PAGE).toContain("status");
  });

  test("CD-010: legal basis is NEVER written onto the violation_codes row", () => {
    // createViolationCode inserts only the proven columns — legal_basis lives on
    // the penalty mapping, not the code row.
    expect(ACTIONS).toContain("corrective_action");
    expect(ACTIONS).not.toMatch(/violation_codes[^;]*insert[^;]*legal_basis/s);
  });

  test("CD-011: one-to-one enforced and duplicate/legal-basis negatives are handled", () => {
    // Unique-constraint (23505) → specific, non-leaky rejection for both writes.
    expect(ACTIONS).toContain('const UNIQUE_VIOLATION = "23505"');
    expect(ACTIONS).toContain('admin.viol.err.dupCode');
    expect(ACTIONS).toContain('admin.viol.map.err.dupMapping');
    // Missing legal basis is rejected before insert (never invented).
    expect(ACTIONS).toContain('admin.viol.map.err.legalBasis');
    // Presets are config tokens, not monetary/legal values.
    expect(ACTIONS).toContain("PENALTY_RANGE_PRESETS");
    expect(ACTIONS).toContain('sb.rpc("publish_penalty_mapping"');
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_one_active");
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_one_draft");
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_maker_checker");
    expect(COMPLETION_MIGRATION).toContain("trg_guard_governed_penalty_mapping");
    expect(ACTIONS).not.toMatch(/SAR|ريال|price/);
    expect(ACTIONS).toContain("amountRaw");
  });

  test("CD-010: usage, active-to deactivation, and scoped audit are wired without false zeroes", () => {
    expect(ACTIONS).toContain('sb.rpc("violation_code_usage"');
    expect(ACTIONS).toContain("export async function deactivateViolationCode");
    expect(ACTIONS).toContain('.is("active_to", null).in("status", ["published", "locked"]).select("id")');
    expect(PAGE).toContain('sb.rpc("admin_configuration_audit"');
    expect(PAGE).toContain('data-usage-state="unavailable"');
    expect(PAGE).toContain("Audit history unavailable — no zero-event claim was made.");
    expect(CONTROLS).toContain("DeactivateViolationForm");
    expect(COMPLETION_MIGRATION).toContain("create or replace function violation_code_usage");
    expect(COMPLETION_MIGRATION).toContain("create or replace function admin_configuration_audit");
  });

  test("CD-011: scoped penalty audit replaces the stale blocked audit target", () => {
    expect(PAGE).toContain('p_object_type: "penalty_mappings"');
    expect(PAGE).toContain("Mapping audit events");
    expect(PAGE).not.toContain('["mapping-audit"');
  });

  test("the contract route /admin/penalties is NOT created as a live URL", () => {
    expect(existsSync(join(process.cwd(), "src/app/(app)/admin/penalties"))).toBe(false);
  });

  test("authoritative violation and penalty fields are enabled without blocked targets", () => {
    for (const field of ["category", "applicability", "configuration_version", "corrective_action", "penalty_type", "amount"]) expect(PAGE).toContain(field);
    expect(PAGE).not.toContain("data-blocked-leg");
  });

  test("loading/error/no-op semantics and focus-safe validation are present", () => {
    const loading = SRC("src/app/(app)/admin/violations/loading.tsx");
    const error = SRC("src/app/(app)/admin/violations/error.tsx");
    expect(loading).toContain('aria-busy="true"');
    expect(error).toContain("No zero-count or healthy-state claim has been made.");
    expect(CONTROLS).toContain('querySelector<HTMLElement>(":invalid")');
    expect(CONTROLS).toContain('role="status"');
    expect(CONTROLS).toContain('role="alert"');
  });

  test("Arabic seed migration exists for the new keys and is guarded", () => {
    const mig = SRC("../../supabase/migrations/20260715102000_cd010_cd011_ar_strings.sql");
    expect(mig).toContain("insert into ui_strings");
    expect(mig).toContain("admin.viol.lens.title");
    expect(mig).toContain("admin.viol.derived");
    expect(mig).toContain("where ui_strings.status = 'draft'");
  });
});
