import type { AnalyticsMessages } from "./strings";

type BottleneckStatus = "decision_required" | "not_configured" | "unavailable";

type BottleneckKey = keyof Pick<
  AnalyticsMessages["bottlenecks"],
  | "planningToSubmissionCohort"
  | "repeatViolationLineage"
  | "riskToAttentionRules"
  | "healthScore"
  | "licenceExposure"
  | "slaUrgency"
  | "capacityUtilization"
  | "strategicBrief"
  | "attentionQueue"
  | "export"
>;

type NoteKey = keyof Pick<
  AnalyticsMessages["bottlenecks"],
  "strategicBriefNote" | "attentionQueueNote" | "exportNote"
>;

export type Bottleneck = {
  readonly key: BottleneckKey;
  readonly status: BottleneckStatus;
  readonly note?: NoteKey;
};

export const ANALYTICS_BOTTLENECKS: readonly Bottleneck[] = [
  { key: "planningToSubmissionCohort", status: "decision_required" },
  { key: "repeatViolationLineage", status: "unavailable" },
  { key: "riskToAttentionRules", status: "decision_required" },
  { key: "healthScore", status: "not_configured" },
  { key: "licenceExposure", status: "not_configured" },
  { key: "slaUrgency", status: "not_configured" },
  { key: "capacityUtilization", status: "not_configured" },
  { key: "strategicBrief", status: "not_configured", note: "strategicBriefNote" },
  { key: "attentionQueue", status: "not_configured", note: "attentionQueueNote" },
  { key: "export", status: "unavailable", note: "exportNote" },
];
