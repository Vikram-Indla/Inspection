import { expect, test } from "@playwright/test";
import { scanAxe } from "./axe-scan";
import { storageStatePath } from "./personas";

// The application shell is on every authenticated route, so a defect here is a
// defect everywhere — the rail's duplicated aria ids (T-106) shipped for months
// because no spec scanned the shell itself, only the pages inside it.
//
// Both locales and both directions: the scope controls collapse to icon-only
// triggers below 1360px and move their labels into the accessible name, which
// is exactly the kind of change that reads fine in English and breaks in RTL.
const WIDTHS = [1440, 1280, 900, 430] as const;
const LOCALES = ["en", "ar"] as const;

test.describe("shell chrome accessibility", () => {
  test.use({ storageState: storageStatePath("inspector") });

  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`shell is axe-clean at ${width}px in ${locale}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/locale?set=${locale}`);
        await page.goto("/dashboard");
        await page.locator("header").first().waitFor();

        const { violations, unresolvedIncomplete } = await scanAxe(page, "header");

        expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
        expect(
          unresolvedIncomplete,
          JSON.stringify(unresolvedIncomplete, null, 2),
        ).toEqual([]);
      });
    }
  }

  test("rail subgroup ids are unique across both rail instances", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("header").first().waitFor();

    const duplicates = await page.evaluate(() => {
      const counts: Record<string, number> = {};
      document.querySelectorAll("[id^='sqx-nav-']").forEach(node => {
        counts[node.id] = (counts[node.id] ?? 0) + 1;
      });
      return Object.entries(counts).filter(([, count]) => count > 1).map(([id]) => id);
    });

    expect(duplicates, "the rail renders twice; ids must be scoped by variant").toEqual([]);
  });
});
