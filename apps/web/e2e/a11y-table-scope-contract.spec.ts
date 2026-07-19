import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// WCAG 2.2 — 1.3.1 Info & Relationships (technique H63).
// Static release guard for the design-system data-table pattern:
//   <table className="ax-table"><thead><tr><th>…</th>…</thead>
//   <tbody>…<tr><th scope="row">…</th>…</tr>…</tbody></table>
// Every <th> header cell MUST carry a `scope` attribute so screen readers can
// programmatically associate headers with their data cells (scope="col" for
// column headers in <thead>, scope="row" for the leading row-header cell).
// A <th> with no scope leaves the association ambiguous. This test reads source
// only (no browser) and fails listing any file that regresses.
const srcRoot = path.resolve(__dirname, "..", "src");

// Matches an opening `<th …>` tag (up to its `>`). The negative lookahead keeps
// `<thead>` out of the match; closing `</th>` tags never start with `<th`.
const TH_TAG = /<th(?![a-z])[^>]*>/g;

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

test.describe("A11y table-header scope release guard", () => {
  test("every <th> carries a scope attribute", () => {
    const offenders: string[] = [];
    let totalHeaders = 0;

    for (const file of collectTsx(srcRoot)) {
      const source = fs.readFileSync(file, "utf8");
      const tags = source.match(TH_TAG);
      if (!tags) continue;
      let unscoped = 0;
      for (const tag of tags) {
        totalHeaders += 1;
        if (!/\bscope=/.test(tag)) unscoped += 1;
      }
      if (unscoped > 0) {
        offenders.push(`${path.relative(srcRoot, file)} (${unscoped} without scope)`);
      }
    }

    // Guard the guard: the pattern must actually exist, or the scan is vacuous.
    expect(totalHeaders).toBeGreaterThan(0);
    expect(offenders, `<th> without scope:\n${offenders.join("\n")}`).toEqual([]);
  });
});
