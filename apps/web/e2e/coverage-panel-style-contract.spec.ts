import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// INSP-697 CoveragePanel (Figma SCR-PLN-200 node 433:49148).
//
// The original contract froze this component to the legacy global class
// vocabulary because an integration review returned commit 1365446c for inline
// style={{...}} use. That vocabulary is now the thing being retired: the
// component was migrated onto SAQEEL primitives and a colocated CSS Module
// (WEB-002 §4), so the contract is restated in the terms that replaced it —
// the intent is unchanged and strictly stronger.
//
// What is still forbidden is what the review actually objected to: styling
// invented at the call site. Inline style props and frozen-sheet globals both
// fail that test; a colocated module consuming --sqx-* tokens does not.
const root = path.resolve(__dirname, "..");
const componentFile = "src/app/(app)/visits/map/CoveragePanel.tsx";
const moduleFile = "src/app/(app)/visits/map/coverage-panel.module.css";
const component = fs.readFileSync(path.join(root, componentFile), "utf8");
const stylesheet = fs.readFileSync(path.join(root, moduleFile), "utf8");

// The frozen sheets this component must no longer reach into.
const RETIRED_CLASSES = [
  "sq-grid-2", "stack", "panel", "panel-header", "panel-title", "panel-body",
  "field", "sq-field__label", "select", "sq-btn", "sq-btn--secondary",
  "row", "grow", "sq-link", "field-help", "t-caption", "numeric",
];

test.describe("INSP-697 CoveragePanel style contract", () => {
  test("no inline style props", () => {
    expect(component).not.toMatch(/style=\{\{/);
    expect(component).not.toMatch(/\bstyle=\{[a-zA-Z]/);
  });

  test("no styled-component or CSS-in-JS import", () => {
    expect(component).not.toMatch(/styled-components|@emotion/);
  });

  test("styling comes from the colocated module, not from global classes", () => {
    expect(component).toMatch(/from "\.\/coverage-panel\.module\.css"/);
    const classNameLiterals = [...component.matchAll(/className="([^"]*)"/g)].map(m => m[1]);
    expect(classNameLiterals, "string-literal classNames are global classes by definition").toEqual([]);
  });

  test("the retired global vocabulary is gone", () => {
    for (const cls of RETIRED_CLASSES) {
      expect(component, `.${cls} is a frozen-sheet global and must not return`)
        .not.toMatch(new RegExp(`["\\s]${cls.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["\\s]`));
    }
  });

  test("the module declares no raw visual values — tokens only (WEB-000 §7)", () => {
    expect(stylesheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(stylesheet).not.toMatch(/\b\d+(?:\.\d+)?(?:px|rem)\b/);
    expect(stylesheet).not.toMatch(/\bfont-(?:size|family|weight|style)\b/);
    expect(stylesheet).toMatch(/var\(--sqx-/);
  });
});
