"use server";
// Incident Report create — Figma FNS-033 / J-12 ("رصد حادث").
// Additive insert into incident_reports (migration 20260720010000). RLS gates
// who may write (inspector, own row); this action only shapes and forwards the
// captured EM-046..EM-059 fields. Same auth/neutral-error shape as the external
// portal create (apps/web/src/app/portal/actions.ts) — no new pattern invented.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type IncidentResult = { error?: string; ok?: boolean };

// Trim to string, collapse empty → null so nullable columns stay null (never "").
function opt(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v.length ? v : null;
}

export async function createIncidentReport(_: IncidentResult, formData: FormData): Promise<IncidentResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const { error } = await sb.from("incident_reports").insert({
    establishment_code: opt(formData, "establishment_code"),                             // EM-046
    commercial_registration_number: opt(formData, "commercial_registration_number"),     // EM-047
    report_source: opt(formData, "report_source"),                                       // EM-048 (free-text; domain uncaptured)
    reporter_name: opt(formData, "reporter_name"),                                       // EM-049
    reporter_contact_number: opt(formData, "reporter_contact_number"),                   // EM-050
    report_time: opt(formData, "report_time"),                                           // EM-051
    number_of_cases: opt(formData, "number_of_cases"),                                   // EM-052
    resulting_damage: opt(formData, "resulting_damage"),                                 // EM-054
    incident_type: opt(formData, "incident_type"),                                       // EM-057 (free-text; domain uncaptured)
    preliminary_incident_description: opt(formData, "preliminary_incident_description"),  // EM-059
    // created_by is defaulted to auth.uid() and enforced by the insert policy.
  });
  if (error) { logProviderError("incident report create", error); return { error: `${NEUTRAL_WRITE_ERROR} (inspector scope required).` }; }

  revalidatePath("/incident-reports");
  return { ok: true };
}
