"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { findDuplicateActiveVisits } from "./duplicate";

export type StepStatus = "pending" | "done" | "failed";
export type PublishSteps = { plan: StepStatus; visit: StepStatus; assignment: StepStatus; status: StepStatus; notification: StepStatus };
export type PublishResult = { error?: string; steps?: PublishSteps; resumeId?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// CD-022 — catalogued neutral copy for write-phase failures. Raw Supabase
// error text must never reach the UI (schema/internal detail leak); the real
// cause is logged server-side only. Validation blockers below are deliberate
// governed business messages, not raw provider errors, and are unchanged.
const NEUTRAL_WRITE_ERROR =
  "Publishing could not complete a step. Your entries are preserved — review the step status below and retry; retry will not create a second visit.";
const NEUTRAL_READ_ERROR =
  "Planning data could not be verified (ERR-OPS-001). Your entries are preserved — try again.";

export async function publishSingleVisit(_: PublishResult, formData: FormData): Promise<PublishResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError) {
    console.error("[CD-022 publishSingleVisit] auth read failed:", authError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
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
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw;
  const resumeRaw = String(formData.get("resume_visit_plan_id") ?? "").trim();
  const resumeId = UUID.test(resumeRaw) ? resumeRaw : "";

  // Publish validation gate (M01-041) — exact blockers, work preserved.
  // Unchanged from the prior runtime.
  const blockers: string[] = [];
  if (!user.id) blockers.push("Authorized Planner role required (RBAC-007)");
  const { data: plannerRole, error: plannerRoleError } = await sb.from("user_roles")
    .select("role_key").eq("user_id", user.id).eq("role_key", "planner").maybeSingle();
  if (plannerRoleError) {
    console.error("[CD-022 publishSingleVisit] planner role read failed:", plannerRoleError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!plannerRole) blockers.push("Authorized Planner role required (RBAC-007)");
  if (!["periodic", "follow_up", "complaint"].includes(visit_type)) blockers.push("Visit type is not supported (FLD-PLAN-003)");
  if (!["physical", "virtual"].includes(mode)) blockers.push("Execution mode is not supported (M03-011)");
  if (!factory_id) blockers.push("Factory not selected (M01-035)");
  if (factory_id) {
    // License + location gates validated against the factory record (M01-036 / M01-038)
    const { data: fac, error: factoryError } = await sb.from("factories")
      .select("license_number, official_lat, official_lng").eq("id", factory_id).single();
    if (factoryError || !fac) {
      console.error("[CD-022 publishSingleVisit] factory verification failed:", factoryError?.message);
      return { error: NEUTRAL_READ_ERROR };
    }
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
      const { data: otpEngine, error: otpError } = await sb.from("engine_settings").select("engine").eq("engine", "otp").maybeSingle();
      if (otpError) {
        console.error("[CD-022 publishSingleVisit] OTP engine verification failed:", otpError.message);
        return { error: NEUTRAL_READ_ERROR };
      }
      if (!otpEngine) blockers.push("Virtual execution requires the OTP engine to be configured (M03-011)");
    }
  }
  if (!location_confirmed) blockers.push("Location must be confirmed on the map before publish (M01-038)");
  if (!package_version_id) blockers.push("No published package selected (ERR-PUB-001)");
  if (package_version_id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: packageVersion, error: packageError } = await sb.from("package_versions")
      .select("id").eq("id", package_version_id).in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).maybeSingle();
    if (packageError) {
      console.error("[CD-022 publishSingleVisit] package verification failed:", packageError.message);
      return { error: NEUTRAL_READ_ERROR };
    }
    if (!packageVersion) blockers.push("No published package selected (ERR-PUB-001)");
  }
  // M01-040 — either a manual inspector or the auto-assign option ("auto") is required.
  const autoAssign = inspector_id === "auto";
  if (!inspector_id) blockers.push("Assign an inspector or choose auto-assign before publish (M01-040)");
  const startMs = Date.parse(window_start);
  const endMs = Date.parse(window_end);
  if (!window_start || !window_end || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs)
    blockers.push("Visit window end must be after start (FLD-PLAN-005)");
  // Duplicate active visit (M02-012) — same shared check the dossier surfaces
  // as a selection-time warning; here it remains the hard publish-time block.
  if (factory_id) {
    const dups = await findDuplicateActiveVisits(sb, factory_id, visit_type);
    if (dups.unavailable) return { error: NEUTRAL_READ_ERROR };
    if (dups.visits.length > 0) blockers.push(`Duplicate active visit exists for this factory/type (M02-012): ${dups.visits[0].id.slice(0, 8)}`);
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // M01-040 — resolve the inspector with an availability check: auto-assign the
  // first inspector with no overlapping active assignment in this window, or
  // validate the manual pick's availability (no double-booking).
  const { data: inspRows, error: inspectorPoolError } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  if (inspectorPoolError) {
    console.error("[CD-022 publishSingleVisit] inspector pool read failed:", inspectorPoolError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const pool = (inspRows ?? []).map(r => r.user_id as string);
  if (pool.length === 0) return { error: "No eligible inspector in the pool (M01-040 / P02)" };
  const { data: overlaps, error: overlapError } = await sb.from("assignments")
    .select("inspector_id, visits!inner(planning_status, window_start, window_end)")
    .in("inspector_id", autoAssign ? pool : [inspector_id])
    .in("visits.planning_status", ["draft", "published", "returned"])
    .lt("visits.window_start", window_end)
    .gt("visits.window_end", window_start);
  if (overlapError) {
    console.error("[CD-022 publishSingleVisit] assignment overlap read failed:", overlapError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const booked = new Set((overlaps ?? []).map(o => o.inspector_id as string));
  if (autoAssign) {
    const available = pool.find(pid => !booked.has(pid));
    if (!available) return { error: "No inspector is available in this window — all are double-booked (M01-040)" };
  } else {
    if (!pool.includes(inspector_id)) return { error: "Selected inspector is not in the eligible pool (M01-040)" };
    if (booked.has(inspector_id)) return { error: "Selected inspector is already booked in this window — pick another or choose auto-assign (M01-040)" };
  }

  const steps: PublishSteps = { plan: "pending", visit: "pending", assignment: "pending", status: "pending", notification: "pending" };
  // Migration 0033 is the authoritative write boundary. It repeats every
  // mutable guard inside one transaction, derives auto-assignment server-side,
  // executes STM-PLAN-001 then STM-PLAN-002, and rolls back plan, visit,
  // assignment, audit and notification together on any failure.
  const { data: visitId, error: publishError } = await sb.rpc("publish_single_visit", {
    p_factory_id: factory_id,
    p_package_version_id: package_version_id,
    p_inspector_id: autoAssign ? null : inspector_id,
    p_visit_type: visit_type,
    p_execution_mode: mode,
    p_window_start: window_start,
    p_window_end: window_end,
    p_license_number: license_number || null,
    p_location_confirmed: location_confirmed,
    p_planner_lat: planner_lat != null && Number.isFinite(planner_lat) ? planner_lat : null,
    p_planner_lng: planner_lng != null && Number.isFinite(planner_lng) ? planner_lng : null,
    p_notes: notes,
    p_resume_plan_id: resumeId || null,
  });
  if (publishError || !visitId) {
    console.error("[CD-022 publishSingleVisit] atomic publish failed:", publishError?.message, publishError?.code);
    steps.plan = "failed";
    return { error: NEUTRAL_WRITE_ERROR, steps };
  }

  redirect(`/visits/${visitId}`);
}
