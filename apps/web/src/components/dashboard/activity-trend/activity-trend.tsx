import { formatCount } from "@/i18n/numbers";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Sparkline, { type SparkPoint } from "@/components/saqeel/charts/sparkline/sparkline";
import { Metric, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import { formatDate, riyadhDayDiff, riyadhToday } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./activity-trend.module.css";

const DAY_MS = 86_400_000;

export type ActivityStrings = {
  readonly aria: string;
  readonly unit: string;
  readonly peak: string;
  readonly unbounded: string;
  readonly emptyTitle: string;
  readonly empty: string;
};

function dailyCounts(occurredAt: readonly string[], from: string, to: string): readonly SparkPoint[] {
  const counts = new Map<string, number>();
  for (const stamp of occurredAt) {
    const day = riyadhToday(stamp);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const span = Math.max(0, riyadhDayDiff(from, to));
  const start = Date.parse(`${from}T00:00:00.000Z`);

  return Array.from({ length: span + 1 }, (_, index) => {
    const key = riyadhToday(start + index * DAY_MS);
    return { key, value: counts.get(key) ?? 0 };
  });
}

/**
 * Governed events per day across the scoped period.
 *
 * A daily series needs a bounded period. An unbounded scope has none, so the
 * card says so rather than inventing a window to plot — the same refusal
 * `queryEnforcementTrend` makes for its period-over-period comparison.
 *
 * Days with no activity are plotted as zero rather than skipped. Dropping them
 * would compress the gaps and turn a quiet fortnight into a smooth line.
 */
export default function ActivityTrend({ occurredAt, from, to, locale, strings }: {
  occurredAt: readonly string[];
  from: string | null;
  to: string | null;
  locale: Locale;
  strings: ActivityStrings;
}) {
  if (!from || !to) return <Text tone="secondary">{strings.unbounded}</Text>;
  if (!occurredAt.length) {
    return <EmptyState icon="radar" title={strings.emptyTitle} description={strings.empty} />;
  }

  const points = dailyCounts(occurredAt, from, to);
  const peak = points.reduce(
    (best, point) => (point.value > best.value ? point : best),
    points[0] ?? { key: from, value: 0 },
  );

  return (
    <div className={styles.root}>
      <div className={styles.figure}>
        <Metric>{formatCount(occurredAt.length, locale)}</Metric>
        <Text role="label" tone="muted">{strings.unit}</Text>
      </div>
      <div className={styles.plot}>
        <Sparkline points={points} ariaLabel={strings.aria} />
        <Text tone="muted">
          {fill(strings.peak, { date: formatDate(peak.key, locale), count: formatCount(peak.value, locale) })}
        </Text>
      </div>
    </div>
  );
}
