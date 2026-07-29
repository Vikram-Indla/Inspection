import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const wizard = readFileSync(
  join(process.cwd(), "src/app/(app)/planning/single/Wizard.tsx"),
  "utf8",
);

test("DM-003 window end inherits the selected start as its native minimum", () => {
  expect(wizard).toMatch(
    /name="window_end"[^>]*type="datetime-local"[^>]*required min=\{windowStart \|\| undefined\}/,
  );
  expect(wizard).toContain('const scheduleReady = windowStart !== "" && windowEnd !== "" && windowEnd > windowStart;');
});
