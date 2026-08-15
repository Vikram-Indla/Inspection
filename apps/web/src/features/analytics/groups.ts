import type { ResolvedMetric } from "./view";

export const COUNT_GROUPS = ["visits", "coverage", "enforcement"] as const;
export type CountGroup = (typeof COUNT_GROUPS)[number];

const GROUP_OF: Readonly<Record<string, CountGroup>> = {
  visit_volume: "visits",
  published_visit_count: "visits",
  active_executions: "visits",
  draft_backlog_count: "visits",
  submission_throughput: "visits",
  factory_coverage: "coverage",
  inspector_coverage: "coverage",
  scheduled_load_count: "coverage",
  evidence_capture_count: "enforcement",
  violation_issue_count: "enforcement",
  penalty_issue_count: "enforcement",
};

export type CountBand = {
  readonly group: CountGroup;
  readonly metrics: readonly ResolvedMetric[];
  readonly max: number;
};

export function bandCounts(counts: readonly ResolvedMetric[]): readonly CountBand[] {
  return COUNT_GROUPS.flatMap(group => {
    const metrics = counts.filter(metric => GROUP_OF[metric.key] === group);
    if (!metrics.length) return [];
    return [{ group, metrics, max: Math.max(...metrics.map(metric => metric.value)) }];
  });
}
