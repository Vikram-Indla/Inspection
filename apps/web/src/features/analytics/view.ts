import { ANALYTICS_METRICS } from "@/lib/analytics/metric-registry";
import type { AnalyticsRpcRow } from "@/lib/analytics/contract";
import type { Locale } from "@/lib/i18n";
import { analyticsMessages } from "./strings";

export type MetricKind = "rate" | "count";

export type ResolvedMetric = {
  readonly key: string;
  readonly title: string;
  readonly definition: string;
  readonly trace: string;
  readonly kind: MetricKind;
  readonly value: number;
  readonly display: string;
  readonly numerator: number | null;
  readonly denominator: number | null;
  readonly breakdown: readonly (readonly [string, number])[];
};

export type BlockedMetric = {
  readonly key: string;
  readonly title: string;
  readonly trace: string;
  readonly status: AnalyticsRpcRow["source_status"] | "missing";
};

export type AnalyticsView = {
  readonly rates: readonly ResolvedMetric[];
  readonly counts: readonly ResolvedMetric[];
  readonly breakdowns: readonly ResolvedMetric[];
  readonly blocked: readonly BlockedMetric[];
};

const RESOLVED = new Set(["ok", "stale"]);
const MAX_SLICES = 3;

function numeric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function breakdownOf(row: AnalyticsRpcRow): readonly (readonly [string, number])[] {
  if (!row.breakdown) return [];
  return Object.entries(row.breakdown)
    .flatMap(([label, raw]) => {
      const value = numeric(raw);
      return value === null ? [] : [[label, value] as const];
    })
    .sort((left, right) => right[1] - left[1])
    .slice(0, MAX_SLICES);
}

export function buildAnalyticsView(rows: readonly AnalyticsRpcRow[], locale: Locale): AnalyticsView {
  const copy: Readonly<Record<string, { title: string; definition: string }>> = analyticsMessages(locale).metrics;
  const rates: ResolvedMetric[] = [];
  const counts: ResolvedMetric[] = [];
  const breakdowns: ResolvedMetric[] = [];
  const blocked: BlockedMetric[] = [];

  for (const metric of ANALYTICS_METRICS) {
    const row = rows.find(candidate => candidate.metric_key === metric.key);
    if (!row || !RESOLVED.has(row.source_status) || row.value === null) {
      blocked.push({
        key: metric.key,
        title: copy[metric.key]?.title ?? metric.title,
        trace: metric.trace,
        status: row?.source_status ?? "missing",
      });
      continue;
    }

    const display = metric.format(row.value);
    const resolved: ResolvedMetric = {
      key: metric.key,
      title: copy[metric.key]?.title ?? metric.title,
      definition: copy[metric.key]?.definition ?? metric.definition,
      trace: metric.trace,
      kind: display.endsWith("%") ? "rate" : "count",
      value: row.value,
      display,
      numerator: numeric(row.numerator),
      denominator: numeric(row.denominator),
      breakdown: breakdownOf(row),
    };

    const charted = resolved.breakdown.reduce((sum, [, value]) => sum + value, 0);
    if (resolved.breakdown.length > 1 && charted > 0) breakdowns.push(resolved);
    if (resolved.kind === "rate") rates.push(resolved);
    else counts.push(resolved);
  }

  return {
    rates: [...rates].sort((left, right) => right.value - left.value),
    counts: [...counts].sort((left, right) => right.value - left.value),
    breakdowns,
    blocked,
  };
}
