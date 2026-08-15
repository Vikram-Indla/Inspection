import {
  buildMethodology, isBlocked, metricDisplay, statusLabel,
  type MetricDisplay, type MethodologyEntry,
} from "@/app/(app)/dashboard/dashboard-format";
import {
  findMetric,
  type DashboardKpiProjection, type MetricSourceStatus, type SharedMetric,
} from "@/lib/dashboard-kpi/contract";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type MetricStripStrings = {
  readonly methodology: string;
  readonly why: string;
  readonly close: string;
  readonly advisory: string;
  readonly blockedTitle: string;
  readonly drillFallback: string;
};

export type MetricStripData = {
  readonly metrics: MetricDisplay[];
  readonly methodology: Record<string, MethodologyEntry>;
};

function requirementIds(prefix: string, count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(3, "0")}`);
}

export const STRATEGIC_REQUIREMENT_IDS = requirementIds("STR-KPI", 12);
export const OPERATIONAL_REQUIREMENT_IDS = requirementIds("OPS-KPI", 9);

export const STRATEGIC_CARD_IDS: readonly string[] = [
  "STR-KPI-001",
  "STR-KPI-004",
  "STR-KPI-007",
  "STR-KPI-008",
  "STR-KPI-012",
];

export const OPERATIONAL_CARD_IDS: readonly string[] = [
  "OPS-KPI-003",
  "OPS-KPI-004",
  "OPS-KPI-006",
];

export function unrepresented(
  all: readonly string[],
  ...shownElsewhere: ReadonlyArray<readonly string[]>
): readonly string[] {
  const shown = new Set(shownElsewhere.flat());
  return all.filter(id => !shown.has(id));
}

function withSourceState(
  metric: SharedMetric,
  partialSources: readonly string[],
  separator: string,
  template: string,
): SharedMetric {
  if (!partialSources.length || metric.sourceStatus !== "live") return metric;
  return {
    ...metric,
    sourceStatus: "partial",
    unavailableReason: fill(template, { sources: partialSources.join(separator) }),
  };
}

export function buildMetricStrip(
  projection: DashboardKpiProjection,
  ids: readonly string[],
  locale: Locale,
  partialSources: readonly string[],
): MetricStripData {
  const { dashboard } = getMessages(locale);
  const separator = locale === "ar" ? "، " : ", ";
  const entries = ids
    .map(id => ({ id, source: findMetric(projection, id) }))
    .filter((entry): entry is { id: string; source: SharedMetric } => Boolean(entry.source))
    .map(entry => ({
      id: entry.id,
      metric: withSourceState(entry.source, partialSources, separator, dashboard.partial.sourceSet),
    }));

  return {
    metrics: entries.map(entry => metricDisplay(entry.metric, locale)),
    methodology: Object.fromEntries(
      entries.map(entry => [entry.id, buildMethodology(entry.metric, locale)] as const),
    ),
  };
}

export type CoverageReason = {
  readonly key: string;
  readonly label: string;
  readonly count: number;
};

export type MeasureCoverage = {
  readonly live: number;
  readonly total: number;
  readonly percent: number;
  readonly reasons: readonly CoverageReason[];
};

/**
 * How many of the measures in `ids` carry a live source, and what is stopping
 * the rest — counted over the same population the register lists below it, so
 * the meter and the table can never disagree.
 *
 * A metric the projection does not know about is left out of both numerator and
 * denominator. Counting it as blocked would report a governance failure where
 * the truth is that the measure is not registered at all.
 */
export function buildCoverage(
  projection: DashboardKpiProjection,
  ids: readonly string[],
  locale: Locale,
): MeasureCoverage {
  const found = ids
    .map(id => findMetric(projection, id))
    .filter((metric): metric is SharedMetric => Boolean(metric));

  const blocked = found.filter(metric => isBlocked(metric.sourceStatus));
  const counts = new Map<MetricSourceStatus, number>();
  for (const metric of blocked) {
    counts.set(metric.sourceStatus, (counts.get(metric.sourceStatus) ?? 0) + 1);
  }

  return {
    live: found.length - blocked.length,
    total: found.length,
    percent: found.length ? Math.round(((found.length - blocked.length) / found.length) * 100) : 0,
    reasons: [...counts.entries()]
      .map(([key, count]) => ({ key, label: statusLabel(key, locale), count }))
      .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label)),
  };
}

export function requirementRegisterStrings(locale: Locale) {
  const { dashboard } = getMessages(locale);
  return {
    ...metricStripStrings(locale),
    measure: dashboard.metric.measure,
    state: dashboard.metric.state,
    basis: dashboard.metric.basis,
    emptyTitle: dashboard.metric.emptyTitle,
  };
}

export function metricStripStrings(locale: Locale): MetricStripStrings {
  const { common, dashboard } = getMessages(locale);
  return {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    close: common.action.close,
    advisory: dashboard.metric.advisory,
    blockedTitle: dashboard.metric.blockedTitle,
    drillFallback: dashboard.metric.drill,
  };
}
