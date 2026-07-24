import Link from "next/link";
import FieldNav from "@/components/field/FieldNav";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FieldIncidentReportForm from "./IncidentReportForm";
import styles from "./incident-reports.module.css";

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
//
// Chrome converted to the SAQEEL field design system: <Shell> replaced by
// <FieldHeader> + shared <FieldNav>, the form/history/banners moved to DS
// classes and tokens. The mid-visit context banner, the real incident_reports
// insert/read (via IncidentReportForm's server action) and every governed field
// label are unchanged.
export default async function FieldIncidentReportsPage({ searchParams }: { searchParams: Promise<{ visit?: string; factory?: string; inspection?: string }> }) {
  const { visit: visitId, factory: factoryId, inspection: inspectionId } = await searchParams;
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

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const nav = (
    <FieldNav active="home" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );
  const dtf = (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <>
      <FieldHeader leading={back}
        title={tr("field.incidents.title", "Field incident reports", "بلاغات الحوادث الميدانية")}
        subtitle="FNS-033 · J-12"
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        <div className="alert alert-info">
          <div>
            <div className="alert-title">{tr("field.incidents.capture", "Capture an incident observation", "تسجيل ملاحظة حادث")}</div>
            {tr(
              "field.incidents.help",
              "This writes the existing incident-report record. Report Source, Incident Type, Report Time and Number of Cases remain text because their governed domains or formats are not defined.",
              "يكتب هذا النموذج في سجل بلاغات الحوادث القائم. تبقى حقول مصدر البلاغ ونوع الحادث ووقت البلاغ وعدد الحالات نصية لأن نطاقاتها أو صيغها المعتمدة غير محددة.",
            )}
          </div>
        </div>
        {visitId && <div className="alert alert-warning" role="status"><div>{tr("field.incidents.midVisit", "Logging for the active visit — this report will be linked to it, distinct from any violation.", "تسجيل ضمن الزيارة الحالية — سيُربط هذا البلاغ بها، وهو منفصل عن أي مخالفة.")}</div></div>}

        <FieldIncidentReportForm locale={locale} strings={labels}
          context={{ factoryId: factoryId || undefined, visitId: visitId || undefined, inspectionId: inspectionId || undefined }} />

        <section aria-labelledby="field-incident-history" className={styles.history}>
          <h2 id="field-incident-history" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tr("field.incidents.history", "Reports in your access scope", "البلاغات ضمن نطاق صلاحياتك")}</h2>
          {error && <div className="alert alert-critical" role="alert"><div>{tr("field.incidents.loadError", "Incident reports are temporarily unavailable. Nothing was changed.", "بلاغات الحوادث غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
          {!error && rows.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{tr("field.incidents.empty", "No incident reports in scope", "لا توجد بلاغات حوادث ضمن النطاق")}</div>
              <p className="t-caption">{tr("field.incidents.emptyBody", "Submitted incident reports appear here according to incident_reports RLS.", "تظهر بلاغات الحوادث المرسلة هنا وفق صلاحيات صفوف جدول بلاغات الحوادث.")}</p>
            </div>
          )}
          {!error && rows.map(row => (
            <details key={row.id} className={styles.rowcard}>
              <summary>
                <strong><bdi>{value(row.establishment_code)}</bdi></strong>
                <span className="badge badge-info">{value(row.incident_type)}</span>
                <span className="grow" />
                <span className="t-caption id-code"><bdi>{dtf(row.created_at)}</bdi></span>
              </summary>
              <dl className={styles.grid2dl}>
                <div><dt className="t-caption">{labels.commercialRegistrationNumber}</dt><dd className="id-code"><bdi>{value(row.commercial_registration_number)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.reportSource}</dt><dd>{value(row.report_source)}</dd></div>
                <div><dt className="t-caption">{labels.reporterName}</dt><dd><bdi>{value(row.reporter_name)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.reporterContactNumber}</dt><dd className="id-code"><bdi>{value(row.reporter_contact_number)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.reportTime}</dt><dd>{value(row.report_time)}</dd></div>
                <div><dt className="t-caption">{labels.numberOfCases}</dt><dd>{value(row.number_of_cases)}</dd></div>
                <div><dt className="t-caption">{labels.resultingDamage}</dt><dd><bdi>{value(row.resulting_damage)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.preliminaryIncidentDescription}</dt><dd><bdi>{value(row.preliminary_incident_description)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.incidents.recordId", "Record ID", "معرّف السجل")}</dt><dd className="id-code"><bdi>{row.id}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.incidents.anchors", "Factory / visit / inspection anchors", "روابط المصنع / الزيارة / التفتيش")}</dt><dd className="id-code"><bdi>{value(row.factory_id)} / {value(row.visit_id)} / {value(row.inspection_id)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.incidents.createdBy", "Created by", "أنشئ بواسطة")}</dt><dd className="id-code"><bdi>{row.created_by}</bdi></dd></div>
              </dl>
            </details>
          ))}
        </section>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      {nav}
    </>
  );
}
