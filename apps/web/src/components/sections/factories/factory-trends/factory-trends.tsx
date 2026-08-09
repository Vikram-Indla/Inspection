import { type CSSProperties } from "react";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-trends.module.css";

export type TrendPoint = {
  readonly key: string;
  readonly value: number;
  readonly label: string;
};

type BarStyle = CSSProperties & Record<"--sqx-trend-value", string>;

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
          <h3 className={styles.title} id="factory-trend-risk">{strings.riskTitle}</h3>
          <p className={styles.summary}>
            <span className={styles.current}>{strings.current} {current}</span>
            {delta ? <StatusPill tone={tone}>{delta}</StatusPill> : null}
          </p>
        </div>

        {series.length === 0 ? (
          <p className={styles.note}>{strings.noHistory}</p>
        ) : (
          <ol className={styles.chart} aria-label={strings.seriesLabel}>
            {series.map(point => (
              <li className={styles.column} key={point.key}>
                <span
                  className={styles.bar}
                  data-tone={tone}
                  style={{ "--sqx-trend-value": String(point.value) } as BarStyle}
                />
                <span className="sqx-visually-hidden">{point.label}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={styles.trend} aria-labelledby="factory-trend-compliance">
        <div className={styles.head}>
          <h3 className={styles.title} id="factory-trend-compliance">{strings.complianceTitle}</h3>
        </div>
        <p className={styles.note}>{strings.complianceUnavailable}</p>
      </section>
    </div>
  );
}
