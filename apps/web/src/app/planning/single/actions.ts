"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type PublishResult = { error?: string };

export async function publishSingleVisit(_: PublishResult, formData: FormData): Promise<PublishResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const factory_id = String(formData.get("factory_id") ?? "");
  const package_version_id = String(formData.get("package_version_id") ?? "");
  const inspector_id = String(formData.get("inspector_id") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const mode = String(formData.get("execution_mode") ?? "physical");
  const license_number = String(formData.get("license_number") ?? "");
  const location_confirmed = formData.get("location_confirmed") === "1";
  const plannerLatRaw = String(formData.get("planner_lat") ?? "").trim();
  const plannerLngRaw = String(formData.get("planner_lng") ?? "").trim();
  const planner_lat = plannerLatRaw === "" ? null : Number(plannerLatRaw);
  const planner_lng = plannerLngRaw === "" ? null : Number(plannerLngRaw);

  // Publish validation gate (M01-041) — exact blockers, work preserved
  const blockers: string[] = [];
  if (!factory_id) blockers.push("Factory not selected (M01-035)");
  if (factory_id) {
    // License + location gates validated against the factory record (M01-036 / M01-038)
    const { data: fac } = await sb.from("factories")
      .select("license_number, official_lat, official_lng").eq("id", factory_id).single();
    if (fac?.license_number && license_number !== fac.license_number)
      blockers.push("Industrial License must be selected and confirmed before publish (M01-036)");
    const hasPlannerPin = planner_lat != null && planner_lng != null && Number.isFinite(planner_lat) && Number.isFinite(planner_lng);
    if ((planner_lat != null || planner_lng != null) && !hasPlannerPin)
      blockers.push("Planner pin needs both a valid latitude and longitude (M01-038)");
    const hasOfficial = fac?.official_lat != null && fac?.official_lng != null;
    if (fac && !hasOfficial && !hasPlannerPin)
      blockers.push("No official location on record — pin the visit location manually (M01-038)");
    // Execution-mode eligibility (M03-011): physical needs GIS-verifiable
    // coordinates, virtual needs the OTP engine configured. Startup.tsx
    // already computes and displays this read-only after publish — this is
    // the only place mode is actually chosen, so it's the only place that
    // can enforce "an ineligible mode cannot be selected" for real.
    if (mode === "physical" && !hasOfficial && !hasPlannerPin)
      blockers.push("Physical execution needs a GIS-verifiable location — no official pin and none provided (M03-011)");
    if (mode === "virtual") {
      const { data: otpEngine } = await sb.from("engine_settings").select("engine").eq("engine", "otp").maybeSingle();
      if (!otpEngine) blockers.push("Virtual execution requires the OTP engine to be configured (M03-011)");
    }
  }
  if (!location_confirmed) blockers.push("Location must be confirmed on the map before publish (M01-038)");
  if (!package_version_id) blockers.push("No published package selected (ERR-PUB-001)");
  // M01-040 — either a manual inspector or the auto-assign option ("auto") is required.
  const autoAssign = inspector_id === "auto";
  if (!inspector_id) blockers.push("Assign an inspector or choose auto-assign before publish (M01-040)");
  if (!window_start || !window_end || new Date(window_end) <= new Date(window_start))
    blockers.push("Visit window end must be after start (FLD-PLAN-005)");
  // Duplicate active visit (M02-012)
  if (factory_id) {
    const { data: dups } = await sb.from("visits").select("id")
      .eq("factory_id", factory_id).eq("visit_type", visit_type)
      .in("planning_status", ["draft", "published", "returned"]).limit(1);
    if ((dups ?? []).length > 0) blockers.push(`Duplicate active visit exists for this factory/type (M02-012): ${dups![0].id.slice(0, 8)}`);
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // M01-040 — resolve the inspector with an availability check: auto-assign the
  // first inspector with no overlapping active assignment in this window, or
  // validate the manual pick's availability (no double-booking).
  const { data: inspRows } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  const pool = (inspRows ?? []).map(r => r.user_id as string);
  if (pool.length === 0) return { error: "No eligible inspector in the pool (M01-040 / P02)" };
  const { data: overlaps } = await sb.from("assignments")
    .select("inspector_id, visits!inner(planning_status, window_start, window_end)")
    .in("inspector_id", autoAssign ? pool : [inspector_id])
    .in("visits.planning_status", ["draft", "published", "returned"])
    .lt("visits.window_start", window_end)
    .gt("visits.window_end", window_start);
  const booked = new Set((overlaps ?? []).map(o => o.inspector_id as string));
  let assigned_id: string; let assign_method: "manual" | "automatic";
  if (autoAssign) {
    const available = pool.find(pid => !booked.has(pid));
    if (!available) return { error: "No inspector is available in this window — all are double-booked (M01-040)" };
    assigned_id = available; assign_method = "automatic";
  } else {
    if (!pool.includes(inspector_id)) return { error: "Selected inspector is not in the eligible pool (M01-040)" };
    if (booked.has(inspector_id)) return { error: "Selected inspector is already booked in this window — pick another or choose auto-assign (M01-040)" };
    assigned_id = inspector_id; assign_method = "manual";
  }

  const { data: plan, error: e1 } = await sb.from("visit_plans")
    .insert({ method: "single", status: "draft", created_by: user.id }).select().single();
  if (e1) return { error: e1.message };
  const { data: visit, error: e2 } = await sb.from("visits").insert({
    visit_plan_id: plan.id, factory_id, visit_type, execution_mode: mode,
    planning_status: "draft", window_start, window_end, package_version_id,
    // planner pin ≠ official pin (M01-038) — only stored when the planner overrode it
    planner_lat: planner_lat != null && Number.isFinite(planner_lat) ? planner_lat : null,
    planner_lng: planner_lng != null && Number.isFinite(planner_lng) ? planner_lng : null,
  }).select().single();
  if (e2) return { error: e2.message };
  const { error: e3 } = await sb.from("assignments").insert({
    visit_id: visit.id, inspector_id: assigned_id, method: assign_method,
    candidates: assign_method === "automatic" ? { pool, chosen: assigned_id, reason: "first available in window" } : null,
  });
  if (e3) return { error: e3.message };
  // Atomic publish step (STM-PLAN-002 side effects; notification row = ENG-11)
  const { error: e4 } = await sb.from("visits").update({ planning_status: "published" }).eq("id", visit.id);
  const { error: e5 } = await sb.from("visit_plans").update({ status: "published", published_at: new Date().toISOString() }).eq("id", plan.id);
  if (e4 || e5) return { error: (e4 ?? e5)!.message };
  await sb.from("notifications").insert({ event_key: "assignment", recipient: assigned_id, payload: { visit_id: visit.id }, channel: "push" });
  redirect(`/visits/${visit.id}`);
}
