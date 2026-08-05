import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FieldSummonsNoticeForm from "./SummonsNoticeForm";
import styles from "../incident-reports/incident-reports.module.css";

type SummonsRow = {
  id: string;
  report_date: string | null;
  report_day: string | null;
  subject: string | null;
  region: string | null;
  department: string | null;
  required_document_type: string | null;
  reason: string | null;
  attendance: string | null;
  signer_name: string | null;
  factory_id: string | null;
  visit_id: string | null;
  inspection_id: string | null;
  created_by: string;
  created_at: string;
};

// Jira INSP-558. Figma: MIM iPad Inspector App, Components > Reports >
// "Summons Notice" (node 360:48214) create-form, Report Details (node
// 369:127296) read view. Chrome/CSS follow field/incident-reports/ exactly
// (FieldHeader, same module CSS, same history-list pattern) — CLAUDE.md rule
// 1: no new class authored, every element renders with a class that already
// exists in this repo.
export default async function FieldSummonsNoticesPage({ searchParams }: { searchParams: Promise<{ visit?: string; factory?: string; inspection?: string }> }) {
  const { visit: visitId, factory: factoryId, inspection: inspectionId } = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data, error } = await sb.from("summons_notices")
    .select("id, report_date, report_day, subject, region, department, required_document_type, reason, attendance, signer_name, factory_id, visit_id, inspection_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("[field summons notices] load", error.message);
  const rows = (data ?? []) as SummonsRow[];
  const value = (item: string | null) => item || "—";

  const labels = {
    reportDate: tr("field.summons.reportDate", "Report Date", "تاريخ المحضر"),
    reportDay: tr("field.summons.reportDay", "Report Day", "يوم المحضر"),
    subject: tr("field.summons.subject", "Subject", "الموضوع"),
    region: tr("field.summons.region", "Region", "المنطقة"),
    department: tr("field.summons.department", "Department", "الإدارة"),
    requiredDocumentType: tr("field.summons.docType", "Required Document Type", "نوع المستند المطلوب"),
    reason: tr("field.summons.reason", "Reason", "السبب"),
    attendanceSignature: tr("field.summons.attendanceSignature", "Confirm attendance and signature", "تأكيد الحضور والتوقيع"),
    openSignature: tr("field.summons.openSignature", "Capture signature", "توقيع"),
    signed: tr("field.summons.signed", "Signed", "تم التوقيع"),
    submit: tr("field.summons.submit", "Issue notice", "إصدار المحضر"),
    submitting: tr("common.submitting", "Submitting…", "جارٍ الإرسال…"),
    created: tr("field.summons.created", "Summons notice issued.", "تم إصدار المحضر."),
  };
  const sigStrings = {
    mode: "inspection" as const,
    title: tr("field.summons.sigTitle", "Attendance and signature", "الحضور والتوقيع"),
    hint: tr("field.summons.sigHint", "Confirm whether the establishment representative attended and signs below.", "أكّد ما إذا حضر ممثل المنشأة ووقّع أدناه."),
    nameLabel: tr("field.summons.sigName", "Representative name", "اسم الممثل"),
    namePlaceholder: tr("field.summons.sigNamePh", "Full name", "الاسم الكامل"),
    clear: tr("common.clear", "Clear", "مسح"),
    cancel: tr("common.cancel", "Cancel", "إلغاء"),
    confirm: tr("common.confirm", "Confirm", "تأكيد"),
    required: tr("field.summons.sigRequired", "A name and signature are required.", "الاسم والتوقيع مطلوبان."),
    attendance: tr("field.summons.attendance", "Attendance", "الحضور"),
    present: tr("field.summons.present", "Attended and agreed to sign", "حضر ووافق على التوقيع"),
    absent: tr("field.summons.absent", "Did not attend", "لم يحضر"),
    objected: tr("field.summons.objected", "Attended but objected to signing", "حضر واعترض على التوقيع"),
    reasonLabel: tr("field.summons.reasonLabel", "Reason", "السبب"),
    unsupported: tr("field.summons.unsupported", "Absent/objected recording is not available. Capture it in the notes for now.", "تسجيل حالة عدم الحضور/الاعتراض غير موصول بعد بمسار كتابة — سجّلها ضمن الملاحظات حاليًا."),
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
        title={tr("field.summons.title", "Summons Notice", "مذكرة استدعاء")}
        subtitle={tr("field.summons.subtitle", "Issue a summons notice", "إصدار محضر استدعاء")}
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        {visitId && <div className="alert alert-warning" role="status"><div>{tr("field.summons.midVisit", "Issuing for the active visit — this notice will be linked to it.", "الإصدار ضمن الزيارة الحالية — سيُربط هذا المحضر بها.")}</div></div>}

        <FieldSummonsNoticeForm locale={locale} strings={labels} sigStrings={sigStrings}
          context={{ factoryId: factoryId || undefined, visitId: visitId || undefined, inspectionId: inspectionId || undefined }}
          contextBadge={visitId ? tr("field.summons.duringVisit", "During visit", "أثناء الزيارة") : undefined} />

        <section aria-labelledby="field-summons-history" className={styles.history}>
          <h2 id="field-summons-history" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tr("field.summons.history", "Notices in your access scope", "المحاضر ضمن نطاق صلاحياتك")}</h2>
          {error && <div className="alert alert-critical" role="alert"><div>{tr("field.summons.loadError", "Summons notices are temporarily unavailable. Nothing was changed.", "المحاضر غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
          {!error && rows.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{tr("field.summons.empty", "No summons notices in scope", "لا توجد محاضر ضمن النطاق")}</div>
              <p className="t-caption">{tr("field.summons.emptyBody", "Issued summons notices appear here when they are within your scope.", "تظهر المحاضر الصادرة هنا وفق صلاحيات صفوف جدول المحاضر.")}</p>
            </div>
          )}
          {!error && rows.map(row => (
            <details key={row.id} className={styles.rowcard}>
              <summary>
                <strong><bdi>{value(row.subject)}</bdi></strong>
                <span className="badge badge-info">{value(row.attendance)}</span>
                <span className="grow" />
                <span className="t-caption id-code"><bdi>{dtf(row.created_at)}</bdi></span>
              </summary>
              <dl className={styles.grid2dl}>
                <div><dt className="t-caption">{labels.reportDate}</dt><dd className="id-code"><bdi>{value(row.report_date)}</bdi></dd></div>
                <div><dt className="t-caption">{labels.reportDay}</dt><dd>{value(row.report_day)}</dd></div>
                <div><dt className="t-caption">{labels.region}</dt><dd>{value(row.region)}</dd></div>
                <div><dt className="t-caption">{labels.department}</dt><dd>{value(row.department)}</dd></div>
                <div><dt className="t-caption">{labels.requiredDocumentType}</dt><dd>{value(row.required_document_type)}</dd></div>
                <div><dt className="t-caption">{labels.reason}</dt><dd><bdi>{value(row.reason)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.summons.signer", "Signer", "الموقّع")}</dt><dd><bdi>{value(row.signer_name)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.summons.recordId", "Record ID", "معرّف السجل")}</dt><dd className="id-code"><bdi>{row.id}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.summons.anchors", "Factory / visit / inspection anchors", "روابط المصنع / الزيارة / التفتيش")}</dt><dd className="id-code"><bdi>{value(row.factory_id)} / {value(row.visit_id)} / {value(row.inspection_id)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.summons.createdBy", "Created by", "أنشئ بواسطة")}</dt><dd className="id-code"><bdi>{row.created_by}</bdi></dd></div>
              </dl>
            </details>
          ))}
        </section>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
