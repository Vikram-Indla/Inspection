"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type BulkResult = { error?: string };

// CD-021 — data for the P02 review step. The targeting screen (110) hands off a
// client-held selection of factory ids; the review route loads their summaries,
// the eligible inspector pool (M01-029) and published packages, all RLS-scoped
// (no privileged bypass). Duplicate active periodic visits are flagged so the
// reviewer sees them before publishing (M02-012).
export type ReviewFactory = {
  id: string; factory_code: string; name: string; cr_number: string;
  city: string | null; region: string | null; risk_band: string | null; risk_score: number | null; dup: boolean;
};
export type ReviewInspector = { user_id: string; full_name: string };
export type ReviewPackage = { id: string; version_label: string; code: string };
export type ReviewData = { factories: ReviewFactory[]; packages: ReviewPackage[]; inspectors: ReviewInspector[] };

export async function loadBulkSelection(ids: string[]): Promise<ReviewData> {
  const sb = await supabaseServer();
  const clean = [...new Set(ids)].filter(id => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500);
  if (clean.length === 0) return { factories: [], packages: [], inspectors: [] };
  const [{ data: fac }, { data: pkgs }, { data: inspRows }] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, visits(planning_status, visit_type)").in("id", clean),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
  ]);
  const factories: ReviewFactory[] = (fac ?? []).map(f => {
    const visits = (f as unknown as { visits: { planning_status: string; visit_type: string }[] }).visits ?? [];
    const dup = visits.some(v => ["draft", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");
    return { id: f.id, factory_code: f.factory_code, name: f.name, cr_number: f.cr_number, city: f.city, region: f.region, risk_band: f.risk_band, risk_score: f.risk_score, dup };
  });
  const packages: ReviewPackage[] = (pkgs ?? []).map(p => ({ id: p.id, version_label: p.version_label, code: (p.packages as unknown as { code: string }).code }));
  const inspectors: ReviewInspector[] = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  return { factories, packages, inspectors };
}

// CD-021: neutral, catalogued failure copy. Raw Supabase/provider error text
// must NEVER reach the UI (it leaks schema/internal detail) — it is logged
// server-side and the operator sees governed language only.
const NEUTRAL_PUBLISH_ERROR =
  "Publishing failed — the plan was not created and no visits were scheduled. " +
  "Nothing was published. Please try again; if it keeps failing, contact support.";

export async function publishBulkPlan(_: BulkResult, formData: FormData): Promise<BulkResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired." };
  let factoryIds = formData.getAll("factory_id").map(String);
  const package_version_id = String(formData.get("package_version_id") ?? "");
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");
  const skipDuplicates = formData.get("skip_duplicates") === "1";
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw;
  // Manual per-visit inspector picks (M01-029): inspector_<factoryId> = user_id | "" (auto)
  const picks = new Map<string, string>();
  for (const fid of factoryIds) {
    const p = String(formData.get(`inspector_${fid}`) ?? "");
    if (p) picks.set(fid, p);
  }

  const blockers: string[] = [];
  if (factoryIds.length === 0) blockers.push("No factories selected — only selected targets proceed (M01-005)");
  if (!package_version_id) blockers.push("No published package (ERR-PUB-001)");
  if (!window_start || !window_end || new Date(window_end) <= new Date(window_start)) blockers.push("Invalid window (FLD-PLAN-005)");
  // per-row duplicate check (P01: duplicates flagged; conflicts listed, skip allowed)
  const { data: dups } = await sb.from("visits").select("factory_id")
    .in("factory_id", factoryIds).eq("visit_type", visit_type).in("planning_status", ["draft", "published", "returned"]);
  const dupSet = new Set((dups ?? []).map(d => d.factory_id));
  if (dupSet.size) {
    if (skipDuplicates) {
      factoryIds = factoryIds.filter(fid => !dupSet.has(fid));
      if (factoryIds.length === 0) blockers.push("All selected factories have an active duplicate visit — nothing left to publish (M02-012)");
    } else {
      blockers.push(`${dupSet.size} selected factories already have an active ${visit_type} visit (M02-012) — deselect them or choose skip`);
    }
  }

  // inspectors pool (ENG-05 automatic; capacity checks deepen in B7)
  const { data: inspRows } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  const inspectors = (inspRows ?? []).map(r => r.user_id);
  if (!inspectors.length) blockers.push("No eligible inspector (P02 failure control)");

  // Manual pick validation (M01-029): eligibility + same-window double-booking conflicts.
  const pool = new Set(inspectors);
  const chosen = [...new Set([...picks.values()])];
  for (const insp of chosen) {
    if (!pool.has(insp)) blockers.push(`Selected inspector is not in the eligible inspector pool (M01-029): ${insp.slice(0, 8)}`);
  }
  if (chosen.length && window_start && window_end) {
    // Existing active assignments whose visit window overlaps this plan's window (visits embed is TO-ONE).
    const { data: conflicts } = await sb.from("assignments")
      .select("inspector_id, visits!inner(id, window_start, window_end, planning_status)")
      .in("inspector_id", chosen)
      .in("visits.planning_status", ["draft", "published", "returned"])
      .lt("visits.window_start", window_end)
      .gt("visits.window_end", window_start);
    if ((conflicts ?? []).length) {
      const byInsp = new Map<string, number>();
      for (const c of conflicts!) byInsp.set(c.inspector_id, (byInsp.get(c.inspector_id) ?? 0) + 1);
      const { data: names } = await sb.from("profiles").select("user_id, full_name").in("user_id", [...byInsp.keys()]);
      const nameOf = new Map((names ?? []).map(n => [n.user_id, n.full_name]));
      for (const [insp, n] of byInsp) {
        blockers.push(`${nameOf.get(insp) ?? insp.slice(0, 8)} is already booked on ${n} overlapping visit(s) in this window (M01-029 double-booking)`);
      }
    }
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // CD-021: atomic publish. publish_bulk_plan (migration 0026) performs every
  // write — plan, visits, assignments, draft->published transition,
  // notifications — inside one SECURITY INVOKER transaction. On any error the
  // whole operation rolls back: no plan, no visits, no half-published state
  // (P03 "partial publish prohibited"). RLS is still enforced because the
  // function runs as the calling planner.
  const manual: Record<string, string> = {};
  for (const [fid, insp] of picks) manual[fid] = insp;
  const { error } = await sb.rpc("publish_bulk_plan", {
    p_factory_ids: factoryIds,
    p_package_version_id: package_version_id,
    p_window_start: window_start,
    p_window_end: window_end,
    p_visit_type: visit_type,
    p_notes: notes,
    p_manual: manual,
    p_auto_pool: inspectors,
  });
  if (error) {
    // Log the real cause server-side; return catalogued neutral copy only.
    console.error("[CD-021] publish_bulk_plan failed:", error.message, error.code);
    return { error: NEUTRAL_PUBLISH_ERROR };
  }
  redirect("/visits");
}
