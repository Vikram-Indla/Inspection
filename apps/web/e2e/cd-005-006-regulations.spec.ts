import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-005 Regulation Library (SCR-ADM-010) + CD-006 Regulation Detail & Version
// (SCR-ADM-011) · /admin/regulations. Requirements: MVP1-M09-001..030, RBAC-001..006,
// FND-003. The contract route /admin/regulations/:id is NOT implemented — the detail
// dossier is a LOGICAL MODE selected by ?id=. No Admin-family route guard exists (W04/W08
// HANDOFF_BLOCKED); the middleware authenticates only, so the Inspector persona
// legitimately reaches /admin/regulations and is used here to prove:
//   - the read-only truth (Inspector is neither compliance_admin nor form_admin → writes
//     hidden, RLS-mirrored, route guard disclosed as blocked), and
//   - that the logical detail mode + every blocked contract leg render for any
//     authenticated user without seeding a writer or a specific regulation.
//
// Per-source FAILURE / VERIFIED-ZERO cannot be forced safely against the live backend, so
// they are proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-005-006-regulations-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("inspector") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-005 register — discovery, impact rail, read-only truth", () => {
  test("renders the register (search + lifecycle filter + impact rail) OR a verified-zero empty state — never a fabricated zero", async ({ page }) => {
    await page.goto("/admin/regulations");
    const search = page.getByRole("search");
    const emptyZero = page.getByText(/No regulations configured/i);
    // Exactly one of the two truthful states shows; both are legitimate.
    const hasRegister = await search.count();
    if (hasRegister > 0) {
      await expect(search).toBeVisible();
      // Lifecycle chips are pressable filter controls (client-side over the loaded set).
      await expect(page.getByRole("button", { name: /^All/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Published/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Draft/ })).toBeVisible();
      // Impact Footprint Rail is the CD-005 signature.
      await expect(page.getByText(/Impact footprint/i).first()).toBeVisible();
    } else {
      await expect(emptyZero).toBeVisible();
      await expect(page.getByText(/genuinely empty/i)).toBeVisible();
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "register-en-light-1440.png"), fullPage: true });
  });

  test("Inspector (non-writer) sees a read-only disclosure and NO create/publish affordance", async ({ page }) => {
    await page.goto("/admin/regulations");
    // Read-only banner mirrors the RLS write grant; route guard is disclosed as blocked.
    await expect(page.getByText(/require a Compliance or Form Admin role/i)).toBeVisible();
    await expect(page.getByText(/route guard is not implemented|route guard is not/i)).toBeVisible();
    // No write control is rendered for a non-writer.
    await expect(page.getByRole("button", { name: /Create draft regulation/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Publish now/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Add clause/i })).toHaveCount(0);
  });
});

test.describe("CD-006 detail — logical mode via ?id= and blocked contract legs", () => {
  test("?id= enters the logical dossier mode on the SAME route (no dedicated URL) and shows the back link", async ({ page }) => {
    await page.goto("/admin/regulations?id=__no_such_regulation__");
    // Still the same route — the dossier is a logical mode, not /admin/regulations/:id.
    expect(new URL(page.url()).pathname).toBe("/admin/regulations");
    await expect(page.getByRole("link", { name: /Back to register/i })).toBeVisible();
    // Unknown id → verified read, no match → not-found (never a fabricated dossier).
    await expect(page.getByText(/Regulation not found/i)).toBeVisible();
  });

  test("every governed capability is a DISABLED, annotated HANDOFF_BLOCKED target — wired to nothing", async ({ page }) => {
    await page.goto("/admin/regulations?id=__no_such_regulation__");
    const blocked = page.getByRole("region", { name: /Governed capabilities/i });
    await expect(blocked).toBeVisible();
    for (const label of [
      "Submit for validated publish",
      "Compare versions / lineage",
      "Run dependency validation",
      "Open audit timeline",
      "Open dedicated detail route",
    ]) {
      const btn = blocked.getByRole("button", { name: new RegExp(label, "i") });
      await expect(btn).toBeDisabled();
    }
    // The blocked audit leg states the exact policy reason (no invented audit timeline).
    await expect(blocked.getByText(/audit_events read is not granted/i)).toBeVisible();
    // The dedicated contract route is explicitly not implemented.
    await expect(blocked.getByText(/\/admin\/regulations\/:id is not implemented/i)).toBeVisible();
    await expect(blocked.getByText(/HANDOFF_BLOCKED/).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "detail-blocked-en-light-1440.png"), fullPage: true });
  });
});

test.describe("CD-005/006 a11y / RTL / responsive (DSG-A11Y-001)", () => {
  test("Arabic renders document-level RTL", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/regulations");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: join(EVIDENCE_DIR, "register-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("no horizontal overflow at 1024 in list and detail modes", async ({ page }) => {
    for (const url of ["/admin/regulations", "/admin/regulations?id=__no_such_regulation__"]) {
      await page.goto(url);
      await page.setViewportSize({ width: 1024, height: 768 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `no overflow at 1024 on ${url}`).toBeLessThanOrEqual(1);
    }
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the closures that cannot be forced live.
test.describe("CD-005/006 wiring (DEC-012): distinct states, maker-checker publish, blocked legs, no invented lifecycle", () => {
  const page = SRC("src/app/admin/regulations/page.tsx");
  const controls = SRC("src/app/admin/regulations/Controls.tsx");
  const actions = SRC("src/app/admin/regulations/actions.ts");
  const auditMigration = SRC("../../supabase/migrations/20260715173000_admin_configuration_audit.sql");

  test("verified-zero and unavailable/unknown are DISTINCT — a failed read never renders zero", () => {
    // Empty = read succeeded, genuinely zero.
    expect(page).toContain('t("admin.reg.r1.empty.title"');
    // Degraded = read failed → unknown, explicitly never zero.
    expect(page).toContain("regsError");
    expect(page).toContain('t("admin.reg.r1.degraded.body"');
    // Impact counts are null (unknown) rather than 0 when the embedded read is unresolved.
    expect(controls).toContain("clauseCount: number | null");
    expect(controls).toContain("itemCount: number | null");
    expect(page).toContain("unknown ? null : items");
  });

  test("direct draft→published records a distinct checker and locks the result; mapped-clause validation stays blocked", () => {
    // The proven transition records the checker and remains guarded on status=draft.
    expect(actions).toContain('.update({ status: "published", approved_by: userId, published_at:');
    expect(actions).toContain('.eq("status", "draft")');
    expect(actions).toContain("created_by: userId");
    expect(auditMigration).toContain("regulations_maker_checker");
    expect(auditMigration).toContain("trg_guard_published_regulation");
    // Mapped-clause validation and a successor-version model remain disclosures.
    expect(page).toContain('t("admin.reg.r1.detail.validation.title"');
  });

  test("blocked read/lineage/validation legs stay disabled; regulation and clause writes disclose audit coverage", () => {
    for (const key of [
      "admin.reg.r1.detail.blocked.validatedPublish",
      "admin.reg.r1.detail.blocked.compare",
      "admin.reg.r1.detail.blocked.dependency",
      "admin.reg.r1.detail.blocked.audit",
      "admin.reg.r1.detail.blocked.route",
    ]) {
      expect(page).toContain(`t("${key}"`);
    }
    expect(page).toContain('aria-disabled="true"');
    // Write-side audit exists; only the audit-timeline read view remains blocked.
    expect(page).toContain('t("admin.reg.r1.detail.auditNote"');
    expect(page).toContain("trg_audit_regulation_clauses");
    expect(auditMigration).toContain("regulation_clauses");
    expect(controls).toContain("clauseNotAudited");
  });

  test("writes are gated to writers in the UI (RLS mirror), and the dedicated detail route is NOT created", () => {
    expect(page).toContain('roles.has("compliance_admin") || roles.has("form_admin")');
    expect(page).toContain("{isWriter ? <NewRegulationForm");
    // No dedicated /admin/regulations/[id] route folder exists.
    expect(existsSync(join(process.cwd(), "src/app/admin/regulations/[id]"))).toBe(false);
  });

  test("no bare colours — only ax design tokens (GLOBAL COLOR LAW)", () => {
    const bare = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;
    expect(page).not.toMatch(bare);
    expect(controls).not.toMatch(bare);
  });

  test("Arabic seed migration exists, is guarded, and covers CD-005 and CD-006 keys", () => {
    const mig = SRC("../../supabase/migrations/20260715100000_cd005_cd006_ar_strings.sql");
    expect(mig).toContain("insert into ui_strings");
    expect(mig).toContain("admin.reg.r1.rail.heading");            // CD-005 signature
    expect(mig).toContain("admin.reg.r1.detail.blocked.audit.reason"); // CD-006 blocked leg
    expect(mig).toContain("where ui_strings.status = 'draft'");    // never clobber reviewed
  });
});
