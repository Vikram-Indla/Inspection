import { Text } from "@/components/experimental/linear";
import { EmptyBlock } from "@/components/experimental/linear-data";
import { BarSeries, TrendBars, type BarPoint, type TrendPoint } from "@/components/experimental/linear-charts/charts";
import { makeEnumLabel } from "@/i18n/enum-label";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import { formatDate, riyadhDayDiff, riyadhToday } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const DAY_MS = 86_400_000;

export type PipelineSlice = {
  readonly label: string;
  readonly value: number;
};

export type PipelineStrings = {
  readonly aria: string;
  readonly total: string;
  readonly emptyTitle?: string;
  readonly empty?: string;
};

export type ActivityStrings = {
  readonly aria: string;
  readonly unit: string;
  readonly peak: string;
  readonly unbounded: string;
  readonly emptyTitle: string;
  readonly empty: string;
};

export function PipelineBreakdown({ slices, total, locale, strings }: {
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
      ? <EmptyBlock title={strings.emptyTitle} description={strings.empty} />
      : null;
  }

  const peak = Math.max(...ranked.map(slice => slice.value), 1);
  const points: readonly BarPoint[] = ranked.map(slice => ({
    label: enumLabel(slice.label),
    percent: (slice.value / peak) * 100,
    display: formatCount(slice.value, locale),
  }));

  return (
    <>
      <BarSeries label={strings.aria} points={points} />
      <Text role="caption" tone="muted" numeric>
        {fill(strings.total, { total: formatCount(total, locale) })}
      </Text>
    </>
  );
}

export function ActivityTrend({ occurredAt, from, to, locale, strings }: {
  occurredAt: readonly string[];
  from: string | null;
  to: string | null;
  locale: Locale;
  strings: ActivityStrings;
}) {
  if (!from || !to) return <Text role="caption" tone="muted">{strings.unbounded}</Text>;

  const counts = new Map<string, number>();
  for (const stamp of occurredAt) {
    const day = riyadhToday(stamp);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const span = Math.max(0, riyadhDayDiff(from, to));
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const days = Array.from({ length: span + 1 }, (_, index) => {
    const key = riyadhToday(start + index * DAY_MS);
    return { key, value: counts.get(key) ?? 0 };
  });

  const peak = Math.max(...days.map(day => day.value), 0);
  if (peak === 0) return <EmptyBlock title={strings.emptyTitle} description={strings.empty} />;

  const points: readonly TrendPoint[] = days.map(day => ({
    label: formatDate(day.key, locale),
    percent: (day.value / peak) * 100,
    display: `${formatCount(day.value, locale)} ${strings.unit}`,
  }));

  return (
    <>
      <TrendBars label={strings.aria} points={points} tone={2} />
      <Text role="caption" tone="muted" numeric>
        {fill(strings.peak, { count: formatCount(peak, locale) })}
      </Text>
    </>
  );
}
