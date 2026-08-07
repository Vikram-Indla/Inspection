import { buildMethodology, metricDisplay, type MetricDisplay, type MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import type { MetricStripStrings } from "@/app/(app)/dashboard/MetricStrip";
import { findMetric, type DashboardKpiProjection, type SharedMetric } from "@/lib/dashboard-kpi/contract";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type MetricStripData = {
  readonly metrics: MetricDisplay[];
  readonly methodology: Record<string, MethodologyEntry>;
};

function requirementIds(prefix: string, count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(3, "0")}`);
}

export const STRATEGIC_REQUIREMENT_IDS = requirementIds("STR-KPI", 12);
export const OPERATIONAL_REQUIREMENT_IDS = requirementIds("OPS-KPI", 9);

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
