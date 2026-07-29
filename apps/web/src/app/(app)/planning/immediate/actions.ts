"use server";
// Urgent planning is governed by the same supervisory boundary as all other
// planning. This action submits an exact registered target; it never creates a
// temporary factory, auto-assigns an Inspector, or releases execution itself.
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type BlockingField =
  | "identity" | "location" | "reason" | "package" | "inspector"
  | "window" | "review" | "visit_type";

export type ImmResult = {
  error?: string;
  errorCode?: string;
  blockingField?: BlockingField;
  visitId?: string;
};

const COPY = {
  en: {
    auth_required: "Your session has expired. Sign in and try again.",
    unauthorized: "You are not authorized to create this Immediate Visit.",
    invalid_actor_mode: "The selected creation path is unavailable.",
    location_required: "Confirm a valid visit location before creating the visit.",
    location_source_invalid: "Confirm whether the visit uses the official Factory list pin or a manually verified pin.",
    reason_required: "Select the urgency reason before creating the visit.",
    reason_invalid: "Select one of the approved urgency reasons.",
    reason_justification_required: "Justify the “Other” urgency reason in Notes before creating the visit.",
    visit_type_invalid: "Select a valid Business Visit Type.",
    package_unavailable: "The selected inspection checklist is no longer active or locked. Refresh and select an available checklist.",
    review_required: "Review the visit details and confirm them before creation.",
    window_invalid: "Planner-created Immediate Visits require a valid start and end window.",
    factory_unavailable: "The selected factory is no longer available. Search and select it again.",
    identity_required: "Enter any available factory identity: name, CR, Industrial License, or business activity.",
    factory_identity_match: "A factory already uses this CR or Industrial License. Select the existing factory instead.",
    duplicate_active_visit: "An active visit already exists for this factory. Duplicate active visits are not allowed.",
    inspector_ineligible: "The selected inspector is no longer eligible for assignment.",
    inspector_unavailable: "The selected inspector is no longer available in this window.",
    no_inspector_available: "No eligible inspector is available in this window.",
    concurrent_conflict: "The record changed during creation. Your entries are preserved; review and try again.",
    invalid_request: "The creation request is invalid. Refresh this page and try again.",
    manual_permission_denied: "Manual factory entry is not permitted for your role.",
    manual_lookups_unavailable: "Manual entry reference data is unavailable right now; manual creation is blocked.",
    manual_type_not_allowed: "The selected visit type does not allow unregistered factory entry.",
    manual_confirm_required: "Confirm that the factory was not found in the registered list before manual entry.",
    manual_identity_incomplete: "Enter the establishment name, region and city for the manual factory.",
    manual_reason_required: "Select the manual entry reason.",
    manual_reason_comment_required: "Add a comment for the “Other” manual entry reason.",
    manual_mobile_invalid: "Enter a valid contact mobile, or turn off factory notification.",
    system: "The Immediate Visit could not be created. Your entries are preserved; try again.",
  },
  ar: {
    auth_required: "انتهت صلاحية جلستك. سجّل الدخول ثم أعد المحاولة.",
    unauthorized: "ليس لديك تصريح لإنشاء هذه الزيارة الفورية.",
    invalid_actor_mode: "مسار الإنشاء المحدد غير متاح.",
    location_required: "أكّد موقع زيارة صالحًا قبل إنشاء الزيارة.",
    location_source_invalid: "أكّد ما إذا كانت الزيارة تستخدم موقع قائمة المصانع الرسمي أو موقعًا تم التحقق منه يدويًا.",
    reason_required: "اختر سبب الاستعجال قبل إنشاء الزيارة.",
    reason_invalid: "اختر أحد أسباب الاستعجال المعتمدة.",
    reason_justification_required: "برّر سبب الاستعجال «أخرى» في الملاحظات قبل إنشاء الزيارة.",
    visit_type_invalid: "اختر نوع زيارة أعمال صالحًا.",
    package_unavailable: "قائمة التفتيش المحددة لم تعد نشطة أو مقفلة. حدّث الصفحة واختر قائمة تفتيش متاحة.",
    review_required: "راجع تفاصيل الزيارة وأكّدها قبل الإنشاء.",
    window_invalid: "تتطلب الزيارة الفورية التي ينشئها المخطط بداية ونهاية صالحتين للنافذة.",
    factory_unavailable: "المصنع المحدد لم يعد متاحًا. ابحث عنه وحدده مرة أخرى.",
    identity_required: "أدخل أي هوية متاحة للمصنع: الاسم أو السجل التجاري أو الترخيص الصناعي أو نشاط الأعمال.",
    factory_identity_match: "يوجد مصنع يستخدم هذا السجل التجاري أو الترخيص الصناعي. حدد المصنع الموجود بدلًا منه.",
    duplicate_active_visit: "توجد زيارة نشطة لهذا المصنع. لا يُسمح بتكرار الزيارات النشطة.",
    inspector_ineligible: "المفتش المحدد لم يعد مؤهلًا للتكليف.",
    inspector_unavailable: "المفتش المحدد لم يعد متاحًا في هذه النافذة.",
    no_inspector_available: "لا يوجد مفتش مؤهل متاح في هذه النافذة.",
    concurrent_conflict: "تغير السجل أثناء الإنشاء. تم الاحتفاظ بمدخلاتك؛ راجعها وأعد المحاولة.",
    invalid_request: "طلب الإنشاء غير صالح. حدّث الصفحة وأعد المحاولة.",
    manual_permission_denied: "الإدخال اليدوي للمصنع غير مصرح لدورك.",
    manual_lookups_unavailable: "البيانات المرجعية للإدخال اليدوي غير متاحة حاليًا؛ الإنشاء اليدوي محظور.",
    manual_type_not_allowed: "نوع الزيارة المحدد لا يسمح بإدخال مصنع غير مسجل.",
    manual_confirm_required: "أكّد أن المصنع غير موجود في القائمة المسجلة قبل الإدخال اليدوي.",
    manual_identity_incomplete: "أدخل اسم المنشأة والمنطقة والمدينة للمصنع اليدوي.",
    manual_reason_required: "اختر سبب الإدخال اليدوي.",
    manual_reason_comment_required: "أضف تعليقًا لسبب الإدخال اليدوي «أخرى».",
    manual_mobile_invalid: "أدخل جوال تواصل صالحًا، أو أوقف إشعار المصنع.",
    system: "تعذر إنشاء الزيارة الفورية. تم الاحتفاظ بمدخلاتك؛ أعد المحاولة.",
  },
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URGENCY_REASONS = new Set([
  "Complaint received",
  "Incident / accident report",
  "Referral from authority",
  "Other",
]);
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const coordinate = (value: string) => value === "" ? null : Number(value);
const instant = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export async function createImmediateVisit(_: ImmResult, formData: FormData): Promise<ImmResult> {
  const locale = text(formData, "locale") === "ar" ? "ar" : "en";
  const copy = COPY[locale];
  const requestId = text(formData, "request_id");
  const actorMode = text(formData, "actor_mode");
  if (!UUID.test(requestId) || actorMode !== "planner") {
    return { error: copy.invalid_request, errorCode: "invalid_request" };
  }

  const latRaw = text(formData, "lat");
  const lngRaw = text(formData, "lng");
  const lat = coordinate(latRaw);
  const lng = coordinate(lngRaw);
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: copy.location_required, errorCode: "location_required", blockingField: "location" };
  }
  const reason = text(formData, "urgency_reason");
  if (!reason) {
    return { error: copy.reason_required, errorCode: "reason_required", blockingField: "reason" };
  }
  if (!URGENCY_REASONS.has(reason)) {
    return { error: copy.reason_invalid, errorCode: "reason_invalid", blockingField: "reason" };
  }
  const notes = text(formData, "notes");
  if (reason === "Other" && !notes) {
    return { error: copy.reason_justification_required, errorCode: "reason_justification_required", blockingField: "reason" };
  }

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: copy.auth_required, errorCode: "auth_required" };

  const packageId = text(formData, "package_version_id");
  const existingFactoryId = text(formData, "existing_factory_id");
  const inspectorId = text(formData, "inspector_id");
  if (!UUID.test(existingFactoryId)) return { error: "Choose one registered factory before submitting an urgent visit.", errorCode: "factory_unavailable", blockingField: "identity" };
  if (text(formData, "review_confirmed") !== "yes") return { error: copy.review_required, errorCode: "review_required", blockingField: "review" };
  const { data: visitId, error } = await sb.rpc("submit_immediate_visit_for_supervision", {
    p_request_id: requestId,
    p_factory_id: existingFactoryId,
    p_package_version_id: UUID.test(packageId) ? packageId : null,
    p_proposed_inspector_id: UUID.test(inspectorId) ? inspectorId : null,
    p_visit_type: text(formData, "visit_type"),
    p_window_start: instant(text(formData, "window_start")),
    p_window_end: instant(text(formData, "window_end")),
    p_urgency_reason: reason,
    p_priority: text(formData, "priority") || null,
    p_notes: notes || null,
    p_lat: lat,
    p_lng: lng,
    p_location_source: text(formData, "location_source") || null,
  });
  if (error) {
    console.error("[ submit_immediate_visit_for_supervision]", error.code, error.message);
    if (/WINDOW/i.test(error.message)) return { error: "The urgent visit must start within 24 hours and have a valid window.", errorCode: "window_invalid", blockingField: "window" };
    if (/TARGET-AMBIGUOUS/i.test(error.message)) return { error: "This factory has more than one target identity. Start from Factory 360 and select the exact licence.", errorCode: "factory_unavailable", blockingField: "identity" };
    if (/DUPLICATE/i.test(error.message)) return { error: copy.duplicate_active_visit, errorCode: "duplicate_active_visit", blockingField: "identity" };
    return { error: copy.system, errorCode: "system" };
  }
  if (!visitId) return { error: copy.system, errorCode: "system" };
  redirect(`/planning/supervision?submitted=${visitId}`);
}
