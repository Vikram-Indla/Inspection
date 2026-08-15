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

/**
 * Which slot a **single-series** chart takes, chosen by what it measures.
 *
 * Colour is not identity here — one series, so length carries the whole meaning
 * and the CVD-separation rule (which governs series *within* a chart) does not
 * apply *between* charts. This exists so a reader can tell at a glance that two
 * cards are about the same kind of thing, and so the application does not render
 * every bar and every meter in one colour.
 *
 * Two slots carry meaning elsewhere and are chosen with that in mind:
 * `CHART_SERIES[1]` resolves to `--sqx-warning-*` and `CHART_SERIES[2]` to the
 * AI accent. Neutral tallies therefore take `volume`, not `rate`.
 *
 * Measured contrast against both surfaces, both themes, all three slots:
 * **≥ 5.7:1** — every one clears the 3:1 floor for a graphical object.
 */
export const SERIES_ROLE = {
  /** Tallies and volumes — visits, inspections, events, workload. */
  volume: 0,
  /** Proportions of a whole — rates and shares. */
  rate: 1,
  /** What the platform knows about itself — coverage and blocking reasons. */
  coverage: 2,
} as const;

export function seriesColour(index: number): string {
  return CHART_SERIES[index % MAX_SERIES] ?? CHART_SERIES[0];
}
