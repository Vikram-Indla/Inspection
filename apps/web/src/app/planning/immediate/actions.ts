"use server";
// CD-023 / SCR-WEB-130 — MVP1-M01-043..052, M02-012.
// All authoritative validation and writes run in create_immediate_visit (0027):
// one SECURITY INVOKER transaction, RLS enforced, request-id idempotent and
// append-only audited. This action only normalizes form input and maps stable
// blocker codes to neutral localized copy; raw database errors never reach UI.
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

type RpcResult = {
  status?: "ok" | "blocked";
  code?: string;
  field?: BlockingField;
  visit_id?: string;
  actor_mode?: "planner" | "inspector";
};

const COPY = {
  en: {
    auth_required: "Your session has expired. Sign in and try again.",
    unauthorized: "You are not authorized to create this Immediate Visit.",
    invalid_actor_mode: "The selected creation path is unavailable.",
    location_required: "Confirm a valid visit location before creating the visit (M01-046).",
    location_source_invalid: "Confirm whether the visit uses the official registry pin or a manually verified pin (M01-046).",
    reason_required: "Select the urgency reason before creating the visit.",
    reason_invalid: "Select one of the approved urgency reasons.",
    reason_justification_required: "Justify the “Other” urgency reason in Notes before creating the visit.",
    visit_type_invalid: "Select a valid Business Visit Type (M01-047).",
    package_unavailable: "The selected package is no longer published or locked. Refresh and select an available package.",
    review_required: "Review the visit details and confirm them before creation (M01-049).",
    window_invalid: "Planner-created Immediate Visits require a valid start and end window (M01-047).",
    factory_unavailable: "The selected factory is no longer available. Search and select it again.",
    identity_required: "Enter any available factory identity: name, CR, Industrial License, or business activity (M01-045).",
    factory_identity_match: "A factory already uses this CR or Industrial License. Select the existing factory instead (M01-044/045).",
    duplicate_active_visit: "An active visit already exists for this factory. Duplicate active visits are not allowed (M02-012).",
    inspector_ineligible: "The selected inspector is no longer eligible for assignment (M01-048).",
    inspector_unavailable: "The selected inspector is no longer available in this window (M01-048).",
    no_inspector_available: "No eligible inspector is available in this window (M01-048).",
    concurrent_conflict: "The record changed during creation. Your entries are preserved; review and try again.",
    invalid_request: "The creation request is invalid. Refresh this page and try again.",
    system: "The Immediate Visit could not be created. Your entries are preserved; try again.",
  },
  ar: {
    auth_required: "انتهت صلاحية جلستك. سجّل الدخول ثم أعد المحاولة.",
    unauthorized: "ليس لديك تصريح لإنشاء هذه الزيارة الفورية.",
    invalid_actor_mode: "مسار الإنشاء المحدد غير متاح.",
    location_required: "أكّد موقع زيارة صالحًا قبل إنشاء الزيارة (M01-046).",
    location_source_invalid: "أكّد ما إذا كانت الزيارة تستخدم موقع السجل الرسمي أو موقعًا تم التحقق منه يدويًا (M01-046).",
    reason_required: "اختر سبب الاستعجال قبل إنشاء الزيارة.",
    reason_invalid: "اختر أحد أسباب الاستعجال المعتمدة.",
    reason_justification_required: "برّر سبب الاستعجال «أخرى» في الملاحظات قبل إنشاء الزيارة.",
    visit_type_invalid: "اختر نوع زيارة أعمال صالحًا (M01-047).",
    package_unavailable: "حزمة التفتيش المحددة لم تعد منشورة أو مقفلة. حدّث الصفحة واختر حزمة متاحة.",
    review_required: "راجع تفاصيل الزيارة وأكّدها قبل الإنشاء (M01-049).",
    window_invalid: "تتطلب الزيارة الفورية التي ينشئها المخطط بداية ونهاية صالحتين للنافذة (M01-047).",
    factory_unavailable: "المصنع المحدد لم يعد متاحًا. ابحث عنه وحدده مرة أخرى.",
    identity_required: "أدخل أي هوية متاحة للمصنع: الاسم أو السجل التجاري أو الترخيص الصناعي أو نشاط الأعمال (M01-045).",
    factory_identity_match: "يوجد مصنع يستخدم هذا السجل التجاري أو الترخيص الصناعي. حدد المصنع الموجود بدلًا منه (M01-044/045).",
    duplicate_active_visit: "توجد زيارة نشطة لهذا المصنع. لا يُسمح بتكرار الزيارات النشطة (M02-012).",
    inspector_ineligible: "المفتش المحدد لم يعد مؤهلًا للتكليف (M01-048).",
    inspector_unavailable: "المفتش المحدد لم يعد متاحًا في هذه النافذة (M01-048).",
    no_inspector_available: "لا يوجد مفتش مؤهل متاح في هذه النافذة (M01-048).",
    concurrent_conflict: "تغير السجل أثناء الإنشاء. تم الاحتفاظ بمدخلاتك؛ راجعها وأعد المحاولة.",
    invalid_request: "طلب الإنشاء غير صالح. حدّث الصفحة وأعد المحاولة.",
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
const nullable = (value: string) => value || null;
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
  if (!UUID.test(requestId) || !["planner", "inspector"].includes(actorMode)) {
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
  const { data, error } = await sb.rpc("create_immediate_visit", {
    p_request_id: requestId,
    p_actor_mode: actorMode,
    p_existing_factory_id: UUID.test(existingFactoryId) ? existingFactoryId : null,
    p_manual_name: nullable(text(formData, "manual_name")),
    p_manual_cr: nullable(text(formData, "manual_cr")),
    p_manual_license: nullable(text(formData, "manual_license")),
    p_manual_activity: nullable(text(formData, "manual_activity")),
    p_manual_region: nullable(text(formData, "manual_region")),
    p_manual_city: nullable(text(formData, "manual_city")),
    p_lat: lat,
    p_lng: lng,
    p_location_source: nullable(text(formData, "location_source")),
    p_reason: reason,
    p_package_version_id: UUID.test(packageId) ? packageId : null,
    p_visit_type: text(formData, "visit_type"),
    p_priority: nullable(text(formData, "priority")),
    p_notes: nullable(notes),
    p_window_start: instant(text(formData, "window_start")),
    p_window_end: instant(text(formData, "window_end")),
    p_inspector_id: actorMode === "planner" && UUID.test(inspectorId) ? inspectorId : null,
    p_review_confirmed: text(formData, "review_confirmed") === "yes",
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[CD-023 create_immediate_visit]", error);
    return { error: copy.system, errorCode: "system" };
  }

  const result = (data ?? {}) as RpcResult;
  if (result.status !== "ok" || !result.visit_id) {
    const code = result.code && result.code in copy ? result.code as keyof typeof copy : "system";
    return { error: copy[code], errorCode: code, blockingField: result.field };
  }

  if (result.actor_mode === "inspector") redirect(`/field/${result.visit_id}`);
  redirect(`/visits/${result.visit_id}`);
}
