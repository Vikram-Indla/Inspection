import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

// FIX WAVE F4 — M02-035: plan register. Every visit plan (bulk/single) with
// method, status, creator, published_at and child-visit count; drill-down per
// plan lives at /planning/plans/[id] (M02-017/036). RLS plans_read governs
// visibility (planner/ops/reviewer/auditor/leadership).

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical" };

type PlanRow = {
  id: string; method: string; status: string; created_at: string; published_at: string | null;
  profiles: { full_name: string } | null;
  visits: { count: number }[];
};

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");

export default async function PlanRegister() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data, error } = await sb.from("visit_plans")
    .select("id, method, status, created_at, published_at, profiles(full_name), visits(count)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[planning plan register]", error);
    return (
      <Shell current="/planning" title={t("plan.register.title", "Plan register")}>
        <div className="ax-banner ax-banner--critical"><div>{t("plan.register.loadErrorSafe", "Could not load plans. Nothing was changed. Try again (ERR-OPS-001).")}</div></div>
      </Shell>
    );
  }
  const plans = (data ?? []) as unknown as PlanRow[];
  const counts: Record<string, number> = {};
  for (const p of plans) counts[p.status] = (counts[p.status] ?? 0) + 1;
  return (
    <Shell current="/planning" title={t("plan.register.title", "Plan register")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.register.context", "M02-035 · every plan with child-visit progress")}</span>}>
      <div className="ax-kpi-row">
        {["draft", "published", "returned", "cancelled"].map(s => (
          <div key={s} className="ax-surface ax-kpi">
            <span className="ax-overline">{t(`enum.${s}`, s)}</span>
            <span className="ax-kpi__value ax-numeric">{counts[s] ?? 0}</span>
          </div>
        ))}
      </div>
      {plans.length === 0 ? (
        <EmptyState glyph="▦" title={t("plan.register.empty", "No plans yet")}
          body={t("plan.register.emptyDesc", "Bulk and single plans appear here the moment they are created (M01-002/034).")}>
          <a className="ax-btn" href="/planning">{t("plan.register.createPlan", "Create a plan")}</a>
        </EmptyState>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th>{t("plan.register.colPlan", "Plan")}</th>
            <th>{t("plan.register.colMethod", "Method")}</th>
            <th>{t("plan.register.colStatus", "Status")}</th>
            <th>{t("plan.register.colCreatedBy", "Created by")}</th>
            <th className="ax-td-num">{t("plan.register.colCreated", "Created")}</th>
            <th className="ax-td-num">{t("plan.register.colPublished", "Published")}</th>
            <th className="ax-td-num">{t("plan.register.colVisits", "Child visits")}</th>
          </tr></thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td className="ax-numeric"><a className="ax-link" href={`/planning/plans/${p.id}`}><strong>{p.id.slice(0, 8)}</strong></a></td>
                <td><span className="ax-lozenge ax-lozenge--info">{t(`enum.${p.method}`, p.method)}</span></td>
                <td><span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[p.status] ?? ""}`}>{t(`enum.${p.status}`, p.status)}</span></td>
                <td>{p.profiles?.full_name ?? "—"}</td>
                <td className="ax-td-num ax-numeric">{fmt(p.created_at)}</td>
                <td className="ax-td-num ax-numeric">{p.published_at ? fmt(p.published_at) : "—"}</td>
                <td className="ax-td-num ax-numeric">{p.visits?.[0]?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <p className="ax-caption">{t("plan.register.drillHint", "Open a plan to see its child visits and per-plan progress (M02-017/036).")}</p>
    </Shell>
  );
}
