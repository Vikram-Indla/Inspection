import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./auth.setup.ts", import.meta.url), "utf8");

test("auth setup accepts the approved shared Dashboard landing for every governed role", () => {
  assert.match(source, /url\.pathname\.startsWith\(p\.home\) \|\|\s*url\.pathname\.startsWith\("\/dashboard"\)/);
  assert.doesNotMatch(source, /key === "inspector" && url\.pathname\.startsWith\("\/dashboard"\)/);
});

test("auth setup still proves role-authorized useful content before persisting state", () => {
  assert.match(source, /if \(!new URL\(page\.url\(\)\)\.pathname\.startsWith\(p\.home\)\)/);
  assert.match(source, /await page\.goto\(p\.home\)/);
  assert.match(source, /await page\.waitForURL\(\(url\) => url\.pathname\.startsWith\(p\.home\)\)/);
  assert.match(source, /not\.toContainText\("ERR-AUTH"\)/);
  assert.match(source, /storageState\(\{ path: storageStatePath\(key\) \}\)/);
});
