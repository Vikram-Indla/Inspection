import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// FIX WAVE F4 — M02-018/037: inspector workload & capacity view. Aggregates
// assignments → published visit windows into per-inspector active-visit counts
// by week (KSA weeks, Sunday-first per ENG-09 calendar), with a relative
// utilization bar. No capacity threshold exists in engine_settings, so
// utilization is displayed RELATIVE to the busiest inspector-week — the page
// says so explicitly instead of inventing a policy value (CLAUDE.md hard rule).

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
  const { error: expiryError } = await sb.rpc("expire_lapsed_visits"); // count real published load, not lapsed windows (M02-016)
  if (expiryError) console.error(`[visits.workload] expiry refresh failed: ${expiryError.message}`);
  const { data, error } = await sb.from("assignments")
    .select("inspector_id, profiles(full_name), visits(id, planning_status, operational_state, window_start, window_end)")
    .limit(2000);
  if (error) {
    // CD-026 query-degraded — neutralise provider error (log server-side only).
    console.error(`[visits.workload] load failed: ${error.message}`);
    return (
      <Shell current="/visits" title={t("visit.load.title", "Inspector workload")}>
        <div className="ax-banner ax-banner--critical" role="alert"><div>{t("visit.load.loadErrorNeutral", "Assignments are temporarily unavailable. Please try again.")}</div></div>
      </Shell>
    );
  }
  const rows = (data ?? []) as unknown as Row[];

  // Week buckets: current KSA week (Sunday) + the next (WEEKS-1).
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const week0 = todayMs - now.getUTCDay() * DAY_MS;
  const weekStarts = Array.from({ length: WEEKS }, (_, i) => week0 + i * 7 * DAY_MS);
  const weekLabel = (ms: number) => new Date(ms).toISOString().slice(5, 10).replace("-", "/");
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
      context={<span className="ax-lozenge ax-lozenge--info">{t("visit.load.context", "M02-018/037 · assignments × published windows")}</span>}>
      <div className="ax-row" role="group" aria-label={t("visit.views.aria", "Visit management views")}>
        <a className="ax-btn ax-btn--subtle" href="/visits">{t("visit.views.list", "List")}</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/calendar">{t("visit.views.calendar", "Calendar")}</a>
        <a className="ax-btn ax-btn--secondary" aria-current="page" href="/visits/workload">{t("visit.views.workload", "Workload")}</a>
      </div>
      {inspectors.length === 0 ? (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">◫</span><h4>{t("visit.load.empty", "No active assigned load")}</h4>
          <p className="ax-caption">{t("visit.load.emptyDesc", "Published, not-yet-submitted visits with an assignment appear here grouped by inspector and week (M02-018).")}</p>
        </div></div>
      ) : (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4 style={{ margin: 0 }}>{t("visit.load.heading", "Active visits per inspector per week (M02-018)")}</h4>
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr>
              <th scope="col">{t("visit.load.colInspector", "Inspector")}</th>
              {weekStarts.map((ms, i) => (
                <th scope="col" key={ms} className="ax-td-num"><span className="ax-numeric">{weekLabel(ms)}</span>{i === 0 && <> · {t("visit.load.thisWeek", "this week")}</>}</th>
              ))}
              <th scope="col" className="ax-td-num">{t("visit.load.colLater", "Later")}</th>
              <th scope="col" className="ax-td-num">{t("visit.load.colTotal", "Active total")}</th>
              <th scope="col" style={{ inlineSize: 180 }}>{t("visit.load.colUtilization", "Relative utilization (M02-037)")}</th>
            </tr></thead>
            <tbody>
              {inspectors.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  {a.weeks.map((n, i) => (
                    <td key={i} className="ax-td-num">
                      <span className="ax-numeric" style={n === maxCell && n > 0 ? { color: "var(--ax-color-warning-strong)", fontWeight: 600 } : undefined}>{n}</span>
                      <div aria-hidden="true" style={{ blockSize: 4, marginBlockStart: 2, borderRadius: "var(--ax-radius-full)", background: "var(--ax-color-neutral-tint)" }}>
                        <div style={{ blockSize: 4, borderRadius: "var(--ax-radius-full)", inlineSize: `${(n / maxCell) * 100}%`, background: "var(--ax-color-primary)" }} />
                      </div>
                    </td>
                  ))}
                  <td className="ax-td-num ax-numeric">{a.beyond}</td>
                  <td className="ax-td-num ax-numeric"><strong>{a.total}</strong></td>
                  <td>
                    <div className="ax-row" style={{ alignItems: "center", gap: "var(--ax-space-100)" }}>
                      <div style={{ flex: 1, blockSize: 8, borderRadius: "var(--ax-radius-full)", background: "var(--ax-color-neutral-tint)" }}>
                        <div style={{ blockSize: 8, borderRadius: "var(--ax-radius-full)", inlineSize: `${Math.round((a.total / maxTotal) * 100)}%`, background: "var(--ax-color-info)" }} />
                      </div>
                      <span className="ax-caption ax-numeric">{Math.round((a.total / maxTotal) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="ax-caption">
            {t("visit.load.relativeNote", "Utilization is relative to the busiest inspector — no capacity threshold is configured in engine_settings (ENG-05), so no absolute capacity is invented. Weeks start Sunday (ENG-09 calendar).")}
          </p>
        </div>
      )}
    </Shell>
  );
}
