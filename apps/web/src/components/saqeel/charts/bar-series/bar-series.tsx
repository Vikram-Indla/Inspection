"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/components/saqeel/primitives/use-media-query";
import { CHART_TRACK, seriesColour } from "../chart-palette";
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

type ValueProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: string | number;
};

const VALUE_GAP = 6;

/**
 * The count at the growing tip of its bar.
 *
 * Hand-placed because Recharts resolves `LabelList position` against the bar's
 * own origin, and a `reversed` axis moves that origin to the **base** — so
 * `"left"` and `"right"` both land there, on top of the axis labels.
 *
 * Measured rather than reasoned about: under `reversed`, Recharts keeps `x` at
 * the base and makes `width` **negative**. `x + width` is therefore the growing
 * tip in both directions, and only the gap and the anchor flip.
 */
function ValueLabel({ x = 0, y = 0, width = 0, height = 0, value, rtl = false }: ValueProps & { rtl?: boolean }) {
  const tip = x + width;
  return (
    <text
      className={styles.value}
      x={rtl ? tip - VALUE_GAP : tip + VALUE_GAP}
      y={y + height / 2}
      textAnchor={rtl ? "end" : "start"}
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
}

function wrapLabel(label: string): readonly string[] {
  return label.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= LINE_CHARS) {
      return [...lines.slice(0, -1), `${last} ${word}`];
    }
    return [...lines, word];
  }, []);
}

function AxisLabel({ x = 0, y = 0, index = 0, points, rtl = false }: TickProps & {
  points: readonly BarPoint[];
  rtl?: boolean;
}) {
  const point = points[index];
  if (!point) return null;
  const lines = wrapLabel(point.label);
  const top = y - ((lines.length - 1) * LINE_HEIGHT) / 2;
  const text = (
    <text
      className={styles.tick}
      x={x}
      y={top}
      textAnchor={rtl ? "start" : "end"}
      dominantBaseline="middle"
    >
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
export default function BarSeries({ points, domainMax, ariaLabel, barSize, labelWidth, series = 1, track = false, rtl = false }: {
  points: readonly BarPoint[];
  domainMax: number;
  ariaLabel: string;
  barSize?: number;
  labelWidth?: number;
  /** Which validated slot the bars take. Slots are fixed, never cycled. */
  series?: number;
  /**
   * Draws the unfilled remainder of the domain behind each bar.
   *
   * Set this whenever `domainMax` is a fixed scale rather than the data's own
   * maximum — a governed 0–100 rate, say. Without it the leftover scale reads as
   * empty layout, which invites the fix that would actually be a lie: rescaling
   * to the largest value, so a third of the scale draws as a full bar.
   */
  track?: boolean;
  /**
   * Mirrors the whole plot for a right-to-left reader: category labels move to
   * the right edge, bars grow leftwards from there, and the value sits at the
   * left end of each bar.
   *
   * Recharts has no writing-mode support, so this cannot come from CSS — the
   * axis side, the numeric direction and the label position are all separate
   * props and every one of them has to flip together. The caller passes it
   * because only the caller knows the locale.
   */
  rtl?: boolean;
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
        <BarChart
          data={[...points]}
          layout="vertical"
          margin={{ top: 0, right: rtl ? 0 : 44, bottom: 0, left: rtl ? 44 : 0 }}
        >
          <XAxis type="number" domain={[0, domainMax]} hide reversed={rtl} />
          <YAxis
            type="category"
            dataKey="label"
            width={labels}
            orientation={rtl ? "right" : "left"}
            axisLine={false}
            tickLine={false}
            className={styles.axis}
            tick={<AxisLabel points={points} rtl={rtl} />}
          />
          <Bar
            dataKey="value"
            radius={4}
            isAnimationActive={false}
            barSize={16}
            minPointSize={2}
            background={track ? { fill: CHART_TRACK, radius: 4 } : undefined}
          >
            {points.map(point => (
              <Cell key={point.key} fill={point.muted ? "var(--sqx-chart-7)" : seriesColour(series)} />
            ))}
            <LabelList dataKey="display" content={<ValueLabel rtl={rtl} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
