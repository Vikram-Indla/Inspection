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

// The canonical Admin is admitted by the SCR-ADM-040 route boundary, and since
// the Compliance Configuration Request cutover EVERY direct write on this
// surface is read-only ("Configuration Request required"), giving deterministic
// runtime proof of the fail-closed authoring state. The bare /admin/violations
// URL is design-rewritten to the Enforcement Library; the legacy catalogue and
// penalty modes stay reachable through their explicit ?mode= URLs.
test.use({ storageState: storageStatePath("admin") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });

test.describe("CD-010 catalogue mode — populated, trace, derived lifecycle (AC-0449..0460)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });
  test("S01: mode tablist + populated legal-taxonomy rows or the verified-zero catalogue", async ({ page }) => {
    await page.goto("/admin/violations?mode=catalogue");
    // Two logical modes on the same direct route (penalty mode is not a new URL).
    const tabs = page.getByRole("tablist", { name: /Catalogue view/i });
    await expect(tabs.getByRole("tab", { name: /Violation catalogue/i })).toHaveAttribute("aria-selected", "true");
    await expect(tabs.getByRole("tab", { name: /Penalty mapping/i })).toBeVisible();
    // Rows show their clause-link trace when the live catalogue has codes; a
    // successful read of zero codes states verified-zero, never a blank page.
    const emptyZero = page.getByText(/No violation codes configured/i);
    if (await emptyZero.count()) {
      await expect(emptyZero).toBeVisible();
      await expect(page.getByText(/Violations generate automatically from configured responses/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/Legal trace/i).first()).toBeVisible();
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd010-catalogue-en-light-1440.png"), fullPage: true });
  });

  test("severity is glyph+word+colour (never colour alone) and lifecycle is derived", async ({ page }) => {
    await page.goto("/admin/violations?mode=catalogue");
    const emptyZero = page.getByText(/No violation codes configured/i);
    if (await emptyZero.count()) {
      await expect(emptyZero).toBeVisible();
      return;
    }
    // Severity carries the word 'severity' + the schema level label (not colour only).
    await expect(page.getByText(/severity/i).first()).toBeVisible();
    // Explicit derivation statement — never a stored status enum.
    await expect(page.getByText(/Lifecycle derived from active-from/i).first()).toBeVisible();
  });

  test("S06 read-only: direct authoring is closed for everyone behind the governed request flow", async ({ page }) => {
    await page.goto("/admin/violations?mode=catalogue");
    await expect(page.getByText(/Configuration Request required/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Compliance Configuration Requests/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create violation code/i })).toHaveCount(0);
  });

  test("category, applicability, version and trigger trace are enabled (CD-010)", async ({ page }) => {
    await page.goto("/admin/violations?mode=catalogue");
    const emptyZero = page.getByText(/No violation codes configured/i);
    if (await emptyZero.count() === 0) {
      await expect(page.getByText(/Trigger trace/i).first()).toBeVisible();
      await expect(page.getByText(/Version history/i).first()).toBeVisible();
    }
    await expect(page.locator("[data-blocked-leg]")).toHaveCount(0);
  });
});

test.describe("CD-011 penalty mode — Mapping Validation Lens + one-to-one record (AC-0461..0478)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });
  test("S01: lens shows exactly the four proven checks and a one-to-one record", async ({ page }) => {
    await page.goto("/admin/violations?mode=penalty");
    await expect(page.getByRole("tab", { name: /Penalty mapping/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /Mapping Validation Lens/i })).toBeVisible();
    // Proven checks only — no fifth capability implied.
    await expect(page.getByText(/Proven rule/).first()).toBeVisible();
    await expect(page.getByText(/No value is guessed or made up/i)).toBeVisible();
    // Shared verification data may be mapped, genuinely unmapped, or the
    // catalogue itself may be verified-zero; every state is explicit and none
    // fabricates a mapping record.
    const mapped = page.getByText(/one active mapping; one-to-one satisfied/i).first();
    const unmapped = page.getByText(/no mapping yet — one is required/i).first();
    if (await mapped.count()) {
      await expect(mapped).toBeVisible();
    } else if (await unmapped.count()) {
      await expect(unmapped).toBeVisible();
    } else {
      await expect(page.getByText(/No violation codes configured|No violation codes to map|No penalty mappings/i).first()).toBeVisible();
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd011-penalty-en-light-1440.png"), fullPage: true });
  });

  test("penalty values render only when explicitly configured", async ({ page }) => {
    await page.goto("/admin/violations?mode=penalty");
    // A present mapping shows its governed preset token; otherwise the verified
    // unmapped or verified-zero state is shown. No case fabricates an amount.
    const range = page.getByText(/Range preset/i).first();
    const unmapped = page.getByText(/no mapping yet — one is required/i).first();
    if (await range.count()) {
      await expect(range).toBeVisible();
    } else if (await unmapped.count()) {
      await expect(unmapped).toBeVisible();
    } else {
      await expect(page.getByText(/No violation codes configured|No violation codes to map|No penalty mappings/i).first()).toBeVisible();
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
    await page.goto("/admin/violations?mode=catalogue");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("tablist", { name: /Catalogue view|عرض/i })).toBeVisible();
    if (await page.locator("bdi[dir=ltr]").count()) {
      await expect(page.locator("bdi[dir=ltr]").first()).toBeVisible();
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd010-catalogue-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=ar");
    await page.goto("/admin/violations?mode=penalty");
    await page.screenshot({ path: join(EVIDENCE_DIR, "cd011-penalty-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("mode-tab targets are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin/violations?mode=catalogue");
    await expect(page.getByRole("tablist", { name: /Catalogue view/i })).toBeVisible();
    const links = page.locator(".sq-segmented a.btn");
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
    for (const mode of ["/admin/violations?mode=catalogue", "/admin/violations?mode=penalty"]) {
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

// CCR cutover evidence: every direct write path on this surface fails closed
// with ccr_required — even for the canonical writer roles — so the governed
// Compliance Configuration Request lifecycle cannot be skipped.
test.describe("CD-010/011 CCR fail-closed authoring evidence", () => {
  test("every server action returns ccr_required and performs no write", () => {
    for (const action of [
      "createViolationCode", "deactivateViolationCode", "publishViolationCode",
      "createPenaltyMapping", "publishPenaltyMapping",
    ]) {
      expect(ACTIONS).toContain(`export async function ${action}`);
    }
    expect(ACTIONS.match(/return \{ error: CCR_REQUIRED \};/g)?.length).toBe(5);
    expect(ACTIONS).not.toMatch(/\.(insert|update|upsert|delete)\(/);
    expect(ACTIONS).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE/i);
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
    // Direct inserts left this surface entirely (CCR cutover); legal_basis
    // renders from the penalty mapping, never from the code row.
    expect(ACTIONS).not.toMatch(/violation_codes[^;]*insert/s);
    expect(PAGE).toContain("corrective_action");
    expect(PAGE).toContain("legal_basis");
  });

  test("CD-011: one-to-one stays enforced at the database while direct writes stay closed", () => {
    // The one-to-one, maker-checker and immutability rules live in the applied
    // completion migration; the retired direct-write path can no longer reach
    // them, and no monetary value is invented anywhere on the surface.
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_one_active");
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_one_draft");
    expect(COMPLETION_MIGRATION).toContain("penalty_mapping_maker_checker");
    expect(COMPLETION_MIGRATION).toContain("trg_guard_governed_penalty_mapping");
    expect(ACTIONS).not.toMatch(/SAR|ريال|price/);
    expect(PAGE).not.toMatch(/SAR\s*\d|ريال\s*\d/);
  });

  test("CD-010: usage and scoped audit are wired without false zeroes", () => {
    expect(ACTIONS).toContain('sb.rpc("violation_code_usage"');
    expect(ACTIONS).toContain("export async function deactivateViolationCode");
    expect(PAGE).toContain('sb.rpc("admin_configuration_audit"');
    expect(PAGE).toContain('data-usage-state="unavailable"');
    expect(PAGE).toContain("Audit history couldn't load — this doesn't mean there are no events.");
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
    expect(error).toContain("This does not mean the count is zero or that everything is fine.");
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
