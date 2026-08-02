import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test.describe("Figma to application terminology parity", () => {
  test("uses Dashboard and Inspector language in the visible catalogue", () => {
    const catalogue = read("src/lib/i18n-keys.generated.ts");
    expect(catalogue).toContain('{ key: "landing.cta.workspace", en: "Open dashboard"');
    expect(catalogue).toContain('{ key: "landing.hero.ctaWorkspace", en: "Open dashboard"');
    expect(catalogue).toContain('{ key: "landing.nav.ipad", en: "Inspector"');
    expect(catalogue).toContain('{ key: "landing.persona.inspector.title", en: "Inspector"');
    expect(catalogue).toContain('{ key: "login.inspector.title", en: "Inspector"');
    expect(catalogue).toContain('{ key: "login.inspector.short", en: "Inspector"');
  });

  test("keeps retired terms out of the affected visible values", () => {
    const catalogue = read("src/lib/i18n-keys.generated.ts");
    const planning = read("src/app/(app)/planning/page.tsx");
    expect(catalogue).not.toMatch(/en: "[^"]*(?:workspace|iPad)[^"]*"/i);
    expect(planning).not.toContain("Task workspace");
    expect(planning).toContain("Tasks — assigned, in progress and completed");
  });

  test("keeps the approved Arabic terminology in the seed source", () => {
    const seed = read("../../scripts/seed_arabic.py");
    expect(seed).toContain('"landing.cta.workspace": "افتح لوحة المعلومات"');
    expect(seed).toContain('"landing.nav.ipad": "المفتش"');
    expect(seed).not.toContain('"landing.nav.ipad": "آيباد"');
    expect(seed).not.toContain("مساحة عملك");
  });
});
