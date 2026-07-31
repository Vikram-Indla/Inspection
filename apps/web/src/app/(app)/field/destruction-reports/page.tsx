import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FieldDestructionReportForm from "./DestructionReportForm";
import styles from "../incident-reports/incident-reports.module.css";

type DestructionRow = {
  id: string;
  report_number: string;
  report_date: string | null;
  attendance: string | null;
  signer_name: string | null;
  factory_id: string | null;
  visit_id: string | null;
  inspection_id: string | null;
  created_by: string;
  created_at: string;
};

// Jira INSP-578. Figma: MIM iPad Inspector App, Components > Reports, canonical
// node 362:39096 ("محضر إتلاف منتجات مخالفة" — Non-Compliant Products
// Destruction). Chrome/CSS follow field/incident-reports/ exactly — no new
// class authored (CLAUDE.md rule 1).
export default async function FieldDestructionReportsPage({ searchParams }: { searchParams: Promise<{ visit?: string; factory?: string; inspection?: string }> }) {
  const { visit: visitId, factory: factoryId, inspection: inspectionId } = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data, error } = await sb.from("non_compliant_destruction_reports")
    .select("id, report_number, report_date, attendance, signer_name, factory_id, visit_id, inspection_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("[field destruction reports] load", error.message);
  const rows = (data ?? []) as DestructionRow[];
  const value = (item: string | null) => item || "—";

  const labels = {
    reportNumber: tr("field.destruction.reportNumber", "Report Number", "رقم محضر"),
    reportDate: tr("field.destruction.reportDate", "Report Date", "تاريخ المحضر"),
    attendanceSignature: tr("field.destruction.attendanceSignature", "Confirm attendance and signature", "تأكيد الحضور والتوقيع"),
    openSignature: tr("field.destruction.openSignature", "Capture signature", "توقيع"),
    signed: tr("field.destruction.signed", "Signed", "تم التوقيع"),
    submit: tr("field.destruction.submit", "Log destruction report", "تسجيل محضر الإتلاف"),
    submitting: tr("common.submitting", "Submitting…", "جارٍ الإرسال…"),
    created: tr("field.destruction.created", "Destruction report logged.", "تم تسجيل محضر الإتلاف."),
  };
  const sigStrings = {
    mode: "inspection" as const,
    title: tr("field.destruction.sigTitle", "Attendance and signature", "الحضور والتوقيع"),
    hint: tr("field.destruction.sigHint", "Confirm whether the establishment representative attended and signs below.", "أكّد ما إذا حضر ممثل المنشأة ووقّع أدناه."),
    nameLabel: tr("field.destruction.sigName", "Representative name", "اسم الممثل"),
    namePlaceholder: tr("field.destruction.sigNamePh", "Full name", "الاسم الكامل"),
    clear: tr("common.clear", "Clear", "مسح"),
    cancel: tr("common.cancel", "Cancel", "إلغاء"),
    confirm: tr("common.confirm", "Confirm", "تأكيد"),
    required: tr("field.destruction.sigRequired", "A name and signature are required.", "الاسم والتوقيع مطلوبان."),
    attendance: tr("field.destruction.attendance", "Attendance", "الحضور"),
    present: tr("field.destruction.present", "Attended and agreed to sign", "حضر ووافق على التوقيع"),
    absent: tr("field.destruction.absent", "Did not attend", "لم يحضر"),
    objected: tr("field.destruction.objected", "Attended but objected to signing", "حضر واعترض على التوقيع"),
    reasonLabel: tr("field.destruction.reasonLabel", "Reason", "السبب"),
    unsupported: tr("field.destruction.unsupported", "Absent/objected recording is not yet wired to a write path — capture in the notes for now.", "تسجيل حالة عدم الحضور/الاعتراض غير موصول بعد بمسار كتابة — سجّلها ضمن الملاحظات حاليًا."),
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
        title={tr("field.destruction.title", "Non-Compliant Products Destruction", "محضر إتلاف منتجات مخالفة")}
        subtitle={tr("field.destruction.subtitle", "Log a destruction report", "تسجيل محضر إتلاف")}
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        {visitId && <div className="alert alert-warning" role="status"><div>{tr("field.destruction.midVisit", "Logging for the active visit — this report will be linked to it.", "التسجيل ضمن الزيارة الحالية — سيُربط هذا المحضر بها.")}</div></div>}

        <FieldDestructionReportForm locale={locale} strings={labels} sigStrings={sigStrings}
          context={{ factoryId: factoryId || undefined, visitId: visitId || undefined, inspectionId: inspectionId || undefined }}
          contextBadge={visitId ? tr("field.destruction.duringVisit", "During visit", "أثناء الزيارة") : undefined} />

        <section aria-labelledby="field-destruction-history" className={styles.history}>
          <h2 id="field-destruction-history" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tr("field.destruction.history", "Reports in your access scope", "المحاضر ضمن نطاق صلاحياتك")}</h2>
          {error && <div className="alert alert-critical" role="alert"><div>{tr("field.destruction.loadError", "Destruction reports are temporarily unavailable. Nothing was changed.", "محاضر الإتلاف غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
          {!error && rows.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{tr("field.destruction.empty", "No destruction reports in scope", "لا توجد محاضر إتلاف ضمن النطاق")}</div>
              <p className="t-caption">{tr("field.destruction.emptyBody", "Logged reports appear here according to non_compliant_destruction_reports RLS.", "تظهر المحاضر المسجلة هنا وفق صلاحيات صفوف جدول محاضر الإتلاف.")}</p>
            </div>
          )}
          {!error && rows.map(row => (
            <details key={row.id} className={styles.rowcard}>
              <summary>
                <strong className="id-code"><bdi>{row.report_number}</bdi></strong>
                <span className="badge badge-info">{value(row.attendance)}</span>
                <span className="grow" />
                <span className="t-caption id-code"><bdi>{dtf(row.created_at)}</bdi></span>
              </summary>
              <dl className={styles.grid2dl}>
                <div><dt className="t-caption">{labels.reportDate}</dt><dd className="id-code"><bdi>{value(row.report_date)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.destruction.signer", "Signer", "الموقّع")}</dt><dd><bdi>{value(row.signer_name)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.destruction.recordId", "Record ID", "معرّف السجل")}</dt><dd className="id-code"><bdi>{row.id}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.destruction.anchors", "Factory / visit / inspection anchors", "روابط المصنع / الزيارة / التفتيش")}</dt><dd className="id-code"><bdi>{value(row.factory_id)} / {value(row.visit_id)} / {value(row.inspection_id)}</bdi></dd></div>
                <div><dt className="t-caption">{tr("field.destruction.createdBy", "Created by", "أنشئ بواسطة")}</dt><dd className="id-code"><bdi>{row.created_by}</bdi></dd></div>
              </dl>
            </details>
          ))}
        </section>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
