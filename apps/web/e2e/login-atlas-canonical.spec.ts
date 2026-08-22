import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// DEC-040 — /login is the atlas login. web/SAQEEL Login v2.dc.html in the SAQEEL
// Design System is the accepted authority for this route and depicts the
// credential column beside the inspection atlas.
//
// This file exists because the atlas was deleted twice by sessions that read it
// as obsolete (530d501a, then 76c31dc0 — 27 files, 1987 deletions, including
// every brand raster). Nothing failed: the two atlas specs that existed were
// registered in neither playwright config, so they never ran, and /login
// silently degraded to the credential card alone. A static contract is the
// cheapest guard that turns that deletion into a red test instead of a merge.
//
// Static by design: no browser, no server, no seeded data. It asserts the
// modules and assets exist and that page.tsx still composes them, which is
// exactly what a removal breaks first.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const exists = (path: string) => existsSync(join(process.cwd(), path));

const LOGIN = "src/app/login";
const loginPage = read(`${LOGIN}/page.tsx`);
const loginCss = read(`${LOGIN}/login.css`);

test.describe("DEC-040 the atlas login is canonical", () => {
  test("/login composes the credential column beside the story panel", () => {
    expect(loginPage).toContain('import StoryPanel');
    expect(loginPage).toContain("<StoryPanel");
    expect(loginPage).toContain("<FieldLoginClient");
    // credential column first: the atlas is the second column, never the page
    expect(loginPage.indexOf("<FieldLoginClient")).toBeLessThan(loginPage.indexOf("<StoryPanel"));
  });

  test("the atlas modules are present", () => {
    for (const mod of [
      "StoryPanel.tsx",
      "SaudiIndustrialAtlas.tsx",
      "saudi-atlas-locations.ts",
      "saudi-atlas-motion.ts",
      "saudi-atlas-structures.ts",
    ]) {
      expect(exists(`${LOGIN}/${mod}`), `${mod} is missing from ${LOGIN}`).toBe(true);
    }
  });

  test("the brand rasters the atlas renders are present", () => {
    for (const asset of [
      "inspection-atlas-scene-base-v2.png",
      "inspection-suv-topdown-v1.png",
      "inspector-character-v2-01.png",
    ]) {
      expect(exists(`public/brand/saudi-atlas/${asset}`), `${asset} is missing`).toBe(true);
    }
  });

  // The Login v2 traits that distinguish the accepted design from the earlier
  // atlas: one graphite ground shared with the credential column, and a Zones
  // scene that shows every layer at once rather than one story at a time.
  test("the Login v2 composition survives", () => {
    expect(loginCss).toContain("--atlas-canvas:  var(--nav-bg)");           // graphite re-ground
    expect(loginCss).toContain("saturate(.72) hue-rotate(-10deg) brightness(1.1)"); // raster grade
    expect(loginCss).toContain("lg-story__seam");                            // 190px seam
    expect(loginCss).toContain("lg-atlas-image__wash");                      // colour + multiply wash
    expect(loginCss).toContain("min(132cqw");                                // plane over-scale
    expect(loginCss).toContain("lg-atlas-motion__fence");                    // geofence rings
    expect(loginCss).toContain("lg-atlas-motion__km");                       // trip-distance chips
  });

  test("scene 05 Zones is the composite, not a single story", () => {
    for (const layer of [
      "lg-atlas-motion__route-line",
      "lg-atlas-motion__suvs",
      "lg-atlas-motion__km",
      "lg-atlas-motion__inspector",
      "lg-atlas-motion__outcome",
    ]) {
      expect(
        loginCss.includes(`.lg-atlas-motion[data-stage="decide"] .${layer}`),
        `${layer} does not light up on the Zones scene`,
      ).toBe(true);
    }
  });

  test("no rule is drawn between the two columns", () => {
    expect(loginCss).not.toContain(
      "border-inline-end: 1px solid color-mix(in srgb, var(--nav-text) 14%, transparent)",
    );
  });
});
