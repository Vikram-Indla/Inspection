import { formatCount } from "@/i18n/numbers";
import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import { SERIES_ROLE } from "@/components/saqeel/charts/chart-palette";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import { makeEnumLabel } from "@/i18n/enum-label";
import { fill } from "@/i18n/messages";
import { isRtl } from "@/i18n/direction";
import type { Locale } from "@/lib/i18n";

export type PipelineStrings = {
  readonly aria: string;
  readonly total: string;
  /** Omit both to render nothing at all rather than an empty state. */
  readonly emptyTitle?: string;
  readonly empty?: string;
};

export type PipelineSlice = {
  readonly label: string;
  readonly value: number;
};

/**
 * The planning-status split behind the pipeline total.
 *
 * Bars are scaled against the largest status rather than the total, because the
 * question the reader brings is which queue is deepest, not what fraction of a
 * whole each one holds. The total is printed underneath so the parts are still
 * anchored to something.
 *
 * One colour: the statuses are ranked, not categorised, so no series colour is
 * spent and the chart stays correct for however many statuses exist.
 */
export default function PipelineBreakdown({ slices, total, locale, strings }: {
  slices: readonly PipelineSlice[];
  total: number;
  locale: Locale;
  strings: PipelineStrings;
}) {
  const enumLabel = makeEnumLabel(locale);
  const ranked = [...slices]
    .filter(slice => slice.value > 0)
    .sort((first, second) => second.value - first.value);

  if (!ranked.length) {
    return strings.emptyTitle
      ? <EmptyState icon="visits" title={strings.emptyTitle} description={strings.empty} />
      : null;
  }

  const points: readonly BarPoint[] = ranked.map(slice => ({
    key: slice.label,
    label: enumLabel(slice.label),
    value: slice.value,
    display: formatCount(slice.value, locale),
  }));

  return (
    <>
      <BarSeries
        points={points}
        domainMax={Math.max(...ranked.map(slice => slice.value), 1)}
        ariaLabel={strings.aria}
        series={SERIES_ROLE.volume}
        rtl={isRtl(locale)}
      />
      <Text tone="muted">{fill(strings.total, { total: formatCount(total, locale) })}</Text>
    </>
  );
}
