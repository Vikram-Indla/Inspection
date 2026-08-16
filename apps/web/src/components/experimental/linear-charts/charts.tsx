import type { CSSProperties } from "react";
import { Text } from "@/components/experimental/linear";
import styles from "./charts.module.css";

export type ChartTone = 1 | 2 | 3;

export type BarPoint = {
  label: string;
  percent: number;
  display: string;
};

export type TrendPoint = {
  label: string;
  percent: number;
  display: string;
};

const toneClass = { 1: "", 2: styles.tone2, 3: styles.tone3 } as const;

const cssPercent = (name: string, percent: number): CSSProperties =>
  ({ [name]: Math.max(0, Math.min(100, percent)) } as CSSProperties);

export function Gauge({ label, percent, display, tone = 1 }: {
  label: string;
  percent: number;
  display: string;
  tone?: ChartTone;
}) {
  return (
    <div className={`${styles.gauge} ${toneClass[tone]}`}>
      <div className={styles.gaugeHead}>
        <Text role="caption" tone="muted" as="span">{label}</Text>
        <Text role="caption" tone="strong" weight="medium" as="span" numeric>{display}</Text>
      </div>
      <div className={styles.gaugeTrack} role="img" aria-label={`${label}: ${display}`}>
        <div className={styles.gaugeFill} style={cssPercent("--lnr-gauge-percent", percent)} />
      </div>
    </div>
  );
}

export function BarSeries({ label, points, tone = 1 }: {
  label: string;
  points: readonly BarPoint[];
  tone?: ChartTone;
}) {
  return (
    <ol className={`${styles.series} ${toneClass[tone]}`} aria-label={label}>
      {points.map(point => (
        <li className={styles.row} key={point.label}>
          <Text role="caption" tone="muted" as="span">{point.label}</Text>
          <Text role="caption" tone="strong" weight="medium" as="span" numeric>{point.display}</Text>
          <div className={styles.rowTrack}>
            <div className={styles.rowFill} style={cssPercent("--lnr-bar-percent", point.percent)} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TrendBars({ label, points, tone = 1 }: {
  label: string;
  points: readonly TrendPoint[];
  tone?: ChartTone;
}) {
  return (
    <ol className={`${styles.trend} ${toneClass[tone]}`} aria-label={label}>
      {points.map(point => (
        <li
          className={styles.trendBar}
          key={point.label}
          style={cssPercent("--lnr-trend-percent", point.percent)}
        >
          <span className={styles.visuallyHidden}>{`${point.label}: ${point.display}`}</span>
        </li>
      ))}
    </ol>
  );
}

export function BarCell({ display, percent, muted = false }: {
  display: string;
  percent: number;
  muted?: boolean;
}) {
  return (
    <span className={`${styles.cell} ${muted ? styles.cellMuted : ""}`}>
      <Text role="caption" as="span" numeric>{display}</Text>
      <span className={styles.cellTrack} aria-hidden="true">
        <span className={styles.cellFill} style={cssPercent("--lnr-bar-percent", percent)} />
      </span>
    </span>
  );
}
