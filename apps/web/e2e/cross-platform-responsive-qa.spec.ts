import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const evidenceDir = process.env.CROSS_PLATFORM_EVIDENCE_DIR?.trim();
if (evidenceDir) mkdirSync(evidenceDir, { recursive: true });

const screenshot = async (
  page: Page,
  project: string,
  name: string,
) => {
  if (!evidenceDir) return;
  await page.screenshot({ path: join(evidenceDir, `${project}-${name}.png`), fullPage: true });
};

test.describe("shared shell remediation contract", () => {
  test("closed mobile drawer is hidden/non-interactive and phone search reclaims its row", () => {
    const css = source("src/app/astryx.css");
    expect(css).toMatch(/\.ax-shell__nav,[\s\S]*visibility: hidden; pointer-events: none;/);
    expect(css).toMatch(/\.ax-shell\.is-drawer-open \.ax-shell__nav[\s\S]*visibility: visible; pointer-events: auto;/);
    expect(css).toMatch(/@media \(max-width: 560px\)[\s\S]*\.ax-shell-search,[\s\S]*inline-size: 100%;/);
    expect(css).toMatch(/@media \(max-width: 360px\)[\s\S]*\.ax-shell-controls \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  });
});

test.describe("mobile shell geometry and accessibility", () => {
  test.use({ storageState: storageStatePath("inspector") });

  for (const locale of ["en", "ar"] as const) {
    test(`${locale.toUpperCase()} closed/open drawer is visually absent then fully operable`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/locale?set=${locale}`);
      await page.goto("/field/settings/readiness");
      await expect(page.locator("[data-readiness-ready=ready]")).toBeVisible();

      const nav = page.locator("nav#saqeel-primary-nav");
      await expect(nav).toHaveCSS("visibility", "hidden");
      await expect(nav).toHaveCSS("pointer-events", "none");
      await expect(nav).toHaveCSS("box-shadow", "none");
      const closedEdge = await page.evaluate((rtl) => {
        const element = document.elementFromPoint(rtl ? innerWidth - 1 : 1, Math.round(innerHeight / 2));
        return {
          navHit: Boolean(element?.closest("nav#saqeel-primary-nav")),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      }, locale === "ar");
      expect(closedEdge.navHit).toBe(false);
      expect(closedEdge.overflow).toBeLessThanOrEqual(1);
      await screenshot(page, testInfo.project.name, `drawer-closed-${locale}-390`);

      const menu = page.getByRole("button", { name: locale === "ar" ? "فتح قائمة التنقل" : "Open navigation" });
      await menu.click();
      await expect(nav).toHaveCSS("visibility", "visible");
      await expect(nav).toHaveCSS("pointer-events", "auto");
      await expect(page.locator(".ax-shell__backdrop")).toBeVisible();
      const openRect = await nav.boundingBox();
      expect(openRect).not.toBeNull();
      expect(openRect!.x).toBeGreaterThanOrEqual(-1);
      expect(openRect!.x + openRect!.width).toBeLessThanOrEqual(391);
      await screenshot(page, testInfo.project.name, `drawer-open-${locale}-390`);

      await page.keyboard.press("Escape");
      await expect(nav).toHaveCSS("visibility", "hidden");
      await expect(menu).toBeFocused();
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
    });
  }

  test("phone topbar controls remain inside 320/375/390 viewports in LTR and RTL", async ({ page }, testInfo) => {
    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      for (const width of [320, 375, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/field/settings/readiness");
        await expect(page.locator("[data-readiness-ready=ready]")).toBeVisible();
        const geometry = await page.evaluate(() => {
          const selectors = [
            ".ax-shell__menu",
            ".ax-shell-search",
            ".sq-shell-scope--date",
            ".sq-shell-scope--region",
            ".ax-pagehead__actions",
          ];
          const outside = selectors.flatMap(selector =>
            [...document.querySelectorAll<HTMLElement>(selector)]
              .filter(element => {
                const style = getComputedStyle(element);
                return style.display !== "none" && style.visibility !== "hidden";
              })
              .map(element => {
                const rect = element.getBoundingClientRect();
                return { selector, left: rect.left, right: rect.right, width: rect.width };
              })
              .filter(rect => rect.left < -1 || rect.right > innerWidth + 1),
          );
          return {
            outside,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            searchWidth: document.querySelector(".ax-shell-search")?.getBoundingClientRect().width ?? 0,
          };
        });
        expect(geometry.outside, `${locale}/${width}px controls outside viewport`).toEqual([]);
        expect(geometry.overflow, `${locale}/${width}px overflow`).toBeLessThanOrEqual(1);
        expect(geometry.searchWidth, `${locale}/${width}px search width`).toBeGreaterThan(200);
        await screenshot(page, testInfo.project.name, `topbar-${locale}-${width}`);
      }
    }
  });
});

test("representative cross-vertical routes pass the eight-width continuum", async ({ browser }, testInfo) => {
  test.setTimeout(180_000);
  const matrix = [
    { width: 320, height: 800, locale: "en", theme: "light", persona: "inspector", route: "/field/settings/readiness" },
    { width: 375, height: 812, locale: "ar", theme: "dark", persona: "planner", route: "/dashboard" },
    { width: 390, height: 844, locale: "en", theme: "dark", persona: "admin", route: "/admin/access?view=roles" },
    { width: 768, height: 1024, locale: "ar", theme: "light", persona: "inspector", route: "/field" },
    { width: 1024, height: 768, locale: "en", theme: "light", persona: "planner", route: "/planning" },
    { width: 1280, height: 800, locale: "ar", theme: "dark", persona: "admin", route: "/admin/access" },
    { width: 1440, height: 900, locale: "en", theme: "dark", persona: "planner", route: "/operations" },
    { width: 1920, height: 1080, locale: "ar", theme: "light", persona: "inspector", route: "/field/visits" },
  ] as const;

  for (const state of matrix) {
    const context = await (browser as Browser).newContext({
      storageState: storageStatePath(state.persona),
      viewport: { width: state.width, height: state.height },
    });
    await context.addInitScript(theme => {
      localStorage.setItem("saqeel-theme", theme);
    }, state.theme);
    const page = await context.newPage();
    await page.goto(`/locale?set=${state.locale}`);
    const response = await page.goto(state.route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${state.persona} ${state.route}`).toBeLessThan(400);
    await expect(page.locator("html")).toHaveAttribute("lang", state.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", state.locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page).not.toHaveURL(/\/login\?reason=unauthorized/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${testInfo.project.name}/${state.persona}/${state.route}/${state.width}`).toBeLessThanOrEqual(1);
    if (state.width <= 1024) {
      await expect(page.locator("nav#saqeel-primary-nav")).toHaveCSS("visibility", "hidden");
    }
    await screenshot(
      page,
      testInfo.project.name,
      `route-${state.persona}-${state.locale}-${state.theme}-${state.width}`,
    );
    await context.close();
  }
});
