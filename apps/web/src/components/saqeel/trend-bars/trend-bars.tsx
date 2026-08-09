import { type CSSProperties } from "react";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./trend-bars.module.css";

export type TrendPoint = {
  readonly key: string;
  /** Charted height as a percentage of the scale, 0–100. */
  readonly percent: number;
  /** Read out to assistive technology in place of the bar. */
  readonly label: string;
};

type BarStyle = CSSProperties & Record<"--sqx-trend-value", string>;

/**
 * A bar series that is a real list, not a picture: every bar carries a
 * visually-hidden label, so the data is readable without seeing the chart
 * (WEB-003 — a chart gets an accessible alternative).
 *
 * Callers pass an already-scaled `percent`. Deciding the scale is the caller's
 * job because it is a truth question, not a layout one — a series charted
 * against its own maximum exaggerates a flat run, so a governed 0–100 measure
 * should be passed through unchanged.
 */
export default function TrendBars({ points, tone = "neutral", label }: {
  points: readonly TrendPoint[];
  tone?: StatusTone;
  label: string;
}) {
  if (points.length === 0) return null;
  return (
    <ol className={styles.chart} aria-label={label}>
      {points.map(point => (
        <li className={styles.column} key={point.key}>
          <span
            className={styles.bar}
            data-tone={tone}
            style={{ "--sqx-trend-value": String(point.percent) } as BarStyle}
          />
          <span className="sqx-visually-hidden">{point.label}</span>
        </li>
      ))}
    </ol>
  );
}
