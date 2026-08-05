import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FieldFacilityReportForm from "./FacilityReportForm";
import styles from "../incident-reports/incident-reports.module.css";

type FacilityRow = {
  id: string;
  report_date: string | null;
  summons_date: string | null;
  facility_action: string | null;
  reason: string | null;
  attendance: string | null;
  signer_name: string | null;
  factory_id: string | null;
  visit_id: string | null;
  inspection_id: string | null;
  created_by: string;
  created_at: string;
};

// Jira INSP-583. Figma: MIM iPad Inspector App, Components > Reports >
// "Facility Report" (node 369:49024). Distinct from field/reports/
// ReportsLibrary.tsx (inspection-submission retrieval) — see Technical
// Baseline on INSP-583. Chrome/CSS follow field/incident-reports/ exactly.
export default async function FieldFacilityReportsPage({ searchParams }: { searchParams: Promise<{ visit?: string; factory?: string; inspection?: string }> }) {
  const { visit: visitId, factory: factoryId, inspection: inspectionId } = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data, error } = await sb.from("facility_reports")
    .select("id, report_date, summons_date, facility_action, reason, attendance, signer_name, factory_id, visit_id, inspection_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("[field facility reports] load", error.message);
  const rows = (data ?? []) as FacilityRow[];
  const value = (item: string | null) => item || "—";

  const labels = {
    reportDate: tr("field.facilityReport.reportDate", "Report Date", "تاريخ المحضر"),
    summonsDate: tr("field.facilityReport.summonsDate", "Summons Date", "تاريخ الاستدعاء"),
    facilityAction: tr("field.facilityReport.action", "Facility Action", "إجراء المنشأة"),
    close: tr("field.facilityReport.close", "Close facility", "إغلاق المنشأة"),
    reopen: tr("field.facilityReport.reopen", "Reopen facility", "إعادة فتح المنشأة"),
    reason: tr("field.facilityReport.reason", "Reason", "السبب"),
    attendanceSignature: tr("field.facilityReport.attendanceSignature", "Confirm attendance and signature", "تأكيد الحضور والتوقيع"),
    openSignature: tr("field.facilityReport.openSignature", "Capture signature", "توقيع"),
    signed: tr("field.facilityReport.signed", "Signed", "تم التوقيع"),
    submit: tr("field.facilityReport.submit", "Log facility report", "تسجيل محضر المنشأة"),
    submitting: tr("common.submitting", "Submitting…", "جارٍ الإرسال…"),
    created: tr("field.facilityReport.created", "Facility report logged.", "تم تسجيل محضر المنشأة."),
  };
  const facilityActionLabel = (v: string | null) => v === "close" ? labels.close : v === "reopen" ? labels.reopen : "—";
  const sigStrings = {
    mode: "inspection" as const,
    title: tr("field.facilityReport.sigTitle", "Attendance and signature", "الحضور والتوقيع"),
    hint: tr("field.facilityReport.sigHint", "Confirm whether the establishment representative attended and signs below.", "أكّد ما إذا حضر ممثل المنشأة ووقّع أدناه."),
    nameLabel: tr("field.facilityReport.sigName", "Representative name", "اسم الممثل"),
    namePlaceholder: tr("field.facilityReport.sigNamePh", "Full name", "الاسم الكامل"),
    clear: tr("common.clear", "Clear", "مسح"),
    cancel: tr("common.cancel", "Cancel", "إلغاء"),
    confirm: tr("common.confirm", "Confirm", "تأكيد"),
    required: tr("field.facilityReport.sigRequired", "A name and signature are required.", "الاسم والتوقيع مطلوبان."),
    attendance: tr("field.facilityReport.attendance", "Attendance", "الحضور"),
    present: tr("field.facilityReport.present", "Attended and agreed to sign", "حضر ووافق على التوقيع"),
    absent: tr("field.facilityReport.absent", "Did not attend", "لم يحضر"),
    objected: tr("field.facilityReport.objected", "Attended but objected to signing", "حضر واعترض على التوقيع"),
    reasonLabel: tr("field.facilityReport.reasonLabel", "Reason", "السبب"),
    unsupported: tr("field.facilityReport.unsupported", "Absent/objected recording is not available. Capture it in the notes for now.", "تسجيل حالة عدم الحضور/الاعتراض غير موصول بعد بمسار كتابة — سجّلها ضمن الملاحظات حاليًا."),
  };

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );
  const dtf = (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <>
      <FieldHeader leading={back}
        title={tr("field.facilityReport.title", "Facility Report", "محضر منشأة")}
        subtitle={tr("field.facilityReport.subtitle", "Log a facility action report", "تسجيل محضر إجراء منشأة")}
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        {visitId && <div className="alert alert-warning" role="status"><div>{tr("field.facilityReport.midVisit", "Logging for the active visit — this report will be linked to it.", "التسجيل ضمن الزيارة الحالية — سيُربط هذا المحضر بها.")}</div></div>}

        <FieldFacilityReportForm locale={locale} strings={labels} sigStrings={sigStrings}
          context={{ factoryId: factoryId || undefined, visitId: visitId || undefined, inspectionId: inspectionId || undefined }}
          contextBadge={visitId ? tr("field.facilityReport.duringVisit", "During visit", "أثناء الزيارة") : undefined} />

        <section aria-labelledby="field-facility-reports-history" className={styles.history}>
          <h2 id="field-facility-reports-history" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tr("field.facilityReport.history", "Reports in your access scope", "المحاضر ضمن نطاق صلاحياتك")}</h2>
          {error && <div className="alert alert-critical" role="alert"><div>{tr("field.facilityReport.loadError", "Facility reports are temporarily unavailable. Nothing was changed.", "محاضر المنشآت غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
          {!error && rows.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{tr("field.facilityReport.empty", "No facility reports in scope", "لا توجد محاضر منشآت ضمن النطاق")}</div>
              <p className="t-caption">{tr("field.facilityReport.emptyBody", "Logged reports appear here when they are within your scope.", "تظهر المحاضر المسجلة هنا وفق صلاحيات صفوف جدول محاضر المنشآت.")}</p>
            </div>
          )}
          {!error && rows.map(row => (
            <details key={row.id} className={styles.rowcard}>
              <summary>
                <strong>{facilityActionLabel(row.facility_action)}</strong>
                <span className="badge badge-info">{value(row.attendance)}</span>
                <span className="grow" />
                <span className="t-caption id-code"><bdi>{dtf(row.created_at)}</bdi></span>
              </summary>
              <dl className={styles.grid2dl}>
                <div><dt className="t-caption">{labels.reportDate}</dt><dd className="id-code"><bdi>{value(row.report_date)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.summonsDate}</dt><dd className="id-code"><bdi>{value(row.summons_date)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.reason}</dt><dd><bdi>{value(row.reason)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.facilityReport.signer", "Signer", "الموقّع")}</dt><dd><bdi>{value(row.signer_name)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.facilityReport.recordId", "Record ID", "معرّف السجل")}</dt><dd className="id-code"><bdi>{row.id}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.facilityReport.anchors", "Factory / visit / inspection anchors", "روابط المصنع / الزيارة / التفتيش")}</dt><dd className="id-code"><bdi>{value(row.factory_id)} / {value(row.visit_id)} / {value(row.inspection_id)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.facilityReport.createdBy", "Created by", "أنشئ بواسطة")}</dt><dd className="id-code"><bdi>{row.created_by}</bdi></dd></div>
              </dl>
            </details>
          ))}
        </section>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
