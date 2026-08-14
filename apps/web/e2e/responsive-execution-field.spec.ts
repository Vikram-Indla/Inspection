import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("PKT-RESPONSIVE-EXECUTION-FIELD-004 source contracts", () => {
  test("Field routes use the canonical AppShell without an active duplicate shell", () => {
    const appLayout = source("src/app/(app)/layout.tsx");
    const fieldLayout = source("src/app/(app)/field/layout.tsx");
    const fieldHeader = source("src/components/field/FieldHeader.tsx");
    const completed = source("src/app/(app)/field/completed/page.tsx");

    expect(appLayout).toContain("return <AppShell>{children}</AppShell>");
    expect(fieldLayout).toContain('data-saqeel-migration="unified-execution"');
    expect(fieldLayout).not.toMatch(/FieldShellDrawer|FieldNav|FieldTabs/);
    expect(fieldHeader).not.toMatch(/FieldShellBurger|FieldShellDrawer/);
    expect(completed).not.toMatch(/FieldNav|field-nav-spacer/);
  });

  test("Field participates in the application light and dark theme contract", () => {
    const theme = source("src/components/ThemeScript.tsx");
    const sync = source("src/components/ThemeChannelSync.tsx");
    const settings = source("src/app/(app)/field/settings/FieldSettingsClient.tsx");
    const account = source("src/app/(app)/field/account/page.tsx");
    expect(theme).not.toContain('^\\\\/field(\\\\/|$)');
    expect(theme).toContain('^\\\\/login(\\\\/|$)|^\\\\/reset(\\\\/|$)');
    expect(sync).not.toMatch(/pathname === "\/field"|pathname\.startsWith\("\/field\/"\)/);
    expect(source("src/app/(app)/field/layout.tsx")).toContain("background: \"var(--surface-canvas)\"");
    expect(settings).toContain('import ThemeToggle from "@/components/ThemeToggle"');
    expect(settings).toContain("<ThemeToggle");
    expect(account).toContain('import ThemeToggle from "@/components/ThemeToggle"');
    expect(account).toContain("<ThemeToggle");
  });

  test("offline, conflict, package-integrity and immutable-history identities are preserved", () => {
    const offline = source("src/lib/offline.ts");
    const integrity = source("src/lib/offline-package-integrity.ts");
    const completed = source("src/app/(app)/field/completed/page.tsx");
    expect(offline).toContain("packageCacheNamespace(userId)");
    expect(offline).toContain("conflict");
    expect(integrity).toContain("`mim-field-v1:${verifiedUserId}`");
    expect(integrity).toMatch(/checksum|sha256/i);
    expect(completed).toContain("latestSubmittedVersions");
    expect(completed).toContain("submission_versions");
    expect(completed).not.toMatch(/\.update\(|\.delete\(|\.insert\(/);
  });

  test("Inspector authorization resolves before Field route content", () => {
    const layout = source("src/app/(app)/field/layout.tsx");
    expect(layout).toContain('roleKeys.includes("inspector")');
    expect(layout.indexOf('roleKeys.includes("inspector")')).toBeLessThan(layout.indexOf("<FieldSessionBoundary>"));
    expect(layout).not.toMatch(/service_role|SUPABASE_SERVICE|bypassRls/i);
  });
});

test.describe("PKT-RESPONSIVE-EXECUTION-FIELD-004 runtime", () => {
  test("Inspector execution reflows in the unified shell across the responsive continuum", async ({ browser }) => {
    test.setTimeout(150_000);
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    const matrix = [
      { width: 320, height: 800, locale: "en", theme: "light" },
      { width: 375, height: 812, locale: "ar", theme: "dark" },
      { width: 390, height: 844, locale: "en", theme: "dark" },
      { width: 768, height: 1024, locale: "ar", theme: "light" },
      { width: 1024, height: 768, locale: "en", theme: "light" },
      { width: 1280, height: 800, locale: "ar", theme: "dark" },
      { width: 1440, height: 900, locale: "en", theme: "dark" },
      { width: 1920, height: 1080, locale: "ar", theme: "light" },
    ] as const;

    for (const state of matrix) {
      await page.setViewportSize({ width: state.width, height: state.height });
      await page.goto(`/locale?set=${state.locale}`);
      await page.goto("/field");
      await page.evaluate(theme => {
        localStorage.setItem("saqeel-theme", theme);
      }, state.theme);
      await page.reload();
      await expect(page.locator('[data-saqeel-migration="unified-execution"]')).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
      await expect(page.locator("nav#sqx-shell-rail")).toHaveCount(1);
      await expect(page.locator(".field-nav, .pwa-shell-drawer, .pwa-shell-menu")).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${state.width}px ${state.locale}/${state.theme}`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });

  test("Planner and Administrator are denied before Field content renders", async ({ browser }) => {
    for (const persona of ["planner", "admin"] as const) {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto("/field");
      await expect(page).toHaveURL(/\/login\?reason=unauthorized&next=/);
      await expect(page.locator('[data-saqeel-migration="unified-execution"]')).toHaveCount(0);
      await context.close();
    }
  });

  test("Virtual execution remains responsive, bilingual and accessible in the unified shell", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    for (const state of [
      { width: 320, height: 800, locale: "en", theme: "light" },
      { width: 768, height: 1024, locale: "ar", theme: "dark" },
      { width: 1920, height: 1080, locale: "en", theme: "dark" },
    ] as const) {
      await page.setViewportSize({ width: state.width, height: state.height });
      await page.goto(`/locale?set=${state.locale}`);
      await page.goto("/virtual");
      await page.evaluate(theme => {
        localStorage.setItem("saqeel-theme", theme);
      }, state.theme);
      await page.reload();
      await expect(page.locator("nav#sqx-shell-rail")).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${state.width}px ${state.locale}/${state.theme}`).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/locale?set=ar");
    await page.goto("/virtual");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await context.close();
  });
});
