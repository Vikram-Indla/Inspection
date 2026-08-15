"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/components/saqeel/primitives/use-media-query";
import { CHART_SERIES } from "../chart-palette";
import styles from "./bar-series.module.css";

const WIDE_LABEL = 132;
const NARROW_LABEL = 120;
const LINE_CHARS = 17;
const LINE_HEIGHT = 12;

export type BarPoint = {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly display: string;
  readonly muted?: boolean;
  /**
   * Makes the axis label a link. An SVG anchor takes keyboard focus, so a
   * chart can carry drill-through without the target being mouse-only.
   */
  readonly href?: string;
  readonly title?: string;
};

type TickProps = {
  x?: number;
  y?: number;
  index?: number;
};

function wrapLabel(label: string): readonly string[] {
  return label.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= LINE_CHARS) {
      return [...lines.slice(0, -1), `${last} ${word}`];
    }
    return [...lines, word];
  }, []);
}

function AxisLabel({ x = 0, y = 0, index = 0, points }: TickProps & { points: readonly BarPoint[] }) {
  const point = points[index];
  if (!point) return null;
  const lines = wrapLabel(point.label);
  const top = y - ((lines.length - 1) * LINE_HEIGHT) / 2;
  const text = (
    <text className={styles.tick} x={x} y={top} textAnchor="end" dominantBaseline="middle">
      {lines.map((line, row) => (
        <tspan key={line} x={x} dy={row === 0 ? 0 : LINE_HEIGHT}>{line}</tspan>
      ))}
    </text>
  );
  if (!point.href) return text;
  return (
    <a className={styles.tickLink} href={point.href} aria-label={`${point.label} ${point.display}`}>
      {point.title ? <title>{point.title}</title> : null}
      {text}
    </a>
  );
}

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
export default function BarSeries({ points, domainMax, ariaLabel, barSize, labelWidth }: {
  points: readonly BarPoint[];
  domainMax: number;
  ariaLabel: string;
  barSize?: number;
  labelWidth?: number;
}) {
  const roomy = useMediaQuery("(min-width: 48rem)");
  const labels = labelWidth ?? (roomy ? WIDE_LABEL : NARROW_LABEL);
  const height = points.length * (barSize ?? 38) + 8;
  const linked = points.some(point => point.href);

  return (
    <div
      className={styles.root}
      role={linked ? undefined : "img"}
      aria-label={linked ? undefined : ariaLabel}
      style={{ blockSize: `${height}px` }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...points]} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, domainMax]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={labels}
            axisLine={false}
            tickLine={false}
            className={styles.axis}
            tick={<AxisLabel points={points} />}
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
