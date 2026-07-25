// SCR-IPAD accessibility & interaction hardening — reusable helpers for the
// inspector iPad journeys. No design tokens, no business logic: purely
// interaction / assistive-tech utilities that are safe across journeys.

/** Honors the OS "reduce motion" setting; false during SSR / when matchMedia is
 *  unavailable, so callers can default to instant behavior safely. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll an element into view (instant under reduced-motion) AND move keyboard
 *  focus to it, so a "jump to …" action is continuous for keyboard and
 *  screen-reader users, not just a silent scroll. Non-interactive containers are
 *  made programmatically focusable without entering the tab order. */
export function focusAndScrollTo(id: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  (el as HTMLElement).focus({ preventScroll: true });
}

/** Grouped submit blockers (structural mirror of runtime SectionBlockers) —
 *  kept local so this helper stays dependency-free and unit-testable. */
export type BlockerGroup = { key: string; title: string; unanswered: string[]; evidence: string[]; forms: string[] };

/** The first blocking item across grouped blockers, with the section that owns
 *  it, for a "go to the first thing that needs fixing" jump. Pure + testable.
 *  Order within a group mirrors how the summary reads: unanswered → evidence →
 *  forms. Returns null when nothing blocks. */
export function firstBlocker(groups: BlockerGroup[]): { sectionKey: string; code: string } | null {
  for (const g of groups) {
    const code = g.unanswered[0] ?? g.evidence[0] ?? g.forms[0];
    if (code) return { sectionKey: g.key, code };
  }
  return null;
}
