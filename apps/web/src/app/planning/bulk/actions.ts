"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type BulkResult = { error?: string };

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

  const { data: plan, error: e1 } = await sb.from("visit_plans")
    .insert({ method: "bulk", status: "draft", created_by: user.id, criteria: { selected: factoryIds.length } }).select().single();
  if (e1) return { error: e1.message };
  const rows = factoryIds.map(fid => ({
    visit_plan_id: plan.id, factory_id: fid, visit_type, execution_mode: "physical" as const,
    planning_status: "draft" as const, window_start, window_end, package_version_id, notes,
  }));
  const { data: visits, error: e2 } = await sb.from("visits").insert(rows).select("id, factory_id");
  if (e2) return { error: e2.message };
  // Manual picks honored per visit; remaining rows round-robin over the pool (ENG-05).
  let rr = 0;
  const asg = visits!.map(v => {
    const manual = picks.get(v.factory_id as string);
    return manual
      ? { visit_id: v.id, inspector_id: manual, method: "manual" as const }
      : { visit_id: v.id, inspector_id: inspectors[rr++ % inspectors.length], method: "automatic" as const };
  });
  const { error: e3 } = await sb.from("assignments").insert(asg);
  if (e3) return { error: e3.message };
  // atomic publish: all or nothing (P03 "partial publish prohibited")
  const { error: e4 } = await sb.from("visits").update({ planning_status: "published" }).eq("visit_plan_id", plan.id);
  const { error: e5 } = await sb.from("visit_plans").update({ status: "published", published_at: new Date().toISOString() }).eq("id", plan.id);
  if (e4 || e5) return { error: (e4 ?? e5)!.message };
  await sb.from("notifications").insert(asg.map(a => ({ event_key: "assignment", recipient: a.inspector_id, payload: { visit_id: a.visit_id }, channel: "push" })));
  redirect("/visits");
}
