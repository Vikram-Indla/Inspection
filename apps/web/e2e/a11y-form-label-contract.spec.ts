import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// WCAG 2.2 — 1.3.1 Info & Relationships + 4.1.2 Name, Role, Value.
// Static release guard for the design-system form-field pattern:
//   <div className="ax-field"><label className="ax-field__label">…</label><CONTROL/></div>
// Every ax-field__label MUST be programmatically associated with its control via
// htmlFor (matching an id on the input/select/textarea it describes). A sibling
// <label> with no htmlFor is invisible to screen readers. This test reads source
// only (no browser) and fails listing any file that regresses.
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
        if (!tag.includes("htmlFor")) unassociated += 1;
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
