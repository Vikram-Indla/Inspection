import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");

test("golden P1 preserves editable manual-pin behavior", () => {
  assert.match(source, /if \(latEditors > 0\)/);
  assert.match(source, /await plannerLat\.fill\("24\.7136"\)/);
  assert.match(source, /await plannerLng\.fill\("46\.6753"\)/);
  assert.match(source, /location_confirmed[^\n]+\.check\(\)/);
});

test("golden P1 accepts governed read-only external location without coordinate injection", () => {
  assert.match(source, /const locationPanel = locationHeading\.locator\("\.\."\)/);
  assert.match(source, /expect\(latEditors, "location editor must expose both coordinates or neither"\)\.toBe\(lngEditors\)/);
  assert.match(source, /Read-only\.\*location master data cannot be changed in Planning/);
  assert.match(source, /locationPanel\.getByText\("Location confirmed", \{ exact: true \}\)/);
  assert.match(source, /expect\(plannerLat\)\.toHaveCount\(0\)/);
  assert.match(source, /expect\(plannerLng\)\.toHaveCount\(0\)/);
});
