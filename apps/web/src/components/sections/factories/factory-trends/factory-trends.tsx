import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import TrendBars from "@/components/saqeel/trend-bars/trend-bars";
import styles from "./factory-trends.module.css";
import { Heading, Text } from "@/components/saqeel/type";

export type TrendPoint = {
  readonly key: string;
  readonly value: number;
  readonly label: string;
};

export type FactoryTrendsStrings = {
  readonly title: string;
  readonly riskTitle: string;
  readonly current: string;
  readonly rising: string;
  readonly falling: string;
  readonly steady: string;
  readonly firstCalculation: string;
  readonly noHistory: string;
  readonly complianceTitle: string;
  readonly complianceUnavailable: string;
  readonly seriesLabel: string;
};

export default function FactoryTrends({ series, current, delta, tone, strings }: {
  series: readonly TrendPoint[];
  current: string;
  delta: string | null;
  tone: StatusTone;
  strings: FactoryTrendsStrings;
}) {
  return (
    <div className={styles.root}>
      <section className={styles.trend} aria-labelledby="factory-trend-risk">
        <div className={styles.head}>
          <Heading level={3} visual="bodyStrong" id="factory-trend-risk">{strings.riskTitle}</Heading>
          <p className={styles.summary}>
            <Text as="span" tone="muted" numeric>{strings.current} {current}</Text>
            {delta ? <StatusPill tone={tone}>{delta}</StatusPill> : null}
          </p>
        </div>

        {series.length === 0 ? (
          <Text tone="muted">{strings.noHistory}</Text>
        ) : (
          <TrendBars
            points={series.map(point => ({ key: point.key, percent: point.value, label: point.label }))}
            tone={tone}
            label={strings.seriesLabel}
          />
        )}
      </section>

      <section className={styles.trend} aria-labelledby="factory-trend-compliance">
        <div className={styles.head}>
          <Heading level={3} visual="bodyStrong" id="factory-trend-compliance">{strings.complianceTitle}</Heading>
        </div>
        <Text tone="muted">{strings.complianceUnavailable}</Text>
      </section>
    </div>
  );
}
