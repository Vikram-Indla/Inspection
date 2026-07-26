"use client";
// SAQEEL Field Dashboard.dc.html — SECTION 1, rebuilt from the design's own
// composition rather than patched.
//
// The design renders the mission line, the returned / draft-to-resume exception
// chips, the Daily/Weekly segmented control AND the four metrics inside ONE
// .fd-card split by a single rule. This route previously drew a mission card
// and a metric card as two separate surfaces; that was the structural miss the
// Product Owner reported. This component is that one card.
//
// Scope is the SHARED FieldScopeProvider scope, so the Daily/Weekly control
// here also drives the AI Daily Brief below it, exactly as the design's
// `briefRange` state drives both `brief.*` and `briefMissionText`.
//
// ZERO-ASSUMPTION: every number arrives pre-computed from governed, RLS-scoped
// rows. The design's 4th daily metric ("Est. Finish Time", a 4:45 PM clock)
// has no governed input on this platform — no shift-end, no per-inspection
// duration standard, no travel-time provider, and nothing in
// REQUIREMENT_BASELINE.csv defines one (CR-099 Inspector Dashboard says only
// "Dashboard displays inspector-specific information only"). The slot is kept,
// the label is kept, and the VALUE renders the governed empty state. An
// invented ETA on an inspector's dashboard is exactly the class of lie this
// platform bans.

import { useFieldScope } from "./FieldScopeProvider";
import styles from "@/app/(app)/field/field-home.module.css";

/** One scope's governed counts. `completionPct` is submitted ÷ assigned. */
export type FieldScopeStat = {
  inspections: number;
  followUp: number;
  highRisk: number;
  remaining: number;
  completionPct: number;
};

export type FieldMetricStripStrings = {
  /** "{n} visits remaining today" / "…this week" */
  missionDaily: string;
  missionWeekly: string;
  returned: string;
  drafts: string;
  daily: string;
  weekly: string;
  scopeAria: string;
  stripAria: string;
  labelInspections: string;
  labelFollowUp: string;
  labelHighRisk: string;
  labelFinish: string;
  labelCompletion: string;
  capAssignedDaily: string;
  capAssignedWeekly: string;
  capFollowUp: string;
  capHighRisk: string;
  capCompletion: string;
  /** Governed empty-state caption for a metric with no reachable input. */
  notConfigured: string;
};

export default function FieldMetricStrip({
  daily,
  weekly,
  returned,
  drafts,
  strings,
}: {
  daily: FieldScopeStat;
  weekly: FieldScopeStat;
  returned: number;
  drafts: number;
  strings: FieldMetricStripStrings;
}) {
  const { scope, setScope } = useFieldScope();
  const isWeekly = scope === "weekly";
  const s = isWeekly ? weekly : daily;
  const mission = (isWeekly ? strings.missionWeekly : strings.missionDaily).replace("{n}", String(s.remaining));

  return (
    <section
      className={`${styles.card} ${styles.missionCard}`}
      aria-label={strings.stripAria}
      data-testid="field-mission-metrics"
      data-scope={scope}
    >
      <div className={styles.missionRow}>
        <span className={styles.missionText}>{mission}</span>
        <span className="grow" />
        <span className="exc-chip exc-warning" style={{ height: 22 }}>
          <span className="exc-mark" aria-hidden="true" />
          {returned} {strings.returned}
        </span>
        <span className="exc-chip exc-pending" style={{ height: 22 }}>
          <span className="exc-mark" aria-hidden="true" />
          {drafts} {strings.drafts}
        </span>
        <div className="seg" role="group" aria-label={strings.scopeAria}>
          <button type="button" className="seg-opt" aria-pressed={!isWeekly} onClick={() => setScope("daily")}>
            {strings.daily}
          </button>
          <button type="button" className="seg-opt" aria-pressed={isWeekly} onClick={() => setScope("weekly")}>
            {strings.weekly}
          </button>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <div className={styles.metric}>
          <div className={`id-code ${styles.metricValue}`}>{s.inspections}</div>
          <div className={styles.metricLabel}>{strings.labelInspections}</div>
          <div className={`t-caption ${styles.metricCap}`}>
            {isWeekly ? strings.capAssignedWeekly : strings.capAssignedDaily}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={`id-code ${styles.metricValue}`}>{s.followUp}</div>
          <div className={styles.metricLabel}>{strings.labelFollowUp}</div>
          <div className={`t-caption ${styles.metricCap}`}>{strings.capFollowUp}</div>
        </div>

        <div className={styles.metric}>
          <div className={`id-code ${styles.metricValue} ${styles.metricValueWarn}`}>{s.highRisk}</div>
          <div className={styles.metricLabel}>{strings.labelHighRisk}</div>
          <div className={`t-caption ${styles.metricCap}`}>{strings.capHighRisk}</div>
        </div>

        {/* Slot 4 — the design's "Est. Finish Time" (daily) / "Completion Rate"
            (weekly). Completion rate IS reachable (submitted ÷ assigned over the
            same governed rows). A finish-time estimate is NOT, so the daily
            variant renders the governed empty state instead of a clock. */}
        <div className={styles.metric}>
          {isWeekly ? (
            <>
              <div className={`id-code ${styles.metricValue}`}>{s.completionPct}%</div>
              <div className={styles.metricLabel}>{strings.labelCompletion}</div>
              <div className={`t-caption ${styles.metricCap}`}>{strings.capCompletion}</div>
            </>
          ) : (
            <>
              <div className={`id-code ${styles.metricValue} ${styles.metricValueEmpty}`}>—</div>
              <div className={styles.metricLabel}>{strings.labelFinish}</div>
              <div className={`t-caption ${styles.metricCap}`}>{strings.notConfigured}</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
