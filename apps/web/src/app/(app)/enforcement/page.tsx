import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EnforcementDecisionForm from "./EnforcementDecisionForm";
import EnforcementLibrary, {
  type EnforcementLibraryRow,
  type EnforcementLibraryStrings,
} from "./EnforcementLibrary";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

type RuntimeViolation = {
  id: string;
  mapping_version: string;
  invalidated_at: string | null;
  violation_codes: {
    code: string;
    title: string;
    level: string;
  } | null;
  inspections: {
    id: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    visits: {
      id: string;
      factories: {
        id: string;
        name: string;
        factory_code: string;
        license_number: string | null;
        region: string | null;
        city: string | null;
      } | null;
      assignments: {
        status: string;
        profiles: { full_name: string } | null;
      }[];
    } | null;
    action_forms: {
      id: string;
      violation_id: string | null;
      form_type: string;
      status: string;
      owner_name: string | null;
    }[];
    evidence: {
      id: string;
      linked_type: string;
      linked_id: string;
      content_sha256: string | null;
    }[];
  } | null;
};

type RecommendationRow = {
  id: string;
  recommendation_notes: string | null;
  recommended_by: string;
  recommended_at: string;
  factories: {
    name: string;
    factory_code: string;
  } | null;
};

type DecidedRecommendationRow = {
  id: string;
  status: string;
  decided_at: string | null;
  decision_reason: string | null;
  factories: {
    name: string;
    factory_code: string;
  } | null;
};

// WA-DES-023 · WA-M6-AC-001/002/004/005 · M3-09 · CD-059
// The responsive library and the DEC-F recommendation queue are one governed
// enforcement surface. Policy-held measures and legal wording remain
// explicitly unconfigured; only the approved/rejected human disposition and
// its required basis can be recorded through the guarded server action.
export default async function EnforcementPage() {
  const [{ t, locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user } } = await getVerifiedUser(sb);

  const [
    { data, error },
    roleRead,
    recommendationRead,
    decidedRead,
  ] = await Promise.all([
    sb
      .from("violations")
      .select(`
        id,mapping_version,invalidated_at,
        violation_codes(code,title,level),
        inspections!inner(
          id,status,started_at,submitted_at,
          visits!inner(
            id,
            factories!inner(id,name,factory_code,license_number,region,city),
            assignments(status,profiles(full_name))
          ),
          action_forms(id,violation_id,form_type,status,owner_name),
          evidence(id,linked_type,linked_id,content_sha256)
        )
      `)
      .in("inspections.visits.factories.factory_code", [...CLEAN_FACTORY_CODES])
      .limit(100),
    user
      ? sb.from("user_roles").select("role_key").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { role_key: string }[], error: null }),
    sb
      .from("enforcement_recommendations")
      .select("id,recommendation_notes,recommended_by,recommended_at,factories!inner(name,factory_code)")
      .eq("status", "pending")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("recommended_at", { ascending: true }),
    sb
      .from("enforcement_recommendations")
      .select("id,status,decided_at,decision_reason,factories!inner(name,factory_code)")
      .neq("status", "pending")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("decided_at", { ascending: false })
      .limit(20),
  ]);

  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const canDecide = !roleRead.error && (roles.has("ops") || roles.has("compliance_admin"));
  const recommendations = (recommendationRead.data ?? []) as unknown as RecommendationRow[];
  const decided = (decidedRead.data ?? []) as unknown as DecidedRecommendationRow[];

  const strings: EnforcementLibraryStrings = {
    search: tr("mvp3.enforcement.search", "Search enforcement", "البحث في سجلات الإنفاذ"),
    status: tr("mvp3.enforcement.filter.status", "Status", "الحالة"),
    allStatuses: tr("mvp3.enforcement.filter.allStatuses", "All statuses", "جميع الحالات"),
    region: tr("mvp3.enforcement.filter.region", "Region", "المنطقة"),
    allRegions: tr("mvp3.enforcement.filter.allRegions", "All regions", "جميع المناطق"),
    export: tr("mvp3.enforcement.export", "Export", "تصدير"),
    exportUnavailable: tr("mvp3.enforcement.exportUnavailable", "Export is not configured for this governed record set.", "التصدير غير مهيأ لمجموعة السجلات المحكومة هذه."),
    licence: tr("mvp3.enforcement.licence", "Licence", "الترخيص"),
    penalty: tr("mvp3.enforcement.penalty", "Applied penalty", "العقوبة المطبقة"),
    inspector: tr("mvp3.enforcement.inspector", "Inspector", "المفتش"),
    issueDate: tr("mvp3.enforcement.issueDate", "Inspection date", "تاريخ التفتيش"),
    actionForm: tr("mvp3.enforcement.actionForm", "Action form", "نموذج الإجراء"),
    notConfigured: tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ"),
    noActionForm: tr("mvp3.enforcement.noActionForm", "No linked action form", "لا يوجد نموذج إجراء مرتبط"),
    empty: tr("mvp3.enforcement.empty", "No RLS-visible enforcement records match these filters.", "لا توجد سجلات إنفاذ ظاهرة وفق صلاحيات الصفوف تطابق عوامل التصفية."),
    close: tr("common.close", "Close", "إغلاق"),
    factorySummary: tr("mvp3.enforcement.factorySummary", "Factory summary", "ملخص المنشأة"),
    inspectionSummary: tr("mvp3.enforcement.inspectionSummary", "Inspection summary", "ملخص التفتيش"),
    violation: tr("mvp3.enforcement.violation", "Violation", "المخالفة"),
    evidence: tr("mvp3.enforcement.evidence", "Evidence", "الأدلة"),
    attachments: tr("mvp3.enforcement.attachments", "Linked attachments", "المرفقات المرتبطة"),
    custody: tr("mvp3.enforcement.custody", "Chain of custody", "سلسلة الحيازة"),
    custodyRecorded: tr("mvp3.enforcement.custodyRecorded", "Content hashes recorded", "تم تسجيل بصمات المحتوى"),
    custodyIncomplete: tr("mvp3.enforcement.custodyIncomplete", "Hash record incomplete", "سجل البصمة غير مكتمل"),
    timeline: tr("mvp3.enforcement.timeline", "Enforcement timeline", "الخط الزمني للإنفاذ"),
    recorded: tr("mvp3.enforcement.recorded", "Inspection recorded", "تم تسجيل التفتيش"),
    audit: tr("mvp3.enforcement.audit", "Audit", "التدقيق"),
    mappingVersion: tr("mvp3.enforcement.mappingVersion", "Immutable mapping version", "إصدار الربط غير القابل للتعديل"),
    openFactory: tr("mvp3.enforcement.openFactory", "Open Factory 360", "فتح ملف المنشأة 360"),
  };

  const rows = ((data ?? []) as unknown as RuntimeViolation[]).flatMap((violation): EnforcementLibraryRow[] => {
    const inspection = violation.inspections;
    const visit = inspection?.visits;
    const factory = visit?.factories;
    const code = violation.violation_codes;
    if (!inspection || !visit || !factory || !code) return [];

    const actionForm = (inspection.action_forms ?? []).find((form) => form.violation_id === violation.id) ?? null;
    const evidence = (inspection.evidence ?? []).filter((item) => item.linked_id === violation.id);
    const assignment = (visit.assignments ?? []).find((item) => item.status !== "returned") ?? visit.assignments?.[0] ?? null;
    const recordedAt = inspection.submitted_at ?? inspection.started_at;

    return [{
      id: violation.id,
      code: code.code,
      title: code.title,
      level: code.level,
      status: violation.invalidated_at ? "invalidated" : inspection.status,
      factoryId: factory.id,
      factoryName: factory.name,
      factoryCode: factory.factory_code,
      licenceNumber: factory.license_number,
      region: factory.region,
      city: factory.city,
      inspectionId: inspection.id,
      visitId: visit.id,
      inspectorName: assignment?.profiles?.full_name ?? null,
      recordedAt,
      actionForm: actionForm ? `${actionForm.form_type.replaceAll("_", " ")} · ${actionForm.status.replaceAll("_", " ")}` : null,
      evidenceCount: evidence.length,
      custodyComplete: evidence.length > 0 && evidence.every((item) => Boolean(item.content_sha256)),
      mappingVersion: violation.mapping_version,
    }];
  });

  return (
    <Shell
      current="/enforcement"
      title={tr("mvp3.enforcement.title", "Enforcement Library", "مكتبة الإنفاذ")}
      context={<span className="badge badge-info">M3-09 · CD-059 · {tr("mvp3.enforcement.badge", "source-linked records", "سجلات مرتبطة بالمصدر")}</span>}
    >
      <h1 className="ax-sr-only">{tr("mvp3.enforcement.title", "Enforcement Library", "مكتبة الإنفاذ")}</h1>

      <div className="sq-banner">
        <div>
          <strong>{tr("mvp3.enforcement.rule", "Every record remains linked to its source inspection, violation mapping and human review.", "يبقى كل سجل مرتبطًا بالتفتيش المصدر وربط المخالفة والمراجعة البشرية.")}</strong>{" "}
          {tr("mvp3.enforcement.ruleBody", "Missing links are shown as incomplete—not silently repaired.", "تُعرض الروابط المفقودة على أنها غير مكتملة، ولا تُصلح بصمت.")}
        </div>
      </div>

      <div className="sq-banner sq-banner--warning" role="note">
        <div>
          <strong>{tr("mvp3.enforcement.config.title", "Enforcement policy: Not configured.", "سياسة الإنفاذ: غير مهيأة.")}</strong>{" "}
          {tr(
            "mvp3.enforcement.config.body",
            "The sponsor must supply the approved enforcement measure catalogue and authoritative legal-basis wording. Until supplied, no applied measure, amount, escalation ladder, citation or Arabic legal wording is asserted.",
            "يجب على الراعي تزويد كتالوج تدابير الإنفاذ المعتمد والصياغة الموثوقة للأساس القانوني. وحتى يتم ذلك، لا تُعرض تدابير مطبقة أو مبالغ أو سلالم تصعيد أو استشهادات أو صياغة قانونية عربية.",
          )}
        </div>
      </div>

      {error ? (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div>{tr("mvp3.enforcement.unavailable", "The enforcement record contract is unavailable in this environment. No record count is claimed.", "عقد سجلات الإنفاذ غير متاح في هذه البيئة. لا يُدّعى أي عدد للسجلات.")}</div>
        </div>
      ) : (
        <EnforcementLibrary rows={rows} strings={strings} locale={locale} />
      )}

      <section
        className="panel stack"
        aria-labelledby="enforcement-recommendations-heading"
        style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-5)" }}
      >
        <div className="row" style={{ justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div>
            <h2 id="enforcement-recommendations-heading" style={{ margin: 0 }}>
              {tr("mvp3.enforcement.recommendations", "Enforcement recommendations", "توصيات الإنفاذ")}
            </h2>
            <p className="t-caption" style={{ marginBlockEnd: 0 }}>
              {tr(
                "mvp3.enforcement.recommendations.rule",
                "Inspector recommendations remain pending until a different Operations or Compliance Admin checker records a decision and its basis.",
                "تظل توصيات المفتش معلقة حتى يسجل مدقق مختلف من العمليات أو مسؤول الامتثال القرار وأساسه.",
              )}
            </p>
          </div>
          {!recommendationRead.error ? (
            <span className="badge badge-warning">
              <bdi>{recommendations.length.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</bdi>{" "}
              {tr("mvp3.enforcement.pending", "pending", "معلقة")}
            </span>
          ) : null}
        </div>

        {roleRead.error ? (
          <div className="sq-banner sq-banner--warning" role="alert">
            <div>{tr(
              "mvp3.enforcement.permissions",
              "Decision permissions could not be verified. Writes are disabled.",
              "تعذر التحقق من صلاحيات القرار. تم تعطيل الكتابة.",
            )}</div>
          </div>
        ) : null}
        {recommendationRead.error ? (
          <div className="sq-banner sq-banner--warning" role="alert">
            <div>{tr(
              "mvp3.enforcement.recommendationsUnavailable",
              "The recommendation queue is unavailable. No pending count is claimed.",
              "قائمة التوصيات غير متاحة. لا يُدّعى أي عدد معلق.",
            )}</div>
          </div>
        ) : null}
        {!recommendationRead.error && recommendations.length === 0 ? (
          <div className="sq-state sq-state--inline" role="status">
            <span className="sq-state__glyph" aria-hidden="true">✓</span>
            <h3>{tr("mvp3.enforcement.noRecommendations", "No pending recommendations", "لا توجد توصيات معلقة")}</h3>
          </div>
        ) : null}

        {recommendations.map(row => {
          const makerCheckerBlocked = row.recommended_by === user?.id;
          return (
            <article className="sq-panel stack" style={{ padding: "var(--space-5)" }} key={row.id}>
              <div className="row" style={{ justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <div>
                  <strong>{row.factories?.name ?? row.factories?.factory_code ?? "—"}</strong>
                  <div className="t-caption">
                    <bdi>{row.id}</bdi>
                    {" · "}
                    <bdi>{new Date(row.recommended_at).toLocaleString(locale)}</bdi>
                  </div>
                </div>
                <span className="badge badge-warning">
                  {tr("mvp3.enforcement.measureNotConfigured", "Recommended measure: Not configured", "التدبير الموصى به: غير مهيأ")}
                </span>
              </div>
              {row.recommendation_notes ? <p>{row.recommendation_notes}</p> : null}
              <dl className="sq-grid">
                <div>
                  <dt className="t-caption">{tr("mvp3.enforcement.measure", "Measure catalogue", "كتالوج التدابير")}</dt>
                  <dd>{tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ")}</dd>
                </div>
                <div>
                  <dt className="t-caption">{tr("mvp3.enforcement.legalBasis", "Legal basis", "الأساس القانوني")}</dt>
                  <dd>{tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ")}</dd>
                </div>
              </dl>
              {canDecide ? (
                makerCheckerBlocked ? (
                  <div className="sq-banner" role="note">
                    <div>{tr(
                      "mvp3.enforcement.error.makerChecker",
                      "Maker-checker blocked this decision: the recommender cannot decide their own recommendation.",
                      "منع فصل المُعدّ عن المدقّق هذا القرار: لا يمكن لمقدم التوصية البت في توصيته.",
                    )}</div>
                  </div>
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
                      errors: {
                        auth_required: tr("mvp3.enforcement.error.auth", "Your session expired. Sign in and try again.", "انتهت جلستك. سجّل الدخول وحاول مرة أخرى."),
                        invalid_request: tr("mvp3.enforcement.error.invalid", "The decision request is invalid.", "طلب القرار غير صالح."),
                        reason_required: tr("mvp3.enforcement.error.reason", "A decision reason is required.", "سبب القرار مطلوب."),
                        maker_checker: tr("mvp3.enforcement.error.makerChecker", "Maker-checker blocked this decision.", "منع فصل المُعدّ عن المدقّق هذا القرار."),
                        conflict: tr("mvp3.enforcement.error.conflict", "This recommendation changed or was already decided. Reload before deciding again.", "تغيرت هذه التوصية أو تم البت فيها. أعد التحميل قبل اتخاذ قرار جديد."),
                        write_failed: tr("mvp3.enforcement.error.write", "The decision could not be recorded. No outcome was changed.", "تعذر تسجيل القرار. لم تتغير أي نتيجة."),
                      },
                    }}
                  />
                )
              ) : (
                <p className="t-caption">
                  {tr(
                    "mvp3.enforcement.readOnly",
                    "Read-only. An Operations or Compliance Admin checker records the decision.",
                    "للقراءة فقط. يسجل مدقق من العمليات أو مسؤول الامتثال القرار.",
                  )}
                </p>
              )}
            </article>
          );
        })}
      </section>

      <section
        className="panel stack"
        aria-labelledby="enforcement-decision-trail-heading"
        style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}
      >
        <h2 id="enforcement-decision-trail-heading" style={{ margin: 0 }}>
          {tr("mvp3.enforcement.decisionTrail", "Immutable decision trail", "مسار القرار غير القابل للتعديل")}
        </h2>
        {decidedRead.error ? (
          <div className="sq-banner sq-banner--warning" role="alert">
            <div>{tr(
              "mvp3.enforcement.auditUnavailable",
              "Decision history is unavailable. No history claim is made.",
              "سجل القرارات غير متاح. لا يُدّعى وجود سجل.",
            )}</div>
          </div>
        ) : decided.length === 0 ? (
          <p className="t-caption">{tr("mvp3.enforcement.noHistory", "No decisions recorded yet.", "لم تُسجَّل قرارات بعد.")}</p>
        ) : (
          <div className="sq-tablewrap" tabIndex={0}>
            <table className="sq-table">
              <thead>
                <tr>
                  <th scope="col">{tr("mvp3.enforcement.establishment", "Establishment", "المنشأة")}</th>
                  <th scope="col">{tr("mvp3.enforcement.decision", "Decision", "القرار")}</th>
                  <th scope="col">{tr("mvp3.enforcement.reason", "Decision basis", "أساس القرار")}</th>
                  <th scope="col">{tr("mvp3.enforcement.decidedAt", "Recorded", "سُجِّل")}</th>
                </tr>
              </thead>
              <tbody>
                {decided.map(row => (
                  <tr key={row.id}>
                    <th scope="row">
                      {row.factories?.name ?? row.factories?.factory_code ?? "—"}
                      <span className="t-caption"><bdi>{row.id}</bdi></span>
                    </th>
                    <td><span className="badge">{row.status}</span></td>
                    <td>{row.decision_reason ?? "—"}</td>
                    <td><bdi>{row.decided_at ? new Date(row.decided_at).toLocaleString(locale) : "—"}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="t-caption">
          {tr(
            "mvp3.enforcement.auditRule",
            "Decision rows and their append-only audit events cannot be edited or deleted from this screen.",
            "لا يمكن تعديل أو حذف صفوف القرارات وأحداث التدقيق الإلحاقية من هذه الشاشة.",
          )}
        </p>
      </section>
    </Shell>
  );
}
