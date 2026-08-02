import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// AGENTS.md rule 1 (no new CSS/style props, existing classes only) + rule 4
// (copy the approved markup structure), enforced specifically for
// CoveragePanel.tsx (INSP-697, Figma SCR-PLN-200 node 433:49148) after the
// integration review returned commit 1365446c for inline style={{...}} use.
const root = path.resolve(__dirname, "..");
const componentFile = "src/app/(app)/visits/map/CoveragePanel.tsx";
const component = fs.readFileSync(path.join(root, componentFile), "utf8");

// The exact class vocabulary this component is allowed to use — every entry
// verified present in saqeel-components.css or saqeel-runtime.css before
// being added here. Extending this list requires the same verification.
const ALLOWED_CLASSES = new Set([
  "sq-grid-2", "stack", "panel", "panel-header", "panel-title", "panel-body",
  "field", "sq-field__label", "select", "sq-btn", "sq-btn--secondary",
  "row", "grow", "sq-link", "field-help", "t-caption", "numeric",
]);

test.describe("INSP-697 CoveragePanel style contract", () => {
  test("no inline style props", () => {
    expect(component).not.toMatch(/style=\{\{/);
    expect(component).not.toMatch(/\bstyle=\{[a-zA-Z]/); // style={someVar} would also be a new styling abstraction
  });

  test("no new CSS module or styled-component import", () => {
    expect(component).not.toMatch(/\.module\.css/);
    expect(component).not.toMatch(/styled-components|@emotion/);
  });

  test("every className used resolves to the allowed, pre-verified vocabulary", () => {
    const classNameLiterals = [...component.matchAll(/className="([^"]*)"/g)].map(m => m[1]);
    expect(classNameLiterals.length).toBeGreaterThan(0); // guard against the extraction itself silently matching nothing
    const used = new Set(classNameLiterals.flatMap(c => c.split(/\s+/)).filter(Boolean));
    const unauthorized = [...used].filter(c => !ALLOWED_CLASSES.has(c));
    expect(unauthorized).toEqual([]);
  });

  test("every allowed class is actually defined in the real stylesheets (catches stale allowlist entries)", () => {
    const cssFiles = ["saqeel-components.css", "saqeel-runtime.css", "v2-components.css"]
      .map(f => fs.readFileSync(path.join(root, "src/app", f), "utf8"));
    const allCss = cssFiles.join("\n");
    for (const cls of ALLOWED_CLASSES) {
      const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const definedSomewhere = new RegExp(`\\.${escaped}(?:[.:\\[\\s,{]|$)`, "m").test(allCss);
      expect(definedSomewhere, `.${cls} must be defined in a real stylesheet`).toBe(true);
    }
  });
});
