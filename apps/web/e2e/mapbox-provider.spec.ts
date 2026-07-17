import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const app = (...parts: string[]) => join(process.cwd(), ...parts);

test.describe("TASK-IPAD-MAPBOX-RUNTIME-004", () => {
  test("uses Mapbox as the only application map renderer across web, Admin and iPad", () => {
    const genericMap = readFileSync(app("src/components/GeoMap.tsx"), "utf8");
    const liveMap = readFileSync(app("src/app/operations/live/LiveMapInner.tsx"), "utf8");
    const field = readFileSync(app("src/app/field/[visitId]/Startup.tsx"), "utf8");
    const admin = readFileSync(app("src/app/admin/gis/GisStudio.tsx"), "utf8");
    const packages = readFileSync(app("package.json"), "utf8");

    expect(genericMap).toContain('process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
    expect(genericMap).toContain('style: "mapbox://styles/mapbox/standard"');
    expect(genericMap).toContain("function geodesicRing");
    expect(genericMap).not.toMatch(/pk\.[A-Za-z0-9._-]{20,}/);
    expect(liveMap).toContain('style: "mapbox://styles/mapbox/standard"');
    expect(field).toContain('import("@/components/GeoMap")');
    expect(admin).toContain('import("@/components/GeoMap")');
    expect(packages).toContain('"mapbox-gl"');
    expect(packages).not.toContain('"leaflet"');
    expect(packages).not.toContain('"react-leaflet"');
  });

  test("uses Mapbox Directions for road-network ETA without committing a token", () => {
    const eta = readFileSync(app("src/app/api/routing/eta/route.ts"), "utf8");

    expect(eta).toContain("process.env.MAPBOX_ACCESS_TOKEN");
    expect(eta).toContain("https://api.mapbox.com/directions/v5/mapbox/driving/");
    expect(eta).toContain('provider: "mapbox_directions"');
    expect(eta).not.toContain("routes.googleapis.com");
    expect(eta).not.toMatch(/pk\.[A-Za-z0-9._-]{20,}/);
  });
});
