import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { riyadhDateParts } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";

// FIX WAVE F4 — M02-018/037: inspector workload & capacity view. Aggregates
// assignments → published visit windows into per-inspector active-visit counts
// by week (KSA weeks, Sunday-first per ENG-09 calendar), with a relative
// utilization bar. TASK-EXECUTION-MODULE-001 (D-001): a governed daily visit
// cap now exists (engine_settings.execution.daily_visit_cap, default 10) — the
// page displays it as configured context while the weekly bars stay RELATIVE
// to the busiest inspector-week (weekly capacity is not a governed value).

const DAY_MS = 86_400_000;
const WEEKS = 6;

type Row = {
  inspector_id: string;
  profiles: { full_name: string } | null;
  visits: { id: string; planning_status: string; operational_state: string; window_start: string; window_end: string } | null;
};

export default async function Workload() {
  const { t } = await useT();
  const sb = await supabaseServer();
  // M02-016 expiry is owned by pg_cron sweep expire_lapsed_visits_scheduled
  // (0025, every 15 min, unscoped); boards render display-level 'expired' for
  // lapsed windows in between ticks. No per-page-load mutating RPC (K-009).
  const { data, error } = await sb.from("assignments")
    .select("inspector_id, profiles(full_name), visits(id, planning_status, operational_state, window_start, window_end)")
    .limit(2000);
  // D-001 — the governed daily visit cap (engine_settings.execution), shown as
  // configured context next to the relative weekly utilization. Default 10
  // matches the server-side counting service when the setting is absent.
  const { data: execEngine } = await sb.from("engine_settings").select("settings").eq("engine", "execution").maybeSingle();
  const execSettings = (execEngine?.settings ?? {}) as { daily_visit_cap?: unknown };
  const dailyCap = typeof execSettings.daily_visit_cap === "number" && execSettings.daily_visit_cap > 0 ? execSettings.daily_visit_cap : 10;
  if (error) {
    // CD-026 query-degraded — neutralise provider error (log server-side only).
    console.error(`[visits.workload] load failed: ${error.message}`);
    return (
      <Shell current="/visits" title={t("visit.load.title", "Inspector workload")}>
        <div className="sq-banner sq-banner--critical" role="alert"><div>{t("visit.load.loadErrorNeutral", "Assignments are temporarily unavailable. Please try again.")}</div></div>
      </Shell>
    );
  }
  const rows = (data ?? []) as unknown as Row[];

  // Week buckets: current KSA week (Sunday) + the next (WEEKS-1). Riyadh-local
  // "today", not raw UTC — near UTC midnight (03:00 Riyadh) the two disagree
  // on both the calendar day AND the day-of-week, which silently shifted the
  // whole 6-week grid by a day for part of every 24h cycle.
  const riyadhToday = riyadhDateParts(Date.now());
  const todayMs = Date.UTC(riyadhToday.year, riyadhToday.month - 1, riyadhToday.day);
  const week0 = todayMs - new Date(todayMs).getUTCDay() * DAY_MS;
  const weekStarts = Array.from({ length: WEEKS }, (_, i) => week0 + i * 7 * DAY_MS);
  const weekLabel = (ms: number) => {
    const { month, day } = riyadhDateParts(ms);
    return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
  };
  const weekIndex = (iso: string) => {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms) || ms < week0 || ms >= week0 + WEEKS * 7 * DAY_MS) return -1;
    return Math.floor((ms - week0) / (7 * DAY_MS));
  };

  type Agg = { name: string; weeks: number[]; total: number; beyond: number };
  const byInspector = new Map<string, Agg>();
  for (const r of rows) {
    const v = r.visits;
    // Active load = published visits whose execution has not been submitted yet.
    if (!v || v.planning_status !== "published" || v.operational_state === "submitted") continue;
    const agg = byInspector.get(r.inspector_id) ?? { name: r.profiles?.full_name ?? r.inspector_id.slice(0, 8), weeks: Array.from({ length: WEEKS }, () => 0), total: 0, beyond: 0 };
    const wi = weekIndex(v.window_start);
    if (wi >= 0) agg.weeks[wi] += 1; else agg.beyond += 1;
    agg.total += 1;
    byInspector.set(r.inspector_id, agg);
  }
  const inspectors = [...byInspector.entries()].map(([id, a]) => ({ id, ...a })).sort((a, b) => b.total - a.total);
  const maxCell = Math.max(1, ...inspectors.flatMap(a => a.weeks));
  const maxTotal = Math.max(1, ...inspectors.map(a => a.total));

  return (
    <Shell current="/visits" title={t("visit.load.title", "Inspector workload")}
      context={<span className="badge badge-info">{t("visit.load.context", "M02-018/037 · assignments × published windows")}</span>}>
      <div className="row" role="group" aria-label={t("visit.views.aria", "Visit management views")}>
        <a className="btn btn-ghost btn-touch" href="/visits">{t("visit.views.list", "List")}</a>
        <a className="btn btn-ghost btn-touch" href="/visits/calendar">{t("visit.views.calendar", "Calendar")}</a>
        <a className="btn btn-secondary btn-touch" aria-current="page" href="/visits/workload">{t("visit.views.workload", "Workload")}</a>
      </div>
      {inspectors.length === 0 ? (
        <EmptyState glyph="◫" title={t("visit.load.empty", "No active assigned load")}
          body={t("visit.load.emptyDesc", "Published, not-yet-submitted visits with an assignment appear here grouped by inspector and week (M02-018).")} />
      ) : (
        <div className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h4 style={{ margin: 0 }}>{t("visit.load.heading", "Active visits per inspector per week (M02-018)")}</h4>
          <div className="sq-tablewrap"><table className="sq-table">
            <thead><tr>
              <th scope="col">{t("visit.load.colInspector", "Inspector")}</th>
              {weekStarts.map((ms, i) => (
                <th scope="col" key={ms} className="sq-td-num"><span className="numeric">{weekLabel(ms)}</span>{i === 0 && <> · {t("visit.load.thisWeek", "this week")}</>}</th>
              ))}
              <th scope="col" className="sq-td-num">{t("visit.load.colLater", "Later")}</th>
              <th scope="col" className="sq-td-num">{t("visit.load.colTotal", "Active total")}</th>
              <th scope="col" style={{ inlineSize: 180 }}>{t("visit.load.colUtilization", "Relative utilization (M02-037)")}</th>
            </tr></thead>
            <tbody>
              {inspectors.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  {a.weeks.map((n, i) => (
                    <td key={i} className="sq-td-num">
                      <span className="numeric" style={n === maxCell && n > 0 ? { color: "var(--status-warning-text)", fontWeight: 600 } : undefined}>{n}</span>
                      <div aria-hidden="true" style={{ blockSize: 4, marginBlockStart: 2, borderRadius: "var(--radius-full)", background: "var(--surface-secondary)" }}>
                        <div style={{ blockSize: 4, borderRadius: "var(--radius-full)", inlineSize: `${(n / maxCell) * 100}%`, background: "var(--action-primary)" }} />
                      </div>
                    </td>
                  ))}
                  <td className="sq-td-num numeric">{a.beyond}</td>
                  <td className="sq-td-num numeric"><strong>{a.total}</strong></td>
                  <td>
                    <div className="row" style={{ alignItems: "center", gap: "var(--space-2)" }}>
                      <div style={{ flex: 1, blockSize: 8, borderRadius: "var(--radius-full)", background: "var(--surface-secondary)" }}>
                        <div style={{ blockSize: 8, borderRadius: "var(--radius-full)", inlineSize: `${Math.round((a.total / maxTotal) * 100)}%`, background: "var(--status-info)" }} />
                      </div>
                      <span className="t-caption numeric">{Math.round((a.total / maxTotal) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="t-caption">
            {t("visit.load.dailyCap", "Daily visit limit: {n} (configured).").replace("{n}", String(dailyCap))}
            {" "}
            {t("visit.load.relativeNote", "Utilization is relative to the busiest inspector — weekly counts are compared, not capped. Weeks start Sunday (ENG-09 calendar).")}
          </p>
        </div>
      )}
    </Shell>
  );
}
