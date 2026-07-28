import { redirect } from "next/navigation";
import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import ResultsClient, { type LookupOption, type ResultsStrings } from "./ResultsClient";
import type { ResultsDraft } from "./actions";

/**
 * Visit Report · Results (Step 3 of 4).
 * Design of record: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html
 *
 * ROUTE — /field/inspection/[id]/results, the canonical home: this is Step 3 of
 * the inspection execution flow, it is anchored on an inspection, and it sits
 * beside the existing statement/ sibling under the same [id].
 *
 * LEASE NOTE: field/inspection/[id]/** is held under
 * LEASE-SAQEEL-PWA-WORKSPACE-001 / -PWA-COMPLETION-001. This slice adds a NEW
 * results/ subdirectory and modifies none of the leased files, so it cannot
 * collide textually with that holder's work. Flagged rather than assumed —
 * if the lease holder also builds a results surface, these must converge.
 */
export default async function VisitResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: inspectionId } = await params;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const { data: inspection } = await sb
    .from("inspections")
    .select("id, status, visit_id, inspection_no, visits(id, visit_reference, factory_id, factories(id, name))")
    .eq("id", inspectionId)
    .maybeSingle();

  // RLS decides visibility; a miss here means not visible or not present.
  if (!inspection) redirect("/field/my-tasks");

  const visit = inspection.visits as unknown as {
    id: string; visit_reference: string | null; factory_id: string | null;
    factories: { id: string; name: string } | null;
  } | null;

  const [{ data: report }, { data: lookups }] = await Promise.all([
    sb.from("visit_result_reports")
      .select("id, specialty_visit_needed, competent_department, specialty_notes, samples_taken, products_seized, pending_document_type, inspector_notes")
      .eq("inspection_id", inspectionId)
      .maybeSingle(),
    sb.from("compliance_lookup_values")
      .select("lookup_type_key, code, label_en, label_ar, display_order, active")
      .in("lookup_type_key", ["competent_departments", "document_types"])
      .eq("active", true)
      .order("display_order"),
  ]);

  // Rows load only when a report exists; there is no parent to hang them off otherwise.
  const [{ data: sampleRows }, { data: seizedRows }] = report
    ? await Promise.all([
        sb.from("visit_result_samples").select("id, ordinal, sample_name").eq("report_id", report.id).order("ordinal"),
        sb.from("visit_result_seized_products").select("id, ordinal, product_name, quantity").eq("report_id", report.id).order("ordinal"),
      ])
    : [{ data: [] }, { data: [] }];

  const optionsFor = (key: string): LookupOption[] =>
    (lookups ?? [])
      .filter(r => r.lookup_type_key === key)
      .map(r => ({ code: r.code, label: (locale === "ar" ? r.label_ar : r.label_en) ?? r.label_en }));

  // Both lookup types are registered with NO values (HUMAN_DECISION in
  // 20260726042050). Until the Product Owner supplies them these come back
  // empty and the selects render the governed empty state.
  const departments = optionsFor("competent_departments");
  const documentTypes = optionsFor("document_types");

  const initial: ResultsDraft = {
    specialty_visit_needed: report?.specialty_visit_needed ?? null,
    competent_department: report?.competent_department ?? null,
    specialty_notes: report?.specialty_notes ?? null,
    samples_taken: report?.samples_taken ?? null,
    products_seized: report?.products_seized ?? null,
    pending_document_type: report?.pending_document_type ?? null,
    inspector_notes: report?.inspector_notes ?? null,
    samples: (sampleRows ?? []).map(r => ({ id: r.id, ordinal: r.ordinal, sample_name: r.sample_name })),
    seized: (seizedRows ?? []).map(r => ({ id: r.id, ordinal: r.ordinal, product_name: r.product_name, quantity: r.quantity })),
  };

  // Mirrors guard_submitted_inspection so the UI does not offer edits the
  // database will refuse. The guard remains the authority.
  const locked = ["submitted", "under_review", "approved", "rejected"].includes(inspection.status);

  const s: ResultsStrings = {
    specDetails: tr("figma.visitreports.vr035", "Specialty Details", "تفاصيل التخصص"),
    needSpecVisit: tr("figma.visitreports.vr034", "Is a specialty visit needed?", "هل يوجد حاجة لزيارة تخصصية؟"),
    competentDept: tr("figma.visitreports.vr033", "Competent department", "الإدارة المختصة"),
    notes: tr("common.notes", "Notes", "ملاحظات"),
    sampleDetails: t("figma.visitreports.vr036", locale === "ar" ? "تفاصيل العينات" : "Sample Details"),
    samplesTaken: t("figma.visitreports.vr037", locale === "ar" ? "هل تم سحب عينات من المنشأة؟" : "Were samples taken from the establishment?"),
    sample: tr("figma.visitreports.vr040", "Sample", "عينة"),
    delete: tr("common.delete", "Delete", "حذف"),
    sampleName: tr("figma.visitreports.vr043", "Sample name", "اسم العينة"),
    samplePhoto: tr("figma.visitreports.vr041", "Sample photo", "صورة العينة"),
    takePhoto: tr("figma.visitreports.vr042", "Take photo", "التقاط صورة"),
    addSample: t("figma.visitreports.vr047", locale === "ar" ? "إضافة عينة جديدة" : "Add new sample"),
    seizureDetails: t("figma.visitreports.vr038", locale === "ar" ? "تفاصيل الحجز" : "Seizure Details"),
    productsSeized: t("figma.visitreports.vr039", locale === "ar" ? "هل تم حجز منتجات؟" : "Were products seized?"),
    seizedProduct: tr("figma.visitreports.vr048", "Seized product", "منتج محجوز"),
    productName: t("figma.establishmentmanagement.em101", locale === "ar" ? "اسم المنتج" : "Product name"),
    seizedProductName: tr("figma.visitreports.vr050", "Seized product name", "اسم المنتج المحجوز"),
    quantity: tr("figma.visitreports.vr051", "Quantity", "الكمية"),
    addSeized: t("figma.visitreports.vr049", locale === "ar" ? "إضافة منتج محجوز" : "Add seized product"),
    docsToReview: tr("figma.visitreports.vr052", "Documents Pending Review", "الوثائق القائمة للمراجعة"),
    docType: tr("figma.visitreports.vr053", "Document type", "نوع الوثيقة"),
    inspectorNotes: tr("figma.visitreports.vr054", "Inspector Notes", "ملاحظات المفتش"),
    enterNotes: tr("figma.visitreports.vr055", "Enter your notes...", "أدخل ملاحظاتك..."),
    yes: t("field.ws.ctx.yes", locale === "ar" ? "نعم" : "Yes"),
    no: t("field.ws.ctx.no", locale === "ar" ? "لا" : "No"),
    previous: tr("common.previous", "Previous", "السابق"),
    submitReview: tr("figma.visitreports.vr056", "Submit for review", "إرسال للمراجعة"),
    save: tr("common.save", "Save", "حفظ"),
    saving: tr("common.saving", "Saving…", "جارٍ الحفظ…"),
    saved: tr("common.saved", "Saved", "تم الحفظ"),
    unsaved: tr("common.unsavedChanges", "Unsaved changes", "تغييرات غير محفوظة"),
    notConfigured: tr("common.notConfigured", "Not configured", "غير مهيأ"),
    selectPlaceholder: tr("common.select", "Select…", "اختر…"),
    successTitle: tr("figma.visitreports.vr057", "Request submitted for review and approval", "تم إرسال الطلب لغاية المراجعة والاعتماد"),
    successDesc: tr("figma.visitreports.vr058", "The request will be sent to the competent authority to complete review and approval.", "سيتم إرسال الطلب إلى الجهة المختصة لاستكمال المراجعة والاعتماد."),
    finalImmutable: tr("field.statement.final", "Final version — not editable", "النسخة النهائية غير قابلة للتعديل"),
    backToTasks: tr("field.tasks.back", "Back to tasks", "العودة إلى المهام"),
    immutableError: tr("field.results.immutable", "This report is locked because the inspection has been submitted. Corrections require a reviewer return.", "هذا التقرير مقفل لأنه تم إرسال التفتيش. يتطلب التصحيح إرجاعاً من المراجع."),
    blockedError: tr("field.results.blocked", "The submission was not accepted:", "لم يتم قبول الإرسال:"),
    signedOutError: tr("field.results.signedOut", "Your session has ended. Sign in again to continue.", "انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة."),
    connectivityOffline: tr("field.connectivity.offline", "Offline — changes remain on this device until connection returns.", "غير متصل — ستبقى التغييرات على هذا الجهاز حتى عودة الاتصال."),
    connectivityWeak: tr("field.connectivity.weak", "Weak connection — saving may take longer.", "الاتصال ضعيف — قد يستغرق الحفظ وقتاً أطول."),
  };

  const reference = visit?.visit_reference ?? inspection.inspection_no ?? inspectionId.slice(0, 8);

  // The design points both the back arrow and "Previous" at the Establishment
  // File; /field/factory-360/[id] is that surface in the app. When the factory
  // is unknown the link would have no target, so it falls back to the workspace
  // rather than rendering a dead control.
  const factoryId = visit?.factories?.id ?? visit?.factory_id ?? null;
  const backHref = factoryId ? `/field/factory-360/${factoryId}` : `/field/inspection/${inspectionId}`;

  const back = (
    <Link href={backHref} prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional>
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={back}
        title={tr("figma.visitreports.vr032", "Visit Report · Results", "تقرير زيارة · النتائج")}
        subtitle={<>{visit?.factories?.name ?? "—"} · <span className="id-code">{reference}</span></>}
        right={<span className="badge badge-info">{tr("field.results.step", "Step 3 of 4", "الخطوة 3 من 4")}</span>}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
        // Visit Results draws its own header geometry: padding:12px 18px,
        // gap:12px, 15px/600 title. Passed per-screen so the shared defaults —
        // and therefore every other field screen — stay untouched.
        geometry={{ paddingBlock: 12, gap: 12, titleSize: 15, titleWeight: 600 }}
      />
      <ResultsClient
        inspectionId={inspectionId}
        reference={reference}
        establishment={visit?.factories?.name ?? null}
        initial={initial}
        departments={departments}
        documentTypes={documentTypes}
        locked={locked}
        backHref={backHref}
        tasksHref="/field/my-tasks"
        s={s}
      />
    </>
  );
}
