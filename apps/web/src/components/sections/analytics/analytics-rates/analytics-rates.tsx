import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Gauge from "@/components/saqeel/charts/gauge/gauge";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { ResolvedMetric } from "@/features/analytics/view";
import Link from "next/link";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import { analyticsDrillHref } from "@/lib/analytics/drills";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-rates.module.css";

const FULL_SCALE = 100;
const HERO_COUNT = 3;

const captionOf = (metric: ResolvedMetric, strings: AnalyticsMessages, locale: Locale): string =>
  metric.numerator !== null && metric.denominator !== null
    ? fill(strings.rates.ofTotal, { numerator: formatCount(metric.numerator, locale), denominator: formatCount(metric.denominator, locale) })
    : metric.definition;

export default function AnalyticsRates({ rates, strings, query, locale }: {
  rates: readonly ResolvedMetric[];
  strings: AnalyticsMessages;
  query: AnalyticsQuery;
  locale: Locale;
}) {
  if (!rates.length) return null;

  const points: BarPoint[] = rates.map(metric => ({
    key: metric.key,
    label: metric.title,
    value: metric.value,
    display: metric.display,
    muted: metric.value === 0,
  }));

  return (
    <Card as="section" labelledBy="analytics-rates">
      <CardHeader
        level="h2"
        titleId="analytics-rates"
        title={strings.rates.heading}
        description={strings.rates.description}
      />
      <CardBody>
        <div className={styles.heroes}>
          {rates.slice(0, HERO_COUNT).map(metric => (
            <Link className={styles.hero} key={metric.key} prefetch={false}
              href={analyticsDrillHref(metric.key, query)} title={metric.definition}
              aria-label={`${metric.title} ${metric.display}`}>
            <Gauge
              percent={metric.value}
              display={metric.display}
              label={metric.title}
              size="sm"
              caption={captionOf(metric, strings, locale)}
              ariaLabel={`${metric.title} ${metric.display} — ${captionOf(metric, strings, locale)}`}
            />
            </Link>
          ))}
        </div>
        <BarSeries points={points} domainMax={FULL_SCALE} ariaLabel={strings.rates.ariaLabel} track />
      </CardBody>
    </Card>
  );
}
