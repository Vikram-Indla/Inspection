import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { STATE_SURFACE_KINDS, resolveStateSurfaceMessage } from "../src/components/saqeel/feedback/StateSurface";

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
  expect(stateSurface).not.toContain("copy.en[kind]");
  expect(stateSurface).not.toContain("Live information is unavailable while this device is offline");
  expect(mapState).toContain('"provider-unavailable" | "offline" | "stale"');
  expect(mapState).toContain('className="map-panel"');
});

test("offline copy is route-supplied and the canonical inventory is complete", () => {
  expect(STATE_SURFACE_KINDS).toContain("offline");
  expect(resolveStateSurfaceMessage("offline", "ar")).toBeNull();
  expect(resolveStateSurfaceMessage("offline", "ar", {
    title: "AR_ROUTE_TITLE",
    body: "AR_ROUTE_BODY",
  })).toEqual({ title: "AR_ROUTE_TITLE", body: "AR_ROUTE_BODY" });
  expect(resolveStateSurfaceMessage("empty", "ar")).not.toEqual(resolveStateSurfaceMessage("empty", "en"));
});

test("new shared primitives are exported from the canonical barrel", () => {
  const barrel = read("src/components/saqeel/index.ts");
  expect(barrel).toContain("MapTruthState");
  expect(barrel).toContain("CheckInOverride");
  expect(barrel).toContain("resolveStateSurfaceMessage");
});

test("check-in override remains generic and confirmation-gated", () => {
  const override = read("src/components/saqeel/inspection/CheckInOverride.tsx");

  expect(override).toContain("reason.trim().length > 0");
  expect(override).toContain("explanation.trim().length > 0");
  expect(override).toContain("confirmed &&");
  expect(override).not.toMatch(/threshold|distance|geofence|taxonomy|penalty/i);
});
