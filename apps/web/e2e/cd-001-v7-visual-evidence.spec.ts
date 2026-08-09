import { test, expect } from "@playwright/test";
import path from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { identifierField, waitForCredentialsForm } from "./login-helper";

const evidenceRoot = evidenceDirectory("login-v7-atlas");

test("capture accepted CD-001 V7 runtime evidence", async ({ page }) => {
  const cases = [
    { name: "desktop-dark-en", width: 1440, height: 900, locale: "en", theme: "dark" as const },
    { name: "desktop-light-en", width: 1440, height: 900, locale: "en", theme: "light" as const },
    { name: "desktop-dark-ar", width: 1440, height: 900, locale: "ar", theme: "dark" as const },
    { name: "desktop-light-ar", width: 1440, height: 900, locale: "ar", theme: "light" as const },
    { name: "laptop-dark-en", width: 1280, height: 800, locale: "en", theme: "dark" as const },
    { name: "mobile-dark-en", width: 390, height: 844, locale: "en", theme: "dark" as const },
    { name: "mobile-dark-ar", width: 390, height: 844, locale: "ar", theme: "dark" as const },
    { name: "mobile-light-ar", width: 390, height: 844, locale: "ar", theme: "light" as const },
  ];

  for (const c of cases) {
    await page.setViewportSize({ width: c.width, height: c.height });
    await page.goto(`/locale?set=${c.locale}`);
    // Set the requested case directly. Repeated addInitScript calls accumulate
    // on a reused page and can make later evidence cases non-deterministic.
    await page.evaluate(theme => localStorage.setItem("saqeel-theme", theme), c.theme);
    await page.goto("/login");
    const atlas = page.locator('.lg-atlas-image.is-ready[data-atlas-mode="public-safe-image"]');
    if (c.width >= 1024) await expect(atlas).toBeVisible();
    else await expect(atlas).toBeAttached();
    await waitForCredentialsForm(page);
    await expect(identifierField(page)).toBeVisible();
    await page.screenshot({ path: path.join(evidenceRoot, `${c.name}.png`), fullPage: true });
  }
});
