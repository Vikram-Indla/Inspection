"use server";
// Jira INSP-605. Figma: MIM iPad Inspector App, "Visit Reports" page (node
// 269:40019), "Create an Unlicensed Establishment" (node 941:49887).
//
// Calls the already-governed create_immediate_visit RPC
// (0027_cd023_immediate_visit_atomic.sql) with p_actor_mode='inspector' — its
// own separate, narrower RLS branch (self-assign, zero-duration "start now"
// window) that R05 (the planner-path block in planning/immediate) never
// applied to. No schema change, no new write path.
//
// PO decision 2026-08-01: photo + GPS location count as sufficient identity
// for a field-discovered facility — no name/CR/licence field exists in the
// design. p_manual_name/cr/license stay empty so the RPC's own
// name_is_system_generated logic fires correctly (line ~374-375 of the
// migration); p_manual_activity carries a fixed, honest provenance marker
// instead of an invented business fact, to satisfy the RPC's identity_required
// check without pretending real identity was captured.
//
// PO decision 2026-08-01: visit_type defaults to 'follow_up' — the design's
// "نوع الزيارة" sample value ("رقابية مستهدفة") doesn't map to the RPC's
// enum (complaint|follow_up|periodic), and extending that enum is schema work
// out of scope here.
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type UnregisteredResult = { error?: string; ok?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VISIT_TYPES = new Set(["complaint", "follow_up", "periodic"]);
// Exact governed set from visits_immediate_reason_contract
// (20260714060935_cd023_urgency_contract.sql) — the same 4 values
// planning/immediate/ImmediateForm.tsx already uses. 'Other' requires notes.
const URGENCY_REASONS = new Set(["Complaint received", "Incident / accident report", "Referral from authority", "Other"]);
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function createUnregisteredEstablishmentVisit(_: UnregisteredResult, formData: FormData): Promise<UnregisteredResult> {
  const locale = text(formData, "locale") === "ar" ? "ar" : "en";
  const requestId = text(formData, "request_id");
  if (!UUID.test(requestId)) {
    return { error: locale === "ar" ? "طلب غير صالح. حدّث الصفحة وأعد المحاولة." : "Invalid request. Refresh and try again." };
  }
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: locale === "ar" ? "انتهت صلاحية الجلسة. سجّل الدخول ثم أعد المحاولة." : "Session expired. Sign in and try again." };

  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: locale === "ar" ? "أكّد موقعاً صالحاً قبل المتابعة." : "Confirm a valid location before continuing." };
  }
  const visitType = text(formData, "visit_type") || "follow_up";
  if (!VISIT_TYPES.has(visitType)) {
    return { error: locale === "ar" ? "نوع زيارة غير صالح." : "Invalid visit type." };
  }
  const reason = text(formData, "reason");
  if (!URGENCY_REASONS.has(reason)) {
    return { error: locale === "ar" ? "اختر سبب الزيارة." : "Select a reason for this visit." };
  }
  const notes = text(formData, "notes");
  if (reason === "Other" && !notes) {
    return { error: locale === "ar" ? "برّر سبب «أخرى» في الملاحظات." : "Justify the \"Other\" reason in Notes." };
  }
  const packageVersionId = text(formData, "package_version_id");
  if (!UUID.test(packageVersionId)) {
    return { error: locale === "ar" ? "اختر نوع التقرير." : "Select a report type." };
  }

  const { data, error } = await sb.rpc("create_immediate_visit", {
    p_request_id: requestId,
    p_actor_mode: "inspector",
    p_existing_factory_id: null,
    p_manual_name: null,
    p_manual_cr: null,
    p_manual_license: null,
    p_manual_activity: "Captured in the field — unregistered facility, identity pending reconciliation",
    p_manual_region: null,
    p_manual_city: null,
    p_lat: lat,
    p_lng: lng,
    p_location_source: "manual",
    p_reason: reason,
    p_package_version_id: packageVersionId,
    p_visit_type: visitType,
    p_priority: null,
    p_notes: notes || null,
    p_window_start: null,
    p_window_end: null,
    p_inspector_id: null,
    p_review_confirmed: null,
  });
  if (error) {
    console.error("[unregistered establishment] create_immediate_visit", error.message);
    return { error: locale === "ar" ? "تعذّر إنشاء الزيارة. لم يتم تغيير أي شيء." : "Could not create the visit. Nothing was changed." };
  }
  const result = data as { status?: string; code?: string; visit_id?: string } | null;
  if (!result || result.status !== "ok") {
    const code = result?.code ?? "system_error";
    const messages: Record<string, { en: string; ar: string }> = {
      identity_required: { en: "Facility identity could not be established.", ar: "تعذر إثبات هوية المنشأة." },
      duplicate_active_visit: { en: "An active visit already exists here.", ar: "توجد زيارة نشطة هنا بالفعل." },
      package_unavailable: { en: "The selected report type is no longer available.", ar: "نوع التقرير المحدد لم يعد متاحاً." },
      location_required: { en: "Confirm a valid location before continuing.", ar: "أكّد موقعاً صالحاً قبل المتابعة." },
    };
    const m = messages[code] ?? { en: "Could not create the visit. Nothing was changed.", ar: "تعذّر إنشاء الزيارة. لم يتم تغيير أي شيء." };
    return { error: locale === "ar" ? m.ar : m.en };
  }
  redirect(`/field/${result.visit_id}`);
}
