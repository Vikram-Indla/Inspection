import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Donut from "@/components/saqeel/charts/donut/donut";
import { Text } from "@/components/saqeel/type";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { ResolvedMetric } from "@/features/analytics/view";
import { makeEnumLabel } from "@/i18n/enum-label";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-breakdowns.module.css";

const totalOf = (metric: ResolvedMetric): number =>
  metric.breakdown.reduce((sum, [, value]) => sum + value, 0);

export default function AnalyticsBreakdowns({ breakdowns, strings, locale }: {
  breakdowns: readonly ResolvedMetric[];
  strings: AnalyticsMessages;
  locale: Locale;
}) {
  if (!breakdowns.length) return null;
  const governed = makeEnumLabel(locale);
  const labels: Readonly<Record<string, string>> = strings.breakdown.labels;
  const enumLabel = (value: string) => labels[value] ?? governed(value);

  return (
    <Card as="section" labelledBy="analytics-breakdowns">
      <CardHeader
        level="h2"
        titleId="analytics-breakdowns"
        title={strings.breakdown.heading}
        description={strings.breakdown.description}
      />
      <CardBody>
        <div className={styles.grid}>
          {breakdowns.map(metric => {
            const total = totalOf(metric);
            const summary = metric.breakdown.map(([label, value]) => `${enumLabel(label)} ${value}`).join(", ");
            return (
              <figure className={styles.item} key={metric.key}>
                <figcaption className={styles.head}>
                  <Text as="span" role="bodyStrong">{metric.title}</Text>
                </figcaption>
                <Donut
                  total={total.toLocaleString(locale)}
                  ariaLabel={fill(strings.breakdown.ariaLabel, { metric: metric.title, summary })}
                  slices={metric.breakdown.map(([label, value]) => ({ key: label, label: enumLabel(label), value }))}
                />
              </figure>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
