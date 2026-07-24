import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { storageStatePath, type PersonaKey } from "./personas";

// TASK-QA-UI-COMPLIANCE-CERT-004 · UIC-AC-001..030
// Read-only authenticated journeys. /field is deliberately excluded because
// its server load invokes canonical visit expiry; field UI remains covered by
// the non-mutating inspector component harness until a controlled DB is used.
const journeys: { persona: PersonaKey; route: string; label: string; locale: "en" | "ar"; theme: "light" | "dark" }[] = [
  { persona: "planner", route: "/planning", label: "planning", locale: "en", theme: "light" },
  { persona: "planner", route: "/visits", label: "visit management", locale: "ar", theme: "dark" },
  { persona: "reviewer", route: "/reviews", label: "review queue", locale: "en", theme: "dark" },
  { persona: "admin", route: "/admin", label: "admin control plane", locale: "ar", theme: "light" },
  { persona: "admin", route: "/admin/regulations", label: "compliance library", locale: "en", theme: "light" },
  { persona: "inspector", route: "/factories", label: "inspector factory context", locale: "ar", theme: "dark" },
];

async function setPresentation(page: Page, locale: "en" | "ar", theme: "light" | "dark") {
  // The shared verification identity service has a deliberately low request
  // ceiling. Pace read-only certification renders so the audit itself does
  // not create an artificial 429; product assertions remain unchanged.
  await page.waitForTimeout(5_000);
  await page.addInitScript(value => localStorage.setItem("saqeel-theme", value), theme);
  const port = Number(process.env.UI_COMPLIANCE_PORT ?? 3137);
  await page.context().addCookies([
    { name: "locale", value: locale, url: `http://127.0.0.1:${port}` },
    { name: "login_locale", value: locale, url: `http://127.0.0.1:${port}` },
  ]);
}

for (const journey of journeys) {
  test.describe(`${journey.persona}: ${journey.label}`, () => {
    test.use({ storageState: storageStatePath(journey.persona) });

    test(`UIC WCAG 2.2 AA, 320px reflow and targets — ${journey.locale}/${journey.theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setPresentation(page, journey.locale, journey.theme);
      await page.goto(journey.route);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", journey.locale);
      await expect(page.locator("html")).toHaveAttribute("dir", journey.locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("html")).toHaveAttribute("data-theme", journey.theme);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .exclude(".mapboxgl-map")
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

      // Re-use the authenticated render at the narrow viewport. This avoids
      // unnecessary identity-provider traffic while preserving the same DOM.
      await page.setViewportSize({ width: 320, height: 800 });

      const overflow = await page.evaluate(() => ({
        html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));
      expect(overflow.html).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);
      await expect(page.locator('nav[aria-label], main#main-content')).toHaveCount(2);

      // Axe's wcag22aa target-size rule evaluates compact checkbox/radio
      // targets together with their spacing exception. This supplemental
      // geometry check covers controls whose painted box is the target.
      const undersized = await page.locator("button:visible, input:not([type=checkbox]):not([type=radio]):visible, select:visible, textarea:visible, summary:visible, a.sq-nav-item:visible")
        .evaluateAll(elements => elements.flatMap(element => {
          const rect = element.getBoundingClientRect();
          if (element.hasAttribute("disabled") || rect.width === 0 || rect.height === 0) return [];
          return rect.width + 0.5 < 24 || rect.height + 0.5 < 24
            ? [{ tag: element.tagName, text: (element.textContent ?? "").trim().slice(0, 80), width: rect.width, height: rect.height }]
            : [];
        }));
      expect(undersized, JSON.stringify(undersized, null, 2)).toEqual([]);
    });
  });
}

test.describe("shared shell keyboard, RTL and reduced motion", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("UIC focus remains visible and unobscured through primary shell controls", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "en", "light");
    await page.goto("/planning");
    const observed: string[] = [];
    for (let index = 0; index < 24; index += 1) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          label: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 60),
          visible: rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= innerHeight && rect.right >= 0 && rect.left <= innerWidth,
          focusStyle: style.outlineStyle !== "none" || style.boxShadow !== "none",
        };
      });
      // Reaching body means the document's finite tab sequence completed.
      if (!state) break;
      expect(state?.visible, JSON.stringify(state)).toBe(true);
      expect(state?.focusStyle, JSON.stringify(state)).toBe(true);
      observed.push(`${state.tag}:${state.label ?? ""}`);
    }
    expect(observed.length, JSON.stringify(observed, null, 2)).toBeGreaterThanOrEqual(12);
  });

  test("UIC Arabic mirrors shell structure and reduced motion removes animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "ar", "dark");
    await page.goto("/planning");
    const nav = await page.locator("nav.sq-shell__nav").boundingBox();
    const main = await page.locator("main#main-content").boundingBox();
    expect(nav).not.toBeNull();
    expect(main).not.toBeNull();
    expect(nav?.x ?? 0).toBeGreaterThan(main?.x ?? 0);
    const animated = await page.locator("*").evaluateAll(elements => elements.filter(element => {
      const style = getComputedStyle(element);
      return style.animationName !== "none" && style.animationDuration !== "0s";
    }).slice(0, 20).map(element => ({ tag: element.tagName, className: element.className, animation: getComputedStyle(element).animationName })));
    expect(animated, JSON.stringify(animated, null, 2)).toEqual([]);
  });
});
