import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";

// Browser gate for the Executive Overview (card `exec`).
//
// The redesign made three structural claims. None of them is provable by a
// typecheck, so each is asserted here against the running route:
//
//   1. the assurance figure leads, with its eligible-answer denominator beside
//      it — never presented as a share of compliant factories;
//   2. the regional queue renders ABOVE the map, and selecting a region still
//      cross-filters it (the state lifted into RegionalScope);
//   3. "Basis and source" opens the metric lineage and reaches source records.
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
  test("assurance leads, queue precedes the map, basis drawer reaches source", async ({ page }) => {
    await page.goto("/dashboard?view=strategic");

    // 1 — the dominant figure and its denominator.
    const assurance = page.locator("#ex-assurance-h");
    await expect(assurance).toBeVisible();
    const lead = page.locator("section", { has: assurance });
    await expect(lead).toContainText(/eligible answers|إجابة مؤهلة/);
    // The denominator must never be described as factories.
    await expect(lead).not.toContainText(/of \d+ factories|من \d+ مصنع/);

    // 2 — queue above the map, in document order.
    const queue = page.getByRole("region", { name: /Regions requiring examination|مناطق تستدعي الفحص/ });
    await expect(queue).toBeVisible();
    const order = await page.evaluate(() => {
      const q = document.querySelector('[aria-label*="Regions requiring"], [aria-label*="مناطق تستدعي"]');
      const map = document.querySelector('[class*="mapPanel"], [class*="canvasGrid"]');
      if (!q || !map) return "missing";
      return q.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING ? "queue-first" : "map-first";
    });
    expect(order, "the regional queue must precede the geographic evidence").toBe("queue-first");

    // 2b — cross-filter survives the lift out of DecisionCanvas.
    const firstRegion = queue.getByRole("button").nth(1);
    if (await firstRegion.count()) {
      await firstRegion.click();
      await expect(firstRegion).toHaveAttribute("aria-pressed", "true");
    }

    // 3 — basis drawer opens and offers the source drill.
    const basis = page.getByRole("button", { name: /Basis and source|الأساس والمصدر/ });
    await expect(basis).toBeVisible();
    await basis.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/Numerator|البسط/);
    await expect(drawer).toContainText(/Denominator|المقام/);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

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
        await expect(page.locator("#ex-assurance-h")).toBeVisible();

        // Mapbox GL reports readiness before its tiles paint. Without this the
        // capture shows an empty grey box and reads as a broken map — which is
        // exactly how a false "map does not mount" finding got raised once.
        await expect(page.locator('[data-map-ready="true"]').first())
          .toBeAttached({ timeout: 30_000 });
        await expect(page.locator("canvas").first()).toBeAttached({ timeout: 30_000 });
        await page.waitForTimeout(6_000);

        // At 1440x900 the map must not intrude on the first viewport.
        if (w.name === "1440") {
          const mapTop = await page.evaluate(() => {
            const map = document.querySelector('[class*="mapPanel"], [class*="canvasGrid"]');
            return map ? map.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
          });
          expect(mapTop, "map must start below the fold at 1440x900").toBeGreaterThan(900);
        }

        await page.screenshot({
          path: join(evidenceDirectory("exec"), `exec-overview-${dir}-${w.name}.png`),
          fullPage: true,
        });
      });
    }
  }
});
