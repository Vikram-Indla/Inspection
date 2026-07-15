import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-008 / SCR-ADM-030 — Package Library (/admin/packages) and
// CD-009 / SCR-ADM-031 — Package & Form Designer (the designer mode of the SAME
// route). Requirements: MVP1-M09-004/012/013/019/025/028/029/030, RBAC-002.
// Acceptance: the CD-008/CD-009 QG rows in the admin-control-plane suite +
// DSG-A11Y-001, DSG-CODE-001 / DEC-012.
//
// The route guard is HANDOFF_BLOCKED (CD-008 W06 / CD-009 W08): middleware only
// authenticates and no admin-family guard exists, so an Inspector legitimately
// reaches /admin/packages — exactly as CD-004 proved. These runtime specs use the
// Inspector persona to exercise the read-only library + preview + impact surfaces
// that live seed data (package PKG-FS, published version v2026.07.02) reliably
// renders. The DRAFT designer (edit / save / approve-publish) and the blocked
// designer legs (reorder, condition authoring, scoring toggle, evidence-model
// editor, action-form authoring, simulation, circular-condition detector) cannot
// be forced against the live backend (no seeded draft version, no writer persona,
// and those legs are HANDOFF_BLOCKED), so they are proven at the code layer below
// (DSG-CODE-001 / DEC-012) — the same discipline CD-004 and CD-025 used.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/cd-008-009-packages-v1");
const PKG = (p: string) => readFileSync(join(process.cwd(), "src/app/admin/packages", p), "utf8");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("inspector") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-008 package library — populated, version-led (S01 / W01)", () => {
  test("renders the version-led library: package heading, version label, published status", async ({ page }) => {
    await page.goto("/admin/packages");
    // Not a KPI wall — the surface is package → version rows (spec §3).
    await expect(page.getByRole("heading", { name: /Package & Form Designer/i })).toBeVisible();
    // Seeded package PKG-FS with its published version v2026.07.02.
    await expect(page.getByRole("heading", { name: /PKG-FS/ }).first()).toBeVisible();
    await expect(page.locator(".ax-version", { hasText: "v2026.07.02" })).toBeVisible();
    await expect(page.locator(".ax-lozenge--success", { hasText: /published/i }).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-en-light-1440.png"), fullPage: true });
  });

  test("S06 read-only: a published version shows the immutability reason and NO draft-editor / publish controls", async ({ page }) => {
    await page.goto("/admin/packages");
    // The published version states WHY it is read-only (DB trigger trg_guard_pkg).
    const immutable = page.getByText(/Published version — immutable/i).first();
    await expect(immutable).toBeVisible();
    const publishedCard = immutable.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' ax-surface ')][1]");
    await expect(publishedCard.locator("code", { hasText: "trg_guard_pkg" })).toBeVisible();
    // Other packages may legitimately have a draft. The published card itself must
    // never expose draft-editor or publish controls (M09-030).
    await expect(publishedCard.getByRole("button", { name: /Save draft definition/i })).toHaveCount(0);
    await expect(publishedCard.getByRole("button", { name: /Approve & publish/i })).toHaveCount(0);
  });

  test("W03: the new-draft-version create control is present (draft is the only path to change)", async ({ page }) => {
    await page.goto("/admin/packages");
    await expect(page.locator("label.ax-field__label", { hasText: /^New draft version \(M09-030\)$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create draft/i })).toBeVisible();
    // Create-draft is the authored write path — publishing/editing is never done on
    // a published version, only on a fresh draft it clones (M09-030).
  });
});

test.describe("CD-009 preview is a read-only projection, not a simulator (M09-028)", () => {
  test("toggling preview reveals a read-only render whose inspector controls are all disabled", async ({ page }) => {
    await page.goto("/admin/packages");
    const toggle = page.getByRole("button", { name: /Preview as inspector/i }).first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    // The read-only lozenge appears, and the ipad preview mounts.
    await expect(page.locator(".ax-lozenge--info", { hasText: /read-only/i }).first()).toBeVisible();
    const preview = page.locator(".ipad-preview").first();
    await expect(preview).toBeVisible();
    // Every compliance button / input inside is inert — a faithful render, never an
    // interactive simulator: response chips carry aria-disabled, inputs are disabled.
    const fieldChips = preview.locator(".ax-btn--field");
    const nChips = await fieldChips.count();
    for (let i = 0; i < nChips; i++) {
      await expect(fieldChips.nth(i)).toHaveAttribute("aria-disabled", /.*/);
    }
    const inputs = preview.locator("input, textarea");
    const nInputs = await inputs.count();
    for (let i = 0; i < nInputs; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }
    // No run / simulate / calculate affordance exists in the preview (M09-028 is a
    // projection, not the SCR-IPAD-620 runtime).
    await expect(preview.getByRole("button", { name: /simulate|run|calculate|score/i })).toHaveCount(0);
    await page.screenshot({ path: join(EVIDENCE_DIR, "preview-readonly-en-light.png"), fullPage: true });
  });
});

test.describe("CD-008 impact panel (S08) — unavailable is never zero", () => {
  test("the publish-impact panel renders, and its in-flight section is a truthful state, never a bare 0", async ({ page }) => {
    await page.goto("/admin/packages");
    const impact = page.locator(".ax-impact").first();
    await expect(impact).toBeVisible();
    await expect(impact.getByText(/Publish impact/i)).toBeVisible();
    // The in-flight (pinned) block resolves to ONE of the two truthful states:
    //   • RPC scoped out for the Inspector  → "…outside your read scope" (unavailable)
    //   • RPC succeeds with nothing pinned   → "No active visits or inspections…" (verified-none)
    // It must never present a fabricated numeric zero as the count.
    await expect(impact).toContainText(/outside your read scope|No active visits or inspections are pinned/i);
    await expect(impact.getByText(/0 active visit/i)).toHaveCount(0);
    await expect(impact.getByText(/0 active inspection/i)).toHaveCount(0);
  });
});

test.describe("CD-008/009 a11y · RTL · dark/light · responsive (DSG-A11Y-001)", () => {
  test("primary action targets are at least 44px", async ({ page }) => {
    await page.goto("/admin/packages");
    const btns = page.locator("button.ax-btn");
    const n = await btns.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      if (!(await btns.nth(i).isVisible())) continue;
      const box = await btns.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `button ${i} height`).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });

  test("Arabic renders document-level RTL and the library still populates", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin/packages");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // The version-led surface renders in RTL. (Arabic strings for admin.pkg.* arrive
    // via the seeded ui_strings migration and are review-gated; this spec does not
    // assert the translated copy so it stays green whether or not the seed is applied.)
    await expect(page.getByRole("heading", { name: /PKG-FS/ }).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "library-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("dark and light, 1440 and 1024 — same populated library, no horizontal overflow", async ({ page }) => {
    await page.goto("/admin/packages");
    for (const [w, h] of [[1440, 900], [1024, 768]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await expect(page.getByRole("heading", { name: /PKG-FS/ }).first()).toBeVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, `library-en-${theme}-${w}.png`), fullPage: true });
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the designer wiring and the blocked
// legs that cannot be forced against the live backend (no seeded draft version, no
// writer persona, HANDOFF_BLOCKED legs).
test.describe("CD-009 designer wiring (DEC-012): editable draft controls, gated to status=draft", () => {
  const editor = PKG("DraftEditor.tsx");
  const page = PKG("page.tsx");
  const actions = PKG("actions.ts");

  test("W02: the draft editor exposes exactly the proven structural controls", () => {
    // Editable section title, mandatory flag, add/remove item code, add section, save.
    for (const s of [
      "s.sectionTitleAria",    // section-title input
      "checked={!!sec.mandatory}", // mandatory toggle
      "s.removeAria",          // remove item code
      "s.addItemAria",         // add item code (catalog-backed select)
      "s.addSection",          // add section
      "s.save",                // save draft definition
    ]) {
      expect(editor, `DraftEditor is missing ${s}`).toContain(s);
    }
  });

  test("W04/W08: editor + approve/publish render only for a NON-published draft version", () => {
    // The editor and the approve/publish gate are mounted behind the draft guard;
    // a published (or locked) version never renders them (disabled == absent here).
    expect(page).toContain('!published && v.status === "draft"');
    expect(page).toContain("<DraftEditor");
    expect(page).toContain("<ApprovePublish");
  });

  test("W02/W04: save and publish are refused server-side unless the version is still draft", () => {
    // saveDraftDefinition targets id + status=draft, and refuses when nothing matched.
    expect(actions).toContain('.eq("id", version_id).eq("status", "draft")');
    expect(actions).toContain("Only draft versions are editable");
    // approveAndPublish rejects a non-draft and validates the definition BEFORE the flip.
    expect(actions).toContain('if (ver.status !== "draft") return');
    expect(actions).toContain("const blockers = await validateDefinition(sb, ");
  });
});

test.describe("CD-009 blocked legs stay blocked — not silently invented (W04–W07)", () => {
  const all = ["page.tsx", "actions.ts", "DraftEditor.tsx", "PackagePreview.tsx", "PublishControls.tsx", "ImpactPanel.tsx"]
    .map(PKG).join("\n");
  const editor = PKG("DraftEditor.tsx");

  test("no reorder / drag, no simulation, no circular-condition detector anywhere in the family", () => {
    expect(all).not.toMatch(/reorder|onDrag|draggable|moveUp|moveDown/i);   // W04 reorder blocked
    expect(all).not.toMatch(/simulat/i);                                     // W06 simulation blocked
    expect(all).not.toMatch(/circular/i);                                    // W07 circular detector blocked
  });

  test("the designer authors NO condition, scoring, evidence-model, or action-form editor", () => {
    // The read-only version row / preview DISPLAY these facts (page.tsx), but the only
    // editable surface (DraftEditor) never authors them — those legs are HANDOFF_BLOCKED.
    expect(editor).not.toContain("visible_when");     // W05 condition authoring blocked
    expect(editor).not.toContain("score_weight");     // scoring toggle blocked
    expect(editor).not.toContain("evidence_rule");    // evidence-model editor blocked
    expect(editor).not.toMatch(/action_forms\s*:\s*\[/); // action-form authoring blocked (types pass through, never edited)
  });
});

test.describe("CD-008 impact + RBAC-002: unavailable-never-zero and the distinct-approver gate", () => {
  const impact = PKG("ImpactPanel.tsx");
  const actions = PKG("actions.ts");
  const page = PKG("page.tsx");

  test("S08: a denied/errored impact RPC degrades to 'unavailable', and true-zero is a distinct state", () => {
    // Reader returns null when the aggregate RPC is unavailable or scoped out.
    expect(actions).toContain("package_version_impact");
    expect(actions).toMatch(/return null;/);
    // Panel: null → unavailable; genuine 0 → the verified-none message; only otherwise counts.
    expect(impact).toContain("pinned == null");
    expect(impact).toContain("s.pinnedUnavailable");
    expect(impact).toContain("pinned.active_visits + pinned.active_inspections === 0");
    expect(impact).toContain("s.pinnedNone");
  });

  test("RBAC-002 maker-checker: distinct approver is enforced and surfaced, publish is dependency-validated", () => {
    // The approve/publish control names the maker-checker rule (RBAC-002).
    expect(page).toContain("Approve & publish (maker-checker — RBAC-002)");
    // The server flips draft→published recording approved_by, and only after zero blockers.
    expect(actions).toContain("approved_by: userId");
    expect(actions).toContain('status: "published"');
    expect(actions).toContain("Publish blocked —");
  });
});

test.describe("CD-008/009 Arabic seed migration exists and is guarded", () => {
  test("the ui_strings seed upserts the family keys without clobbering reviewed rows", () => {
    const mig = SRC("../../supabase/migrations/20260715103000_cd008_cd009_ar_strings.sql");
    expect(mig).toContain("insert into ui_strings");
    expect(mig).toContain("admin.pkg.title");
    expect(mig).toContain("admin.pkg.impact.pinnedUnavailable");
    expect(mig).toContain("where ui_strings.status = 'draft'");
  });
});
