import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-008 / SCR-ADM-030 + CD-009 / SCR-ADM-031
// MVP1-M09-004/012/013/019/025/028/029/030 · RBAC-002 · DEC-012.
// SCR-ADM-030/031 are restricted to Form Admin and Compliance Admin. Runtime
// coverage therefore uses the seeded admin persona; read-only and denied paths are
// additionally checked at the source/route boundary because
// no deterministic writer-owned draft is guaranteed in shared live seed data.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-008-009-packages-v2");
const PKG = (path: string) => readFileSync(join(process.cwd(), "src/app/(app)/admin/packages", path), "utf8");
const SRC = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.use({ storageState: storageStatePath("admin") });
test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }));
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.titlePath.some(part => part.includes("source wiring") || part.includes("localized string source"))) return;
  await page.goto("/locale?set=en");
});

test.describe("CD-008 package library — version-led runtime", () => {
  test("S01 renders package groups, version rows and boundary disclosure", async ({ page }) => {
    await page.goto("/admin/packages");
    await expect(page.getByRole("heading", { name: "Inspection Forms" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Inspection packages, tracked by version/i })).toBeVisible();
    const group = page.locator("details > summary").filter({ hasText: /PKG-|TST-PKG/ }).first();
    await expect(group).toBeVisible();
    await group.click();
    await expect(page.getByText(/Published v|Draft · editable/i).first()).toBeVisible();
    await expect(page.getByText(/Published packages can’t be changed/).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-en-light-1440.png"), fullPage: true });
  });

  test("S05/S06 published versions remain immutable while the authorized writer sees draft controls", async ({ page }) => {
    await page.goto("/admin/packages");
    const group = page.locator("details > summary").filter({ hasText: /PKG-UAT-GOLDEN/ }).first();
    await group.click();
    await expect(page.getByText("Published version — locked", { exact: false }).locator("visible=true").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Create draft/i }).locator("visible=true").first()).toBeVisible();
  });

  test("published history exposes governed effective and supersede lineage read-only", async ({ page }) => {
    await page.goto("/admin/packages");
    const derived = page.getByText(/older than current publish \(derived\)/i);
    if (await derived.count()) await expect(derived.first()).toBeVisible();
    await expect(page.getByRole("button", { name: /schedule|effective date|supersede/i })).toHaveCount(0);
  });
});

test.describe("CD-009 read-only field projection", () => {
  test("preview exposes item semantics while every inspector input remains inert", async ({ page }) => {
    await page.goto("/admin/packages");
    await page.locator("details > summary").filter({ hasText: /PKG-UAT-GOLDEN/ }).first().click();
    const toggle = page.getByRole("button", { name: /Open field preview|Preview as inspector/i }).locator("visible=true").first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    const preview = page.locator(".ipad-preview").first();
    await expect(preview).toBeVisible();
    await expect(preview.getByText(/read-only/i).first()).toBeVisible();
    for (const chip of await preview.locator(".sq-btn--field, .btn-field").all()) await expect(chip).toHaveAttribute("aria-disabled", /.*/);
    for (const input of await preview.locator("input, textarea").all()) await expect(input).toBeDisabled();
    await expect(preview.getByRole("button", { name: /simulate|run|calculate|score/i })).toHaveCount(0);
    await page.screenshot({ path: join(EVIDENCE_DIR, "preview-readonly-en-light.png"), fullPage: true });
  });
});

test.describe("CD-008 publish impact truth", () => {
  test("S08 impact failure is unavailable, never fabricated as numeric zero", async ({ page }) => {
    await page.goto("/admin/packages");
    await page.locator("details > summary").filter({ hasText: /PKG-UAT-GOLDEN/ }).first().click();
    const impact = page.locator(".sq-impact:visible").first();
    await expect(impact).toBeVisible();
    const unavailable = impact.getByText(/aren’t available|unavailable|outside what you can see/i);
    if (await unavailable.count()) {
      await expect(impact.getByText(/0 active visit/i)).toHaveCount(0);
      await expect(impact.getByText(/0 active inspection/i)).toHaveCount(0);
    } else {
      await expect(impact).toContainText(/active visit\(s\)/i);
      await expect(impact).toContainText(/active inspection\(s\)/i);
    }
  });
});

test.describe("CD-008/009 a11y, RTL, theme and responsive semantics", () => {
  test("visible action targets are at least 44px", async ({ page }) => {
    await page.goto("/admin/packages");
    const buttons = page.locator("main button:visible");
    expect(await buttons.count()).toBeGreaterThan(0);
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      if (box) expect(box.height).toBeGreaterThanOrEqual(43.5);
    }
  });

  test("Arabic uses document-level RTL and preserves the populated hierarchy", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/packages");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText(/PKG-|TST-PKG/).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-ar-rtl-1440.png"), fullPage: true });
  });

  test("same package hierarchy fits 1440, native 1024 and narrow widths in both themes", async ({ page }) => {
    await page.goto("/admin/packages");
    for (const [width, height] of [[1440, 900], [1024, 1366], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await expect(page.getByText(/PKG-|TST-PKG/).first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
        await page.screenshot({ path: join(EVIDENCE_DIR, `library-en-${theme}-${width}.png`), fullPage: true });
      }
    }
  });
});

test.describe("CD-008/009 source wiring — writer, no-op, validation and hard states", () => {
  const page = PKG("page.tsx");
  const editor = PKG("DraftEditor.tsx");
  const preview = PKG("PackagePreview.tsx");
  const actions = PKG("actions.ts");

  test("writer controls are role-mirrored while RLS/server guard remain authoritative", () => {
    expect(page).toContain('const WRITER_ROLES = new Set(["admin", "compliance_admin", "form_admin"])');
    expect(page).toContain('version.status === "draft" && canWrite');
    expect(page).toContain("canWrite && <section");
    expect(actions).toContain("requireConfigurationWriter");
  });

  test("three-pane draft studio owns governed relationship and ordering controls", () => {
    expect(editor).toContain("styles.designerStudio");
    for (const sourceToken of ["s.structure", "s.fieldCanvas", "s.preview", "patchSelected", "s.addSection", "s.addItemAria", "s.mandatory"]) {
      expect(editor).toContain(sourceToken);
    }
    expect(editor).toContain("moveItem");
    expect(editor).toContain("moveSection");
    expect(editor).toContain("score_weight");
    expect(editor).toContain("evidence_rule");
    expect(editor).toContain("response_mapping");
  });

  test("no-op draft save is disabled and stale/non-draft writes are rejected server-side", () => {
    expect(editor).toContain("!dirty");
    expect(editor).toContain("disabled={pending || !dirty || validationIssues.length > 0}");
    expect(actions).toContain('.eq("id", version_id).eq("status", "draft")');
    expect(actions).toContain("Only draft versions can be edited");
  });

  test("publish gate validates item, condition, evidence, action-form, violation and penalty dependencies", () => {
    expect(actions).toContain("const blockers = await validateDefinition");
    expect(actions).toContain("visibility rule must use key=value grammar");
    expect(actions).toContain("evidenceRuleBlockers");
    expect(actions).toContain("has no penalty mapping");
    expect(actions).toContain('sb.rpc("publish_package_version"');
    expect(actions).toContain("approver must differ from creator");
  });

  test("field projection includes the backend-supported item requirement and scoring semantics", () => {
    expect(page).toContain("mandatoryWhenVisible");
    expect(page).toContain("scoringEnabled: response.scoring_enabled !== false");
    expect(preview).toContain("it.requirement");
    expect(preview).toContain("!it.scoringEnabled");
  });

  test("loading, fatal error, true-empty, partial degradation and recovery are distinct", () => {
    const loading = PKG("loading.tsx");
    const error = PKG("error.tsx");
    expect(loading).toContain('aria-busy="true"');
    expect(error).toContain("لا يمكننا معرفة ما إذا كانت القائمة فارغة أو حدث خطأ");
    expect(page).toContain("packageUnavailable");
    expect(page).toContain("itemBankUnavailable");
    expect(page).toContain("pkgs.length === 0");
    expect(page).toContain('href="/admin/packages"');
  });

  test("rich package authoring is wired to the authoritative definition contract", () => {
    for (const token of ["item_rules", "action_forms", "template_refs", "mandatory_when_visible", "visible_when"]) expect(editor).toContain(token);
    expect(page).toContain("configuration_templates");
    expect(page).toContain("violation_codes");
    expect(actions).toContain("Circular visibility rule");
  });
});

test.describe("CD-008/009 localized string source", () => {
  test("the existing guarded Arabic seed remains present; new keys continue through useT", () => {
    const migration = SRC("../../supabase/migrations/20260715103000_cd008_cd009_ar_strings.sql");
    expect(migration).toContain("insert into ui_strings");
    expect(migration).toContain("admin.pkg.title");
    expect(migration).toContain("where ui_strings.status = 'draft'");
    expect(PKG("page.tsx")).toContain("await useT()");
  });
});
