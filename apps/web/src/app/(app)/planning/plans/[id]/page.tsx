import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";
import { IconCalendar } from "@/app/icons";
import { getPlanningAccess } from "@/lib/planning/access";

// FIX WAVE F4 — M02-017: plan drill-down listing every child visit with its
// assignment; M02-036: per-plan progress calculation (completed / published /
// returned / cancelled / expired counts + segmented % bar). Counts are computed
// from persisted states; the scheduled expiry sweep owns published→expired, so
// this read route never mutates lifecycle state (M02-016 / CR-098).

const PLAN_TONE: Record<string, string> = { published: "sq-lozenge--info", returned: "sq-lozenge--warning", cancelled: "sq-lozenge--critical", expired: "sq-lozenge--critical" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ChildVisit = {
  id: string; visit_reference: string | null; visit_type: string; execution_mode: string; planning_status: string;
  operational_state: string; window_start: string; window_end: string;
  factories: { id: string; name: string } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
  inspections: { status: string } | null; // TO-ONE embed — object or null
};


export default async function PlanDrilldown({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const fmt = (iso: string) => formatDateTime(iso, locale === "ar" ? "ar" : "en");
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.view"]);
  if (access.error) {
    return (
      <Shell current="/planning" title={t("plan.drill.errorTitle", "Plan — error")}>
        <EmptyState glyph="⚠"
          title={tr("plan.drill.unavailable.title", "Plan not available", "الخطة غير متاحة")}
          body={tr("plan.drill.unavailable.body", "We couldn't check your access to this plan. Nothing was changed. Try again once access is fixed.", "تعذّر التحقق من صلاحية الوصول إلى هذه الخطة. لم يتم تغيير أي بيانات. حاول مرة أخرى بعد إصلاح الوصول.")} />
      </Shell>
    );
  }
  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={t("plan.drill.notFoundTitle", "Plan details")}>
        <EmptyState glyph="⛔"
          title={tr("plan.home.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
          body={tr("plan.drill.unauthorized.body", "You need planning access to view plan details.", "يلزم صلاحية تخطيط لعرض تفاصيل الخطة.")} />
      </Shell>
    );
  }
  if (!UUID.test(id)) {
    return (
      <Shell current="/planning" title={t("plan.drill.notFoundTitle", "Plan not found")}>
        <EmptyState glyph="∅"
          title={t("plan.drill.notFound", "Not in your scope or does not exist")}
          body={tr("plan.drill.invalidId", "The plan reference is not valid. Go back to Visit plans and choose one that exists.", "مرجع الخطة غير صالح. ارجع إلى خطط الزيارات واختر خطة متاحة.")} />
      </Shell>
    );
  }
  // M02-016 expiry is owned by pg_cron sweep expire_lapsed_visits_scheduled
  // (0025, every 15 min, unscoped); boards render display-level 'expired' for
  // lapsed windows in between ticks. No per-page-load mutating RPC (K-009).
  const [{ data: plan, error: pErr }, { data: kids, error: kErr }] = await Promise.all([
    sb.from("visit_plans")
      .select("id, plan_reference, method, status, criteria, created_at, published_at, profiles!visit_plans_created_by_fkey(full_name)")
      .eq("id", id).maybeSingle(),
    sb.from("visits")
      .select(`id, visit_reference, visit_type, execution_mode, planning_status, operational_state, window_start, window_end,
        factories(id, name), assignments(profiles(full_name)), inspections(status)`)
      .eq("visit_plan_id", id).order("window_start", { ascending: true }),
  ]);
  if (pErr || kErr) {
    console.error("[planning plan drill read]", pErr ?? kErr);
    return <Shell current="/planning" title={t("plan.drill.errorTitle", "Plan — error")}>
      <div className="sq-banner sq-banner--critical"><div>{t("plan.drill.loadErrorSafe", "We couldn't load the plan. Nothing was changed. Try again once access is fixed.")}</div></div>
    </Shell>;
  }
  if (!plan) {
    return <Shell current="/planning" title={t("plan.drill.notFoundTitle", "Plan not found")}>
      <EmptyState glyph="∅" title={t("plan.drill.notFound", "Not in your scope or does not exist")}
        body={t("plan.drill.notFoundDesc", "Plan visibility is RLS-enforced for authorised planning staff.")} />
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
    { key: "completed", label: t("plan.drill.completed", "completed"), n: completed, bg: "var(--status-compliant)" },
    { key: "published", label: t("enum.published", "published"), n: published, bg: "var(--status-info)" },
    { key: "draft", label: t("enum.draft", "draft"), n: draft, bg: "var(--border-subtle)" },
    { key: "returned", label: t("enum.returned", "returned"), n: returned, bg: "var(--status-warning)" },
    { key: "cancelled", label: t("enum.cancelled", "cancelled"), n: cancelled, bg: "var(--status-critical)" },
    { key: "expired", label: t("enum.expired", "expired"), n: expired, bg: "var(--status-critical-text)" },
  ];

  return (
    <Shell current="/planning" title={t("plan.drill.title", "Plan {id}").replace("{id}", plan.plan_reference ?? tr("plan.referenceUnavailable", "Reference not available", "المرجع غير متاح"))}
      context={<>
        <span className="sq-lozenge sq-lozenge--info">{t(`enum.${plan.method}`, plan.method)}</span>
        <span className={`sq-lozenge sq-lozenge--plan ${PLAN_TONE[plan.status] ?? ""}`}>{t(`enum.${plan.status}`, plan.status)}</span>
      </>}>
      <div className="sq-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <a className="sq-link" href="/planning/plans">← {t("plan.drill.backToRegister", "Visit plans")}</a>
        <span className="sq-caption sq-numeric">
          {t("plan.drill.createdBy", "created by")} <strong>{creator}</strong> · {fmt(plan.created_at)}
          {plan.published_at && <> · {t("plan.drill.publishedAt", "published")} {fmt(plan.published_at)}</>}
        </span>
      </div>

      {/* M02-036 — progress calculation + % bar over persisted child states */}
      <div className="sq-surface" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="sq-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h4 style={{ margin: 0 }}>{t("plan.drill.progressHeading", "Plan progress")}</h4>
          <span className="sq-numeric"><strong>{pct(completed)}%</strong> {t("plan.drill.progressOf", "of {n} child visits completed").replace("{n}", String(total))}</span>
        </div>
        {total > 0 && (
          <div role="img" aria-label={t("plan.drill.progressBarAria", "Progress by child-visit state")}
            style={{ display: "flex", blockSize: 12, borderRadius: "var(--radius-full)", overflow: "hidden", background: "var(--surface-secondary)" }}>
            {segments.filter(s => s.n > 0).map(s => (
              <div key={s.key} title={`${s.label}: ${s.n}`} style={{ inlineSize: `${(s.n / total) * 100}%`, background: s.bg }} />
            ))}
          </div>
        )}
        <div className="sq-row" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
          {segments.map(s => (
            <span key={s.key} className="sq-caption">
              <span aria-hidden="true" style={{ display: "inline-block", inlineSize: 10, blockSize: 10, borderRadius: "var(--radius-full)", background: s.bg, marginInlineEnd: 6 }} />
              {s.label} <span className="sq-numeric"><strong>{s.n}</strong></span>
            </span>
          ))}
        </div>
      </div>

      {/* M02-017 — child visits with assignments */}
      {visits.length === 0 ? (
        <EmptyState icon={<IconCalendar size={28} />} title={t("plan.drill.noChildren", "No child visits under this plan")}
          body={t("plan.drill.noChildrenDesc", "Visits are attached at plan creation; immediate visits never carry a plan.")} />
      ) : (
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr>
            <th scope="col">{t("plan.drill.colVisit", "Visit")}</th>
            <th scope="col">{t("plan.drill.colFactory", "Factory")}</th>
            <th scope="col">{t("plan.drill.colTypeMode", "Type · mode")}</th>
            <th scope="col">{t("plan.drill.colPlanning", "Planning status")}</th>
            <th scope="col">{t("plan.drill.colOperational", "Visit status")}</th>
            <th scope="col">{t("plan.drill.colInspector", "Inspector")}</th>
            <th scope="col" className="sq-td-num">{t("plan.drill.colWindow", "Window")}</th>
          </tr></thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id}>
                <td className="sq-numeric"><a className="sq-link" href={`/visits/${v.id}`}><strong>{v.visit_reference ?? tr("plan.referenceUnavailable", "Reference not available", "المرجع غير متاح")}</strong></a></td>
                <td>{v.factories ? <a className="sq-link" href={`/factories/${v.factories.id}`}>{v.factories.name}</a> : "—"}</td>
                <td>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)}</td>
                <td><span className={`sq-lozenge sq-lozenge--plan ${PLAN_TONE[v.planning_status] ?? ""}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
                  {v.inspections?.status === "approved" && <> <span className="sq-lozenge sq-lozenge--success">{t("plan.drill.completed", "completed")}</span></>}</td>
                <td><span className="sq-lozenge sq-lozenge--ops">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span></td>
                <td>{v.assignments?.[0]?.profiles?.full_name ?? "—"}</td>
                <td className="sq-td-num sq-numeric">{fmt(v.window_start)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </Shell>
  );
}
