"use client";

import { Area, AreaChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CHART_SERIES } from "../chart-palette";
import styles from "./sparkline.module.css";

export type SparkPoint = {
  readonly key: string;
  readonly value: number;
};

/**
 * A single measure over time, drawn small and without axes.
 *
 * One series, so it takes one colour and carries no legend — the card title
 * names it. The plot is decorative in the strict sense: it is marked
 * `aria-hidden` and the figure's own caption carries the total and the peak, so
 * a reader who never sees the line loses nothing. That is the only honest way
 * to ship a chart with no axis labels.
 *
 * The final point is marked, because the end of a trend is the part a reader
 * is looking for and it is otherwise indistinguishable from the line.
 */
export default function Sparkline({ points, ariaLabel, size = "md" }: {
  points: readonly SparkPoint[];
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  const last = points[points.length - 1];
  const peak = Math.max(...points.map(point => point.value), 1);

  return (
    <div className={styles.root} data-size={size} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...points]} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sqx-spark-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_SERIES[0]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_SERIES[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis type="category" dataKey="key" hide />
          <YAxis type="number" domain={[0, peak]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_SERIES[0]}
            strokeWidth={2}
            fill="url(#sqx-spark-fade)"
            isAnimationActive={false}
            dot={false}
          />
          {last ? (
            <ReferenceDot
              x={last.key}
              y={last.value}
              r={3.5}
              fill={CHART_SERIES[0]}
              stroke="var(--sqx-surface-raised)"
              strokeWidth={2}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
