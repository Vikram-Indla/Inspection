import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { evidenceDirectory, inspectionDocsRoot } from "./evidence-path";

const evidenceRoot = evidenceDirectory("saqeel-login-one-unison-004");

async function renderReady(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: path.join(evidenceRoot, `${name}.png`), fullPage: true });
}

test("unified-surface bilingual, responsive and interaction evidence", async ({ page }) => {
  test.setTimeout(180_000);

  // DEC-011 / PO direction 2026-07-25: /login is dark-locked (ThemeScript
  // forces the launch-film dark palette; the page carries no theme control),
  // so every composition case is captured in the one governed theme.
  const compositionCases = [
    { name: "corrected-dark-desktop", width: 1440, height: 900, locale: "en" },
    { name: "ipad-landscape-dark-en", width: 1180, height: 820, locale: "en" },
    { name: "ipad-portrait-dark-en", width: 820, height: 1180, locale: "en" },
    { name: "mobile-dark-en", width: 390, height: 844, locale: "en" },
    { name: "arabic-dark-desktop", width: 1440, height: 900, locale: "ar" },
  ] as const;

  for (const item of compositionCases) {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(`/locale?set=${item.locale}`);
    await renderReady(page);
    await capture(page, item.name);
  }

  // Non-negotiable unison test: hiding every overlay must leave one full-height
  // atmospheric atlas canvas with no structural header/footer bands.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/locale?set=en");
  await renderReady(page);
  await page.addStyleTag({ content: ".lg-story__head,.lg-atlas3d__event,.lg-atlas3d__stages{visibility:hidden!important}" });
  await capture(page, "canvas-only-dark-desktop");
  await page.locator("style").last().evaluate(element => element.remove());

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/locale?set=en");
  await renderReady(page);
  await page.getByRole("tab", { name: "Dispatch" }).click();
  await page.waitForTimeout(3_200);
  await capture(page, "dispatch-with-vehicles-light-en");

  await page.getByRole("tab", { name: "Zones" }).click();
  await capture(page, "zones-resting-light-en");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await east.hover({ force: true });
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await capture(page, "zone-east-hovered-dark-en");
  await page.mouse.move(4, 4);
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).not.toHaveClass(/is-lifted/);
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
  await renderReady(page);
  await page.getByRole("tab", { name: "Dispatch" }).click();
  await page.waitForTimeout(3_200);
  await page.getByRole("tab", { name: "Zones" }).click();
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await east.hover({ force: true });
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await page.mouse.move(4, 4);
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).not.toHaveClass(/is-lifted/);
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
