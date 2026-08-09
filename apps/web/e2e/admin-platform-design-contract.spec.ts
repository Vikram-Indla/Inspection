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
    const source = read("apps/web/src/app/(app)/admin/operations/page.tsx");
    expect(source).toContain("errorsError");
    expect(source).toContain("flagsError");
    expect(source).toContain("endpointsError");
    expect(source).toContain("never shown as zero or empty");
    expect(source).toContain("This source is not available. Records may exist that cannot be shown.");
  });

  test("notification creation fails closed when the governed role catalogue is unavailable", () => {
    const page = read("apps/web/src/app/(app)/admin/notifications/page.tsx");
    const manager = read("apps/web/src/app/(app)/admin/notifications/NotificationRulesManager.tsx");
    expect(page).toContain("roleTableError");
    expect(page).toContain("Rule creation is turned off; existing rules remain readable.");
    expect(manager).toContain("rolesAvailable");
    expect(manager).toContain("disabled={!rolesAvailable}");
  });

  test("audit makes policy-held status prominent and localizes operational status labels", () => {
    const source = read("apps/web/src/app/(app)/admin/audit/AuditReplayWorkspace.tsx");
    expect(source).toContain("auditTerms");
    expect(source).toContain('appendOnly: "إضافة فقط"');
    expect(source).toContain('changed: "متغير"');
    expect(source).toContain("<strong>{L.policyHeldTag}</strong>");
    expect(source).not.toContain('?"RECORDED SEMANTIC":"GENERIC ONLY"');
    expect(source).not.toContain('?"CHANGED":"UNCHANGED"');
  });
});
