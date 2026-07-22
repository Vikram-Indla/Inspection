import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-ADMIN-PHASE1-PLAN-001-F0
// WA-DES-022 · WA-DES-041 · WA-F0-AC-001..006
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("Web/Admin F0 source and security contract", () => {
  test("design hashes, state vocabulary, and neutral boundaries are pinned", () => {
    const renderer = read("src/components/saqeel/ReferenceRenderer.tsx");
    const states = read("src/components/saqeel/feedback/StateSurface.tsx");
    expect(renderer).toContain("85da98476e91038a150b10ecb9b4e45a7f322564187de4f91d48d32e441f9921");
    expect(renderer).toContain("9e78eb7ced8d9b43096d2346a8925534feeecd30c748cc48f70a86a17f4b5d9a");
    for (const state of ["empty", "loading", "error", "rls-denied", "not-yet", "provider-unavailable", "degraded", "stale", "conflict", "unauthorized"]) {
      expect(states).toContain(`"${state}"`);
    }
    expect(states).toContain("Nothing was changed");
    expect(states).toContain("Nothing was overwritten");
    expect(states).toContain("not a claim that no data exists");
    expect(states).toContain("No fallback result has been presented as production truth");
  });

  test("reference renderer is test-only, server-gated, and contains no data bypass", () => {
    const page = read("src/app/reference/web-admin/f0/page.tsx");
    const renderer = read("src/components/saqeel/ReferenceRenderer.tsx");
    expect(page).toContain('process.env.SAQEEL_F0_REFERENCE_RENDERER !== "enabled"');
    expect(page).toContain("notFound()");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(renderer).not.toMatch(/service[_-]?role/i);
    expect(renderer).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(renderer).not.toContain("fetch(");
  });

  test("existing shell, search, navigation, and compatibility contracts remain present", () => {
    const shell = read("src/components/ShellClient.tsx");
    const server = read("src/components/Shell.tsx");
    const search = read("src/app/api/shell/search/route.ts");
    const css = read("src/app/saqeel-components.css");
    expect(shell).toContain("setPendingHref");
    expect(shell).toContain("aria-disabled=\"true\"");
    expect(server).toContain("getUserRoles(user.id)");
    expect(search).toContain("getVerifiedUser(sb)");
    expect(search).not.toMatch(/service[_-]?role/i);
    expect(css).toContain(".btn-touch");
    expect(css).toContain(".btn-field");
    expect(css).toContain("current .ax-state and SAQEEL component contracts remain");
  });
});

test.describe("Web/Admin F0 guarded reference runtime", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reference/web-admin/f0");
    await expect(page.locator(".saqeel-reference")).toBeVisible();
  });

  test("renders source-backed states without success inference", async ({ page }) => {
    const select = page.getByLabel("State", { exact: true });
    await select.selectOption("error");
    await expect(page.locator('[data-state-kind="error"]')).toContainText("Nothing was changed");
    await select.selectOption("rls-denied");
    await expect(page.locator('[data-state-kind="rls-denied"]')).toContainText("not a claim that no data exists");
    await select.selectOption("provider-unavailable");
    await expect(page.locator('[data-state-kind="provider-unavailable"]')).toContainText("production truth");
    await select.selectOption("conflict");
    await expect(page.locator('[data-state-kind="conflict"]')).toContainText("Nothing was overwritten");
  });

  test("supports light/dark and English/Arabic RTL without horizontal overflow", async ({ page }) => {
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator(".saqeel-reference")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "AR · RTL" }).click();
    await expect(page.locator(".saqeel-reference")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[data-state-kind="empty"]')).toContainText("لا توجد سجلات");
    for (const viewport of [{ width: 1024, height: 768 }, { width: 412, height: 915 }, { width: 390, height: 844 }, { width: 320, height: 800 }]) {
      await page.setViewportSize(viewport);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${viewport.width}px must not overflow`).toBeLessThanOrEqual(0);
    }
  });

  test("has keyboard-operable controls and no automatically detectable accessibility violations", async ({ page }) => {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Light" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Dark" })).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
