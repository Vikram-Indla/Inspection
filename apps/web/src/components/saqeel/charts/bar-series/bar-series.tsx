"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CHART_SERIES } from "../chart-palette";
import styles from "./bar-series.module.css";

export type BarPoint = {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly display: string;
  readonly muted?: boolean;
};

/**
 * Ranked horizontal bars on one shared axis.
 *
 * Every point must share a unit — that is the whole reason this form beats a
 * row of separate meters. `domainMax` is the caller's decision because the
 * scale is a truth question: a governed 0–100 measure is passed through
 * unchanged rather than charted against its own maximum, which would
 * exaggerate a flat run.
 *
 * One series, so there is no legend and no categorical colour: bars carry the
 * accent, and a point the caller marks `muted` drops to the de-emphasis grey.
 */
export default function BarSeries({ points, domainMax, ariaLabel, barSize }: {
  points: readonly BarPoint[];
  domainMax: number;
  ariaLabel: string;
  barSize?: number;
}) {
  const height = points.length * (barSize ?? 34) + 8;

  return (
    <div className={styles.root} role="img" aria-label={ariaLabel} style={{ blockSize: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...points]} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, domainMax]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={132}
            axisLine={false}
            tickLine={false}
            className={styles.axis}
          />
          <Bar dataKey="value" radius={4} isAnimationActive={false} barSize={16} minPointSize={2}>
            {points.map(point => (
              <Cell key={point.key} fill={point.muted ? "var(--sqx-chart-7)" : CHART_SERIES[1]} />
            ))}
            <LabelList dataKey="display" position="right" className={styles.value} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
