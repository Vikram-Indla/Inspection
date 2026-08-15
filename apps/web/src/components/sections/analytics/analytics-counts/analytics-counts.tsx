import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Metric, Text } from "@/components/saqeel/type";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { ResolvedMetric } from "@/features/analytics/view";
import { analyticsDrillHref } from "@/lib/analytics/drills";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import styles from "./analytics-counts.module.css";

export default function AnalyticsCounts({ counts, strings, query }: {
  counts: readonly ResolvedMetric[];
  strings: AnalyticsMessages;
  query: AnalyticsQuery;
}) {
  if (!counts.length) return null;

  return (
    <Card as="section" labelledBy="analytics-counts">
      <CardHeader
        level="h2"
        titleId="analytics-counts"
        title={strings.counts.heading}
        description={strings.counts.description}
      />
      <CardBody>
        <ul className={styles.grid}>
          {counts.map(metric => (
            <li key={metric.key}>
              <Link className={styles.tile} href={analyticsDrillHref(metric.key, query)} prefetch={false}
                title={metric.definition}>
                <Text as="span" role="label" tone="secondary">{metric.title}</Text>
                <Metric>{metric.display}</Metric>
                <Text as="span" role="label" tone="muted">{metric.trace}</Text>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
