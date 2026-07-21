import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import EmptyState from "@/components/EmptyState";
import { IconBlocked, IconEye, IconFolder } from "@/app/icons";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import DecideForm from "./DecideForm";

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
  const isReader = isDecider || roles.includes("inspector") || roles.includes("planner") || roles.includes("auditor") || roles.includes("reviewer") || roles.includes("leadership");

  const actionLabel = (a: string) => ({
    fine: tr("admin.enf.rec.fine", "Financial fine", "غرامة مالية"),
    committee: tr("admin.enf.rec.committee", "Refer to committee", "تحويل للجنة"),
    warning: tr("admin.enf.rec.warning", "Final warning", "إنذار نهائي"),
    closure: tr("admin.enf.rec.closure", "Immediate closure", "إغلاق فوري"),
  }[a] ?? a);

  if (!isReader) {
    return (
      <Shell current="/admin/enforcement-recommendations" title={t("admin.enf.rec.title", "Enforcement recommendations")}>
        <EmptyState icon={<IconBlocked size={28} />} title={tr("admin.enf.rec.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("admin.enf.rec.unauthorized.body", "This queue is available to Inspector, Planner, Ops, Compliance Admin, Auditor, Reviewer and Leadership roles.", "هذه القائمة متاحة لأدوار المفتش والمخطط والعمليات ومسؤول الامتثال والمدقق والمراجع والقيادة.")} />
      </Shell>
    );
  }

  const { data: pending, error: pendingError } = await sb
    .from("enforcement_recommendations")
    .select("id, factory_id, visit_id, recommended_action, recommendation_notes, recommended_by, recommended_at, factories(name, factory_code, city, region)")
    .eq("status", "pending")
    .order("recommended_at", { ascending: true });

  const { data: decided } = isDecider
    ? await sb.from("enforcement_recommendations")
        .select("id, factories(name), recommended_action, status, decided_at, decision_reason")
        .neq("status", "pending").order("decided_at", { ascending: false }).limit(20)
    : { data: [] as { id: string; factories: { name: string } | null; recommended_action: string; status: string; decided_at: string | null; decision_reason: string | null }[] };

  const readOnlyBanner = !isDecider ? (
    <div className="ax-banner" role="note">
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
    <Shell current="/admin/enforcement-recommendations" title={t("admin.enf.rec.title", "Enforcement recommendations")}
      context={<span className="badge badge-info">DEC-F</span>}>
      {roleError && <div className="ax-banner ax-banner--warning" role="alert"><div>{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div></div>}
      {readOnlyBanner}
      {pendingError && <div className="ax-banner ax-banner--warning" role="alert"><div>{tr("admin.enf.rec.loadError", "The recommendation queue is unavailable in this environment. No count is claimed.", "قائمة التوصيات غير متاحة في هذه البيئة. لا يُدَّعى أي عدد.")}</div></div>}

      <section className="panel stack" style={{ padding: "var(--ax-space-300)" }}>
        <h3>{tr("admin.enf.rec.pending", "Pending recommendations", "التوصيات المعلقة")}</h3>
        {!rows.length && !pendingError ? (
          <EmptyState icon={<IconFolder size={28} />} title={tr("admin.enf.rec.empty", "No pending recommendations", "لا توجد توصيات معلقة")} inline />
        ) : rows.map(row => (
          <div key={row.id} className="ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <strong>{row.factories?.name ?? row.factory_id}</strong>
                <div className="t-caption">{row.factories?.city ?? "—"}{row.factories?.region ? `, ${row.factories.region}` : ""} · {row.factories?.factory_code ?? tr("admin.enf.rec.unregistered", "unregistered/temporary", "غير مسجّلة/مؤقتة")}</div>
              </div>
              <span className="badge badge-warning">{actionLabel(row.recommended_action)}</span>
            </div>
            {row.recommendation_notes && <p className="t-caption">{row.recommendation_notes}</p>}
            <p className="t-caption numeric">{new Date(row.recommended_at).toLocaleString()}</p>
            {isDecider
              ? <DecideForm id={row.id} strings={{
                  approve: tr("admin.enf.rec.approve", "Approve", "الموافقة"),
                  reject: tr("admin.enf.rec.reject", "Reject", "رفض"),
                  reasonLabel: tr("admin.enf.rec.reasonLabel", "Decision reason (optional)", "سبب القرار (اختياري)"),
                  reasonPlaceholder: tr("admin.enf.rec.reasonPlaceholder", "Recorded with the audit event", "يُسجَّل مع حدث التدقيق"),
                  submit: tr("admin.enf.rec.submit", "Record decision", "تسجيل القرار"),
                  recording: tr("admin.enf.rec.recording", "Recording…", "جارٍ التسجيل…"),
                }} />
              : <p className="t-caption">{tr("admin.enf.rec.awaitingDecider", "Awaiting an Operations or Compliance Admin decision.", "بانتظار قرار من العمليات أو مسؤول الامتثال.")}</p>}
          </div>
        ))}
      </section>

      {isDecider && (
        <section className="panel stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}>
          <h3>{tr("admin.enf.rec.recent", "Recently decided", "تم البت فيها مؤخرًا")}</h3>
          {!(decided ?? []).length ? <p className="t-caption">{tr("admin.enf.rec.noneDecided", "No decisions recorded yet.", "لم تُسجَّل أي قرارات بعد.")}</p> : (
            <div className="ax-tablewrap"><table className="ax-table"><tbody>
              {(decided ?? []).map(d => (
                <tr key={d.id}>
                  <td>{(d.factories as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td>{actionLabel(d.recommended_action)}</td>
                  <td><span className={`ax-lozenge ${d.status === "approved" ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{d.status}</span></td>
                  <td className="t-caption numeric">{d.decided_at ? new Date(d.decided_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>
      )}
    </Shell>
  );
}
