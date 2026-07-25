import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EnforcementDecisionForm from "./EnforcementDecisionForm";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

type CaseRow = {
  id: string;
  case_type: string;
  status: string;
  origin_type: string | null;
  origin_ref: string | null;
  updated_at: string;
};

type RecommendationRow = {
  id: string;
  recommended_action: string;
  recommendation_notes: string | null;
  recommended_by: string;
  recommended_at: string;
  factories: { name: string; factory_code: string } | null;
};

export default async function EnforcementPage() {
  const [{ t, locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user } } = await getVerifiedUser(sb);
  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map((row) => row.role_key);
  const canDecide = roles.includes("ops") || roles.includes("compliance_admin");

  const [
    { data: cases, error: casesError },
    { data: objections, error: objectionsError },
    { data: violations, error: violationsError },
    { data: recommendations, error: recommendationsError },
    { data: decided, error: decidedError },
  ] = await Promise.all([
    sb.from("cases")
      .select("id,case_type,status,origin_type,origin_ref,updated_at,factories!inner(factory_code)")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("updated_at", { ascending: false })
      .limit(100),
    sb.from("objections")
      .select("id,status,grounds,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("violations")
      .select("id,inspections!inner(factory_id,factories!inner(factory_code))")
      .in("inspections.factories.factory_code", [...CLEAN_FACTORY_CODES])
      .limit(100),
    sb.from("enforcement_recommendations")
      .select("id,recommended_action,recommendation_notes,recommended_by,recommended_at,factories!inner(name,factory_code)")
      .eq("status", "pending")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("recommended_at", { ascending: true }),
    sb.from("enforcement_recommendations")
      .select("id,status,decided_at,decision_reason,decided_by,factories!inner(name,factory_code)")
      .neq("status", "pending")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("decided_at", { ascending: false })
      .limit(20),
  ]);

  const readUnavailable = Boolean(casesError || objectionsError || violationsError);
  const pendingRows = (recommendations ?? []) as unknown as RecommendationRow[];
  const errorStrings = {
    auth_required: tr("mvp3.enforcement.error.auth", "Your session expired. Sign in and try again.", "انتهت جلستك. سجّل الدخول وحاول مرة أخرى."),
    invalid_request: tr("mvp3.enforcement.error.invalid", "The decision request is invalid.", "طلب القرار غير صالح."),
    reason_required: tr("mvp3.enforcement.error.reason", "A decision reason is required.", "سبب القرار مطلوب."),
    maker_checker: tr("mvp3.enforcement.error.makerChecker", "Maker-checker blocked this decision: the recommender cannot decide their own recommendation.", "منع فصل المُعدّ عن المدقّق هذا القرار: لا يمكن لمقدم التوصية البت في توصيته."),
    conflict: tr("mvp3.enforcement.error.conflict", "This recommendation changed or was already decided. The write was rejected; reload before deciding again.", "تغيرت هذه التوصية أو تم البت فيها. رُفضت الكتابة؛ أعد التحميل قبل اتخاذ قرار جديد."),
    write_failed: tr("mvp3.enforcement.error.write", "The decision could not be recorded. No outcome was changed.", "تعذر تسجيل القرار. لم تتغير أي نتيجة."),
  };

  return (
    <Shell
      current="/enforcement"
      title={t("mvp3.enforcement.title", "Enforcement and correction lifecycle")}
      context={<span className="badge badge-info">M3-09 · CD-059 · {t("mvp3.enforcement.badge", "source-linked cases")}</span>}
    >
      <div className="sq-banner">
        <div>
          <strong>{t("mvp3.enforcement.rule", "Every outcome remains linked to its source inspection, clause and human decision.")}</strong>{" "}
          {t("mvp3.enforcement.ruleBody", "Missing links are shown as incomplete—not silently repaired.")}
        </div>
      </div>

      <div className="sq-banner sq-banner--warning" role="note">
        <div>
          <strong>{tr("mvp3.enforcement.config.title", "Enforcement policy: Not configured.", "سياسة الإنفاذ: غير مهيأة.")}</strong>{" "}
          {tr(
            "mvp3.enforcement.config.body",
            "The sponsor must supply the approved enforcement measure catalogue and the authoritative legal-basis wording for each measure, including its published instrument and version. Until supplied, no measure, amount, escalation ladder, citation or Arabic legal wording is asserted here.",
            "يجب على الراعي تزويد كتالوج تدابير الإنفاذ المعتمد والصياغة النظامية الموثوقة للأساس القانوني لكل تدبير، بما في ذلك الأداة المنشورة وإصدارها. وحتى يتم ذلك، لا تُعرض هنا أي تدابير أو مبالغ أو سلالم تصعيد أو استشهادات أو صياغة قانونية عربية.",
          )}
        </div>
      </div>

      {readUnavailable ? (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div>{t("mvp3.enforcement.unavailable", "The enforcement case contract is unavailable in this environment. No case count is claimed.")}</div>
        </div>
      ) : null}

      <div className="sq-grid" style={{ marginBlock: "var(--space-4)" }}>
        <section className="panel" style={{ padding: "var(--space-6)" }}>
          <p className="t-caption">{t("mvp3.enforcement.openCases", "Open cases")}</p>
          <strong className="sq-display">{casesError ? "—" : ((cases ?? []) as CaseRow[]).filter((row) => !["resolved", "closed"].includes(row.status)).length}</strong>
        </section>
        <section className="panel" style={{ padding: "var(--space-6)" }}>
          <p className="t-caption">{t("mvp3.enforcement.violations", "RLS-visible violations")}</p>
          <strong className="sq-display">{violationsError ? "—" : (violations ?? []).length}</strong>
        </section>
        <section className="panel" style={{ padding: "var(--space-6)" }}>
          <p className="t-caption">{t("mvp3.enforcement.objections", "Objections")}</p>
          <strong className="sq-display">{objectionsError ? "—" : (objections ?? []).length}</strong>
        </section>
      </div>

      <section className="panel stack" style={{ padding: "var(--space-6)" }}>
        <h2>{t("mvp3.enforcement.board", "Case board")}</h2>
        <div className="sq-tablewrap">
          <table className="sq-table">
            <thead><tr><th scope="col">{t("mvp3.enforcement.case", "Case")}</th><th scope="col">{t("common.source", "Source")}</th><th scope="col">{t("common.status", "Lifecycle")}</th><th scope="col">{t("common.updated", "Updated")}</th></tr></thead>
            <tbody>
              {((cases ?? []) as unknown as CaseRow[]).map((row) => (
                <tr key={row.id}>
                  <th scope="row"><a href={`/cases?case=${row.id}`}>{row.case_type}<div className="t-caption"><bdi>{row.id}</bdi></div></a></th>
                  <td>{row.origin_type ?? tr("mvp3.enforcement.unlinked", "unlinked", "غير مرتبط")}<div className="t-caption"><bdi>{row.origin_ref ?? "—"}</bdi></div></td>
                  <td><span className="badge">{row.status}</span></td>
                  <td>{new Date(row.updated_at).toLocaleString(locale)}</td>
                </tr>
              ))}
              {!casesError && !(cases ?? []).length ? <tr><td colSpan={4}>{t("mvp3.enforcement.empty", "No RLS-visible enforcement cases.")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h2>{tr("mvp3.enforcement.recommendations", "Enforcement recommendations", "توصيات الإنفاذ")}</h2>
          <span className="badge badge-warning">{pendingRows.length} {tr("mvp3.enforcement.pending", "pending", "معلقة")}</span>
        </div>
        {roleError ? <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("mvp3.enforcement.permissions", "Decision permissions could not be verified. Writes are disabled.", "تعذر التحقق من صلاحيات القرار. تم تعطيل الكتابة.")}</div></div> : null}
        {recommendationsError ? <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("mvp3.enforcement.recommendationsUnavailable", "The recommendation queue is unavailable. No pending count is claimed.", "قائمة التوصيات غير متاحة. لا يُدّعى أي عدد معلق.")}</div></div> : null}
        {!recommendationsError && !pendingRows.length ? <EmptyState title={tr("mvp3.enforcement.noRecommendations", "No pending recommendations", "لا توجد توصيات معلقة")} inline /> : null}
        {pendingRows.map((row) => (
          <article className="sq-panel stack" style={{ padding: "var(--space-6)" }} key={row.id}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <strong>{row.factories?.name ?? row.factories?.factory_code ?? "—"}</strong>
                <div className="t-caption"><bdi>{row.id}</bdi> · {new Date(row.recommended_at).toLocaleString(locale)}</div>
              </div>
              <span className="badge badge-warning">{tr("mvp3.enforcement.measureNotConfigured", "Recommended measure: Not configured", "التدبير الموصى به: غير مهيأ")}</span>
            </div>
            {row.recommendation_notes ? <p>{row.recommendation_notes}</p> : null}
            <dl className="sq-grid">
              <div><dt className="t-caption">{tr("mvp3.enforcement.measure", "Measure catalogue", "كتالوج التدابير")}</dt><dd>{tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ")}</dd></div>
              <div><dt className="t-caption">{tr("mvp3.enforcement.legalBasis", "Legal basis", "الأساس القانوني")}</dt><dd>{tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ")}</dd></div>
            </dl>
            {canDecide && !roleError ? (
              row.recommended_by === user?.id ? (
                <div className="sq-banner" role="note"><div>{errorStrings.maker_checker}</div></div>
              ) : (
                <EnforcementDecisionForm
                  recommendationId={row.id}
                  strings={{
                    approve: tr("mvp3.enforcement.approve", "Approve", "موافقة"),
                    reject: tr("mvp3.enforcement.reject", "Reject", "رفض"),
                    reason: tr("mvp3.enforcement.reason", "Decision basis (required)", "أساس القرار (مطلوب)"),
                    reasonPlaceholder: tr("mvp3.enforcement.reasonPlaceholder", "Recorded in the immutable audit trail", "يُسجَّل في مسار التدقيق غير القابل للتعديل"),
                    submit: tr("mvp3.enforcement.record", "Record decision", "تسجيل القرار"),
                    submitting: tr("mvp3.enforcement.recording", "Recording…", "جارٍ التسجيل…"),
                    success: tr("mvp3.enforcement.recorded", "Decision recorded and audited.", "تم تسجيل القرار وتدقيقه."),
                    errors: errorStrings,
                  }}
                />
              )
            ) : (
              <p className="t-caption">{tr("mvp3.enforcement.readOnly", "Read-only. An Operations or Compliance Admin checker records the decision.", "للقراءة فقط. يسجل مدقق من العمليات أو مسؤول الامتثال القرار.")}</p>
            )}
          </article>
        ))}
      </section>

      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}>
        <h2>{tr("mvp3.enforcement.audit", "Immutable decision trail", "مسار القرار غير القابل للتعديل")}</h2>
        {decidedError ? <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("mvp3.enforcement.auditUnavailable", "Decision history is unavailable. No history claim is made.", "سجل القرارات غير متاح. لا يُدّعى وجود سجل.")}</div></div> : null}
        <div className="sq-tablewrap">
          <table className="sq-table">
            <thead><tr><th scope="col">{tr("mvp3.enforcement.establishment", "Establishment", "المنشأة")}</th><th scope="col">{t("common.status", "Decision")}</th><th scope="col">{tr("mvp3.enforcement.reason", "Decision basis (required)", "أساس القرار (مطلوب)")}</th><th scope="col">{tr("mvp3.enforcement.decidedAt", "Recorded", "سُجِّل")}</th></tr></thead>
            <tbody>
              {(decided ?? []).map((row) => {
                const factory = row.factories as unknown as { name: string } | null;
                return <tr key={row.id}><td>{factory?.name ?? "—"}<div className="t-caption"><bdi>{row.id}</bdi></div></td><td><span className="badge">{row.status}</span></td><td>{row.decision_reason ?? "—"}</td><td>{row.decided_at ? new Date(row.decided_at).toLocaleString(locale) : "—"}</td></tr>;
              })}
              {!decidedError && !(decided ?? []).length ? <tr><td colSpan={4}>{tr("mvp3.enforcement.noHistory", "No decisions recorded yet.", "لم تُسجَّل قرارات بعد.")}</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="t-caption">{tr("mvp3.enforcement.auditRule", "Decision rows and their audit events cannot be edited or deleted from this screen.", "لا يمكن تعديل أو حذف صفوف القرارات وأحداث تدقيقها من هذه الشاشة.")}</p>
      </section>

      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}>
        <h2>{t("mvp3.enforcement.objectionQueue", "Correction and objection queue")}</h2>
        {(objections ?? []).map((row) => <div className="row" key={row.id} style={{ justifyContent: "space-between", flexWrap: "wrap" }}><span><strong>{row.grounds}</strong><small className="t-caption"> · {new Date(row.created_at).toLocaleDateString(locale)}</small></span><span className="badge">{row.status}</span></div>)}
        {!objectionsError && !(objections ?? []).length ? <p className="t-caption">{t("mvp3.enforcement.noObjections", "No RLS-visible objections.")}</p> : null}
      </section>
    </Shell>
  );
}
