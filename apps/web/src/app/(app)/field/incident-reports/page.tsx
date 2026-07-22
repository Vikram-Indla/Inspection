import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FieldIncidentReportForm from "./IncidentReportForm";

type IncidentRow = {
  id: string;
  establishment_code: string | null;
  commercial_registration_number: string | null;
  report_source: string | null;
  reporter_name: string | null;
  reporter_contact_number: string | null;
  report_time: string | null;
  number_of_cases: string | null;
  resulting_damage: string | null;
  incident_type: string | null;
  preliminary_incident_description: string | null;
  factory_id: string | null;
  visit_id: string | null;
  inspection_id: string | null;
  created_by: string;
  created_at: string;
};

// PLAN v7 item 7 · FNS-033 / J-12. Field-only sessions cannot use the existing
// /incident-reports route because the authenticated layout redirects every
// non-field route. This route is additive and leaves that web route untouched.
export default async function FieldIncidentReportsPage() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data, error } = await sb.from("incident_reports")
    .select("id, establishment_code, commercial_registration_number, report_source, reporter_name, reporter_contact_number, report_time, number_of_cases, resulting_damage, incident_type, preliminary_incident_description, factory_id, visit_id, inspection_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("[field incident reports] load", error.message);
  const rows = (data ?? []) as IncidentRow[];
  const value = (item: string | null) => item || "—";

  const labels = {
    establishmentCode: tr("figma.establishmentmanagement.em046", "Establishment Code", "رمز المنشأة"),
    commercialRegistrationNumber: tr("figma.establishmentmanagement.em047", "Commercial Registration Number", "رقم السجل التجاري"),
    reportSource: tr("figma.establishmentmanagement.em048", "Report Source", "مصدر البلاغ"),
    reporterName: tr("figma.establishmentmanagement.em049", "Reporter Name", "اسم المبلّغ"),
    reporterContactNumber: tr("figma.establishmentmanagement.em050", "Reporter Contact Number", "رقم تواصل المبلّغ"),
    reportTime: tr("figma.establishmentmanagement.em051", "Report Time", "وقت البلاغ"),
    numberOfCases: tr("figma.establishmentmanagement.em052", "Number of Cases", "عدد الحالات"),
    resultingDamage: tr("figma.establishmentmanagement.em054", "Resulting Damage", "الأضرار الناتجة"),
    incidentType: tr("figma.establishmentmanagement.em057", "Incident Type", "نوع الحادث"),
    preliminaryIncidentDescription: tr("figma.establishmentmanagement.em059", "Preliminary Incident Description", "الوصف الأولي للحادث"),
    submit: tr("incident.report.submit", "Submit incident report", "إرسال بلاغ الحادث"),
    submitting: tr("common.submitting", "Submitting…", "جارٍ الإرسال…"),
    created: tr("incident.report.created", "Incident report submitted.", "تم إرسال بلاغ الحادث."),
  };

  const tabs = <FieldTabs active="visits" fabHref="/field/incident-reports#new-incident" labels={{
    dashboard: tr("field.tabs.dashboard", "Dashboard", "لوحة القيادة"),
    visits: tr("field.tabs.visits", "Visits", "الزيارات"),
    virtual: tr("field.tabs.virtual", "Virtual", "افتراضي"),
    fab: tr("field.incidents.new", "New incident", "بلاغ جديد"),
  }} />;

  return (
    <Shell current="/field" title={tr("field.incidents.title", "Field incident reports", "بلاغات الحوادث الميدانية")}
      context={<span className="ax-lozenge ax-lozenge--warning">FNS-033 · J-12</span>}>
      <div className="ax-field-page">
        <div className="ax-banner ax-banner--info"><div><strong>{tr("field.incidents.capture", "Capture an incident observation", "تسجيل ملاحظة حادث")}</strong>{" "}{tr(
          "field.incidents.help",
          "This writes the existing incident-report record. Report Source, Incident Type, Report Time and Number of Cases remain text because their governed domains or formats are not defined.",
          "يكتب هذا النموذج في سجل بلاغات الحوادث القائم. تبقى حقول مصدر البلاغ ونوع الحادث ووقت البلاغ وعدد الحالات نصية لأن نطاقاتها أو صيغها المعتمدة غير محددة.",
        )}</div></div>

        <FieldIncidentReportForm locale={locale} strings={labels} />

        <section aria-labelledby="field-incident-history" className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
          <h2 id="field-incident-history">{tr("field.incidents.history", "Reports in your access scope", "البلاغات ضمن نطاق صلاحياتك")}</h2>
          {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{tr("field.incidents.loadError", "Incident reports are temporarily unavailable. Nothing was changed.", "بلاغات الحوادث غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
          {!error && rows.length === 0 && <EmptyState glyph="∅" title={tr("field.incidents.empty", "No incident reports in scope", "لا توجد بلاغات حوادث ضمن النطاق")}
            body={tr("field.incidents.emptyBody", "Submitted incident reports appear here according to incident_reports RLS.", "تظهر بلاغات الحوادث المرسلة هنا وفق صلاحيات صفوف جدول بلاغات الحوادث.")} />}
          {!error && rows.map(row => (
            <details key={row.id} className="ax-surface ax-panel">
              <summary style={{ minBlockSize: "var(--ax-control-height-field)", cursor: "pointer" }}>
                <strong><bdi>{value(row.establishment_code)}</bdi></strong>{" · "}<span>{value(row.incident_type)}</span>{" · "}
                <span className="ax-caption"><bdi>{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.created_at))}</bdi></span>
              </summary>
              <dl className="ax-grid-2" style={{ marginBlockStart: "var(--ax-space-200)" }}>
                <div><dt className="ax-caption">{labels.commercialRegistrationNumber}</dt><dd><bdi>{value(row.commercial_registration_number)}</bdi></dd></div>
                <div><dt className="ax-caption">{labels.reportSource}</dt><dd>{value(row.report_source)}</dd></div>
                <div><dt className="ax-caption">{labels.reporterName}</dt><dd>{value(row.reporter_name)}</dd></div>
                <div><dt className="ax-caption">{labels.reporterContactNumber}</dt><dd><bdi>{value(row.reporter_contact_number)}</bdi></dd></div>
                <div><dt className="ax-caption">{labels.reportTime}</dt><dd>{value(row.report_time)}</dd></div>
                <div><dt className="ax-caption">{labels.numberOfCases}</dt><dd>{value(row.number_of_cases)}</dd></div>
                <div><dt className="ax-caption">{labels.resultingDamage}</dt><dd>{value(row.resulting_damage)}</dd></div>
                <div><dt className="ax-caption">{labels.preliminaryIncidentDescription}</dt><dd>{value(row.preliminary_incident_description)}</dd></div>
                <div><dt className="ax-caption">{tr("field.incidents.recordId", "Record ID", "معرّف السجل")}</dt><dd><bdi>{row.id}</bdi></dd></div>
                <div><dt className="ax-caption">{tr("field.incidents.anchors", "Factory / visit / inspection anchors", "روابط المصنع / الزيارة / التفتيش")}</dt><dd><bdi>{value(row.factory_id)} / {value(row.visit_id)} / {value(row.inspection_id)}</bdi></dd></div>
                <div><dt className="ax-caption">{tr("field.incidents.createdBy", "Created by", "أنشئ بواسطة")}</dt><dd><bdi>{row.created_by}</bdi></dd></div>
              </dl>
            </details>
          ))}
        </section>
      </div>
      {tabs}
    </Shell>
  );
}
