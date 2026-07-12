"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type ImmResult = { error?: string };

export async function createImmediateVisit(_: ImmResult, formData: FormData): Promise<ImmResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired." };
  const existing_factory_id = String(formData.get("existing_factory_id") ?? "");
  const manual_name = String(formData.get("manual_name") ?? "").trim();
  const manual_cr = String(formData.get("manual_cr") ?? "").trim();
  const manual_license = String(formData.get("manual_license") ?? "").trim();
  const manual_activity = String(formData.get("manual_activity") ?? "").trim();
  const lat = Number(formData.get("lat")); const lng = Number(formData.get("lng"));
  const reason = String(formData.get("urgency_reason") ?? "");
  const inspector_id = String(formData.get("inspector_id") ?? "");
  const package_version_id = String(formData.get("package_version_id") ?? "");

  const blockers: string[] = [];
  if (!existing_factory_id && !manual_name) blockers.push("Factory identity required — name at minimum for unregistered (M01-045)");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) blockers.push("Location is mandatory before an Immediate Visit can be created (M01-046)");
  if (!reason) blockers.push("Urgency reason required (SCR-WEB-130)");
  if (!inspector_id) blockers.push("Planner-created Immediate Visits require assignment (M01-048)");
  if (!package_version_id) blockers.push("Published package required (ERR-PUB-001)");
  if (blockers.length) return { error: blockers.join(" · ") };

  let factory_id = existing_factory_id;
  if (!factory_id) {
    const { data: f, error } = await sb.from("factories").insert({
      name: manual_name, is_temporary: true, source: "immediate_manual",
      official_lat: lat, official_lng: lng, region: "Riyadh",
      // Optional identity/business info captured with the temporary entity (M01-045)
      cr_number: manual_cr || null, license_number: manual_license || null,
      activity_class: manual_activity || null,
    }).select().single();
    if (error) return { error: error.message };
    factory_id = f.id;  // controlled temporary entity flagged for reconciliation (FLD-VIS-002)
  }
  const now = new Date(); const end = new Date(now.getTime() + 8 * 3600e3);
  const { data: visit, error: e2 } = await sb.from("visits").insert({
    visit_plan_id: null,  // Immediate bypasses Visit Plans (M01-050)
    factory_id, visit_type: "complaint", execution_mode: "physical",
    planning_status: "published", window_start: now.toISOString(), window_end: end.toISOString(),
    package_version_id, notes: `IMMEDIATE · ${reason}`,
  }).select().single();
  if (e2) return { error: e2.message };
  await sb.from("assignments").insert({ visit_id: visit.id, inspector_id, method: "manual" });
  await sb.from("notifications").insert({ event_key: "assignment", recipient: inspector_id, payload: { visit_id: visit.id, immediate: true }, channel: "push" });
  redirect(`/visits/${visit.id}`);
}
