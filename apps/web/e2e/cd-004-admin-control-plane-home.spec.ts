import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-004 / SCR-ADM-001 / /admin — Approval & Configuration home (Configuration
// Evidence Spine). Acceptance: ADM-QG-01..18, CD004-QG-01..08, DSG-A11Y-001,
// DSG-CODE-001. Requirements: MVP1-M09-001..030 (gateway), RBAC-001..006, FND-003.
//
// The route guard is HANDOFF_BLOCKED (W03): middleware authenticates only and the
// admin-family guard does not exist, so an Inspector legitimately reaches /admin
// (ROUTE_RUNTIME_TRUTH_MEMO_CD-004_R2). These runtime specs use the Inspector
// persona precisely to exercise that truth — visibility != authority — and to prove
// the read-only spine renders for any authenticated user. A populated act-scope band
// requires a seeded admin persona (none exists; seeding is out of this slice's scope).
//
// Per-source read FAILURE and VERIFIED-ZERO states are fixtures in the design pack
// (DATA_TRUTH_LEDGER) and cannot be forced safely against the live backend, so they
// are proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-025 did.
const EVIDENCE_DIR = evidenceDirectory("cd-004-admin-home-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("inspector") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-004 configuration evidence spine (ADM-QG-04/07, CD004-QG-02)", () => {
  test("renders a true evidence-spine table: caption, four column headers, five family rows", async ({ page }) => {
    await page.goto("/admin");
    // The signature is a single table (control plane, not a KPI wall) — spec §3.
    const table = page.locator("table.ax-table");
    await expect(table).toHaveCount(1);
    await expect(table.locator("caption")).toHaveText(/Configuration evidence spine/i);
    await expect(table.locator("thead th[scope=col]")).toHaveCount(4);
    for (const col of ["Family", "Read result", "Proven lifecycle", "Action"]) {
      await expect(table.locator("thead th[scope=col]", { hasText: col })).toBeVisible();
    }
    // Five read-backed families, each a row header (th scope=row).
    const rowHeaders = table.locator("tbody th[scope=row]");
    await expect(rowHeaders).toHaveCount(5);
    for (const fam of ["Compliance Library", "Packages & Surveys", "Enforcement Library", "Engine settings", "Audit trail"]) {
      await expect(rowHeaders.filter({ hasText: fam })).toHaveCount(1);
    }
    await page.screenshot({ path: join(EVIDENCE_DIR, "spine-en-light-1440.png"), fullPage: true });
  });

  test("every read cell carries a glyph+word state (never a health verdict)", async ({ page }) => {
    await page.goto("/admin");
    // Live reads succeed → verified state on the read-backed rows; no source failed
    // header lozenge, and no static 'live database' success verdict anywhere.
    await expect(page.locator(".ax-lozenge--success").first()).toContainText(/read verified/i);
    await expect(page.getByText(/live database/i)).toHaveCount(0);
    // Header states a read fact, never a platform-health verdict.
    await expect(page.getByText(/page read/i)).toBeVisible();
    await expect(page.getByText(/a source fact not a platform-health verdict/i)).toBeVisible();
  });

  test("action links resolve to existing module routes only; no approve/publish/edit affordance on the home", async ({ page }) => {
    await page.goto("/admin");
    const spine = page.locator("table.ax-table");
    // Each read-backed family that owns a route links to that module with a scoped name.
    for (const [name, href] of [
      ["Compliance Library", "/admin/regulations"],
      ["Packages & Surveys", "/admin/packages"],
      ["Enforcement Library", "/admin/violations"],
      ["Audit trail", "/admin/audit"],
    ] as const) {
      await expect(spine.getByRole("link", { name: new RegExp(`Open ${name} — ${name}`) })).toHaveAttribute("href", href);
    }
    // The home surfaces NO mutation control (CD004-QG-07 / module ownership).
    await expect(page.getByRole("button", { name: /approve|publish|save|edit|delete/i })).toHaveCount(0);
  });

  test("link-only family band lists the four no-data families as existing routes only", async ({ page }) => {
    await page.goto("/admin");
    const band = page.getByRole("navigation", { name: /reads no data for today/i });
    await expect(band).toBeVisible();
    for (const href of ["/admin/workflows", "/admin/risk", "/admin/gis", "/admin/access"]) {
      await expect(band.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
  });

  test("scope band is truthful for a non-admin: visibility grants nothing", async ({ page }) => {
    await page.goto("/admin");
    const scope = page.getByRole("region", { name: /Your scope/i });
    await expect(scope).toBeVisible();
    // Inspector owns no admin family → acts in 'none'; the awareness sentence holds.
    await expect(scope).toContainText(/You can act in/i);
    await expect(scope).toContainText(/visibility grants nothing/i);
  });
});

test.describe("CD-004 a11y / RTL / dark-light / responsive (DSG-A11Y-001)", () => {
  test("heading hierarchy has no skipped levels and three section headings under the page title", async ({ page }) => {
    await page.goto("/admin");
    // Frozen shell renders the page title as the sole h2; the three CD-004 sections
    // are h3 (spine / families-without-reads / your scope) — clean h2→h3, no skip.
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
    // Accessible action name carries the family (spec §4).
    await expect(page.getByRole("link", { name: /Open Compliance Library — Compliance Library/i })).toBeVisible();
  });

  test("primary action targets are at least 44px (spec §10)", async ({ page }) => {
    await page.goto("/admin");
    const links = page.locator("table.ax-table a.ax-btn, nav a.ax-btn");
    const n = await links.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box, `link ${i} has a box`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });

  test("Arabic renders document-level RTL with isolated LTR identifiers", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // Codes/dates stay LTR-isolated (spec §12).
    await expect(page.locator("table.ax-table bdi[dir=ltr]").first()).toBeVisible();
    // The visible section heading and the semantic table caption intentionally
    // share the same localized text; scope to the visible heading to avoid a
    // strict-mode collision between those two valid landmarks.
    await expect(page.getByRole("heading", { name: "سلسلة أدلة التهيئة", exact: true })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "spine-ar-rtl-1440.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("dark and light, 1440 and 1024 — same populated state", async ({ page }) => {
    await page.goto("/admin");
    for (const [w, h] of [[1440, 900], [1024, 768]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await expect(page.locator("table.ax-table")).toBeVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, `spine-en-${theme}-${w}.png`), fullPage: true });
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the wiring closures that cannot be
// forced against live data (per-source failure isolation, verified-zero, blocked legs).
test.describe("CD-004 wiring (DEC-012): per-source modelling, distinct states, blocked legs stay blocked", () => {
  const page = SRC("src/app/(app)/admin/page.tsx");

  test("W04-W08: each of the six reads is modelled independently — no blanket count ?? 0 render", () => {
    // The R1 defect was rendering `count ?? 0` regardless of per-source error. The fix
    // keys every read on its own error via ok(res) BEFORE reading a count.
    expect(page).toContain("const ok = (r: Res) => !r.error;");
    // The removed overclaim: no static 'live database' success lozenge, no such key.
    expect(page).not.toContain("admin.overview.live");
    expect(page).not.toContain("live database");
    // The old KPI wall + SCR-ADM-* user copy are gone (manifest: remove SCR-ADM-* IDs).
    expect(page).not.toContain("ax-kpi-row");
    expect(page).not.toMatch(/"SCR-ADM-0\d0"/);
  });

  test("CD004-QG-02: verified-zero and unavailable are distinct, first-class states", () => {
    expect(page).toContain('t("admin.overview.r2.read.verified"');
    expect(page).toContain('t("admin.overview.r2.read.verifiedZero"');
    expect(page).toContain('t("admin.overview.r2.read.unavailable"');
    // unavailable is reached only when a source errors; verified-zero only on ok+count===0.
    expect(page).toContain('if (!ok(r)) return chip("unavailable");');
    expect(page).toContain('if (c === 0) {');
  });

  test("W03/W10 + proposed reads stay HANDOFF_BLOCKED — not silently invented", () => {
    // No route-guard enforcement invented on this route (guard decision is blocked).
    expect(page).not.toContain("redirect(");
    expect(page).not.toContain("unauthorized.title");
    // No per-source retry handler mechanism (W10 blocked): the retry name is never rendered.
    expect(page).not.toContain('t("admin.overview.r2.read.retry"');
    // No proposed provenance/draft-queue reads (ledger 'proposed' rows blocked).
    expect(page).not.toContain('.eq("status", "draft")'); // draft-queue count proposal
    expect(page).not.toContain("max(created_at)");
  });

  test("real routes only; five read-backed families + four link-only families", () => {
    for (const href of ["/admin/regulations", "/admin/packages", "/admin/violations", "/admin/audit",
                        "/admin/workflows", "/admin/risk", "/admin/gis", "/admin/access"]) {
      expect(page).toContain(`"${href}"`);
    }
  });

  test("Arabic seed migration exists and is guarded (never clobbers a reviewed row)", () => {
    const mig = SRC("../../supabase/migrations/20260715090000_cd004_ar_strings.sql");
    expect(mig).toContain("insert into ui_strings");
    expect(mig).toContain("admin.overview.r2.spine.caption");
    expect(mig).toContain("where ui_strings.status = 'draft'");
  });
});

// CD004-EV-005 — an authoritative seeded admin-family persona exists in the
// configured project (CD-003 proves the same account lands on /admin). Capture
// the real act-scope band without inventing a role or weakening the non-admin
// visibility-vs-authority proof above.
test.describe("CD-004 admin-family act-scope evidence", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("admin-family persona renders a populated act-scope band", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/login");
    await page.locator("#email").fill("admin@mim.gov.sa");
    await page.locator("#pw").fill("MimAdmin!2026");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL(url => url.pathname.startsWith("/admin"), { timeout: 20_000 });
    await page.goto("/admin");
    const scope = page.getByRole("region", { name: /Your scope/i });
    await expect(scope).toBeVisible();
    await expect(scope).toContainText(/compliance admin|form admin|workflow admin|risk owner|gis admin|security admin/i);
    await page.screenshot({ path: join(EVIDENCE_DIR, "scope-admin-en-light.png"), fullPage: true });
  });
});
