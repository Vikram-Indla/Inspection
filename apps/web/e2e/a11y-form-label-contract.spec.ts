import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// WCAG 2.2 — 1.3.1 Info & Relationships + 4.1.2 Name, Role, Value.
// Static release guard for the design-system form-field pattern:
//   <div className="ax-field"><label className="ax-field__label">…</label><CONTROL/></div>
// Every ax-field__label MUST be programmatically associated with its control:
//   - the common case: htmlFor matching an id on the input/select/textarea; OR
//   - the group case: the label carries an id that a role="radiogroup"/group
//     references via aria-labelledby (a radiogroup is not a labelable element,
//     so htmlFor does not apply — e.g. PackageTypeSelector's imm-package-label).
// A sibling <label> with neither is invisible to screen readers. This test reads
// source only (no browser) and fails listing any file that regresses.
const srcRoot = path.resolve(__dirname, "..", "src");

// Matches an opening `<label className="ax-field__label" …>` tag (up to its `>`).
const LABEL_TAG = /<label className="ax-field__label"[^>]*>/g;

function collectTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...collectTsx(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

test.describe("A11y form-label association release guard", () => {
  test("every ax-field__label is associated with its control via htmlFor", () => {
    const offenders: string[] = [];
    let totalLabels = 0;

    for (const file of collectTsx(srcRoot)) {
      const source = fs.readFileSync(file, "utf8");
      const tags = source.match(LABEL_TAG);
      if (!tags) continue;
      let unassociated = 0;
      for (const tag of tags) {
        totalLabels += 1;
        if (tag.includes("htmlFor")) continue;
        // Group-labeling fallback: the label carries an id that is consumed as a
        // labelling reference in the same file — either directly via
        // aria-labelledby="id" on a role="group"/"radiogroup", or forwarded to a
        // component through a labelledBy="id" prop that sets aria-labelledby
        // internally (e.g. PackageTypeSelector's imm-package-label radiogroup).
        const idMatch = tag.match(/\bid="([^"]+)"/);
        if (idMatch && (source.includes(`aria-labelledby="${idMatch[1]}"`) || source.includes(`labelledBy="${idMatch[1]}"`))) continue;
        unassociated += 1;
      }
      if (unassociated > 0) {
        offenders.push(`${path.relative(srcRoot, file)} (${unassociated} unassociated)`);
      }
    }

    // Guard the guard: the pattern must actually exist, or the scan is vacuous.
    expect(totalLabels).toBeGreaterThan(0);
    expect(offenders, `ax-field__label without htmlFor:\n${offenders.join("\n")}`).toEqual([]);
  });
});
