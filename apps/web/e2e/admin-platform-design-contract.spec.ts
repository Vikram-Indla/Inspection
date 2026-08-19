import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// SCR-ADM-080 · MVP2-M2-05 · M3-00
// Static truth/localization contract for the bounded admin-platform design slice.
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

test.describe("admin platform design truth contract", () => {
  test("operations keeps source failures distinct from genuine zero and empty states", () => {
    const queries = read("apps/web/src/features/admin-operations/queries.ts");
    const copy = read("apps/web/src/i18n/locales/en/admin-operations.json");
    expect(queries).toContain("errorsError");
    expect(queries).toContain("flagsError");
    expect(queries).toContain("endpointsError");
    expect(copy).toContain("never shown as zero or empty");
    expect(copy).toContain("This source is not available. Records may exist that cannot be shown.");
  });

  test("notification creation fails closed when the governed role catalogue is unavailable", () => {
    const queries = read("apps/web/src/features/admin-notifications/queries.ts");
    const form = read("apps/web/src/components/sections/admin-notifications/notif-create-form.tsx");
    const copy = read("apps/web/src/i18n/locales/en/admin-notifications.json");
    expect(queries).toContain("roleTableRead.error");
    expect(copy).toContain("Rule creation is turned off; existing rules remain readable.");
    expect(form).toContain("rolesAvailable");
    expect(form).toContain("disabled={!rolesAvailable}");
  });

  test("audit makes policy-held status prominent and localizes operational status labels", () => {
    const arCopy = read("apps/web/src/i18n/locales/ar/admin-audit.json");
    const screen = read("apps/web/src/components/sections/admin-audit/audit-screen.tsx");
    const recorder = read("apps/web/src/components/sections/admin-audit/audit-recorder.tsx");
    expect(arCopy).toContain('"terms"');
    expect(arCopy).toContain('"appendOnly": "إضافة فقط"');
    expect(arCopy).toContain('"changed": "متغير"');
    expect(screen).toContain("{strings.tags.policyHeld}");
    expect(recorder).not.toContain('?"RECORDED SEMANTIC":"GENERIC ONLY"');
    expect(recorder).not.toContain('?"CHANGED":"UNCHANGED"');
  });
});
