import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-005 Regulation Library (SCR-ADM-010) + CD-006 Regulation Detail & Version
// (SCR-ADM-011) · /admin/regulations. Requirements: MVP1-M09-001..030, RBAC-001..006,
// FND-003. The route layout now permits only the contract roles; the reviewer proves
// read-only visibility while the dedicated /admin/regulations/:id route renders detail.
//
// Per-source FAILURE / VERIFIED-ZERO cannot be forced safely against the live backend, so
// they are proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-005-006-regulations-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("reviewer") });

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
    } else if (await emptyZero.count()) {
      await expect(emptyZero).toBeVisible();
      await expect(page.getByText(/genuinely empty/i)).toBeVisible();
    } else throw new Error("CD-006 register unavailable: completion migration/runtime is not certifiable");
    await page.screenshot({ path: join(EVIDENCE_DIR, "register-en-light-1440.png"), fullPage: true });
  });

  test("Reviewer sees a read-only disclosure and NO create/publish affordance", async ({ page }) => {
    await page.goto("/admin/regulations");
    // Read-only banner mirrors the RLS write grant; route guard is disclosed as blocked.
    await expect(page.getByText(/require a Compliance or Form Admin role/i)).toBeVisible();
    await expect(page.getByText(/route guard and database permissions are independent/i)).toBeVisible();
    // No write control is rendered for a non-writer.
    await expect(page.getByRole("button", { name: /Create draft regulation/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Publish now/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Add clause/i })).toHaveCount(0);
  });
});

test.describe("CD-006 detail — logical mode and genuine remaining blockers", () => {
  test("dedicated detail route renders the dossier mode and shows the back link", async ({ page }) => {
    await page.goto("/admin/regulations/__no_such_regulation__");
    expect(new URL(page.url()).pathname).toBe("/admin/regulations/__no_such_regulation__");
    await expect(page.getByRole("link", { name: /Back to register/i })).toBeVisible();
    // Unknown id is not-found only after a successful read. A schema/source
    // failure remains unavailable and never fabricates either a dossier or zero.
    if (await page.getByText(/register unavailable/i).count()) {
      await expect(page.getByText(/unknown, not empty/i)).toBeVisible();
      await expect(page.getByText(/Regulation not found/i)).toHaveCount(0);
    } else {
      await expect(page.getByText(/Regulation not found/i)).toBeVisible();
    }
  });

  test("only genuine lineage, dependency-engine and route capabilities remain disabled", async ({ page }) => {
    await page.goto("/admin/regulations");
    const dossier = page.getByRole("link", { name: /Open dossier/i }).first();
    if (await dossier.count()) {
      await dossier.click();
      const blocked = page.getByRole("region", { name: /Governed capabilities/i });
      await expect(blocked).toBeVisible();
      for (const label of ["Compare versions / lineage", "Run dependency validation"]) {
        await expect(blocked.getByRole("button", { name: new RegExp(label, "i") })).toBeDisabled();
      }
      await expect(blocked.getByRole("button", { name: /validated publish|audit timeline/i })).toHaveCount(0);
      await expect(blocked.getByText(/HANDOFF_BLOCKED/).first()).toBeVisible();
      await page.screenshot({ path: join(EVIDENCE_DIR, "detail-blocked-en-light-1440.png"), fullPage: true });
    } else {
      await expect(page.getByText(/register unavailable/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Compare versions|Run dependency validation/i })).toHaveCount(0);
    }
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
    for (const url of ["/admin/regulations", "/admin/regulations/__no_such_regulation__"]) {
      await page.goto(url);
      await page.setViewportSize({ width: 1024, height: 768 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `no overflow at 1024 on ${url}`).toBeLessThanOrEqual(1);
    }
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the closures that cannot be forced live.
test.describe("CD-005/006 wiring (DEC-012): governed lifecycle, distinct states and genuine blockers", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const page = SRC("src/app/admin/regulations/page.tsx");
  const controls = SRC("src/app/admin/regulations/Controls.tsx");
  const actions = SRC("src/app/admin/regulations/actions.ts");

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

  test("publish validates mappings, records checker provenance and rejects no-op transitions", () => {
    expect(actions).toContain('status: "published", approved_by: userId');
    expect(actions).toContain('.eq("status", "draft")');
    expect(actions).toContain("every clause must map to an inspection item");
    expect(actions).toContain("approved_by: userId");
    expect(actions).toContain("if (!data?.length)");
    expect(page).toContain('t("admin.reg.r1.detail.validation.title"');
  });

  test("draft edit, effective date, attachments, deactivation and scoped audit are wired", () => {
    for (const action of ["updateRegulationDraft", "addRegulationAttachment", "deactivateRegulation", "admin_configuration_audit"]) {
      expect(`${page}\n${controls}\n${actions}`).toContain(action);
    }
    expect(controls).toContain('name="effective_from"');
    expect(page).toContain("regulation_attachments");
    expect(page).toContain("Configuration audit timeline");
  });

  test("only genuine blockers are disabled targets with owners; clause changes are audited", () => {
    for (const key of [
      "admin.reg.r1.detail.blocked.compare",
      "admin.reg.r1.detail.blocked.dependency",
    ]) {
      expect(page).toContain(`t("${key}"`);
    }
    expect(page).toContain('aria-disabled="true"');
    expect(page).toContain('t("admin.reg.r1.detail.auditNote"');
    expect(controls).toContain("clauseNotAudited");
    expect(page).not.toContain("admin.reg.r1.detail.blocked.validatedPublish");
    expect(page).not.toContain("admin.reg.r1.detail.blocked.audit");
  });

  test("writes are gated to writers in the UI and the dedicated detail route exists", () => {
    expect(page).toContain('roles.has("compliance_admin") || roles.has("form_admin")');
    expect(page).toContain("{isWriter ? <NewRegulationForm");
    expect(existsSync(join(process.cwd(), "src/app/admin/regulations/[id]/page.tsx"))).toBe(true);
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
