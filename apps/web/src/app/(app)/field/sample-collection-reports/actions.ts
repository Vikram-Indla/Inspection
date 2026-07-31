"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type FieldSampleCollectionResult = { error?: string; ok?: boolean };

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

// Jira INSP-573. Write surface for 20260801020000_sample_collection_reports.sql.
export async function createFieldSampleCollectionReport(_: FieldSampleCollectionResult, formData: FormData): Promise<FieldSampleCollectionResult> {
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

  const { error } = await sb.from("sample_collection_reports").insert({
    collector_name: optionalText(formData, "collector_name"),
    laboratory_name: optionalText(formData, "laboratory_name"),
    region: optionalText(formData, "region"),
    department: optionalText(formData, "department"),
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
    logProviderError("field sample collection report create", error);
    return { error: locale === "ar" ? "تعذر حفظ تقرير جمع العينة. لم يتم تغيير أي شيء." : `${NEUTRAL_WRITE_ERROR} Nothing was changed.` };
  }

  const inspectionId = optionalText(formData, "inspection_id");
  revalidatePath("/field/sample-collection-reports");
  if (inspectionId) revalidatePath(`/field/inspection/${inspectionId}`);
  return { ok: true };
}
