"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notify";

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
  // M01-047 — visit type, window, priority and notes are now enterable.
  const VISIT_TYPES = ["complaint", "follow_up", "periodic"];
  const visit_type = VISIT_TYPES.includes(String(formData.get("visit_type"))) ? String(formData.get("visit_type")) : "complaint";
  const priority = String(formData.get("priority") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const wsRaw = String(formData.get("window_start") ?? "").trim();
  const weRaw = String(formData.get("window_end") ?? "").trim();
  // M01-048 — "auto" (or blank) triggers availability-checked auto-assignment.
  const autoAssign = inspector_id === "auto" || inspector_id === "";

  const blockers: string[] = [];
  if (!existing_factory_id && !manual_name) blockers.push("Factory identity required — name at minimum for unregistered (M01-045)");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) blockers.push("Location is mandatory before an Immediate Visit can be created (M01-046)");
  if (!reason) blockers.push("Urgency reason required (SCR-WEB-130)");
  if (!package_version_id) blockers.push("Published package required (ERR-PUB-001)");
  // M01-047 — window: blank keeps the urgent default; if EITHER bound is supplied both must be valid and ordered.
  let window_start: string; let window_end: string;
  if (!wsRaw && !weRaw) {
    const now = new Date(); window_start = now.toISOString(); window_end = new Date(now.getTime() + 8 * 3600e3).toISOString();
  } else {
    const s = new Date(wsRaw); const e = new Date(weRaw);
    if (!wsRaw || !weRaw || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      blockers.push("Provide both a valid window start and end, or leave both blank for the urgent default (M01-047)");
      window_start = ""; window_end = "";
    } else if (e.getTime() <= s.getTime()) {
      blockers.push("Window end must be after window start (M01-047)");
      window_start = ""; window_end = "";
    } else { window_start = s.toISOString(); window_end = e.toISOString(); }
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // M01-048 — resolve the inspector: auto-assign the first available (no overlapping
  // active assignment in the window), or validate the manual pick's availability.
  const { data: inspRows } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  const pool = (inspRows ?? []).map(r => r.user_id as string);
  if (pool.length === 0) return { error: "No eligible inspector in the pool (P02 failure control)" };
  const { data: overlaps } = await sb.from("assignments")
    .select("inspector_id, visits!inner(planning_status, window_start, window_end)")
    .in("inspector_id", autoAssign ? pool : [inspector_id])
    .in("visits.planning_status", ["draft", "published", "returned"])
    .lt("visits.window_start", window_end)
    .gt("visits.window_end", window_start);
  const booked = new Set((overlaps ?? []).map(o => o.inspector_id as string));
  let assigned_id: string; let method: "manual" | "automatic";
  if (autoAssign) {
    const available = pool.find(id => !booked.has(id));
    if (!available) return { error: "No inspector is available in this window — all are double-booked (M01-048)" };
    assigned_id = available; method = "automatic";
  } else {
    if (!pool.includes(inspector_id)) return { error: "Selected inspector is not in the eligible pool (M01-048)" };
    if (booked.has(inspector_id)) return { error: "Selected inspector is already booked in this window — pick another or choose auto-assign (M01-048)" };
    assigned_id = inspector_id; method = "manual";
  }

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
  const { data: visit, error: e2 } = await sb.from("visits").insert({
    visit_plan_id: null,  // Immediate bypasses Visit Plans (M01-050)
    factory_id, visit_type, execution_mode: "physical",
    planning_status: "published", window_start, window_end,
    priority: priority || null,
    package_version_id, notes: notes ? `IMMEDIATE · ${reason} · ${notes}` : `IMMEDIATE · ${reason}`,
  }).select().single();
  if (e2) return { error: e2.message };
  // ENG-05 — record the automatic candidate pool for auto-assignment audit.
  await sb.from("assignments").insert({
    visit_id: visit.id, inspector_id: assigned_id, method,
    candidates: method === "automatic" ? { pool, chosen: assigned_id, reason: "first available in window" } : null,
  });
  await insertNotification(sb, { event_key: "assignment", recipient: assigned_id, payload: { visit_id: visit.id, immediate: true }, channel: "push" });
  redirect(`/visits/${visit.id}`);
}
