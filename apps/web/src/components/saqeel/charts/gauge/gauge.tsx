"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Text } from "@/components/saqeel/type";
import { CHART_SERIES, CHART_TRACK } from "../chart-palette";
import styles from "./gauge.module.css";

/**
 * A single governed ratio drawn as a filled arc against its own track.
 *
 * This is a meter bent into a circle, not a two-slice pie: the track is the
 * remainder, never a second category, so it takes no series colour and no
 * legend entry. `caption` carries the numerator and denominator, because the
 * percentage alone hides whether it came from 3 records or 3,000.
 */
export default function Gauge({ percent, display, label, caption, ariaLabel, size = "md" }: {
  percent: number;
  display: string;
  label: string;
  caption: string;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
}) {
  const filled = Math.max(0, Math.min(100, percent));
  const data = [{ key: "filled", value: filled }, { key: "track", value: 100 - filled }];

  return (
    <figure className={styles.root}>
      <div className={styles.plot} data-size={size} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={CHART_SERIES[1]} />
              <Cell fill={CHART_TRACK} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className={styles.centre}>
          <Text as="span" role="bodyStrong" numeric>{display}</Text>
        </span>
      </div>
      <figcaption className={styles.caption}>
        <Text as="span" role="label">{label}</Text>
        <Text as="span" role="label" tone="muted">{caption}</Text>
      </figcaption>
    </figure>
  );
}
