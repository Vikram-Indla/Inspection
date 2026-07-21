// Shared Dashboard KPI contract — SAQEEL Dashboard rectification, CODEX 01.
//
// This is the ONE typed contract that both the Web dashboard and the iPad field
// dashboard consume. Presentation components must render these SharedMetric
// records and must NEVER recompute a KPI formula, run SQL, or accept arbitrary
// formula code from the client. All arithmetic happens server-side in the
// projection builders (projection.ts / inspector-projection.ts), which are pure
// and unit-tested.
//
// Contract references: SAQEEL_Dashboard_KPI_Admin_Configuration_Matrix.xlsx
// (Shared KPI API sheet), CODEX_01_SHARED_KPI_ADMIN_FOUNDATION.md.

/** Unit of a metric value. */
export type MetricUnit = "percent" | "count" | "ratio" | "duration_ms" | "category" | "currency" | "none";

export type MetricCategory = "strategic" | "operational" | "inspector";

/**
 * Honest source/computation status for a metric. Never fabricate a value: a
 * metric that cannot be computed with governed data returns null with the
 * appropriate status instead of a fabricated percentage or a silent zero.
 *
 * - live            calculated from current governed data
 * - stale           calculated from data past its freshness expectation
 * - partial         some contributing source failed; value is a partial view
 * - cached          served from cache (iPad), explicitly not live
 * - offline         device offline; last synchronised value
 * - unavailable     a required source field/table does not exist yet (stop-line)
 * - not_configured  requires an effective Admin policy that is not yet published
 * - decision_required an unresolved governance decision blocks the exact formula
 */
export type MetricSourceStatus =
  | "live"
  | "stale"
  | "partial"
  | "cached"
  | "offline"
  | "unavailable"
  | "not_configured"
  | "decision_required";

/** How the metric can be delivered right now, independent of live data. */
export type MetricImplementationStatus =
  | "implemented"
  | "not_configured"
  | "decision_required"
  | "unavailable"
  | "deferred";

export type MetricScope = {
  fromMs: number | null;
  toMs: number | null;
  fromDate: string | null;
  toDate: string | null;
  timezone: string; // canonical reporting timezone, e.g. "Asia/Riyadh"
  region: string | null;
  filters: Record<string, string | number | boolean | null>;
};

export type MetricComparison = {
  previousValue: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  window: string | null;
};

export type MetricTarget = {
  value: number | null;
  policyVersionId: string | null;
  configured: boolean;
};

export type MetricDimension = { key: string; labelRef: string };

export type MetricDrill = { route: string | null; filters: Record<string, string> };

/** A masked/permission-scoped view descriptor; the client never supplies this. */
export type MetricPermission = {
  visible: boolean;
  masked: boolean;
  reasonRef: string | null;
};

/** A localized label/description reference (resolved by the i18n layer). */
export type MetricLabelRef = { en: string; ar: string | null; descriptionRef: string | null };

/**
 * The shared metric record. Every field the presentation may need is carried
 * here so that neither Web nor iPad has to reach back into raw data.
 */
export type SharedMetric = {
  metricId: string;
  category: MetricCategory;
  formulaVersion: string;
  /** Published Admin policy version used, or null when no policy applied yet. */
  policyVersionId: string | null;

  value: number | null;
  unit: MetricUnit;
  /** Numerator/denominator when the metric is a rate; null otherwise. */
  numerator: number | null;
  denominator: number | null;

  scope: MetricScope;
  /** Applied exclusions, e.g. ["na","unknown","incomplete"]. */
  exclusions: string[];

  comparison: MetricComparison | null;
  target: MetricTarget | null;

  /** Available governed breakdown dimensions. */
  dimensions: MetricDimension[];
  /** Optional pre-broken-down series for the primary dimension. */
  breakdown: Array<{ labelRef: string; value: number; numerator?: number; denominator?: number }> | null;
  drill: MetricDrill;

  sourceStatus: MetricSourceStatus;
  refreshedAt: string | null;
  /** Human/machine freshness note, e.g. "as of server time". */
  freshnessRef: string | null;

  /** Underlying record references supporting the value (required for AI claims). */
  evidenceRefs: string[];

  permission: MetricPermission;
  label: MetricLabelRef;

  /**
   * When the metric cannot be delivered as a live value, this explains why in
   * governance terms (stop-line reference / decision id). Null when live.
   */
  unavailableReason: string | null;
};

/** A whole-dashboard projection: a flat list of shared metrics plus meta. */
export type DashboardKpiProjection = {
  metrics: SharedMetric[];
  generatedAtMs: number;
  failedSources: string[];
};

export function findMetric(projection: DashboardKpiProjection, metricId: string): SharedMetric | undefined {
  return projection.metrics.find((m) => m.metricId === metricId);
}
