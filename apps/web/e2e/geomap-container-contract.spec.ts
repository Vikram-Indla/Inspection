import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// GeoMap hands one element to Mapbox as its container AND lets React own that
// element's className. Mapbox adds `mapboxgl-map` imperatively at construction;
// React overwrites the attribute on the next render. When the loading class was
// dropped by rendering `className={undefined}`, React removed the attribute
// outright and took `mapboxgl-map` with it — so the container lost the
// `position: relative` that class supplies, and .mapboxgl-canvas (absolute)
// resolved against the viewport and painted the map over the whole page.
//
// Static contract, no browser: whatever React writes into className must always
// carry `mapboxgl-map`, in every branch.
const source = readFileSync(
  join(process.cwd(), "src/components/GeoMap.tsx"),
  "utf8",
);

test.describe("GeoMap container keeps Mapbox's positioning class", () => {
  test("every className branch on the map container carries mapboxgl-map", () => {
    const match = source.match(/className=\{([^}]*)\}/g) ?? [];
    const containerBranches = match.filter(m => m.includes("sq-map-loading"));
    expect(
      containerBranches.length,
      "expected the map container's className expression to be found",
    ).toBeGreaterThan(0);
    for (const branch of containerBranches) {
      expect(
        branch.includes("mapboxgl-map"),
        `className branch drops mapboxgl-map: ${branch}`,
      ).toBe(true);
    }
  });

  test("the container className is never rendered as undefined", () => {
    // `undefined` removes the attribute entirely, which is what deleted the
    // class. An empty string would too. Both are refused.
    expect(source).not.toMatch(/className=\{\s*ready\s*\?\s*undefined\s*:/);
    expect(source).not.toMatch(/className=\{\s*ready\s*\?\s*""\s*:/);
  });
});
