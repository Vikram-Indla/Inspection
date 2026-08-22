import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading } from "@/components/saqeel/type";
import { bandCounts } from "@/features/analytics/groups";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { ResolvedMetric } from "@/features/analytics/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import { analyticsDrillHref } from "@/lib/analytics/drills";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import { isRtl } from "@/i18n/direction";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-counts.module.css";

export default function AnalyticsCounts({ counts, strings, query, locale }: {
  counts: readonly ResolvedMetric[];
  strings: AnalyticsMessages;
  query: AnalyticsQuery;
  locale: Locale;
}) {
  const bands = bandCounts(counts);
  if (!bands.length) return null;

  const pointsOf = (metrics: readonly ResolvedMetric[]): BarPoint[] => metrics.map(metric => ({
    key: metric.key,
    label: metric.title,
    value: metric.value,
    display: formatCount(metric.value, locale),
    muted: metric.value === 0,
    href: analyticsDrillHref(metric.key, query),
    title: metric.definition,
  }));

  return (
    <Card as="section" labelledBy="analytics-counts">
      <CardHeader
        level="h2"
        titleId="analytics-counts"
        title={strings.counts.heading}
      />
      <CardBody>
        {bands.map(band => (
          <section className={styles.band} key={band.group}>
            <Heading level={3} visual="subheading">{strings.counts.groups[band.group]}</Heading>
            <BarSeries
              points={pointsOf(band.metrics)}
              domainMax={band.max}
              ariaLabel={fill(strings.counts.ariaLabel, { group: strings.counts.groups[band.group] })}
              rtl={isRtl(locale)}
              series={2}
            />
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
