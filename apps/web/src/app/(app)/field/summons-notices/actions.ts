"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type FieldSummonsResult = { error?: string; ok?: boolean };

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

// Jira INSP-558. Write surface for 20260801010000_summons_notices.sql — field
// set and option-domain notes are exactly what that migration documents.
export async function createFieldSummonsNotice(_: FieldSummonsResult, formData: FormData): Promise<FieldSummonsResult> {
  const locale = String(formData.get("locale") ?? "") === "ar" ? "ar" : "en";
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: locale === "ar" ? "انتهت صلاحية الجلسة. سجّل الدخول ثم أعد المحاولة." : "Session expired. Sign in and try again." };

  const attendance = optionalText(formData, "attendance");
  if (attendance && !["present", "absent", "objected"].includes(attendance)) {
    return { error: locale === "ar" ? "قيمة الحضور غير صالحة." : "Invalid attendance value." };
  }
  if (attendance === "present" && !optionalText(formData, "signature_data_url")) {
    return { error: locale === "ar" ? "التوقيع مطلوب لإثبات الحضور." : "A signature is required to record attendance." };
  }

  const { error } = await sb.from("summons_notices").insert({
    report_date: optionalText(formData, "report_date"),
    report_day: optionalText(formData, "report_day"),
    subject: optionalText(formData, "subject"),
    region: optionalText(formData, "region"),
    department: optionalText(formData, "department"),
    required_document_type: optionalText(formData, "required_document_type"),
    reason: optionalText(formData, "reason"),
    attendance,
    attendance_reason: optionalText(formData, "attendance_reason"),
    signer_name: optionalText(formData, "signer_name"),
    signature_data_url: optionalText(formData, "signature_data_url"),
    signed_at: optionalText(formData, "signed_at"),
    factory_id: optionalText(formData, "factory_id"),
    visit_id: optionalText(formData, "visit_id"),
    inspection_id: optionalText(formData, "inspection_id"),
    created_by: user.id,
  });
  if (error) {
    logProviderError("field summons notice create", error);
    return { error: locale === "ar" ? "تعذر حفظ المحضر. لم يتم تغيير أي شيء." : `${NEUTRAL_WRITE_ERROR} Nothing was changed.` };
  }

  const inspectionId = optionalText(formData, "inspection_id");
  revalidatePath("/field/summons-notices");
  if (inspectionId) revalidatePath(`/field/inspection/${inspectionId}`);
  return { ok: true };
}
