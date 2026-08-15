import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import { bandCounts } from "@/features/analytics/groups";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { ResolvedMetric } from "@/features/analytics/view";
import { fill } from "@/i18n/messages";
import { analyticsDrillHref } from "@/lib/analytics/drills";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import styles from "./analytics-counts.module.css";

const ZERO_STUB = 1.5;

const share = (metric: ResolvedMetric, max: number): number =>
  max > 0 && metric.value > 0 ? Math.max(ZERO_STUB, (metric.value / max) * 100) : ZERO_STUB;

export default function AnalyticsCounts({ counts, strings, query }: {
  counts: readonly ResolvedMetric[];
  strings: AnalyticsMessages;
  query: AnalyticsQuery;
}) {
  const bands = bandCounts(counts);
  if (!bands.length) return null;

  return (
    <Card as="section" labelledBy="analytics-counts">
      <CardHeader
        level="h2"
        titleId="analytics-counts"
        title={strings.counts.heading}
        description={strings.counts.description}
      />
      <CardBody>
        {bands.map(band => (
          <section className={styles.band} key={band.group}>
            <Heading level={3} visual="subheading">{strings.counts.groups[band.group]}</Heading>
            <ul
              className={styles.rows}
              aria-label={fill(strings.counts.ariaLabel, { group: strings.counts.groups[band.group] })}
            >
              {band.metrics.map(metric => (
                <li key={metric.key}>
                  <Link
                    className={styles.row}
                    href={analyticsDrillHref(metric.key, query)}
                    prefetch={false}
                    title={metric.definition}
                    aria-label={`${metric.title} ${metric.display}`}
                  >
                    <Text as="span" role="label" tone="secondary">{metric.title}</Text>
                    <span className={styles.track}>
                      <span
                        className={styles.fill}
                        data-zero={metric.value === 0 ? "" : undefined}
                        style={{ inlineSize: `${share(metric, band.max)}%` }}
                      />
                    </span>
                    <Text as="span" role="label" numeric>{metric.display}</Text>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
