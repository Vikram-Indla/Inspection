// Display-ready metric tile, shared between the server-rendered daily KPI
// strip build (field/page.tsx) and the weekly mirror (same shape, wider
// window — see lib/dashboard-kpi/inspector-weekly.ts). Kept plain-data (no
// JSX) so a client component (FieldMetricStrip) can render either scope from
// pre-fetched props without another network round trip.
import type { findMetric } from "@/lib/dashboard-kpi";

export type MetricTile = {
  label: string;
  valueText: string;
  delta: string;
  warn: boolean;
  blocked: boolean;
};

export type BlockedTexts = {
  notConfigured: string;
  decisionRequired: string;
  unavailable: string;
  na: string;
};

const BLOCKED_STATUSES = ["unavailable", "not_configured", "decision_required"];

/** Same honest-blocked-state rendering the governed metric strip has always
 *  used — never fabricate a value when the shared projection can't supply one. */
export function buildGovernedMetricTile(
  label: string,
  m: ReturnType<typeof findMetric>,
  delta: string,
  blockedTexts: BlockedTexts,
  opts?: { percent?: boolean; warn?: boolean },
): MetricTile {
  const blocked = !m || BLOCKED_STATUSES.includes(m.sourceStatus);
  const naText = blocked
    ? (m?.sourceStatus === "not_configured" ? blockedTexts.notConfigured
      : m?.sourceStatus === "decision_required" ? blockedTexts.decisionRequired
      : blockedTexts.unavailable)
    : null;
  const isNull = !blocked && m?.value == null;
  const valueText = blocked ? (naText ?? "")
    : isNull ? blockedTexts.na
    : opts?.percent ? `${m!.value}%`
    : String(m!.value);
  return { label, valueText, delta, warn: !!opts?.warn, blocked };
}

/** Plain, always-available weekly tile — no SharedMetric blocked-state
 *  machinery needed since it is computed client-side-safe from rows already
 *  read for the day (see buildInspectorWeeklyKpi). */
export function buildPlainMetricTile(
  label: string,
  value: number | null,
  delta: string,
  blockedTexts: BlockedTexts,
  opts?: { percent?: boolean; warn?: boolean },
): MetricTile {
  const valueText = value == null ? blockedTexts.na : opts?.percent ? `${value}%` : String(value);
  return { label, valueText, delta, warn: !!opts?.warn, blocked: false };
}
