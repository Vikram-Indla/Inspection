import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";
import { getPlanningAccess } from "@/lib/planning/access";

// FIX WAVE F4 — M02-035: plan register. Every visit plan (bulk/single) with
// method, status, creator, published_at and child-visit count; drill-down per
// plan lives at /planning/plans/[id] (M02-017/036). RLS plans_read governs
// visibility (planner/ops/reviewer/auditor/leadership).

const PLAN_TONE: Record<string, string> = { published: "sq-lozenge--info", returned: "sq-lozenge--warning", cancelled: "sq-lozenge--critical", expired: "sq-lozenge--critical" };

type PlanRow = {
  id: string; plan_reference: string | null; method: string; status: string; created_at: string; published_at: string | null;
  profiles: { full_name: string } | null;
  visits: { count: number }[];
};


export default async function PlanRegister() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const fmt = (iso: string) => formatDateTime(iso, locale === "ar" ? "ar" : "en");
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.view"]);
  if (access.error) {
    return (
      <Shell current="/planning" title={t("plan.register.title", "Visit plans")}>
        <EmptyState glyph="⚠"
          title={tr("plan.register.unavailable.title", "Plan register unavailable", "سجل الخطط غير متاح")}
          body={tr("plan.register.unavailable.body", "The Planning register read contract could not be verified. Nothing was changed. Retry after access configuration is restored.", "تعذر التحقق من عقد قراءة سجل التخطيط. لم يتم تغيير أي بيانات. أعد المحاولة بعد استعادة إعدادات الوصول.")} />
      </Shell>
    );
  }
  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={t("plan.register.title", "Visit plans")}>
        <EmptyState glyph="⛔"
          title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("plan.register.unauthorized.body", "Viewing visit plans requires an authorized planning capability.", "يتطلب عرض خطط الزيارات صلاحية تخطيط مصرحاً بها.")} />
      </Shell>
    );
  }
  const { data, error } = await sb.from("visit_plans")
    .select("id, plan_reference, method, status, created_at, published_at, profiles!visit_plans_created_by_fkey(full_name), visits(count)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[planning plan register]", error);
    return (
      <Shell current="/planning" title={t("plan.register.title", "Visit plans")}>
        <div className="sq-banner sq-banner--critical"><div>{t("plan.register.loadErrorSafe", "Could not load plans through the authorized read path. Nothing was changed. Retry after access configuration is restored.")}</div></div>
      </Shell>
    );
  }
  const plans = (data ?? []) as unknown as PlanRow[];
  const counts: Record<string, number> = {};
  for (const p of plans) counts[p.status] = (counts[p.status] ?? 0) + 1;
  return (
    <Shell current="/planning" title={t("plan.register.title", "Visit plans")}
      context={<span className="sq-lozenge sq-lozenge--info">{t("plan.register.context", "every plan with child-visit progress")}</span>}>
      <div className="sq-mstrip">
        {["draft", "published", "returned", "cancelled"].map(s => (
          <div key={s}>
            <div className="sq-mstrip__label">{t(`enum.${s}`, s)}</div>
            <div className="sq-mstrip__value sq-numeric">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>
      {plans.length === 0 ? (
        <EmptyState glyph="▦" title={t("plan.register.empty", "No plans yet")}
          body={t("plan.register.emptyDesc", "Bulk and single plans appear here the moment they are created.")}>
          <a className="sq-btn" href="/planning">{t("plan.register.createPlan", "Create a plan")}</a>
        </EmptyState>
      ) : (
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr>
            <th scope="col">{t("plan.register.colPlan", "Plan")}</th>
            <th scope="col">{t("plan.register.colMethod", "Method")}</th>
            <th scope="col">{t("plan.register.colStatus", "Status")}</th>
            <th scope="col">{t("plan.register.colCreatedBy", "Created by")}</th>
            <th scope="col" className="sq-td-num">{t("plan.register.colCreated", "Created")}</th>
            <th scope="col" className="sq-td-num">{t("plan.register.colPublished", "Published")}</th>
            <th scope="col" className="sq-td-num">{t("plan.register.colVisits", "Child visits")}</th>
          </tr></thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td className="sq-numeric"><a className="sq-link" href={`/planning/plans/${p.id}`}><strong>{p.plan_reference ?? tr("plan.referenceUnavailable", "Reference unavailable", "المرجع غير متاح")}</strong></a></td>
                <td><span className="sq-lozenge sq-lozenge--info">{t(`enum.${p.method}`, p.method)}</span></td>
                <td><span className={`sq-lozenge sq-lozenge--plan ${PLAN_TONE[p.status] ?? ""}`}>{t(`enum.${p.status}`, p.status)}</span></td>
                <td>{p.profiles?.full_name ?? "—"}</td>
                <td className="sq-td-num sq-numeric">{fmt(p.created_at)}</td>
                <td className="sq-td-num sq-numeric">{p.published_at ? fmt(p.published_at) : "—"}</td>
                <td className="sq-td-num sq-numeric">{p.visits?.[0]?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <p className="sq-caption">{t("plan.register.drillHint", "Open a plan to see its child visits and per-plan progress.")}</p>
    </Shell>
  );
}
