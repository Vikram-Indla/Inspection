import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import UnregisteredEstablishmentForm from "./UnregisteredEstablishmentForm";
import styles from "../../incident-reports/incident-reports.module.css";

// Jira INSP-605. Figma: MIM iPad Inspector App, "Visit Reports" page (node
// 269:40019), "Create an Unlicensed Establishment" (node 941:49887).
// Chrome/CSS follow field/incident-reports/ exactly — no new class authored.
export default async function FieldUnregisteredEstablishmentPage() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: roles } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: null };
  const isInspector = (roles ?? []).some(r => r.role_key === "inspector");
  if (!user || !isInspector) {
    return (
      <>
        <FieldHeader title={tr("field.unregistered.title", "Unregistered Establishment", "منشأة غير مسجلة")} langHref="/locale" langLabel={locale === "ar" ? "EN" : "AR"} />
        <div className={styles.page}>
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>{tr("field.unregistered.unauthorized", "Inspector role required", "يلزم دور مفتش")}</div>
          </div>
        </div>
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: pkgs } = await sb.from("package_versions")
    .select("id, version_label, packages(code, title)")
    .in("status", ["published", "locked"])
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`);
  const packages = (pkgs ?? []).map((p) => {
    const pkg = Array.isArray(p.packages) ? p.packages[0] : p.packages;
    return { id: p.id as string, code: `${pkg?.code ?? ""} · ${p.version_label}`, title: pkg?.title ?? "" };
  });

  const labels = {
    location: tr("field.unregistered.location", "Location", "الموقع"),
    useCurrentLocation: tr("field.unregistered.useLocation", "Capture current location", "التقاط الموقع الحالي"),
    locating: tr("field.unregistered.locating", "Locating…", "جارٍ تحديد الموقع…"),
    locationCaptured: tr("field.unregistered.captured", "Captured location", "الموقع الملتقط"),
    latitude: tr("field.unregistered.lat", "Latitude", "خط العرض"),
    longitude: tr("field.unregistered.lng", "Longitude", "خط الطول"),
    mapLoading: tr("field.unregistered.mapLoading", "Loading location map", "جارٍ تحميل الخريطة"),
    reportType: tr("field.unregistered.reportType", "Report Type", "نوع التقرير"),
    reportTypeHint: tr("field.unregistered.reportTypeHint", "Select the inspection package that applies to this facility.", "اختر حزمة التفتيش المناسبة لهذه المنشأة."),
    visitType: tr("field.unregistered.visitType", "Visit Type", "نوع الزيارة"),
    visitTypeComplaint: tr("field.unregistered.complaint", "Complaint", "شكوى"),
    visitTypeFollowUp: tr("field.unregistered.followUp", "Follow-up", "متابعة"),
    visitTypePeriodic: tr("field.unregistered.periodic", "Periodic", "دورية"),
    reason: tr("field.unregistered.reason", "Reason", "السبب"),
    reasonComplaint: tr("plan.imm.reasonComplaint", "Complaint received", "بلاغ مستلم"),
    reasonIncident: tr("plan.imm.reasonIncident", "Incident / accident report", "بلاغ حادث / واقعة"),
    reasonReferral: tr("plan.imm.reasonReferral", "Referral from authority", "إحالة من جهة"),
    reasonOther: tr("plan.imm.reasonOther", "Other", "أخرى"),
    reasonOtherHint: tr("plan.imm.reasonOtherHint", "Justify the \"Other\" reason in Notes below.", "برّر سبب «أخرى» في الملاحظات أدناه."),
    notes: tr("field.unregistered.notes", "Notes", "ملاحظات"),
    notesPlaceholder: tr("field.unregistered.notesPlaceholder", "Additional detail about this visit", "تفاصيل إضافية عن هذه الزيارة"),
    photosNote: tr("field.unregistered.photosNote", "Photo capture for this flow is not wired yet — the design shows it, but no governed storage path exists for it. Location and report type are captured below.", "التقاط الصور لهذا المسار غير موصول بعد — يُظهره التصميم، لكن لا يوجد مسار تخزين معتمد له بعد. يتم التقاط الموقع ونوع التقرير أدناه."),
    submit: tr("field.unregistered.submit", "Create visit", "إنشاء الزيارة"),
    submitting: tr("common.submitting", "Submitting…", "جارٍ الإرسال…"),
  };

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const back = (
    <Link href="/field/establishments" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader leading={back}
        title={tr("field.unregistered.title", "Unregistered Establishment", "منشأة غير مسجلة")}
        subtitle={tr("field.unregistered.subtitle", "Create a visit for a facility not in the system", "إنشاء زيارة لمنشأة غير موجودة في النظام")}
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        <div className="alert alert-info"><div>{tr("field.unregistered.note", "This creates an immediate, self-assigned visit against a system-generated placeholder identity — photo and GPS capture stand in for a registered name until reconciliation.", "هذا ينشئ زيارة فورية موكلة لك تلقائياً بهوية مؤقتة يولدها النظام — تحل الصورة والموقع محل الاسم المسجل حتى المطابقة.")}</div></div>
        <UnregisteredEstablishmentForm locale={locale} strings={labels} packages={packages} visitType="follow_up" />
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
