import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-COMPLIANCE-LIBRARY-003
// CMP-REQ-LIB-001..005 · CMP-ACC-LIB-001..020
const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

test.describe("Prompt 03 Compliance Library and Inspector Runtime Preview contract", () => {
  const items = read("src/app/(app)/admin/items/page.tsx");
  const regulations = read("src/app/(app)/admin/regulations/page.tsx");
  const layout = read("src/app/(app)/admin/items/layout.tsx");
  const preview = read("src/app/(app)/admin/items/[id]/runtime-preview/page.tsx");
  const requestCreate = read("src/app/(app)/admin/compliance-requests/new/page.tsx");

  test("unified library exposes regulations, items and governed request handoff", () => {
    for (const page of [items, regulations]) {
      expect(page).toContain('aria-label="Inspection Rules"');
      expect(page).toContain('/admin/regulations');
      expect(page).toContain('/admin/items');
      expect(page).toContain('/admin/compliance-requests/new');
    }
    // Regulations authoring is request-only (maker-checker CCR); the legacy
    // compatibility path survives only on the items screen.
    expect(items).toContain("Legacy compatibility authoring");
    expect(regulations).toContain("This library is for viewing and searching. To create or change something, start a Compliance Configuration Request.");
    expect(items).not.toContain('sq-btn sq-btn--prominent sq-link');
    expect(regulations).not.toContain('sq-btn sq-btn--prominent sq-link');
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
