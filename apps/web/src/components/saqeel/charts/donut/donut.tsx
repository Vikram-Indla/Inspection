"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Text } from "@/components/saqeel/type";
import { CHART_TRACK, seriesColour } from "../chart-palette";
import styles from "./donut.module.css";

export type DonutSlice = {
  readonly key: string;
  readonly label: string;
  readonly value: number;
};

/**
 * A part-to-whole donut for three or fewer categories.
 *
 * Recharts draws the arcs; the readable copy is a real list beside it, so the
 * data survives without the picture (WEB-003). Colour is never the only
 * channel — every slice is named and counted in the legend.
 *
 * Two slices is not a donut, it is a meter. Use `Gauge` for a single ratio.
 */
export default function Donut({ slices, total, ariaLabel, size = "md" }: {
  slices: readonly DonutSlice[];
  total: string;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
}) {
  const drawn = slices.filter(slice => slice.value > 0);

  return (
    <div className={styles.root}>
      <div className={styles.plot} data-size={size} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={drawn.length ? [...drawn] : [{ key: "empty", label: total, value: 1 }]}
              dataKey="value"
              nameKey="label"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={drawn.length > 1 ? 2 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {(drawn.length ? drawn : [{ key: "empty" }]).map((slice, index) => (
                <Cell key={slice.key} fill={drawn.length ? seriesColour(index) : CHART_TRACK} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className={styles.centre}>
          <Text as="span" role="bodyStrong" numeric>{total}</Text>
        </span>
      </div>

      <ul className={styles.legend}>
        {slices.map((slice, index) => (
          <li className={styles.item} key={slice.key}>
            <span className={styles.swatch} style={{ background: seriesColour(index) }} aria-hidden="true" />
            <Text as="span" role="label">{slice.label}</Text>
            <Text as="span" role="label" tone="muted" numeric>{slice.value}</Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
