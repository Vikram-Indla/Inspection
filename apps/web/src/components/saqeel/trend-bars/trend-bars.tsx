import { type CSSProperties } from "react";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import styles from "./trend-bars.module.css";

export type TrendPoint = {
  readonly key: string;
  /** Charted height as a percentage of the scale, 0–100. */
  readonly percent: number;
  /** Read out to assistive technology in place of the bar. */
  readonly label: string;
  /** Visible period label printed under the bar. */
  readonly caption?: string;
  /** Visible value printed under the caption, already formatted. */
  readonly value?: string;
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
 *
 * A point at zero renders as a dashed baseline rather than a short bar, because
 * an absence must never read as a small quantity.
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
          <span className={styles.track}>
            <span
              className={styles.bar}
              data-tone={tone}
              data-zero={point.percent === 0 ? "" : undefined}
              style={{ "--sqx-trend-value": String(point.percent) } as BarStyle}
            />
          </span>
          {point.caption ? <Text as="span" role="label" tone="secondary">{point.caption}</Text> : null}
          {point.value ? <Text as="span" role="bodyStrong" numeric>{point.value}</Text> : null}
          <span className="sqx-visually-hidden">{point.label}</span>
        </li>
      ))}
    </ol>
  );
}
