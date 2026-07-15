import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-008 / SCR-ADM-030 + CD-009 / SCR-ADM-031
// MVP1-M09-004/012/013/019/025/028/029/030 · RBAC-002 · DEC-012.
// Runtime coverage uses the Inspector as the authenticated read-only persona.
// Writer-only draft paths are additionally checked at the source boundary because
// no deterministic writer-owned draft is guaranteed in shared live seed data.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-008-009-packages-v2");
const PKG = (path: string) => readFileSync(join(process.cwd(), "src/app/admin/packages", path), "utf8");
const SRC = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.use({ storageState: storageStatePath("inspector") });
test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }));
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-008 package library — version-led runtime", () => {
  test("S01 renders package groups, version rows and source-read disclosure", async ({ page }) => {
    await page.goto("/admin/packages");
    await expect(page.getByRole("heading", { name: /Package library & designer/i })).toBeVisible();
    await expect(page.getByText(/PKG-FS/).first()).toBeVisible();
    await expect(page.locator(".ax-version", { hasText: "v2026.07.02" }).first()).toBeVisible();
    await expect(page.getByText(/Read from source at/i)).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-en-light-1440.png"), fullPage: true });
  });

  test("S05/S06 inspector sees a truthful read-only surface and no mutation controls", async ({ page }) => {
    await page.goto("/admin/packages");
    await expect(page.getByText(/Read-only package access/i)).toBeVisible();
    const immutable = page.locator(".ax-banner--immutable:visible").first();
    if (await immutable.count()) await expect(immutable).toContainText(/Published version — immutable/i);
    else {
      const publishedSummary = page.locator("details.ax-panel > summary").filter({ hasText: /published/i }).first();
      const publishedVersion = publishedSummary.locator("..");
      if (await publishedVersion.getAttribute("open") === null) await publishedSummary.click();
      await expect(publishedVersion.locator(".ax-banner--immutable")).toContainText(/Published version — immutable/i);
    }
    await expect(page.getByRole("button", { name: /Create draft/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Save draft definition/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Approve & publish/i })).toHaveCount(0);
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
    const toggle = page.getByRole("button", { name: /Open field preview/i }).first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    const preview = page.locator(".ipad-preview").first();
    await expect(preview).toBeVisible();
    await expect(preview.getByText(/Read-only projection/i)).toBeVisible();
    for (const chip of await preview.locator(".ax-btn--field").all()) await expect(chip).toHaveAttribute("aria-disabled", /.*/);
    for (const input of await preview.locator("input, textarea").all()) await expect(input).toBeDisabled();
    await expect(preview.getByRole("button", { name: /simulate|run|calculate|score/i })).toHaveCount(0);
    await page.screenshot({ path: join(EVIDENCE_DIR, "preview-readonly-en-light.png"), fullPage: true });
  });
});

test.describe("CD-008 publish impact truth", () => {
  test("S08 impact failure is unavailable, never fabricated as numeric zero", async ({ page }) => {
    await page.goto("/admin/packages");
    const impact = page.locator(".ax-impact").first();
    await expect(impact).toBeVisible();
    await expect(impact).toContainText(/unavailable|outside your read scope|No active visits or inspections are pinned/i);
    await expect(impact.getByText(/0 active visit/i)).toHaveCount(0);
    await expect(impact.getByText(/0 active inspection/i)).toHaveCount(0);
  });
});

test.describe("CD-008/009 a11y, RTL, theme and responsive semantics", () => {
  test("visible action targets are at least 44px", async ({ page }) => {
    await page.goto("/admin/packages");
    const buttons = page.locator("button.ax-btn:visible");
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
    await expect(page.getByText(/PKG-FS/).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-ar-rtl-1440.png"), fullPage: true });
  });

  test("same package hierarchy fits 1440, native 1024 and narrow widths in both themes", async ({ page }) => {
    await page.goto("/admin/packages");
    for (const [width, height] of [[1440, 900], [1024, 1366], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await expect(page.getByText(/PKG-FS/).first()).toBeVisible();
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
    expect(page).toContain('const WRITER_ROLES = new Set(["compliance_admin", "form_admin"])');
    expect(page).toContain("version.status === \"draft\" && canWrite");
    expect(page).toContain("canWrite && <section");
    expect(actions).toContain("requireConfigurationWriter");
  });

  test("three-pane draft studio owns only proven structural controls", () => {
    expect(editor).toContain("styles.designerStudio");
    for (const sourceToken of ["s.structure", "s.fieldCanvas", "s.preview", "patchSelected", "s.addSection", "s.addItemAria", "s.mandatory"]) {
      expect(editor).toContain(sourceToken);
    }
    expect(editor).not.toMatch(/onDrag|draggable|moveUp|moveDown/);
    expect(editor).not.toContain("score_weight");
    expect(editor).not.toContain("evidence_rule");
  });

  test("no-op draft save is disabled and stale/non-draft writes are rejected server-side", () => {
    expect(editor).toContain("!dirty");
    expect(editor).toContain("disabled={pending || !dirty || validationIssues.length > 0}");
    expect(actions).toContain('.eq("id", version_id).eq("status", "draft")');
    expect(actions).toContain("Only draft versions are editable");
  });

  test("publish gate validates item, condition, evidence, action-form, violation and penalty dependencies", () => {
    expect(actions).toContain("const blockers = await validateDefinition");
    expect(actions).toContain("visibility rule must use key=value grammar");
    expect(actions).toContain("evidenceRuleBlockers");
    expect(actions).toContain("has no penalty mapping");
    expect(actions).toContain('sb.rpc("publish_package_version"');
    expect(page).toContain("The approver must differ from the creator (RBAC-002)");
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
    expect(error).toContain("No empty or zero state has been inferred");
    expect(page).toContain("packageUnavailable");
    expect(page).toContain("itemBankUnavailable");
    expect(page).toContain("pkgs.length === 0");
    expect(page).toContain('href="/admin/packages"');
  });

  test("unsupported rich package authoring remains disabled or disclosure-only", () => {
    for (const target of ["targetReorder", "targetConditions", "targetItemPolicies", "targetActionForms", "targetSimulation"]) {
      expect(editor).toContain(`s.${target}`);
    }
    expect(editor).toContain('disabled aria-disabled="true"');
    expect(page).toContain("Effective windows, supersede lineage, item ordering, condition validation and circular-rule rejection are enforced");
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
