import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import EmptyState from "@/components/EmptyState";
import { IconBlocked, IconEye, IconFolder } from "@/app/icons";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import DecideForm from "./DecideForm";
import styles from "./responsive.module.css";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

// DEC-F — Unlicensed-establishment enforcement recommendation review.
// Inspector-submitted recommendations (planning/immediate/actions.ts) land
// here as 'pending'; only ops/compliance_admin can decide (RLS-enforced,
// see 20260719010000_dec_f_enforcement_recommendations.sql). This route
// itself has no product-contract screen_id yet — a housekeeping follow-up,
// not a blocker to the capability working.
export default async function EnforcementRecommendations() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: roleRows, error: roleError } = user
    ? await getUserRoles(user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map(r => r.role_key);
  const isDecider = roles.includes("ops") || roles.includes("compliance_admin");
  const canDecide = false;
  const isReader = isDecider || roles.includes("inspector") || roles.includes("planner") || roles.includes("auditor") || roles.includes("reviewer") || roles.includes("leadership");

  const actionLabel = (action: string) => ({
    fine: tr("admin.enf.rec.measure.fine", "Financial fine", "غرامة مالية"),
    committee: tr("admin.enf.rec.measure.committee", "Refer to committee", "تحويل للجنة"),
    warning: tr("admin.enf.rec.measure.warning", "Warning", "إنذار"),
    closure: tr("admin.enf.rec.measure.closure", "Factory closure", "إغلاق منشأة"),
  }[action] ?? tr("admin.enf.rec.measureUnavailable", "Unavailable recommendation category", "فئة التوصية غير متاحة"));

  if (roleError) {
    return (
      <Shell current="/admin/enforcement-recommendations" title={tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}>
        <h1 className="sq-sr-only">{tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}</h1>
        <EmptyState
          icon={<IconBlocked size={28} />}
          title={tr("admin.permissionsUnavailable.title", "Permissions unavailable", "الصلاحيات غير متاحة")}
          body={tr("admin.permissionsUnavailable.body", "Your permissions could not be verified. No recommendation data or action is shown; retry the page.", "تعذر التحقق من صلاحياتك. لم يتم عرض بيانات التوصيات أو أي إجراء؛ أعد تحميل الصفحة.")}
        />
      </Shell>
    );
  }

  if (!isReader) {
    return (
      <Shell current="/admin/enforcement-recommendations" title={tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}>
        <h1 className="sq-sr-only">{tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}</h1>
        <EmptyState icon={<IconBlocked size={28} />} title={tr("admin.enf.rec.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("admin.enf.rec.unauthorized.body", "This queue is available to Inspector, Planner, Ops, Compliance Admin, Auditor, Reviewer and Leadership roles.", "هذه القائمة متاحة لأدوار المفتش والمخطط والعمليات ومسؤول الامتثال والمدقق والمراجع والقيادة.")} />
      </Shell>
    );
  }

  const { data: pending, error: pendingError } = await sb
    .from("enforcement_recommendations")
    .select("id, factory_id, visit_id, recommended_action, recommendation_notes, recommended_by, recommended_at, factories!inner(name, factory_code, city, region)")
    .eq("status", "pending")
    .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
    .order("recommended_at", { ascending: true });

  const { data: decided, error: decidedError } = isDecider
    ? await sb.from("enforcement_recommendations")
        .select("id, factories!inner(name,factory_code), recommended_action, status, decided_at, decision_reason")
        .neq("status", "pending")
        .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
        .order("decided_at", { ascending: false }).limit(20)
    : {
        data: [] as { id: string; factories: { name: string } | null; recommended_action: string; status: string; decided_at: string | null; decision_reason: string | null }[],
        error: null,
      };

  const readOnlyBanner = !isDecider ? (
    <div className="sq-banner" role="note">
      <strong><IconEye size={16} /> {tr("admin.enf.rec.readonly.title", "Read-only for your role", "للعرض فقط بحسب دورك")}</strong>{" "}
      {tr("admin.enf.rec.readonly.body", "You can view the recommendation queue; deciding requires an Operations or Compliance Admin role, enforced by row-level security.", "يمكنك عرض قائمة التوصيات؛ يتطلب اتخاذ القرار دور العمليات أو مسؤول الامتثال، ويُفرض ذلك عبر أمان مستوى الصف.")}
    </div>
  ) : null;

  const rows = (pending ?? []) as unknown as {
    id: string; factory_id: string; visit_id: string | null; recommended_action: string;
    recommendation_notes: string | null; recommended_by: string; recommended_at: string;
    factories: { name: string; factory_code: string | null; city: string | null; region: string | null } | null;
  }[];

  return (
    <Shell current="/admin/enforcement-recommendations" title={tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}
      context={<span className="badge badge-info">DEC-F</span>}>
      <h1 className="sq-sr-only">{tr("admin.enf.rec.title", "Enforcement recommendations", "توصيات الإنفاذ")}</h1>
      <div className={styles.pageRoot}>
      <div className="sq-banner sq-banner--warning" role="note"><div><strong>{tr("admin.enf.rec.configTitle", "Enforcement policy: Not configured.", "سياسة الإنفاذ: غير مهيأة.")}</strong>{" "}{tr("admin.enf.rec.configBody", "The sponsor must supply the approved enforcement measure catalogue and authoritative legal-basis wording for each measure, including the published instrument and version. No amount, escalation ladder, citation or Arabic legal wording is asserted until supplied.", "يجب على الراعي تزويد كتالوج تدابير الإنفاذ المعتمد والصياغة الموثوقة للأساس القانوني لكل تدبير، بما في ذلك الأداة المنشورة وإصدارها. لا تُعرض مبالغ أو سلالم تصعيد أو استشهادات أو صياغة قانونية عربية حتى يتم توفيرها.")}</div></div>
      <div className="sq-banner" role="note"><div><strong>{tr("admin.enf.rec.scopeTitle", "Decision scope", "نطاق القرار")}</strong>{" "}
        {tr("admin.enf.rec.scopeBody", "Decisions are temporarily read-only until the database exposes an atomic guarded decision transition. A future approval will record the recommendation decision only; it will not apply a penalty, close an establishment, issue a legal notice, or bypass governed enforcement configuration.", "القرارات للقراءة فقط مؤقتًا حتى توفر قاعدة البيانات انتقال قرار ذريًا ومحميًا. ستسجل الموافقة المستقبلية القرار بشأن التوصية فقط؛ ولن تطبق عقوبة أو تغلق منشأة أو تصدر إشعارًا قانونيًا أو تتجاوز إعدادات الإنفاذ المحكومة.")}</div></div>
      {readOnlyBanner}
      {pendingError && <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("admin.enf.rec.loadError", "The recommendation queue is unavailable in this environment. No count is claimed.", "قائمة التوصيات غير متاحة في هذه البيئة. لا يُدَّعى أي عدد.")}</div></div>}

      <section className="panel stack" style={{ padding: "var(--space-6)" }}>
        <h2>{tr("admin.enf.rec.pending", "Pending recommendations", "التوصيات المعلقة")}</h2>
        {!rows.length && !pendingError ? (
          <div className="sq-state sq-state--inline" role="status">
            <span className="sq-state__glyph" aria-hidden="true"><IconFolder size={28} /></span>
            <h3>{tr("admin.enf.rec.empty", "No pending recommendations", "لا توجد توصيات معلقة")}</h3>
          </div>
        ) : rows.map(row => (
          <div key={row.id} className="sq-panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <strong>{row.factories?.name ?? row.factory_id}</strong>
                <div className="t-caption">{row.factories?.city ?? "—"}{row.factories?.region ? `, ${row.factories.region}` : ""} · {row.factories?.factory_code ?? tr("admin.enf.rec.unregistered", "unregistered/temporary", "غير مسجّلة/مؤقتة")}</div>
              </div>
              <span className="badge badge-warning">{tr("admin.enf.rec.measureLabel", "Recommended measure", "التدبير الموصى به")}: {actionLabel(row.recommended_action)}</span>
            </div>
            {row.recommendation_notes && <p className="t-caption">{row.recommendation_notes}</p>}
            <p className="t-caption numeric">{new Date(row.recommended_at).toLocaleString(locale)}</p>
            {isDecider && canDecide
              ? <DecideForm id={row.id} strings={{
                  approve: tr("admin.enf.rec.approve", "Approve", "الموافقة"),
                  reject: tr("admin.enf.rec.reject", "Reject", "رفض"),
                  reasonLabel: tr("admin.enf.rec.reasonLabel", "Decision basis (required)", "أساس القرار (مطلوب)"),
                  reasonPlaceholder: tr("admin.enf.rec.reasonPlaceholder", "Recorded with the audit event", "يُسجَّل مع حدث التدقيق"),
                  submit: tr("admin.enf.rec.submit", "Record decision", "تسجيل القرار"),
                  recording: tr("admin.enf.rec.recording", "Recording…", "جارٍ التسجيل…"),
                  success: tr("admin.enf.rec.success", "Decision recorded. The recommendation queue will refresh.", "تم تسجيل القرار. سيتم تحديث قائمة التوصيات."),
                  errors: {
                    auth_required: tr("admin.enf.rec.error.auth", "Your session is unavailable. Sign in again.", "جلستك غير متاحة. سجّل الدخول مرة أخرى."),
                    invalid_request: tr("admin.enf.rec.error.invalid", "Choose a valid decision.", "اختر قرارًا صالحًا."),
                    reason_required: tr("admin.enf.rec.error.reason", "A decision basis is required.", "أساس القرار مطلوب."),
                    already_decided: tr("admin.enf.rec.error.conflict", "This recommendation was already decided. Refresh the queue.", "تم البت في هذه التوصية مسبقًا. حدّث القائمة."),
                    maker_checker: tr("admin.enf.rec.error.makerChecker", "The recommender cannot decide their own recommendation.", "لا يمكن لمقدم التوصية البت في توصيته."),
                    write_failed: tr("admin.enf.rec.error.write", "The decision could not be recorded. No change was claimed.", "تعذر تسجيل القرار. لم يتم الادعاء بإجراء أي تغيير."),
                    backend_guard_required: tr("admin.enf.rec.error.backendGuard", "Decision recording is unavailable until the guarded database transition is deployed.", "تسجيل القرار غير متاح حتى نشر انتقال قاعدة البيانات المحمي."),
                  },
                }} />
              : <p className="t-caption">{isDecider
                ? tr("admin.enf.rec.guardPending", "Decision unavailable — guarded database transition required.", "القرار غير متاح — يلزم انتقال قاعدة بيانات محمي.")
                : tr("admin.enf.rec.awaitingDecider", "Awaiting an Operations or Compliance Admin decision.", "بانتظار قرار من العمليات أو مسؤول الامتثال.")}</p>}
          </div>
        ))}
      </section>

      {isDecider && (
        <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}>
          <h2>{tr("admin.enf.rec.recent", "Recently decided", "تم البت فيها مؤخرًا")}</h2>
          {decidedError ? (
            <div className="sq-banner sq-banner--warning" role="alert"><div>
              {tr("admin.enf.rec.decidedLoadError", "Recent decisions are unavailable. No history count is claimed.", "القرارات الأخيرة غير متاحة. لا يُدّعى أي عدد للسجل.")}
            </div></div>
          ) : !(decided ?? []).length ? <p className="t-caption">{tr("admin.enf.rec.noneDecided", "No decisions recorded yet.", "لم تُسجَّل أي قرارات بعد.")}</p> : (
            <div className="sq-tablewrap" tabIndex={0} aria-label={tr("admin.enf.rec.recent", "Recently decided", "تم البت فيها مؤخرًا")}><table className="sq-table"><tbody>
              {(decided ?? []).map(d => (
                <tr key={d.id}>
                  <td>{(d.factories as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td>{actionLabel(d.recommended_action)}</td>
                  <td><span className={`sq-lozenge ${d.status === "approved" ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>{d.status === "approved"
                    ? tr("admin.enf.rec.status.approved", "Approved", "معتمد")
                    : tr("admin.enf.rec.status.rejected", "Rejected", "مرفوض")}</span></td>
                  <td className="t-caption numeric">{d.decided_at ? new Date(d.decided_at).toLocaleString(locale) : "—"}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>
      )}
      </div>
    </Shell>
  );
}
