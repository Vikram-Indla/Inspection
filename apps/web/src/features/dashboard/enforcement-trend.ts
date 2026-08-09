import type { DashboardClient } from "./sources/client-type";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { TrendPoint } from "@/components/saqeel/trend-bars/trend-bars";
import type { EnforcementTrendStrings } from "@/components/dashboard/enforcement-trend/enforcement-trend";
import { fill } from "@/i18n/messages";

export type EnforcementPeriod = {
  readonly key: "previous" | "current";
  readonly from: string;
  readonly to: string;
  readonly count: number;
};

export type EnforcementTrend = {
  readonly periods: readonly EnforcementPeriod[];
  readonly change: number | null;
  readonly readable: boolean;
};

const DAY_MS = 86_400_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const dayOf = (iso: string) => iso.slice(0, 10);

/**
 * The period immediately before the scoped one, of the same length, so the
 * comparison is like for like. The scope's own bounds are never adjusted.
 */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  const span = Math.max(DAY_MS, end - start + DAY_MS);
  return {
    from: dayOf(new Date(start - span).toISOString()),
    to: dayOf(new Date(start - DAY_MS).toISOString()),
  };
}

/**
 * Enforcement actions issued in the scoped period and the one before it, from
 * `penalty_notices` — the notices actually served, per the owner's definition.
 *
 * That table is readable only by reviewer / ops / auditor / compliance_admin /
 * leadership; every other role gets an **empty result, not an error**, which is
 * not the same as "no enforcement happened". `readable` tells the caller which
 * it is so an absence is never rendered as a zero.
 */
export async function queryEnforcementTrend(
  sb: DashboardClient,
  from: string,
  to: string,
  region: string,
): Promise<EnforcementTrend> {
  const earlier = previousPeriod(from, to);
  const select = region
    ? "id, issued_at, factories!inner(region)"
    : "id, issued_at";

  const scoped = (start: string, end: string) => {
    const query = sb.from("penalty_notices").select(select)
      .gte("issued_at", `${start}T00:00:00.000Z`)
      .lte("issued_at", `${end}T23:59:59.999Z`);
    return region ? query.eq("factories.region", region) : query;
  };

  const [previousRead, currentRead] = await Promise.all([
    scoped(earlier.from, earlier.to),
    scoped(from, to),
  ]);

  if (previousRead.error) console.error(`[dashboard.enforcement] previous period failed: ${previousRead.error.message}`);
  if (currentRead.error) console.error(`[dashboard.enforcement] current period failed: ${currentRead.error.message}`);

  const readable = !previousRead.error && !currentRead.error;
  const previousCount = rows(previousRead.data).length;
  const currentCount = rows(currentRead.data).length;

  return {
    periods: [
      { key: "previous", from: earlier.from, to: earlier.to, count: previousCount },
      { key: "current", from, to, count: currentCount },
    ],
    change: !readable || previousCount === 0 ? null : Math.round(((currentCount - previousCount) / previousCount) * 100),
    readable,
  };
}

export type EnforcementTrendView = {
  readonly points: readonly TrendPoint[];
  readonly currentLabel: string;
  readonly comparison: string;
  readonly tone: StatusTone;
};

/**
 * Bars are scaled against the taller of the two periods rather than a fixed
 * ceiling, so the pair reads as a comparison of each other and never implies a
 * target the ministry has not set.
 *
 * More enforcement is not "good news": a rise carries `warning`, a fall
 * `success`, because the movement is a signal to read, not a score.
 */
export function enforcementTrendView(trend: EnforcementTrend, strings: EnforcementTrendStrings): EnforcementTrendView {
  const peak = Math.max(...trend.periods.map(period => period.count), 1);
  const latest = trend.periods[trend.periods.length - 1];
  const { change } = trend;

  return {
    points: trend.periods.map(period => ({
      key: period.key,
      percent: Math.round((period.count / peak) * 100),
      label: `${period.count} · ${period.from} — ${period.to}`,
    })),
    currentLabel: fill(strings.current, { n: latest?.count ?? 0 }),
    comparison: change === null
      ? strings.noBaseline
      : fill(strings.comparison, { sign: change > 0 ? "+" : "", n: change }),
    tone: change === null || change === 0 ? "neutral" : change > 0 ? "warning" : "success",
  };
}
