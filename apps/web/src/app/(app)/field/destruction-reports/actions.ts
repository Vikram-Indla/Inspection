"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type FieldDestructionResult = { error?: string; ok?: boolean };

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

// Jira INSP-578. Write surface for 20260801030000_non_compliant_destruction_reports.sql.
export async function createFieldDestructionReport(_: FieldDestructionResult, formData: FormData): Promise<FieldDestructionResult> {
  const locale = String(formData.get("locale") ?? "") === "ar" ? "ar" : "en";
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: locale === "ar" ? "انتهت صلاحية الجلسة. سجّل الدخول ثم أعد المحاولة." : "Session expired. Sign in and try again." };

  const reportNumber = optionalText(formData, "report_number");
  if (!reportNumber) return { error: locale === "ar" ? "رقم المحضر مطلوب." : "Report number is required." };

  const attendance = optionalText(formData, "attendance");
  if (attendance && !["present", "absent", "objected"].includes(attendance)) {
    return { error: locale === "ar" ? "قيمة الحضور غير صالحة." : "Invalid attendance value." };
  }
  if (attendance === "present" && !optionalText(formData, "signature_data_url")) {
    return { error: locale === "ar" ? "التوقيع مطلوب لإثبات الحضور." : "A signature is required to record attendance." };
  }

  const { error } = await sb.from("non_compliant_destruction_reports").insert({
    report_number: reportNumber,
    report_date: optionalText(formData, "report_date"),
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
    logProviderError("field destruction report create", error);
    return { error: locale === "ar" ? "تعذر حفظ محضر الإتلاف. لم يتم تغيير أي شيء." : `${NEUTRAL_WRITE_ERROR} Nothing was changed.` };
  }

  const inspectionId = optionalText(formData, "inspection_id");
  revalidatePath("/field/destruction-reports");
  if (inspectionId) revalidatePath(`/field/inspection/${inspectionId}`);
  return { ok: true };
}
