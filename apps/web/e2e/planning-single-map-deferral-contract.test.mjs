import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dossier = readFileSync(new URL("../src/components/sections/planning-single/identity-dossier/identity-dossier.tsx", import.meta.url), "utf8");
const journey = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");

test("Planning Single defers Mapbox until the Planner explicitly selects Map", () => {
  assert.match(dossier, /useState<"map" \| "text">\("text"\)/);
  assert.match(dossier, /view === "map" \? \(/);
  assert.match(dossier, /setView\("map"\)/);
  assert.match(dossier, /<GeoMap center=\{center\}/);
  assert.match(dossier, /aria-label=\{strings\.textEquivalent\}/);
  assert.doesNotMatch(dossier, /useState<"map" \| "text">\("map"\)/);
});

test("golden P1 requires Publish interactivity inside the existing bounded step", () => {
  assert.match(journey, /P1 Planner publish is interactive within the smoke-step timeout/);
  assert.match(journey, /await expect\(publish\)\.toBeEnabled\(\)/);
  assert.match(journey, /timeout: P2_LOGIN_STEP_TIMEOUT/);
  assert.match(journey, /await publish\.click\(\)/);
  assert.doesNotMatch(journey, /waitForTimeout\([^)]*publish|setTimeout\([^)]*publish/i);
});
