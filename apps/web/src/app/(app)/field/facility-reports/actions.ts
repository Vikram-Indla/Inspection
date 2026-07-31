"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type FieldFacilityReportResult = { error?: string; ok?: boolean };

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

// Jira INSP-583. Write surface for 20260801040000_facility_reports.sql.
export async function createFieldFacilityReport(_: FieldFacilityReportResult, formData: FormData): Promise<FieldFacilityReportResult> {
  const locale = String(formData.get("locale") ?? "") === "ar" ? "ar" : "en";
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: locale === "ar" ? "انتهت صلاحية الجلسة. سجّل الدخول ثم أعد المحاولة." : "Session expired. Sign in and try again." };

  const facilityAction = optionalText(formData, "facility_action");
  if (facilityAction && !["close", "reopen"].includes(facilityAction)) {
    return { error: locale === "ar" ? "إجراء المنشأة غير صالح." : "Invalid facility action." };
  }
  const attendance = optionalText(formData, "attendance");
  if (attendance && !["present", "absent", "objected"].includes(attendance)) {
    return { error: locale === "ar" ? "قيمة الحضور غير صالحة." : "Invalid attendance value." };
  }
  if (attendance === "present" && !optionalText(formData, "signature_data_url")) {
    return { error: locale === "ar" ? "التوقيع مطلوب لإثبات الحضور." : "A signature is required to record attendance." };
  }

  const { error } = await sb.from("facility_reports").insert({
    report_date: optionalText(formData, "report_date"),
    summons_date: optionalText(formData, "summons_date"),
    facility_action: facilityAction,
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
    logProviderError("field facility report create", error);
    return { error: locale === "ar" ? "تعذر حفظ محضر المنشأة. لم يتم تغيير أي شيء." : `${NEUTRAL_WRITE_ERROR} Nothing was changed.` };
  }

  const inspectionId = optionalText(formData, "inspection_id");
  revalidatePath("/field/facility-reports");
  if (inspectionId) revalidatePath(`/field/inspection/${inspectionId}`);
  return { ok: true };
}
