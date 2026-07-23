"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type FieldIncidentResult = { error?: string; ok?: boolean };

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

// PLAN v7 item 7 · FNS-033 / J-12. Exact write surface from
// 20260720010000_incident_reports.sql; option domains and text formats remain
// deliberately unconstrained because the migration records them as unresolved.
export async function createFieldIncidentReport(_: FieldIncidentResult, formData: FormData): Promise<FieldIncidentResult> {
  const locale = String(formData.get("locale") ?? "") === "ar" ? "ar" : "en";
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: locale === "ar" ? "انتهت صلاحية الجلسة. سجّل الدخول ثم أعد المحاولة." : "Session expired. Sign in and try again." };

  const { error } = await sb.from("incident_reports").insert({
    establishment_code: optionalText(formData, "establishment_code"),
    commercial_registration_number: optionalText(formData, "commercial_registration_number"),
    report_source: optionalText(formData, "report_source"),
    reporter_name: optionalText(formData, "reporter_name"),
    reporter_contact_number: optionalText(formData, "reporter_contact_number"),
    report_time: optionalText(formData, "report_time"),
    number_of_cases: optionalText(formData, "number_of_cases"),
    resulting_damage: optionalText(formData, "resulting_damage"),
    incident_type: optionalText(formData, "incident_type"),
    preliminary_incident_description: optionalText(formData, "preliminary_incident_description"),
    // O-13/IPAD-FIGMA-DELTA §2B — mid-visit incident logging anchors the
    // report to the active visit/factory/inspection when reached in that
    // context; the standalone route (no query params) leaves these null,
    // same as before this change.
    factory_id: optionalText(formData, "factory_id"),
    visit_id: optionalText(formData, "visit_id"),
    inspection_id: optionalText(formData, "inspection_id"),
    created_by: user.id,
  });
  if (error) {
    logProviderError("field incident report create", error);
    return { error: locale === "ar" ? "تعذر حفظ بلاغ الحادث. لم يتم تغيير أي شيء." : `${NEUTRAL_WRITE_ERROR} Nothing was changed.` };
  }

  const inspectionId = optionalText(formData, "inspection_id");
  revalidatePath("/field/incident-reports");
  if (inspectionId) revalidatePath(`/field/inspection/${inspectionId}`);
  return { ok: true };
}
