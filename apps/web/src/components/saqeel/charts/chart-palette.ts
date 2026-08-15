/**
 * The categorical series order for every Saqeel chart.
 *
 * Three slots, not eight. `--sqx-chart-1…8` exist, but slots 4, 5 and 6 sit at
 * ΔE 3.0 under deuteranopia and ΔE 5.1 to normal vision — indistinguishable to
 * every reader. Slots 2, 4 and 3 are the widest-separated trio the palette
 * offers and clear every check in both themes (light ΔE 16.0 normal / 12.4
 * protan; dark 20.8 / 18.1).
 *
 * A fourth category is never a fourth colour. Fold the tail into a rest slot,
 * or facet. Widening this list is a token change request, not a code edit.
 */
export const CHART_SERIES = [
  "var(--sqx-chart-2)",
  "var(--sqx-chart-4)",
  "var(--sqx-chart-3)",
] as const;

/** The unfilled remainder of a meter, gauge or waffle — never a category. */
export const CHART_TRACK = "var(--sqx-surface-sunken)";

export const CHART_GRID = "var(--sqx-chart-grid)";
export const CHART_AXIS = "var(--sqx-chart-axis)";

export const MAX_SERIES = CHART_SERIES.length;

export function seriesColour(index: number): string {
  return CHART_SERIES[index % MAX_SERIES] ?? CHART_SERIES[0];
}
