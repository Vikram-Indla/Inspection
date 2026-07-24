import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-QA-UI-COMPLIANCE-CERT-004 · UIC-AC-031..040
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("UI compliance release guard", () => {
  test("UIC-AC-031..034 official standards and scope remain explicit", () => {
    const evidence = read("../../product-contract/evidence/TASK-QA-UI-COMPLIANCE-CERT-004.md");
    expect(evidence).toContain("WCAG 2.2");
    expect(evidence).toContain("DGA-1-2-4-203");
    expect(evidence).toContain("5.13.8");
    expect(evidence).toContain("Platform Code");
  });

  test("UIC-AC-035..037 human gates cannot be marked by automation", () => {
    const acceptance = read("../../product-contract/acceptance/UIC_UI_COMPLIANCE_CERT_004.csv");
    expect(acceptance).toContain("UIC-AC-038,native Arabic review,HUMAN_PENDING");
    expect(acceptance).toContain("UIC-AC-039,morning inspector endurance,HUMAN_PENDING");
    expect(acceptance).toContain("UIC-AC-040,night inspector endurance,HUMAN_PENDING");
  });

  test("UIC-AC-038..040 frozen boundaries remain intact", () => {
    const tokens = read("src/app/tokens.css");
    const css = read("src/app/saqeel-components.css");
    const login = read("src/app/login/login.css");
    expect(tokens).toContain("--radius-sm: 3px;"); // SAQEEL: inputs 3px (frozen 12px retired, --ax-* shim removed PR12)
    expect(tokens).toContain("--type-input: 400 14px/1.5 var(--font-body)"); // SAQEEL body input
    expect(css).not.toContain("--ax-color-prism-magenta");
    expect(login).toContain("lg-atlas");
  });

  test("UIC regression — links, targets and visit filters retain accessible affordances", () => {
    const css = read("src/app/saqeel-components-legacy.css");
    const visits = read("src/app/(app)/visits/VisitsBoard.tsx");
    const factories = read("src/app/(app)/factories/FactoryList.tsx");
    expect(css).toContain("a.sq-link:not(.sq-btn)");
    expect(css).toContain("text-decoration: underline");
    expect(css).toContain(".sq-inline-target");
    expect(css).toContain("min-inline-size: 24px");
    expect(visits).toContain('htmlFor="visit-filter-from"');
    expect(visits).toContain('id="visit-filter-from"');
    expect(visits).toContain('htmlFor="visit-filter-to"');
    expect(visits).toContain('id="visit-filter-to"');
    expect(visits).toContain('sq-link t-caption sq-inline-target'); // SAQEEL: t-caption + sq-* replace ax-caption/ax-*
    expect(factories).toContain('htmlFor="factory-region-filter"');
    expect(factories).toContain('id="factory-region-filter"');
  });
});
