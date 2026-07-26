"use client";

import { useState } from "react";
import styles from "@/app/(app)/field/field-home.module.css";

type MetricSet = {
  inspections: number;
  followUp: number;
  highRisk: number;
  remaining: number;
};

type Strings = {
  mission: string;
  returned: string;
  drafts: string;
  daily: string;
  weekly: string;
  inspections: string;
  followUp: string;
  highRisk: string;
  remaining: string;
  assigned: string;
  requiresAttention: string;
  stillOpen: string;
  progress: string;
};

export default function FieldMetricStrip({
  daily,
  weekly,
  returned,
  drafts,
  strings,
}: {
  daily: MetricSet;
  weekly: MetricSet;
  returned: number;
  drafts: number;
  strings: Strings;
}) {
  const [scope, setScope] = useState<"daily" | "weekly">("daily");
  const metrics = scope === "daily" ? daily : weekly;

  return (
    <section className={`${styles.card} ${styles.missionCard}`} aria-label={strings.mission}>
      <div className={styles.missionRail}>
        <span className={styles.missionText}>
          {strings.mission.replace("{n}", String(metrics.followUp + metrics.highRisk))}
        </span>
        <span className="grow" />
        <span className="exc-chip exc-warning"><span className="exc-mark" />{returned} {strings.returned}</span>
        <span className="exc-chip exc-pending"><span className="exc-mark" />{drafts} {strings.drafts}</span>
        <div className="seg">
          <button className="seg-opt" type="button" aria-pressed={scope === "daily"} onClick={() => setScope("daily")}>{strings.daily}</button>
          <button className="seg-opt" type="button" aria-pressed={scope === "weekly"} onClick={() => setScope("weekly")}>{strings.weekly}</button>
        </div>
      </div>
      <div className={styles.metricGrid}>
        {[
          [metrics.inspections, strings.inspections, strings.assigned, false],
          [metrics.followUp, strings.followUp, strings.stillOpen, false],
          [metrics.highRisk, strings.highRisk, strings.requiresAttention, true],
          [metrics.remaining, strings.remaining, strings.progress, false],
        ].map(([value, label, delta, warning], index) => (
          <div className={styles.metricCell} key={String(label)}>
            <div className="id-code" style={warning ? { color: "var(--status-warning-text)" } : undefined}>{value}</div>
            <div>{label}</div>
            <div className="t-caption">{delta}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
