import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// FIX WAVE F4 — M02-017: plan drill-down listing every child visit with its
// assignment; M02-036: per-plan progress calculation (completed / published /
// returned / cancelled / expired counts + segmented % bar). Counts are computed
// from persisted states — expire_lapsed_visits() runs first so 'expired' is a
// database fact, not a client guess (M02-016 parity).

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical" };

type ChildVisit = {
  id: string; visit_type: string; execution_mode: string; planning_status: string;
  operational_state: string; window_start: string; window_end: string;
  factories: { id: string; name: string } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
  inspections: { status: string } | null; // TO-ONE embed — object or null
};

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");

export default async function PlanDrilldown({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await useT();
  const sb = await supabaseServer();
  await sb.rpc("expire_lapsed_visits"); // persist published→expired before counting (M02-016)
  const [{ data: plan, error: pErr }, { data: kids, error: kErr }] = await Promise.all([
    sb.from("visit_plans")
      .select("id, method, status, criteria, created_at, published_at, profiles(full_name)")
      .eq("id", id).maybeSingle(),
    sb.from("visits")
      .select(`id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end,
        factories(id, name), assignments(profiles(full_name)), inspections(status)`)
      .eq("visit_plan_id", id).order("window_start", { ascending: true }),
  ]);
  if (pErr || kErr) {
    return <Shell current="/planning" title={t("plan.drill.errorTitle", "Plan — error")}>
      <div className="ax-banner ax-banner--critical"><div>{t("plan.drill.loadError", "Could not load plan:")} {pErr?.message ?? kErr?.message}</div></div>
    </Shell>;
  }
  if (!plan) {
    return <Shell current="/planning" title={t("plan.drill.notFoundTitle", "Plan not found")}>
      <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">∅</span>
        <h4>{t("plan.drill.notFound", "Not in your scope or does not exist")}</h4>
        <p className="ax-caption">{t("plan.drill.notFoundDesc", "Plan visibility is RLS-enforced (plans_read — planner/ops/reviewer/auditor/leadership).")}</p>
      </div></div>
    </Shell>;
  }
  const creator = (plan.profiles as unknown as { full_name: string } | null)?.full_name ?? "—";
  const visits = (kids ?? []) as unknown as ChildVisit[];

  // ---------- M02-036 per-plan progress ----------
  // completed = child whose inspection reached 'approved' (review sign-off);
  // the remaining buckets are the persisted planning statuses.
  const total = visits.length;
  const completed = visits.filter(v => v.inspections?.status === "approved").length;
  const bucket = (s: string) => visits.filter(v => v.planning_status === s && v.inspections?.status !== "approved").length;
  const published = bucket("published");
  const draft = bucket("draft");
  const returned = bucket("returned");
  const cancelled = bucket("cancelled");
  const expired = bucket("expired");
  const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);
  const segments: { key: string; label: string; n: number; bg: string }[] = [
    { key: "completed", label: t("plan.drill.completed", "completed"), n: completed, bg: "var(--ax-color-success)" },
    { key: "published", label: t("enum.published", "published"), n: published, bg: "var(--ax-color-info)" },
    { key: "draft", label: t("enum.draft", "draft"), n: draft, bg: "var(--ax-color-neutral-weak)" },
    { key: "returned", label: t("enum.returned", "returned"), n: returned, bg: "var(--ax-color-warning)" },
    { key: "cancelled", label: t("enum.cancelled", "cancelled"), n: cancelled, bg: "var(--ax-color-critical)" },
    { key: "expired", label: t("enum.expired", "expired"), n: expired, bg: "var(--ax-color-critical-strong)" },
  ];

  return (
    <Shell current="/planning" title={t("plan.drill.title", "Plan {id}").replace("{id}", plan.id.slice(0, 8))}
      context={<>
        <span className="ax-lozenge ax-lozenge--info">{t(`enum.${plan.method}`, plan.method)}</span>
        <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[plan.status] ?? ""}`}>{t(`enum.${plan.status}`, plan.status)}</span>
      </>}>
      <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <a className="ax-link" href="/planning/plans">← {t("plan.drill.backToRegister", "Plan register")}</a>
        <span className="ax-caption ax-numeric">
          {t("plan.drill.createdBy", "created by")} <strong>{creator}</strong> · {fmt(plan.created_at)}
          {plan.published_at && <> · {t("plan.drill.publishedAt", "published")} {fmt(plan.published_at)}</>}
        </span>
      </div>

      {/* M02-036 — progress calculation + % bar over persisted child states */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
        <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h4 style={{ margin: 0 }}>{t("plan.drill.progressHeading", "Plan progress (M02-036)")}</h4>
          <span className="ax-numeric"><strong>{pct(completed)}%</strong> {t("plan.drill.progressOf", "of {n} child visits completed").replace("{n}", String(total))}</span>
        </div>
        {total > 0 && (
          <div role="img" aria-label={t("plan.drill.progressBarAria", "Progress by child-visit state")}
            style={{ display: "flex", blockSize: 12, borderRadius: "var(--ax-radius-full)", overflow: "hidden", background: "var(--ax-color-neutral-tint)" }}>
            {segments.filter(s => s.n > 0).map(s => (
              <div key={s.key} title={`${s.label}: ${s.n}`} style={{ inlineSize: `${(s.n / total) * 100}%`, background: s.bg }} />
            ))}
          </div>
        )}
        <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
          {segments.map(s => (
            <span key={s.key} className="ax-caption">
              <span aria-hidden="true" style={{ display: "inline-block", inlineSize: 10, blockSize: 10, borderRadius: "var(--ax-radius-full)", background: s.bg, marginInlineEnd: 6 }} />
              {s.label} <span className="ax-numeric"><strong>{s.n}</strong></span>
            </span>
          ))}
        </div>
      </div>

      {/* M02-017 — child visits with assignments */}
      {visits.length === 0 ? (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🗓</span><h4>{t("plan.drill.noChildren", "No child visits under this plan")}</h4>
          <p className="ax-caption">{t("plan.drill.noChildrenDesc", "Visits are attached at plan creation; immediate visits never carry a plan (M01-050).")}</p>
        </div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th>{t("plan.drill.colVisit", "Visit")}</th>
            <th>{t("plan.drill.colFactory", "Factory")}</th>
            <th>{t("plan.drill.colTypeMode", "Type · mode")}</th>
            <th>{t("plan.drill.colPlanning", "Planning status")}</th>
            <th>{t("plan.drill.colOperational", "Operational")}</th>
            <th>{t("plan.drill.colInspector", "Inspector")}</th>
            <th className="ax-td-num">{t("plan.drill.colWindow", "Window")}</th>
          </tr></thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id}>
                <td className="ax-numeric"><a className="ax-link" href={`/visits/${v.id}`}><strong>{v.id.slice(0, 8)}</strong></a></td>
                <td>{v.factories ? <a className="ax-link" href={`/factories/${v.factories.id}`}>{v.factories.name}</a> : "—"}</td>
                <td>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)}</td>
                <td><span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[v.planning_status] ?? ""}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
                  {v.inspections?.status === "approved" && <> <span className="ax-lozenge ax-lozenge--success">{t("plan.drill.completed", "completed")}</span></>}</td>
                <td><span className="ax-lozenge ax-lozenge--ops">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span></td>
                <td>{v.assignments?.[0]?.profiles?.full_name ?? "—"}</td>
                <td className="ax-td-num ax-numeric">{fmt(v.window_start)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </Shell>
  );
}
