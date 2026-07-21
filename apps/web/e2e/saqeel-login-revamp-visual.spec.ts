import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { evidenceDirectory, inspectionDocsRoot } from "./evidence-path";

const evidenceRoot = evidenceDirectory("saqeel-login-one-unison-004");

async function renderTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate(value => localStorage.setItem("saqeel-theme", value), theme);
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  if (await page.locator("html").getAttribute("data-theme") !== theme) {
    await page.locator(".lg-iconbtn:visible").first().click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: path.join(evidenceRoot, `${name}.png`), fullPage: true });
}

test("unified-surface bilingual, responsive and interaction evidence", async ({ page }) => {
  test.setTimeout(180_000);

  const compositionCases = [
    { name: "corrected-light-desktop", width: 1440, height: 900, locale: "en", theme: "light" },
    { name: "corrected-dark-desktop", width: 1440, height: 900, locale: "en", theme: "dark" },
    { name: "ipad-landscape-light-en", width: 1180, height: 820, locale: "en", theme: "light" },
    { name: "ipad-landscape-dark-en", width: 1180, height: 820, locale: "en", theme: "dark" },
    { name: "ipad-portrait-light-en", width: 820, height: 1180, locale: "en", theme: "light" },
    { name: "ipad-portrait-dark-en", width: 820, height: 1180, locale: "en", theme: "dark" },
    { name: "mobile-light-en", width: 390, height: 844, locale: "en", theme: "light" },
    { name: "mobile-dark-en", width: 390, height: 844, locale: "en", theme: "dark" },
    { name: "arabic-light-desktop", width: 1440, height: 900, locale: "ar", theme: "light" },
    { name: "arabic-dark-desktop", width: 1440, height: 900, locale: "ar", theme: "dark" },
  ] as const;

  for (const item of compositionCases) {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(`/locale?set=${item.locale}`);
    await renderTheme(page, item.theme);
    await capture(page, item.name);
  }

  // Non-negotiable unison test: hiding every overlay must leave one full-height
  // atmospheric atlas canvas with no structural header/footer bands.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/locale?set=en");
  for (const theme of ["light", "dark"] as const) {
    await renderTheme(page, theme);
    await page.addStyleTag({ content: ".lg-story__head,.lg-atlas3d__event,.lg-atlas3d__stages{visibility:hidden!important}" });
    await capture(page, `canvas-only-${theme}-desktop`);
    await page.locator("style").last().evaluate(element => element.remove());
  }

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/locale?set=en");
  await renderTheme(page, "light");
  await page.getByRole("tab", { name: "Dispatch" }).click();
  await page.waitForTimeout(3_200);
  await capture(page, "dispatch-with-vehicles-light-en");

  await page.getByRole("tab", { name: "Zones" }).click();
  await capture(page, "zones-resting-light-en");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await east.hover({ force: true });
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await capture(page, "zone-east-hovered-light-en");
  await east.click({ force: true });
  await expect(east).toHaveAttribute("aria-pressed", "true");
  await capture(page, "zone-east-locked-light-en");
  await east.press("Escape");
});

test("protected atlas interaction recording", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  const videoTemp = testInfo.outputPath("video");
  mkdirSync(videoTemp, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoTemp, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto("/locale?set=en");
  await renderTheme(page, "light");
  await page.getByRole("tab", { name: "Dispatch" }).click();
  await page.waitForTimeout(3_200);
  await page.getByRole("tab", { name: "Zones" }).click();
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await east.hover({ force: true });
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await east.click({ force: true });
  await page.mouse.move(4, 4);
  await expect(east).toHaveAttribute("aria-pressed", "true");
  await east.press("Escape");
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const video = page.video();
  await context.close();
  if (!video) throw new Error("Playwright video recording was not available");
  await video.saveAs(path.join(evidenceRoot, "protected-atlas-interaction.webm"));
});

test.afterAll(() => {
  const entries = readdirSync(evidenceRoot)
    .filter(name => name.endsWith(".png") || name.endsWith(".webm"))
    .sort()
    .map(name => {
      const file = path.join(evidenceRoot, name);
      return {
        path: path.relative(inspectionDocsRoot, file),
        size_bytes: statSync(file).size,
        sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
        authority: "CC-SAQEEL-LOGIN-ONE-UNISON-004 / P0 correction evidence",
        lifecycle: "sponsor visual acceptance evidence",
      };
    });

  const manifestDirectory = path.join(inspectionDocsRoot, "MANIFESTS");
  mkdirSync(manifestDirectory, { recursive: true });
  writeFileSync(path.join(manifestDirectory, "SAQEEL_LOGIN_ONE_UNISON_004.json"), `${JSON.stringify({
    schema_version: "1.0",
    task_id: "TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001",
    source_package: {
      name: "ONE FADE, ONE UNISON, ONE THEME correction",
      sha256: "65281e09a30b3ce8cba6b590c267d270d739e5fe7cace24c2bdcaf754ca003c1",
      lifecycle: "external stakeholder source; prohibited from Git",
    },
    before_evidence: [
      "07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/saqeel-login-wordmark-protected-002/desktop-light-en.png",
      "07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/saqeel-login-wordmark-protected-002/desktop-dark-en.png",
    ],
    generated_at: new Date().toISOString(),
    entries,
  }, null, 2)}\n`);
});
