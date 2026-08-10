import { test, expect, type Page } from "@playwright/test";
import { storageStatePath, type PersonaKey } from "./personas";

// The app shell owns exactly one scroller: `.sqx-shell__main`. When the outer
// document is also scrollable, a focus change scrolls both, and the viewport
// lands in the empty region below the fixed-height shell — the screen reads as
// blank while rendering perfectly. Observed on /planning/bulk: the document was
// 2846px against a 645px viewport, and clicking a row checkbox scrolled it to
// 1758. This asserts the contract on the routes most likely to regress it.
const routes: { persona: PersonaKey; route: string; label: string }[] = [
  { persona: "planner", route: "/planning/bulk", label: "bulk targeting" },
  { persona: "planner", route: "/planning", label: "planning" },
  { persona: "planner", route: "/visits", label: "visit management" },
  { persona: "reviewer", route: "/reviews", label: "review queue" },
];

async function documentIsUnscrollable(page: Page): Promise<{ documentScroll: number; mainScroll: number }> {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      documentScroll: document.documentElement.scrollHeight - window.innerHeight,
      mainScroll: main === null ? 0 : main.scrollHeight - main.clientHeight,
    };
  });
}

for (const { persona, route, label } of routes) {
  test.describe(`${label} — the shell is the only scroller`, () => {
    test.use({ storageState: storageStatePath(persona) });

    test(`${route} never lets the document scroll`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      const atRest = await documentIsUnscrollable(page);
      expect(atRest.documentScroll, `${route}: the document must not be scrollable`).toBeLessThanOrEqual(1);

      const focusable = page.locator("main :is(input, button, a, select, textarea):visible").last();
      if (await focusable.count() > 0) {
        await focusable.focus();
        const afterFocus = await page.evaluate(() => Math.round(window.scrollY));
        expect(afterFocus, `${route}: focusing a control must not scroll the document`).toBe(0);
      }

      expect(atRest.mainScroll, `${route}: main should own the scrolling`).toBeGreaterThanOrEqual(0);
    });
  });
}
