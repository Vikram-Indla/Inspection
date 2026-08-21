import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-COMPLIANCE-LIBRARY-003
// CMP-REQ-LIB-001..005 · CMP-ACC-LIB-001..020
const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

test.describe("Prompt 03 Compliance Library and Inspector Runtime Preview contract", () => {
  const items = read("src/components/sections/admin-items/items-screen.tsx");
  const itemsCopy = read("src/i18n/locales/en/admin-items.json");
  const govNotice = read("src/components/sections/regulations/catalogue/regulation-governance-notice/regulation-governance-notice.tsx");
  const regsCopy = read("src/i18n/locales/en/regulations.json");
  const layout = read("src/app/(app)/admin/items/layout.tsx");
  const preview = read("src/app/(app)/admin/items/[id]/runtime-preview/page.tsx");
  const requestCreate = read("src/app/(app)/admin/compliance-requests/new/page.tsx");

  test("unified library exposes regulations, items and governed request handoff", () => {
    // The migrated items screen keeps the library nav (Regulations · Inspection
    // Items · Create request) with an i18n accessible name and the maker-checker
    // modify handoff. Regulations authoring is request-only: its governance
    // notice routes any change to the Compliance Configuration Request.
    expect(items).toContain("aria-label={strings.title}");
    for (const href of ["/admin/regulations", "/admin/items", "/admin/compliance-requests/new"]) {
      expect(items).toContain(href);
    }
    expect(govNotice).toContain("/admin/compliance-requests/new");
    expect(regsCopy).toContain("This library is for viewing and searching. To create or change a regulation, start a compliance configuration request.");
    // The legacy compatibility authoring path survives only on the items screen,
    // its copy governed through the bilingual namespace.
    expect(itemsCopy).toContain("Legacy compatibility authoring");
    expect(items).not.toContain('sq-btn sq-btn--prominent sq-link');
    expect(items).toContain("request_type=modify");
    expect(requestCreate).toContain("sp.title");
    expect(requestCreate).toContain("sp.description");
  });

  test("reviewers can verify configuration but route and page remain read-only", () => {
    expect(layout).toContain('"reviewer"');
    expect(preview).toContain("Read-only · configuration check");
    expect(preview).toContain("It does not create, publish, or change anything in the Inspector app.");
    expect(preview).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
    expect(read("src/app/(app)/admin/items/[id]/runtime-preview/loading.tsx")).toContain("Loading runtime preview");
    expect(read("src/app/(app)/admin/items/[id]/runtime-preview/error.tsx")).toContain("No configuration has been changed");
  });

  test("preview reads exact immutable execution snapshots and version lineage", () => {
    expect(preview).toContain('from("package_version_item_snapshots")');
    expect(preview).toContain('from("inspection_item_versions")');
    expect(preview).toContain('from("compliance_entity_versions")');
    expect(preview).toContain("Exact effective version");
    expect(preview).toContain("Version history");
    expect(preview).toContain("Live item configuration");
  });

  test("preview covers the approved runtime-consumption fields and enforcement timing", () => {
    for (const label of [
      "Regulation", "Inspection Section", "Response Type", "Response Values and evaluation mapping",
      "Mandatory status", "Evidence requirement", "Acceptable Evidence Types", "Self-Assessment visibility",
      "Non-Compliant Trigger Response", "Linked Violation", "Linked Penalty configuration (read-only)",
      "Checklist / report usage", "Operational",
    ]) expect(preview).toContain(label);
    expect(preview).toContain('from("violation_codes")');
    expect(preview).toContain("final application follows Inspection Review and Enforcement");
  });

  test("missing consumption fields are explicit integration gaps, never invented defaults", () => {
    expect(preview).toContain("Inspector runtime integration gaps");
    expect(preview).toContain("Affected runtime route/component");
    expect(preview).toContain("Regression risk");
    expect(preview).toContain("Separate slice: Yes");
    expect(preview).toContain("Not configured");
    expect(preview).not.toMatch(/default.*(?:penalty|response type|report type)/i);
  });
});
