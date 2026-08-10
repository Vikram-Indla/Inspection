import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const wizard = readFileSync(
  join(process.cwd(), "src/components/sections/planning-single/visit-configuration/visit-configuration.tsx"),
  "utf8",
);

test("DM-001 checklist label uses the approved field treatment without a bordered legend", () => {
  expect(wizard).toContain('className={`field ${styles.packageField}`} role="group"');
  expect(wizard).toContain('aria-labelledby="wizard-package-label"');
  expect(wizard).toContain('<span id="wizard-package-label">{strings.packageLabel}</span>');
  expect(wizard).not.toContain('<fieldset className={`field ${styles.packageField}`}>');
  expect(wizard).not.toContain("<legend>{strings.packageLabel}</legend>");
});
