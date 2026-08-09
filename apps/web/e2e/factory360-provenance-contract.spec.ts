import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Factory360 never presents seeded or fixture records as live Senaei", () => {
  const source = readFileSync(resolve(
    process.cwd(),
    "src/app/(app)/factories/RevampFactory360Portfolio.tsx",
  ), "utf8");

  expect(source).toContain('!selected.is_temporary && selected.source === "senaei"');
  expect(source).toContain("label: provenanceStrings.unavailable");
  expect(source).toContain("body: provenanceStrings.unavailableBody");
  expect(source).toContain("provenanceStrings.noSenaeiSync");
  expect(source.match(/label: provenanceStrings\.registered\b/g)?.length).toBe(1);
  expect(source).toMatch(/!selected\.is_temporary && selected\.source === "senaei"\s*\?\s*\{\s*label: provenanceStrings\.registered/);
  expect(source).toMatch(/selected\.source === "saqeel_test_data"\s*\?\s*\{\s*label: provenanceStrings\.test,/);
});
