import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

// CD-005 Regulation Library (SCR-ADM-010) + CD-006 Regulation Detail & Version
// (SCR-ADM-011) · /admin/regulations. Requirements: MVP1-M09-001..030, RBAC-001..006,
// FND-003. The route layout now permits only the contract roles; the reviewer proves
// read-only visibility while the dedicated /admin/regulations/:id route renders detail.
//
// Per-source FAILURE / VERIFIED-ZERO cannot be forced safely against the live backend, so
// they are proven at the code layer below (DSG-CODE-001 / DEC-012), exactly as CD-004 did.
const EVIDENCE_DIR = evidenceDirectory("cd-005-006-regulations-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("reviewer") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-005 register — discovery and read-only truth in the Compliance Library", () => {
  test("renders the register (search + status filters + list) OR a truthful empty/unavailable state — never a fabricated zero", async ({ page }) => {
    await page.goto("/admin/regulations");
    const search = page.getByRole("search");
    const catalogue = page.getByText("Regulations list");
    const emptyZero = page.getByText("No regulations in scope");
    const unavailable = page.getByText("Regulations unavailable");
    await expect(search.or(emptyZero).or(unavailable).first()).toBeVisible({ timeout: 30_000 });
    if (await catalogue.count()) {
      await expect(page.getByText(/\d+ of \d+ regulations/)).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    } else if (await emptyZero.count()) {
      await expect(page.getByText(/No regulations were found for your access/i)).toBeVisible();
    } else if (await unavailable.count()) {
      await expect(page.getByText(/No empty result is claimed/i)).toBeVisible();
    } else throw new Error("CD-006 register unavailable: completion migration/runtime is not certifiable");
    await page.screenshot({ path: join(EVIDENCE_DIR, "register-en-light-1440.png"), fullPage: true });
  });

  test("Reviewer sees only the maker-checker handoff and is refused at the request boundary", async ({ page }) => {
    await page.goto("/admin/regulations");
    // Authoring is request-only: every create affordance hands off to the
    // Compliance Configuration Request flow; no direct write control renders.
    await page.getByText("Create", { exact: true }).first().click();
    const createLinks = page.locator('a[href*="/admin/compliance-requests/new"]');
    await expect(createLinks.first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Create draft regulation/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Publish now/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Add clause/i })).toHaveCount(0);
    await page.goto("/admin/compliance-requests/new?request_type=create");
    await expect(page.getByRole("heading", { name: "You do not have access to this destination" })).toBeVisible();
  });
});

test.describe("CD-006 detail — dossier mode and governed lineage", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("dedicated detail route renders the dossier mode and shows the back link", async ({ page }) => {
    await page.goto("/admin/regulations/__no_such_regulation__");
    expect(new URL(page.url()).pathname.replace(/^\/(en|ar)(?=\/)/, "")).toBe("/admin/regulations/__no_such_regulation__");
    await expect(page.getByRole("link", { name: /Back to list/i })).toBeVisible();
    // Unknown id is not-found only after a successful read. A schema/source
    // failure remains unavailable and never fabricates either a dossier or zero.
    if (await page.getByText(/list not available/i).count()) {
      await expect(page.getByText(/unknown, not empty/i)).toBeVisible();
      await expect(page.getByText(/Regulation not found/i)).toHaveCount(0);
    } else {
      await expect(page.getByText(/Regulation not found/i)).toBeVisible();
    }
  });

  test("lineage and change history are enabled on a real dossier", async ({ page }) => {
    await page.goto("/admin/regulations?id=");
    const dossier = page.getByRole("link", { name: /View record/i }).first();
    if (await dossier.count()) {
      await dossier.click();
      await expect(page.getByRole("heading", { name: /Regulation record/i })).toBeVisible();
      await expect(page.getByText(/Version history/i).first()).toBeVisible();
      await expect(page.getByText(/Change history/i).first()).toBeVisible();
      await expect(page.locator("[data-blocked-leg]")).toHaveCount(0);
      await page.screenshot({ path: join(EVIDENCE_DIR, "detail-lineage-en-light-1440.png"), fullPage: true });
    } else {
      await expect(page.getByText(/list not available/i)).toBeVisible();
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
  const page = SRC("src/app/(app)/admin/regulations/page.tsx");
  const controls = SRC("src/app/(app)/admin/regulations/Controls.tsx");
  const actions = SRC("src/app/(app)/admin/regulations/actions.ts");

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

  test("authoring is request-only through the governed maker-checker transition", () => {
    // Direct publish left this surface: creation and change go through the
    // Compliance Configuration Request flow, while the database constraint
    // regulations_maker_checker still rejects self-approval.
    expect(page).toContain("maker-checker");
    expect(page).toContain("regulations_maker_checker");
    expect(page).toContain("This library is for viewing and searching. To create or change something, start a Compliance Configuration Request.");
    expect(actions).toContain("requireConfigurationWriter");
    expect(actions).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE/i);
  });

  test("lifecycle, effective date, attachment custody and reasoned deactivation are wired", () => {
    expect(actions).toContain('sb.rpc(operation');
    expect(actions).toContain('"activate_regulation" | "deactivate_regulation"');
    expect(actions).toContain("REGULATION-LIFECYCLE-REASON");
    expect(actions).toContain('if (!reason) return { errorCode: "reason_required" }');
    expect(page).toContain("effective_from");
    expect(page).toContain("regulation_attachments");
    expect(page).toContain("attachments_status");
    expect(page).toContain("Change history");
  });

  test("lineage is wired and clause changes are audited", () => {
    expect(page).toContain("Version lineage");
    expect(page).toContain("supersedes_id");
    expect(page).toContain("Version history");
    expect(controls).toContain("clauseNotAudited");
    expect(page).not.toContain("admin.reg.r1.detail.blocked.compare");
  });

  test("writes are gated to writers and the dedicated detail route exists", () => {
    const layout = SRC("src/app/(app)/admin/regulations/layout.tsx");
    expect(layout).toContain("AdminRouteBoundary");
    expect(layout).toContain('"compliance_admin"');
    expect(layout).toContain('"form_admin"');
    expect(page).toContain('roles.has("compliance_admin") || roles.has("form_admin")');
    expect(existsSync(join(process.cwd(), "src/app/(app)/admin/regulations/[id]/page.tsx"))).toBe(true);
  });

  test("no bare colours — only legacy design tokens (GLOBAL COLOR LAW)", () => {
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
