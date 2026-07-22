"use client";
// KPI strip, Daily/Weekly aware (TASK-FIELD-KPI-WEEKLY-001, sponsor-owned
// deviation). Renders whichever pre-fetched tile array (daily or weekly)
// matches the shared FieldScopeProvider toggle — no client fetch, both
// scopes are computed server-side in field/page.tsx from the same governed
// rows, just with a wider (7-day) window for weekly.

import type { MetricTile } from "@/lib/field-metric-tile";
import { useFieldScope } from "./FieldScopeProvider";
import styles from "@/app/(app)/field/field-dashboard.module.css";

export default function FieldMetricStrip({ daily, weekly }: { daily: MetricTile[]; weekly: MetricTile[] }) {
  const { scope } = useFieldScope();
  const tiles = scope === "weekly" ? weekly : daily;
  return (
    <div className={styles.metricStrip}>
      {tiles.map((tile, i) => (
        <div className={styles.metric} key={i}>
          <span className={styles.metric__label}>{tile.label}</span>
          {tile.blocked
            ? <span className={styles.metric__blocked}>{tile.valueText}</span>
            : <span className={`${styles.metric__value}${tile.warn ? " " + styles["metric__value--warning"] : ""}`}>{tile.valueText}</span>}
          <span className={styles.metric__delta}>{tile.delta}</span>
        </div>
      ))}
    </div>
  );
}
