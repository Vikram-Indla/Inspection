import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

const CANONICAL_SIZES_PX = [30, 28, 20, 16, 14, 13, 12, 11];

const MAX_DISTINCT_SIZES_PER_PAGE = 6;

const ROUTES = [
  "/dashboard",
  "/operations",
  "/factories",
  "/planning",
  "/execution",
  "/reviews",
  "/compliance",
  "/analytics",
];

type RenderedType = {
  size: number;
  count: number;
  sample: string;
};

test.use({ storageState: storageStatePath("planner") });

async function collectRenderedType(page: import("@playwright/test").Page): Promise<RenderedType[]> {
  return page.evaluate(() => {
    const bySize = new Map<number, { count: number; sample: string }>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      if (text.length === 0) continue;
      const parent = node.parentElement;
      if (parent === null) continue;
      const style = window.getComputedStyle(parent);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const size = Math.round(parseFloat(style.fontSize));
      const existing = bySize.get(size);
      if (existing === undefined) {
        bySize.set(size, { count: 1, sample: text.slice(0, 60) });
      } else {
        existing.count += 1;
      }
    }
    return [...bySize.entries()].map(([size, entry]) => ({ size, ...entry }));
  });
}

for (const route of ROUTES) {
  test(`typography scale holds on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const rendered = await collectRenderedType(page);
    expect(rendered.length, `${route} rendered no text`).toBeGreaterThan(0);

    const offScale = rendered.filter((entry) => !CANONICAL_SIZES_PX.includes(entry.size));
    expect(
      offScale,
      `${route} renders text at sizes outside the SAQEEL scale (${CANONICAL_SIZES_PX.join(", ")}px). ` +
        `Off-scale: ${offScale.map((e) => `${e.size}px ×${e.count} "${e.sample}"`).join(" | ")}`,
    ).toEqual([]);

    expect(
      rendered.length,
      `${route} renders ${rendered.length} distinct font sizes; the ceiling is ${MAX_DISTINCT_SIZES_PER_PAGE}. ` +
        `Sizes: ${rendered.map((e) => `${e.size}px ×${e.count}`).join(", ")}`,
    ).toBeLessThanOrEqual(MAX_DISTINCT_SIZES_PER_PAGE);
  });
}
