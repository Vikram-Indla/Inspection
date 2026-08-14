import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { NodeResult, Result } from "axe-core";

export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// axe reports "incomplete" for checks it cannot settle statically. Those are not
// passes — each has to be resolved by hand, and the ones that can NEVER be
// resolved are recorded here so a new incomplete stands out instead of being
// lost in known noise. A genuine failure of either rule below still arrives as a
// violation, not an incomplete, so recording these does not blind the suite.
//
// Add nothing here without the measurement in the session record that adds it.
type ResolvedIncomplete = {
  readonly rule: string;
  readonly holds: (node: NodeResult) => boolean;
};

const RESOLVED: readonly ResolvedIncomplete[] = [
  {
    // The MenuSurface panel is portalled and mounts only while open, so at scan
    // time the aria-controls target genuinely does not exist. Measured on the
    // live shell (T-106): idExistsWhenClosed=false, idExistsWhenOpen=true. That
    // is the correct contract for aria-haspopup plus a lazily-mounted popup, and
    // it applies to every MenuSurface consumer in the application.
    rule: "aria-valid-attr-value",
    holds: node => node.html.includes("aria-haspopup") && node.html.includes("aria-controls"),
  },
  {
    // A badge that sits on top of the control it counts leaves axe unable to
    // sample the backdrop, so it cannot compute a ratio either way. Measured by
    // hand (T-106): rgb(255,172,130) on rgb(58,36,35) is 7.88:1, clearing AA
    // (4.5) and AAA (7). Scoped to the obscured-backdrop message so an ordinary
    // low-contrast finding is never swallowed.
    rule: "color-contrast",
    holds: node => [...node.any, ...node.all, ...node.none]
      .some(check => check.message.includes("could not be determined")),
  },
];

function isResolved(result: Result): boolean {
  const entry = RESOLVED.find(candidate => candidate.rule === result.id);
  return entry ? result.nodes.every(entry.holds) : false;
}

export type AxeScan = {
  violations: readonly Result[];
  unresolvedIncomplete: readonly Result[];
};

/**
 * Run axe over the page, or over `selector` when given, and split the result
 * into outright violations and incompletes that are not already accounted for.
 *
 * Assert on both. Asserting only on violations is what let the shell carry
 * seven duplicated `aria-labelledby` targets while every axe run in the suite
 * reported zero failures (T-106).
 */
export async function scanAxe(page: Page, selector?: string): Promise<AxeScan> {
  const base = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  const results = await (selector ? base.include(selector) : base).analyze();
  return {
    violations: results.violations,
    unresolvedIncomplete: results.incomplete.filter(result => !isResolved(result)),
  };
}
