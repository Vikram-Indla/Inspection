import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const wizard = [
  "src/components/saqeel/date-range-picker/date-range-picker.tsx",
  "src/features/planning-single/target.ts",
].map(file => readFileSync(join(process.cwd(), file), "utf8")).join("\n");

test("DM-003 window end inherits the selected start as its native minimum", () => {
  expect(wizard).toMatch(
    /name="window_end"[^>]*type="datetime-local"[^>]*required min=\{windowStart \|\| undefined\}/,
  );
  expect(wizard).toContain('const scheduleReady = windowStart !== "" && windowEnd !== "" && windowEnd > windowStart;');
});
