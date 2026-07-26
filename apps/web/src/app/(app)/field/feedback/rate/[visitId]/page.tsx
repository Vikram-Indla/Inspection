import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import RateForm, { type Aspect } from "./RateForm";

// SAQEEL Feedback — establishment rating (WA-M11, card "feedback").
// Captured in person on the assigned inspector's authenticated device at the
// end of a completed visit, the same device-handoff pattern already accepted
// for factory-representative acknowledgement (DEC-009/M04-197 SignaturePad).
// No public unauthenticated scan destination — that decision (O-15) remains
// open and is out of scope here.
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ASPECT_KEYS: { key: string; en: string; ar: string }[] = [
  { key: "professionalism", en: "Professionalism & conduct", ar: "الاحترافية والسلوك" },
  { key: "clarity", en: "Clarity of findings", ar: "وضوح الملاحظات" },
  { key: "punctuality", en: "Punctuality", ar: "الالتزام بالوقت" },
  { key: "fairness", en: "Fairness & neutrality", ar: "العدالة والحياد" },
  { key: "guidance", en: "Guidance & explanation", ar: "الشرح والتوجيه" },
];

export default async function RateVisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const back = (
    <Link href={`/field/feedback?visit=${visitId}`} prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="m15 6-6 6 6 6" /></svg>
    </Link>
  );
  const header = (title: string) => (
    <FieldHeader leading={back} title={title} langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"} />
  );

  if (!UUID_SHAPE.test(visitId)) {
    return (
      <>
        {header(tr("field.feedback.notFoundTitle", "Not found", "غير موجود"))}
        <EmptyState glyph="∅" title={tr("field.feedback.notFound", "Visit not found", "الزيارة غير موجودة")}
          body={tr("field.feedback.notFoundDesc", "This visit does not exist or is outside your scope.", "هذه الزيارة غير موجودة أو خارج نطاق صلاحيتك.")} />
      </>
    );
  }

  const { data: visit, error: visitError } = await sb
    .from("visits")
    .select("id, operational_state, factories(name)")
    .eq("id", visitId)
    .maybeSingle();

  if (visitError || !visit) {
    return (
      <>
        {header(tr("field.feedback.notFoundTitle", "Not found", "غير موجود"))}
        <EmptyState glyph="∅" title={tr("field.feedback.notFound", "Visit not found", "الزيارة غير موجودة")}
          body={tr("field.feedback.notFoundDesc", "This visit does not exist or is outside your scope.", "هذه الزيارة غير موجودة أو خارج نطاق صلاحيتك.")} />
      </>
    );
  }

  if (visit.operational_state !== "submitted") {
    return (
      <>
        {header(tr("field.feedback.title", "Establishment rating", "تقييم المنشأة"))}
        <EmptyState glyph="⏳" title={tr("field.feedback.notReady", "Not ready for rating yet", "لم تصبح جاهزة للتقييم بعد")}
          body={tr("field.feedback.notReadyDesc", "The visit must be completed before the establishment can be rated.", "يجب إنهاء الزيارة قبل تقييم المنشأة.")} />
      </>
    );
  }

  const { data: existing } = await sb
    .from("feedback")
    .select("id, overall_rating, submitted_at")
    .eq("visit_id", visitId)
    .maybeSingle();

  const { data: inspection } = await sb
    .from("inspections")
    .select("id")
    .eq("visit_id", visitId)
    .maybeSingle();

  const factoryName = (visit as unknown as { factories: { name: string } | null }).factories?.name
    ?? tr("field.feedback.establishment", "Establishment", "المنشأة");

  if (existing) {
    return (
      <>
        {header(tr("field.feedback.title", "Establishment rating", "تقييم المنشأة"))}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)", maxWidth: 520, width: "100%", margin: "0 auto" }}>
          <div className="card" style={{ padding: 24, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span className="badge badge-compliant"><span className="dot" />{tr("field.feedback.alreadySubmitted", "Rating already submitted", "تم إرسال التقييم مسبقاً")}</span>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{factoryName}</div>
            <div className="t-caption">{tr("field.feedback.overall", "Overall", "التقييم العام")} · {existing.overall_rating}/5</div>
            {inspection && (
              <Link href={`/reports/inspection/${inspection.id}`} className="btn btn-secondary btn-block" prefetch={false}>
                {tr("field.feedback.viewReport", "View inspection report", "عرض تقرير التفتيش")}
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  const aspects: Aspect[] = ASPECT_KEYS.map(a => ({ key: a.key, label: locale === "ar" ? a.ar : a.en }));

  return (
    <>
      {header(tr("field.feedback.title", "Establishment rating", "تقييم المنشأة"))}
      <RateForm
        visitId={visitId}
        factoryName={factoryName}
        inspectionId={inspection?.id ?? null}
        aspects={aspects}
        locale={locale}
        strings={{
          visitRatingSub: tr("field.feedback.sub", "Rate this visit before handing the device back", "قيّم هذه الزيارة قبل إعادة الجهاز"),
          overallSatisfaction: tr("field.feedback.overallSatisfaction", "Overall satisfaction with the visit", "الرضا العام عن الزيارة"),
          stepQuestionLabel: tr("field.feedback.stepQuestion", "Question", "السؤال"),
          notesAndAttachments: tr("field.feedback.notes", "Notes (optional)", "ملاحظات (اختياري)"),
          shareThoughts: tr("field.feedback.shareThoughts", "Share your thoughts about the visit", "شاركنا رأيك حول الزيارة"),
          prevQuestion: tr("field.feedback.prev", "Previous", "السابق"),
          nextQuestion: tr("field.feedback.next", "Next", "التالي"),
          finishQuestions: tr("field.feedback.finish", "Finish questions", "إنهاء الأسئلة"),
          repSignature: tr("field.feedback.signature", "Representative signature", "توقيع ممثل المنشأة"),
          submitRating: tr("field.feedback.submit", "Submit rating", "إرسال التقييم"),
          confidentialNote: tr("field.feedback.confidential", "The rating is confidential and used to improve service · does not affect the inspection outcome.", "التقييم سري ويُستخدم لتحسين الخدمة · لا يؤثر على نتيجة التفتيش."),
          sig: {
            // Capture mode: a feedback rating is signed by a representative who is
            // already present, so the attendance question does not apply. Passing
            // attendance copy here is now a compile error, not a silent no-op.
            mode: "capture" as const,
            title: tr("field.feedback.sigTitle", "Representative signature", "توقيع الممثل"),
            hint: tr("field.feedback.sigHint", "Have the establishment representative sign to confirm this rating.", "اطلب من ممثل المنشأة التوقيع لتأكيد هذا التقييم."),
            nameLabel: tr("field.feedback.sigName", "Representative name", "اسم الممثل"),
            namePlaceholder: tr("field.feedback.sigNamePh", "Full name", "الاسم الكامل"),
            clear: tr("common.clear", "Clear", "مسح"),
            cancel: tr("common.cancel", "Cancel", "إلغاء"),
            confirm: tr("field.feedback.sigConfirm", "Confirm & submit", "تأكيد وإرسال"),
            required: tr("field.feedback.sigRequired", "Name and signature are required.", "الاسم والتوقيع مطلوبان."),
          },
          submitError: tr("field.feedback.submitError", "Could not submit the rating. Try again.", "تعذّر إرسال التقييم. حاول مرة أخرى."),
          done: tr("field.feedback.done", "Rating submitted", "تم إرسال التقييم"),
          viewReport: tr("field.feedback.viewReport", "View inspection report", "عرض تقرير التفتيش"),
        }}
      />
    </>
  );
}
