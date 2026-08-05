import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("shared controls and tables retain the approved responsive primitives", () => {
  const tokens = read("src/app/tokens.css");
  const components = read("src/app/saqeel-components.css");

  expect(tokens).toContain('[data-density="compact"]');
  expect(tokens).toContain("--control-h-sm: var(--touch-target)");
  expect(components).toContain("overscroll-behavior-inline: contain");
  expect(components).toContain("min-inline-size: max-content");
  expect(components).toContain(".desc { grid-template-columns: minmax(0, 1fr); }");
});

test("truth states distinguish unavailable, stale, and offline map data", () => {
  const stateSurface = read("src/components/saqeel/feedback/StateSurface.tsx");
  const mapState = read("src/components/saqeel/feedback/MapTruthState.tsx");

  expect(stateSurface).toContain('| "offline"');
  expect(stateSurface).toContain("No cached value is presented as current.");
  expect(mapState).toContain('"provider-unavailable" | "offline" | "stale"');
  expect(mapState).toContain('className="map-panel"');
});

test("check-in override remains generic and confirmation-gated", () => {
  const override = read("src/components/saqeel/inspection/CheckInOverride.tsx");

  expect(override).toContain("reason.trim().length > 0");
  expect(override).toContain("explanation.trim().length > 0");
  expect(override).toContain("confirmed &&");
  expect(override).not.toMatch(/threshold|distance|geofence|taxonomy|penalty/i);
});
