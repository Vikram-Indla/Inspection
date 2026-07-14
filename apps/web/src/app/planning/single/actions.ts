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
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw;
  const resumeRaw = String(formData.get("resume_visit_plan_id") ?? "").trim();
  const resumeId = UUID.test(resumeRaw) ? resumeRaw : "";

  // Publish validation gate (M01-041) — exact blockers, work preserved.
  // Unchanged from the prior runtime.
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
  // Duplicate active visit (M02-012) — same shared check the dossier surfaces
  // as a selection-time warning; here it remains the hard publish-time block.
  if (factory_id) {
    const dups = await findDuplicateActiveVisits(sb, factory_id, visit_type);
    if (dups.length > 0) blockers.push(`Duplicate active visit exists for this factory/type (M02-012): ${dups[0].id.slice(0, 8)}`);
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

  const steps: PublishSteps = { plan: "pending", visit: "pending", assignment: "pending", status: "pending", notification: "pending" };

  // CD-022 — resumable retry keyed by visit_plan_id. If resumeId is present it
  // must resolve to a plan this user owns; a resumeId that fails to resolve
  // fails closed (neutral copy) rather than silently falling through to a
  // fresh insert, so retry can never create a second visit.
  let planId: string;
  if (resumeId) {
    const { data: plan } = await sb.from("visit_plans").select("id").eq("id", resumeId).eq("created_by", user.id).eq("method", "single").maybeSingle();
    if (!plan) return { error: NEUTRAL_WRITE_ERROR, steps };
    planId = plan.id; steps.plan = "done";
  } else {
    const { data: plan, error: e1 } = await sb.from("visit_plans")
      .insert({ method: "single", status: "draft", created_by: user.id }).select().single();
    if (e1 || !plan) {
      console.error("[CD-022 publishSingleVisit] plan insert failed:", e1?.message);
      steps.plan = "failed";
      return { error: NEUTRAL_WRITE_ERROR, steps };
    }
    planId = plan.id; steps.plan = "done";
  }

  let visitId: string;
  {
    const { data: existingVisit } = await sb.from("visits").select("id").eq("visit_plan_id", planId).maybeSingle();
    if (existingVisit) {
      visitId = existingVisit.id; steps.visit = "done";
    } else {
      const { data: visit, error: e2 } = await sb.from("visits").insert({
        visit_plan_id: planId, factory_id, visit_type, execution_mode: mode,
        planning_status: "draft", window_start, window_end, package_version_id,
        // planner pin ≠ official pin (M01-038) — only stored when the planner overrode it
        planner_lat: planner_lat != null && Number.isFinite(planner_lat) ? planner_lat : null,
        planner_lng: planner_lng != null && Number.isFinite(planner_lng) ? planner_lng : null,
        notes,
      }).select().single();
      if (e2 || !visit) {
        console.error("[CD-022 publishSingleVisit] visit insert failed:", e2?.message);
        steps.visit = "failed";
        return { error: NEUTRAL_WRITE_ERROR, steps, resumeId: planId };
      }
      visitId = visit.id; steps.visit = "done";
    }
  }

  {
    const { data: existingAssignment } = await sb.from("assignments").select("id").eq("visit_id", visitId).maybeSingle();
    if (existingAssignment) {
      steps.assignment = "done";
    } else {
      const { error: e3 } = await sb.from("assignments").insert({
        visit_id: visitId, inspector_id: assigned_id, method: assign_method,
        candidates: assign_method === "automatic" ? { pool, chosen: assigned_id, reason: "first available in window" } : null,
      });
      if (e3) {
        console.error("[CD-022 publishSingleVisit] assignment insert failed:", e3.message);
        steps.assignment = "failed";
        return { error: NEUTRAL_WRITE_ERROR, steps, resumeId: planId };
      }
      steps.assignment = "done";
    }
  }

  {
    const { data: visitRow } = await sb.from("visits").select("planning_status").eq("id", visitId).single();
    const { data: planRow } = await sb.from("visit_plans").select("status").eq("id", planId).single();
    if (visitRow?.planning_status === "published" && planRow?.status === "published") {
      steps.status = "done";
    } else {
      // Atomic publish step (STM-PLAN-002 side effects; notification row = ENG-11).
      // Atomicity across the two updates above is HANDOFF_BLOCKED (no
      // transaction/RPC exists for this screen) — this is the truthful step
      // ledger over sequential writes, not a claim of atomicity.
      const { error: e4 } = await sb.from("visits").update({ planning_status: "published" }).eq("id", visitId);
      const { error: e5 } = await sb.from("visit_plans").update({ status: "published", published_at: new Date().toISOString() }).eq("id", planId);
      if (e4 || e5) {
        console.error("[CD-022 publishSingleVisit] status update failed:", (e4 ?? e5)?.message);
        steps.status = "failed";
        return { error: NEUTRAL_WRITE_ERROR, steps, resumeId: planId };
      }
      steps.status = "done";
    }
  }

  {
    const { data: existingNotification } = await sb.from("notifications").select("id").eq("event_key", "assignment").contains("payload", { visit_id: visitId }).maybeSingle();
    if (existingNotification) {
      steps.notification = "done";
    } else {
      const { error: e6 } = await sb.from("notifications").insert({ event_key: "assignment", recipient: assigned_id, payload: { visit_id: visitId }, channel: "push" });
      if (e6) {
        console.error("[CD-022 publishSingleVisit] notification insert failed:", e6.message);
        steps.notification = "failed";
        return { error: NEUTRAL_WRITE_ERROR, steps, resumeId: planId };
      }
      steps.notification = "done";
    }
  }

  redirect(`/visits/${visitId}`);
}
