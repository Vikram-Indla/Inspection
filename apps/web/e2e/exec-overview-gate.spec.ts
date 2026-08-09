import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";

// Browser gate for the Executive/Strategic dashboard (card `exec`).
//
// The server-first rebuild replaced the Executive Overview canvas (assurance
// block, regional queue, Mapbox evidence) with the governed strategic surface:
// National performance → Compliance performance explorer → Strategic
// intervention → governed-absence cards → requirement coverage. The three
// structural claims this gate carries forward, restated on that surface:
//
//   1. the national compliance figure leads, and its basis is the
//      eligible-answer denominator — never presented as a share of factories;
//   2. the explorer cross-filters through the four governed lenses
//      (region/city/sector/authority) without losing the strategic view;
//   3. every metric discloses its methodology (definition + worked example)
//      and offers a drill to the source route — no unexplained number.
//
// Captured at the declared widths in EN and AR, because AR/RTL is the primary
// direction on this product and a mirrored layout is not parity.

const WIDTHS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "narrow", width: 412, height: 915 },
];

test.use({ storageState: storageStatePath("ops") });

test.describe("exec — Executive Overview browser gate", () => {
  test("national compliance leads with the eligible-answer basis, lenses cross-filter, methodology discloses the source", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");

    // 1 — National performance leads the strategic stack.
    const lead = page.locator("#dashboard-national-performance");
    await expect(lead).toBeVisible();
    const order = await page.evaluate(() => {
      const national = document.getElementById("dashboard-national-performance");
      const intervention = document.getElementById("dashboard-strategic-intervention");
      if (!national || !intervention) return "missing";
      return national.compareDocumentPosition(intervention) & Node.DOCUMENT_POSITION_FOLLOWING
        ? "national-first" : "intervention-first";
    });
    expect(order, "National performance must precede Strategic intervention").toBe("national-first");

    // 1b — the compliance basis is the eligible-answer denominator.
    const complianceBasis = page.locator("details", { hasText: /Percentage of eligible inspection answers/i }).first();
    await expect(complianceBasis).toBeAttached();
    await complianceBasis.locator("summary").click();
    await expect(complianceBasis.getByText(/Percentage of eligible inspection answers/i)).toBeVisible();
    // The denominator must never be described as factories.
    await expect(complianceBasis).not.toContainText(/of \d+ factories|من \d+ مصنع/);

    // 2 — the explorer offers the four governed lenses; City cross-filters
    // through the URL while the strategic view survives.
    const explorer = page.locator("section", { has: page.locator("#dashboard-compliance-explorer") }).first();
    await expect(explorer).toBeVisible();
    for (const lens of ["Region", "City", "Sector", "Authority"]) {
      await expect(explorer.getByRole("link", { name: lens, exact: true })).toBeVisible();
    }
    await explorer.getByRole("link", { name: "City", exact: true }).click();
    await page.waitForURL(/group=city/);
    await expect(page.locator("#dashboard-national-performance")).toBeVisible();
    await expect(
      page.locator("section", { has: page.locator("#dashboard-compliance-explorer") }).first()
        .getByRole("link", { name: "City", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    // 3 — the metric card drills to its source route, never a dead end.
    await expect(
      page.locator("a[href*='/analytics'], a[href*='/factories'], a[href*='/reviews']").first(),
    ).toBeVisible();

    // No fabricated liveness claim anywhere on the surface.
    await expect(page.locator("body")).not.toContainText(/Live · refreshed|مباشر · تم التحديث/);
  });

  for (const dir of ["en", "ar"] as const) {
    for (const w of WIDTHS) {
      test(`renders at ${w.name} in ${dir.toUpperCase()}`, async ({ page, context }) => {
        const origin = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? 3000}`;
        await context.addCookies([
          { name: "locale", value: dir, url: origin },
          { name: "login_locale", value: dir, url: origin },
        ]);
        await page.setViewportSize({ width: w.width, height: w.height });
        await page.goto("/dashboard?view=strategic");
        await expect(page.locator("#dashboard-national-performance")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("dir", dir === "ar" ? "rtl" : "ltr");

        // The strategic surface must never scroll horizontally at any
        // declared width, in either direction.
        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(widths.scroll, `no horizontal overflow at ${w.name}/${dir}`).toBeLessThanOrEqual(widths.client + 1);

        await page.screenshot({
          path: join(evidenceDirectory("exec"), `exec-overview-${dir}-${w.name}.png`),
          fullPage: true,
        });
      });
    }
  }
});
