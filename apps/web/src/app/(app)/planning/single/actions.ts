"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";
import { findDuplicateActiveVisits } from "./duplicate";
import { isPlausibleDate, PLAUSIBLE_DATE_ERROR } from "@/lib/plausible-date";

export type StepStatus = "pending" | "done" | "failed";
export type PublishSteps = { plan: StepStatus; visit: StepStatus; assignment: StepStatus; status: StepStatus; notification: StepStatus };
export type PublishResult = { error?: string; steps?: PublishSteps; resumeId?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// source_channel is a provenance label, not an authorization input — accept a
// bounded machine token and default anything else to the module's own channel.
const sanitizeSourceChannel = (raw: string) =>
  /^[a-z0-9][a-z0-9._-]{0,39}$/i.test(raw) ? raw : "planning.single";

// CD-022 — catalogued neutral copy for write-phase failures. Raw Supabase
// error text must never reach the UI (schema/internal detail leak); the real
// cause is logged server-side only. Validation blockers below are deliberate
// governed business messages, not raw provider errors, and are unchanged.
const NEUTRAL_WRITE_ERROR =
  "Publishing could not complete a step. Your entries are preserved — review the step status below and retry; retry will not create a second visit.";
const NEUTRAL_READ_ERROR =
  "Planning data could not be verified (ERR-OPS-001). Your entries are preserved — try again.";
const publishReceiptContractIsExecutable = (): boolean => false;
const draftReceiptContractIsExecutable = (): boolean => false;

export async function publishSingleVisit(_: PublishResult, formData: FormData): Promise<PublishResult> {
  // PLN-S11: R1 marks the durable publish receipt contract
  // PROPOSED_NOT_EFFECTIVE. Do not execute the legacy RPC followed by direct
  // metadata/package fallbacks; preserve the form and terminate explicitly.
  if (!publishReceiptContractIsExecutable()) {
    return {
      error: "Publishing is unavailable until the governed atomic receipt contract is active. Your entries are preserved and nothing was published.",
    };
  }
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[CD-022 publishSingleVisit] auth read failed:", authError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!user) return { error: "Session expired — sign in again." };

  // Targeting identifiers: the Wizard posts the resolved target through
  // dedicated hidden fields (canonical CR → licence → plant, or the legacy
  // factory fallback). `factory_id`/`license_number` fall back to the legacy
  // radio fields so an older rendered form still posts a coherent target.
  const factory_id = String(formData.get("target_factory_id") ?? "") || String(formData.get("factory_id") ?? "");
  // M7 / PLN-CON-003 — Report Package is OPTIONAL during planning, zero-or-more.
  // The Wizard posts one `package_version_id` field per checked package; the
  // first selection remains the primary (visits.package_version_id, backward
  // compat) and EVERY selection is linked with an immutable snapshot after the
  // atomic publish. Zero selections is honest: the inspector chooses an
  // eligible package during preparation.
  const package_version_ids = [...new Set(formData.getAll("package_version_id").map(String))]
    .filter(id => UUID.test(id)).slice(0, 20);
  const inspector_id = String(formData.get("inspector_id") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const mode = String(formData.get("execution_mode") ?? "physical");
  const license_number = String(formData.get("target_license_number") ?? "") || String(formData.get("license_number") ?? "");
  const cr_number = String(formData.get("target_cr_number") ?? "").trim();
  const canonical_license_number = String(formData.get("target_canonical_license_number") ?? "").trim();
  const plant_number = String(formData.get("target_plant_number") ?? "").trim();
  const target_source = String(formData.get("target_source") ?? "") === "canonical" ? "canonical" : "legacy";
  const source_channel = sanitizeSourceChannel(String(formData.get("source_channel") ?? "").trim());
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
  // M7 — the publish gate is the planning.publish CAPABILITY, mirroring the
  // RPC's widened guard (has_role('planner') OR
  // has_planning_capability('planning.publish') — migration 20260721180000).
  // Page (planning.create.single), action and RPC now agree.
  const blockers: string[] = [];
  const access = await getPlanningAccess(sb, ["planning.publish"]);
  if (access.error) {
    console.error("[CD-022 publishSingleVisit] access resolution failed");
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!access.can("planning.publish")) blockers.push("Publishing requires the planning.publish capability (RBAC-007)");
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
  // M7 — zero packages is allowed (preparation-time choice); a selection is
  // validated: every chosen version must still be active.
  let packageRows: { id: string; version_label: string; status: string; packages: { code: string; title: string } | null }[] = [];
  if (package_version_ids.length) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pvs, error: packageError } = await sb.from("package_versions")
      .select("id, version_label, status, packages(code, title)").in("id", package_version_ids)
      .in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`);
    if (packageError) {
      console.error("[CD-022 publishSingleVisit] package verification failed:", packageError.message);
      return { error: NEUTRAL_READ_ERROR };
    }
    packageRows = (pvs ?? []) as unknown as typeof packageRows;
    if (packageRows.length !== package_version_ids.length) blockers.push("A selected inspection checklist is no longer active (ERR-PUB-001)");
  }
  // M01-040 — either a manual inspector or the auto-assign option ("auto") is required.
  const autoAssign = inspector_id === "auto";
  if (!inspector_id) blockers.push("Assign an inspector or choose auto-assign before publish (M01-040)");
  const startMs = Date.parse(window_start);
  const endMs = Date.parse(window_end);
  if (!window_start || !window_end || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs)
    blockers.push("Visit window end must be after start (FLD-PLAN-005)");
  else if (!isPlausibleDate(window_start) || !isPlausibleDate(window_end))
    blockers.push(PLAUSIBLE_DATE_ERROR);
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
    p_package_version_id: package_version_ids[0] ?? null,
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
    // M7 — the in-transaction guards (RPC checks + the 0031 assignments
    // trigger, SQLSTATE 23505) rejected a conflict that appeared between the
    // preview and the commit. Name it honestly; the attempt persists nowhere
    // (rolled back; audit_events is trigger/definer-only — documented gap).
    if (publishError?.code === "23505" || /duplicate active visit|inspector unavailable|window is no longer available/i.test(publishError?.message ?? "")) {
      const dupsNow = await findDuplicateActiveVisits(sb, factory_id, visit_type);
      if (dupsNow.visits.length > 0) {
        return {
          error: `A conflicting active visit now exists for this factory/type (M02-012): ${dupsNow.visits[0].id.slice(0, 8)} — nothing was published.`,
          steps,
        };
      }
      return {
        error: "The assigned Inspector was just booked on an overlapping visit in this window (M01-029) — nothing was published. Pick another Inspector or window.",
        steps,
      };
    }
    // TASK-EXECUTION-MODULE-001 · D-009 — the publish RPC evaluated the shared
    // window capacity and found no selectable day. Surface it as a governed
    // blocker in the same style as the validation blockers above (plain copy,
    // stable token), not as the generic neutral write failure.
    if (publishError?.message?.includes("EXE-CAPACITY-WINDOW-FULL")) {
      return {
        error: "No day in this window has remaining daily capacity for the assigned inspector — pick another inspector or a different window (EXE-CAPACITY-WINDOW-FULL)",
        steps,
      };
    }
    return { error: NEUTRAL_WRITE_ERROR, steps };
  }

  // Canonical targeting metadata (PLN-REQ-023) — publish_single_visit
  // (migration 20260714091727) has no CR/plant parameter and deliberately
  // stays unchanged, so the CR/licence/plant targeting is recorded
  // post-publish: the plan carries the full target in `criteria`, the visit
  // carries source_channel + a compact internal_reference. A failure here
  // never blocks the redirect — the visit itself is already atomically
  // published; the gap is logged server-side.
  const targetingLicense = canonical_license_number || license_number || null;
  const internal_reference = [cr_number, targetingLicense, plant_number].filter(Boolean).join("/") || null;
  const { data: visitRow, error: visitReadError } = await sb.from("visits")
    .select("visit_plan_id").eq("id", visitId).single();
  if (visitReadError) {
    console.error("[CD-022 publishSingleVisit] visit plan lookup failed:", visitReadError.message);
  }
  const { error: visitMetaError } = await sb.from("visits")
    .update({ source_channel, internal_reference }).eq("id", visitId);
  if (visitMetaError) {
    console.error("[CD-022 publishSingleVisit] visit targeting metadata write failed:", visitMetaError.message);
  }
  if (visitRow?.visit_plan_id) {
    const { error: planMetaError } = await sb.from("visit_plans")
      .update({
        source_channel,
        criteria: {
          target: {
            factory_id,
            cr_number: cr_number || null,
            license_number: targetingLicense,
            plant_number: plant_number || null,
            source: target_source,
          },
        },
      })
      .eq("id", visitRow.visit_plan_id);
    if (planMetaError) {
      console.error("[CD-022 publishSingleVisit] plan targeting metadata write failed:", planMetaError.message);
    }
  }

  // M7 / PLN-CON-003 — link EVERY selected package with an immutable snapshot
  // (the primary already sits on visits.package_version_id via the RPC). Zero
  // selections → zero rows; preparation chooses the package later. Best-effort
  // + logged: the visit is already atomically published, so a snapshot gap
  // never blocks the redirect.
  if (packageRows.length) {
    const capturedAt = new Date().toISOString();
    const { error: pkgLinkError } = await sb.from("visit_packages").insert(
      packageRows.map(pv => ({
        visit_id: visitId,
        package_version_id: pv.id,
        added_by: user.id,
        snapshot: {
          package_version_id: pv.id,
          code: pv.packages?.code ?? null,
          title: pv.packages?.title ?? null,
          version_label: pv.version_label,
          status: pv.status,
          captured_at: capturedAt,
        },
      })),
    );
    if (pkgLinkError) {
      console.error("[CD-022 publishSingleVisit] visit_packages snapshot write failed:", pkgLinkError.message);
    }
  }

  redirect(`/visits/${visitId}`);
}

// ---------------------------------------------------------------------------
// saveSingleDraft (PLN-REQ-020/022) — persist the Single Planning wizard as a
// draft visit_plan (method 'single', status 'draft') and return its stable
// plan_reference. No notification, no publish, no status transition: drafts
// are working state only. The publish path consumes a draft later through
// p_resume_plan_id (which requires status 'draft' and no visits — exactly
// what this action produces).
//
// Draft payload contract (read back by /planning/single?plan=<id>):
//   target: resolved factory + CR/licence/plant identifiers + source
//   config: every configurable wizard field, verbatim
//   handoff: source_channel the draft was started from
// Fail-closed: capability (planning.edit_draft / planning.create) is checked
// via getPlanningAccess; RLS remains the final boundary either way.
export type SingleDraftInput = {
  planId?: string;
  sourceChannel?: string;
  target: {
    factoryId: string;
    factoryName: string;
    crNumber: string | null;
    licenseNumber: string | null;
    canonicalLicenseNumber: string | null;
    plantNumber: string | null;
    source: "canonical" | "legacy";
  };
  config: {
    visitType?: string;
    packageVersionId?: string;
    /** M7 — zero-many package selections; persisted as an array (the legacy
        singular field keeps the first/primary for older readers). */
    packageVersionIds?: string[];
    executionMode?: string;
    windowStart?: string;
    windowEnd?: string;
    inspectorId?: string;
    notes?: string;
    plannerLat?: string;
    plannerLng?: string;
  };
};
export type DraftSaveResult = { error?: string; planId?: string; planReference?: string; version?: number };

export async function saveSingleDraft(input: SingleDraftInput): Promise<DraftSaveResult> {
  // PLN-S08: draft persistence is part of the same aggregate/version/audit
  // boundary. Until that durable receipt contract is effective, preserve the
  // client state and do not fall back to direct visit_plans INSERT/UPDATE.
  if (!draftReceiptContractIsExecutable()) return { error: "contract_unavailable" };
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[PLN saveSingleDraft] auth read failed:", authError.message);
    return { error: "read" };
  }
  if (!user) return { error: "session" };
  const access = await getPlanningAccess(sb, ["planning.edit_draft", "planning.create"]);
  if (access.error || !access.can("planning.edit_draft")) {
    if (access.error) console.error("[PLN saveSingleDraft] access resolution failed");
    return { error: "denied" };
  }
  if (!input?.target || !UUID.test(input.target.factoryId)) return { error: "target" };

  const sourceChannel = sanitizeSourceChannel((input.sourceChannel ?? "").trim());
  const emptyToNull = (v: string | undefined) => (v != null && v.trim() !== "" ? v.trim() : null);
  const criteriaTarget = {
    factory_id: input.target.factoryId,
    cr_number: emptyToNull(input.target.crNumber ?? undefined),
    license_number: emptyToNull(input.target.canonicalLicenseNumber ?? undefined) ?? emptyToNull(input.target.licenseNumber ?? undefined),
    plant_number: emptyToNull(input.target.plantNumber ?? undefined),
    source: input.target.source === "canonical" ? "canonical" : "legacy",
  };
  const draftPayload = {
    target: {
      factory_id: input.target.factoryId,
      factory_name: input.target.factoryName,
      cr_number: criteriaTarget.cr_number,
      license_number: emptyToNull(input.target.licenseNumber ?? undefined),
      canonical_license_number: criteriaTarget.license_number,
      plant_number: criteriaTarget.plant_number,
      source: criteriaTarget.source,
    },
    config: {
      visit_type: emptyToNull(input.config?.visitType),
      package_version_id: emptyToNull(input.config?.packageVersionId)
        ?? (input.config?.packageVersionIds ?? []).filter(id => UUID.test(id))[0]
        ?? null,
      package_version_ids: (input.config?.packageVersionIds ?? []).filter(id => UUID.test(id)).slice(0, 20),
      execution_mode: emptyToNull(input.config?.executionMode),
      window_start: emptyToNull(input.config?.windowStart),
      window_end: emptyToNull(input.config?.windowEnd),
      inspector_id: emptyToNull(input.config?.inspectorId),
      notes: emptyToNull(input.config?.notes),
      planner_lat: emptyToNull(input.config?.plannerLat),
      planner_lng: emptyToNull(input.config?.plannerLng),
    },
    handoff: { source_channel: sourceChannel },
  };

  if (input.planId && UUID.test(input.planId)) {
    // Upsert path: only an own, active, still-draft single plan may be
    // overwritten; the version check makes concurrent saves fail closed
    // instead of last-write-wins.
    const { data: current, error: currentError } = await sb.from("visit_plans")
      .select("id, draft_version")
      .eq("id", input.planId).eq("created_by", user.id)
      .eq("method", "single").eq("status", "draft").is("archived_at", null)
      .maybeSingle();
    if (currentError) {
      console.error("[PLN saveSingleDraft] draft read failed:", currentError.message);
      return { error: "read" };
    }
    if (!current) return { error: "unavailable" };
    const { data, error } = await sb.from("visit_plans")
      .update({ draft_payload: draftPayload, draft_version: (current.draft_version ?? 0) + 1, source_channel: sourceChannel })
      .eq("id", current.id).eq("draft_version", current.draft_version ?? 0)
      .select("id, plan_reference, draft_version").single();
    if (error) {
      console.error("[PLN saveSingleDraft] draft update failed:", error.message);
      return { error: "write" };
    }
    return { planId: data.id, planReference: data.plan_reference, version: data.draft_version };
  }

  const { data, error } = await sb.from("visit_plans")
    .insert({
      method: "single",
      status: "draft",
      created_by: user.id,
      draft_payload: draftPayload,
      draft_version: 1,
      source_channel: sourceChannel,
      criteria: { target: criteriaTarget },
    })
    .select("id, plan_reference, draft_version").single();
  if (error) {
    console.error("[PLN saveSingleDraft] draft insert failed:", error.message);
    return { error: "write" };
  }
  return { planId: data.id, planReference: data.plan_reference, version: data.draft_version };
}
