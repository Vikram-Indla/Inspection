import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { evidenceDirectory } from "../evidence-path";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "../login-helper";
import { loadPixelCredentials } from "./credentials";
import {
  bitmapDifferencePercent,
  captureGeometry,
  compareGeometry,
  structuralScore,
} from "./geometry";
import {
  DESIGNS_ROOT,
  loadManifest,
  SPINE_PATH,
} from "./manifest";
import { startPrototypeServer } from "./prototype-server";
import { updateSpineDesignLane } from "./spine-writer";
import {
  PIXEL_LOCALES,
  PIXEL_WIDTHS,
  type CardReport,
  type ManifestCard,
  type RouteTarget,
  type VariantResult,
} from "./types";

const WEB_ROOT = resolve(__dirname, "../..");
const SCORE_RULE =
  "Six equal structural dimensions. Numeric values match within max(1px, 2%); " +
  "categorical breakpoint/overflow/safe-area values match exactly. At least four " +
  "design-specified dimensions and every required route × design × width × locale " +
  "variant must validate. Bitmap difference is supplemental and never scored.";
const CLEAN_FACTORY_IDS = new Set([
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2205",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
]);
type PixelStorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

test.setTimeout(30 * 60_000);

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function signIn(page: Page): Promise<void> {
  const credentials = loadPixelCredentials(WEB_ROOT);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await waitForCredentialsForm(page);
  // The card's inputs carry no id attributes, so go through login-helper's
  // structural locators rather than the #email / #pw of the deleted LoginClient.
  await identifierField(page).fill(credentials.email);
  await passwordField(page).fill(credentials.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.startsWith("/field"), { timeout: 40_000 });
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");
}

async function authenticatedState(browser: Browser): Promise<PixelStorageState> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page);
  const state = await context.storageState();
  await context.close();
  return state;
}

async function resolveTarget(page: Page, target: RouteTarget): Promise<string> {
  if (target.kind === "static") return target.path;
  await page.goto(target.seedPath, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const candidates = await page.locator("a[href]").evaluateAll(anchors =>
    anchors.map(anchor => anchor.getAttribute("href")).filter((href): href is string => Boolean(href)),
  );
  const pattern = new RegExp(target.hrefPattern);
  const origin = new URL(page.url()).origin;
  const match = candidates.find(href => pattern.test(new URL(href, origin).pathname));
  if (!match) throw new Error(`No link matching ${target.hrefPattern} from ${target.seedPath}`);
  return new URL(match, page.url()).pathname;
}

async function assertCleanFactories(page: Page): Promise<void> {
  const identifiers = await page.locator("body").evaluate(body =>
    [...new Set(((body.textContent ?? "").match(/\bF-\d{4}\b/g) ?? []))] as string[],
  );
  const forbidden = identifiers.filter(identifier => !CLEAN_FACTORY_IDS.has(identifier));
  if (forbidden.length) {
    throw new Error(`Non-clean factory identifiers rendered (${forbidden.length})`);
  }
}

async function setLocale(context: BrowserContext, page: Page, locale: string): Promise<void> {
  const origin = new URL(page.url()).origin;
  await context.addCookies([
    { name: "locale", value: locale, url: origin },
    { name: "login_locale", value: locale, url: origin },
  ]);
}

async function renderVariant(
  browser: Browser,
  storageState: PixelStorageState,
  prototypeOrigin: string,
  card: ManifestCard,
  routePath: string,
  designPage: string,
  width: number,
  locale: string,
  direction: string,
  artifactDirectory: string,
): Promise<VariantResult> {
  const context = await browser.newContext({
    storageState,
    viewport: { width, height: 1024 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const browserErrors: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  try {
    await page.goto(routePath, { waitUntil: "domcontentloaded" });
    await setLocale(context, page, locale);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    if (!new URL(page.url()).pathname.startsWith("/field") &&
        !new URL(page.url()).pathname.startsWith("/login")) {
      throw new Error(`Route redirected outside field channel to ${new URL(page.url()).pathname}`);
    }
    await assertCleanFactories(page);
    if (browserErrors.length) throw new Error(`Shipped route page errors: ${browserErrors.length}`);
    const shipped = await captureGeometry(page, locale);
    const fileStem = `${card.cardId}-${slug(basename(designPage, ".dc.html"))}-${slug(routePath)}-${width}-${locale}`;
    const shippedPath = join(artifactDirectory, `${fileStem}-shipped.png`);
    const designPath = join(artifactDirectory, `${fileStem}-design.png`);
    const shippedPng = await page.screenshot({ path: shippedPath, animations: "disabled" });

    browserErrors.length = 0;
    const designUrl = `${prototypeOrigin}/${encodeURIComponent(designPage)}?lang=${locale}`;
    await page.goto(designUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#dc-root > .sc-host", { timeout: 15_000 });
    const renderedRoot = page.locator("#dc-root > .sc-host [dir]").first();
    let renderedDirection = await renderedRoot.getAttribute("dir");
    if (renderedDirection !== direction) {
      const languageControl = page.getByRole("button").filter({
        hasText: /^(?:AR|EN|العربية|English)$/i,
      }).first();
      if (!await languageControl.count()) {
        throw new Error(`Design prototype has no locale control for ${locale}/${direction}`);
      }
      await languageControl.click();
      await expect(renderedRoot).toHaveAttribute("dir", direction);
      renderedDirection = await renderedRoot.getAttribute("dir");
    }
    if (renderedDirection !== direction) {
      throw new Error(`Design prototype remained ${renderedDirection ?? "directionless"} for ${locale}`);
    }
    await page.evaluate(({ locale, direction }) => {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.body.dir = direction;
      const root = document.querySelector<HTMLElement>("#dc-root > .sc-host");
      if (root) {
        root.lang = locale;
        root.dir = direction;
      }
    }, { locale, direction });
    await page.waitForTimeout(250);
    if (browserErrors.length) throw new Error(`Design prototype page errors: ${browserErrors.length}`);
    const design = await captureGeometry(page, locale);
    if (design.runtimeErrorCount || design.unresolvedTemplateCount) {
      throw new Error(
        `Design prototype invalid: ${design.runtimeErrorCount} logic errors, ` +
        `${design.unresolvedTemplateCount} unresolved placeholders`,
      );
    }
    const designPng = await page.screenshot({ path: designPath, animations: "disabled" });
    const assertions = compareGeometry(shipped, design);
    const score = structuralScore(assertions);
    if (score === null) throw new Error("Fewer than four design-specified structural dimensions");
    const bitmap = await bitmapDifferencePercent(page, shippedPng, designPng);
    writeFileSync(
      join(artifactDirectory, `${fileStem}-geometry.json`),
      `${JSON.stringify({ shipped, design, assertions, structuralScore: score, bitmapDifferencePercent: bitmap }, null, 2)}\n`,
      "utf8",
    );
    return {
      width,
      locale,
      direction,
      routePath,
      designPage,
      status: "measured",
      assertions,
      structuralScore: score,
      bitmapDifferencePercent: bitmap,
      shippedScreenshot: shippedPath,
      designScreenshot: designPath,
    };
  } catch (error) {
    return {
      width,
      locale,
      direction,
      routePath,
      designPage,
      status: "unmeasurable",
      reason: error instanceof Error ? error.message : String(error),
      assertions: [],
      structuralScore: null,
      bitmapDifferencePercent: null,
    };
  } finally {
    await context.close();
  }
}

test("BS-1 manifest is 24-card many-to-many and prototypes boot through support.js", async ({ browser }) => {
  const manifest = loadManifest();
  expect(manifest).toHaveLength(24);
  expect(manifest.some(card => card.routeTargets.length > 1)).toBeTruthy();
  expect(manifest.some(card => card.designPages.length > 1)).toBeTruthy();
  const server = await startPrototypeServer(DESIGNS_ROOT);
  const context = await browser.newContext({ viewport: { width: 834, height: 1024 } });
  const page = await context.newPage();
  try {
    await page.goto(
      `${server.origin}/${encodeURIComponent("SAQEEL PWA-Field Dashboard.dc.html")}`,
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForSelector("#dc-root > .sc-host");
    await expect(page.locator(".sc-logic-error")).toHaveCount(0);
    await expect(page.locator(".sc-missing,.sc-unresolved")).toHaveCount(0);
    const languageControl = page.getByRole("button", { name: "AR", exact: true });
    await expect(languageControl).toBeVisible();
    await languageControl.click();
    await expect(page.locator("#dc-root > .sc-host [dir=rtl]").first()).toBeVisible();
  } finally {
    await context.close();
    await server.close();
  }
});

test("BS-1 measures PWA structural parity and dry-runs spine updates", async ({ browser }) => {
  const manifest = loadManifest();
  expect(manifest).toHaveLength(24);
  const artifactDirectory = evidenceDirectory(
    `bs-1-pixel-diff-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  mkdirSync(artifactDirectory, { recursive: true });
  writeFileSync(
    join(artifactDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  const prototypeServer = await startPrototypeServer(DESIGNS_ROOT);
  let storageState: PixelStorageState;
  try {
    storageState = await authenticatedState(browser);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const reports = manifest.map<CardReport>(card => ({
      schemaVersion: 1,
      harness: "BS-1",
      cardId: card.cardId,
      cardName: card.cardName,
      routeJoinKey: card.routeJoinKey,
      generatedAt: new Date().toISOString(),
      rule: SCORE_RULE,
      score: null,
      scoreReason: `Authentication unavailable: ${reason}`,
      designPages: card.designPages,
      routePaths: [],
      variants: [],
    }));
    const reportPath = join(artifactDirectory, "dry-run-report.json");
    writeFileSync(reportPath, `${JSON.stringify(reports, null, 2)}\n`);
    const refusals = reports.map(report => {
      try {
        return updateSpineDesignLane(SPINE_PATH, report, reportPath, { write: false });
      } catch (writerError) {
        return {
          mode: "dry-run-refused",
          cardId: report.cardId,
          reason: writerError instanceof Error ? writerError.message : String(writerError),
        };
      }
    });
    writeFileSync(
      join(artifactDirectory, "writer-preview.json"),
      `${JSON.stringify(refusals, null, 2)}\n`,
    );
    await prototypeServer.close();
    throw error;
  }

  const reports: CardReport[] = [];
  try {
    for (const card of manifest) {
      const generatedAt = new Date().toISOString();
      if (card.manifestIssues.length) {
        reports.push({
          schemaVersion: 1,
          harness: "BS-1",
          cardId: card.cardId,
          cardName: card.cardName,
          routeJoinKey: card.routeJoinKey,
          generatedAt,
          rule: SCORE_RULE,
          score: null,
          scoreReason: card.manifestIssues.join("; "),
          designPages: card.designPages,
          routePaths: [],
          variants: [],
        });
        continue;
      }
      const discoveryContext = await browser.newContext({ storageState });
      const discoveryPage = await discoveryContext.newPage();
      const routePaths: string[] = [];
      const discoveryErrors: string[] = [];
      for (const target of card.routeTargets) {
        try {
          routePaths.push(await resolveTarget(discoveryPage, target));
        } catch (error) {
          discoveryErrors.push(
            `${target.label}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      await discoveryContext.close();
      if (discoveryErrors.length || !routePaths.length) {
        reports.push({
          schemaVersion: 1,
          harness: "BS-1",
          cardId: card.cardId,
          cardName: card.cardName,
          routeJoinKey: card.routeJoinKey,
          generatedAt,
          rule: SCORE_RULE,
          score: null,
          scoreReason: discoveryErrors.join("; ") || "No route paths resolved",
          designPages: card.designPages,
          routePaths,
          variants: [],
        });
        continue;
      }

      const variants: VariantResult[] = [];
      for (const routePath of [...new Set(routePaths)]) {
        for (const designPage of card.designPages) {
          for (const width of PIXEL_WIDTHS) {
            for (const { locale, direction } of PIXEL_LOCALES) {
              variants.push(await renderVariant(
                browser,
                storageState,
                prototypeServer.origin,
                card,
                routePath,
                designPage,
                width,
                locale,
                direction,
                artifactDirectory,
              ));
            }
          }
        }
      }
      const incomplete = variants.filter(variant =>
        variant.status !== "measured" || variant.structuralScore === null,
      );
      const scores = variants
        .map(variant => variant.structuralScore)
        .filter((score): score is number => score !== null);
      const score = incomplete.length || !scores.length
        ? null
        : Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100) / 100;
      reports.push({
        schemaVersion: 1,
        harness: "BS-1",
        cardId: card.cardId,
        cardName: card.cardName,
        routeJoinKey: card.routeJoinKey,
        generatedAt,
        rule: SCORE_RULE,
        score,
        scoreReason: score === null
          ? `${incomplete.length} of ${variants.length} required variants unmeasurable`
          : `macro-average of ${scores.length} equally weighted route/design/width/locale variants`,
        designPages: card.designPages,
        routePaths: [...new Set(routePaths)],
        variants,
      });
    }
  } finally {
    await prototypeServer.close();
  }

  const reportPath = join(artifactDirectory, "dry-run-report.json");
  writeFileSync(reportPath, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
  const writeCardId = process.env.PIXEL_CARD_ID?.trim();
  if (process.env.PIXEL_WRITE === "1" && !writeCardId) {
    throw new Error("PIXEL_WRITE=1 requires PIXEL_CARD_ID so one spine card is edited per run");
  }
  const previews = reports.map(report => {
    try {
      return updateSpineDesignLane(SPINE_PATH, report, reportPath, {
        write: process.env.PIXEL_WRITE === "1" && report.cardId === writeCardId,
        expectedRevision: process.env.PIXEL_EXPECTED_REVISION,
      });
    } catch (error) {
      return {
        mode: process.env.PIXEL_WRITE === "1" ? "write-refused" : "dry-run-refused",
        cardId: report.cardId,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  });
  writeFileSync(
    join(artifactDirectory, "writer-preview.json"),
    `${JSON.stringify(previews, null, 2)}\n`,
    "utf8",
  );
  console.log(`BS-1 dry-run report: ${reportPath}`);
  console.log(`Measured cards: ${reports.filter(report => report.score !== null).length}/${reports.length}`);
  expect(reports).toHaveLength(24);
});
