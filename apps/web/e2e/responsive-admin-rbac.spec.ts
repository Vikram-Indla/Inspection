import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  ADMINISTRATOR_CAPABILITY_ROLES,
  CANONICAL_ROLE_KEYS,
  canonicalRoleForLegacy,
  canonicalRolesForLegacy,
} from "../src/lib/admin-role-convergence";
import { storageStatePath } from "./personas";

const repoRoot = path.resolve(__dirname, "..");
const source = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), "utf8");
const evidenceDir = process.env.ADMIN_RBAC_EVIDENCE_DIR?.trim();
if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });

test.describe("PKT-RESPONSIVE-ADMIN-RBAC-008 contracts", () => {
  test("approved thirteen-role compatibility map presents exactly three internal roles", () => {
    expect(CANONICAL_ROLE_KEYS).toEqual(["planner", "inspector", "administrator"]);
    expect(canonicalRoleForLegacy("planner")).toBe("planner");
    expect(canonicalRoleForLegacy("inspector")).toBe("inspector");
    for (const role of ADMINISTRATOR_CAPABILITY_ROLES) {
      expect(canonicalRoleForLegacy(role)).toBe("administrator");
    }
    expect(canonicalRoleForLegacy("factory_rep")).toBeNull();
    expect(canonicalRolesForLegacy(["planner", "reviewer", "ops", "admin"])).toEqual([
      "planner",
      "administrator",
    ]);
  });

  test("the parent boundary authorizes before protected child routes render", () => {
    const layout = source("src/app/(app)/admin/layout.tsx");
    const boundary = source("src/components/AdminRouteBoundary.tsx");
    expect(layout).toContain("ADMINISTRATOR_CAPABILITY_ROLES");
    expect(layout).toContain("<AdminRouteBoundary");
    expect(layout.indexOf("<AdminRouteBoundary")).toBeLessThan(layout.indexOf("{children}"));
    expect(boundary.indexOf("getUserRoles(user.id)")).toBeLessThan(boundary.indexOf("return children"));
    expect(boundary.indexOf("return children")).toBeLessThan(boundary.indexOf("<Shell current=\"/admin\""));
    expect(boundary).toContain("homeForRoles(roles)");
    expect(boundary).toContain("You do not have access to this destination");
  });

  test("Inspector field gate and database authority remain untouched", () => {
    const navigation = source("src/lib/shell-navigation.ts");
    const roleHome = source("src/lib/role-home.ts");
    const adminLayout = source("src/app/(app)/admin/layout.tsx");
    expect(navigation).toContain('export const FIELD_CHANNEL_ROLE_KEYS = ["inspector"] as const');
    expect(navigation).toContain("isFieldOnlyPersona");
    expect(roleHome).toContain('["inspector", "/field"]');
    expect(adminLayout).toContain("ADMINISTRATOR_CAPABILITY_ROLES");
    expect(adminLayout).not.toContain('"inspector"');
  });

  test("reviewed Arabic and narrow-screen labelled-record fallbacks are complete", () => {
    const arabic = source("src/lib/admin-rbac-arabic.ts");
    const i18n = source("src/lib/i18n.ts");
    const css = source("src/app/(app)/admin/access/access.module.css");
    expect(arabic).toContain('"admin.unauthorized.heading": "ليس لديك صلاحية الوصول إلى هذه الوجهة"');
    expect(arabic).toContain('"admin.access.canonicalBanner.title": "توجد ثلاثة أدوار معتمدة');
    expect(i18n).toContain("...ADMIN_RBAC_AR_FALLBACK");
    expect(css).toContain(".accessPanelTable table");
    expect(css).toContain("content: attr(data-label)");
  });
});

test.describe("Planner Administration refusal", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("direct URL and refresh return the canonical shell without protected data", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/admin/access");
    await expect(page.getByRole("heading", { name: "You do not have access to this destination", level: 2 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to an authorized area" })).toHaveAttribute("href", "/planning");
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText("Access management", { exact: true })).toHaveCount(0);
    if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, "planner-unauthorized-en.png"), fullPage: true });
    await page.reload();
    await expect(page.getByRole("heading", { name: "You do not have access to this destination", level: 2 })).toBeVisible();
  });

  test("Arabic refusal is RTL, translated and axe-clean", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/admin");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "ليس لديك صلاحية الوصول إلى هذه الوجهة", level: 2 })).toBeVisible();
    await expect(page.getByRole("link", { name: "العودة إلى المساحة المصرح بها" })).toHaveAttribute("href", "/planning");
    if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, "planner-unauthorized-ar.png"), fullPage: true });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Administrator Users and Roles", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("roles view exposes three canonical roles and retains governed profile detail", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/admin/access?view=roles");
    await expect(page.getByRole("heading", { name: "Canonical roles" })).toBeVisible();
    for (const role of ["Planner", "Inspector", "Administrator"]) {
      await expect(page.getByRole("article").filter({ hasText: role }).first()).toBeVisible();
    }
    await expect(page.locator("section").filter({ has: page.getByRole("heading", { name: "Canonical roles" }) }).getByRole("article")).toHaveCount(3);
    await expect(page.getByText("There are three canonical roles: Planner, Inspector and Administrator.")).toBeVisible();
  });

  test("mandated widths, locales and themes have no document overflow", async ({ page }) => {
    test.setTimeout(180_000);
    const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      for (const theme of ["light", "dark"] as const) {
        await page.goto("/admin/access?view=users");
        if (await page.locator("html").getAttribute("data-theme") !== theme) {
          await page.locator(".ax-pagehead__actions > button.ax-topbar-icon").click();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        for (const width of widths) {
          await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
          await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `${locale}/${theme}/${width}px document overflow`).toBeLessThanOrEqual(1);
          if (evidenceDir) {
            await page.screenshot({
              path: path.join(evidenceDir, `access-${locale}-${theme}-${width}.png`),
              fullPage: true,
            });
          }
        }
      }
    }
  });

  test("English and Arabic role views are keyboard reachable and axe-clean", async ({ page }) => {
    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      await page.goto("/admin/access?view=roles");
      await expect(page.getByRole("heading", { name: locale === "ar" ? "الأدوار المعتمدة" : "Canonical roles" })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus-visible")).toHaveCount(1);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
