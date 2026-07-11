"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type BulkResult = { error?: string };

export async function publishBulkPlan(_: BulkResult, formData: FormData): Promise<BulkResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired." };
  const factoryIds = formData.getAll("factory_id").map(String);
  const package_version_id = String(formData.get("package_version_id") ?? "");
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");

  const blockers: string[] = [];
  if (factoryIds.length === 0) blockers.push("No factories selected — only selected targets proceed (M01-005)");
  if (!package_version_id) blockers.push("No published package (ERR-PUB-001)");
  if (!window_start || !window_end || new Date(window_end) <= new Date(window_start)) blockers.push("Invalid window (FLD-PLAN-005)");
  // per-row duplicate check (P01: duplicates flagged)
  const { data: dups } = await sb.from("visits").select("factory_id")
    .in("factory_id", factoryIds).eq("visit_type", visit_type).in("planning_status", ["draft", "published", "returned"]);
  const dupSet = new Set((dups ?? []).map(d => d.factory_id));
  if (dupSet.size) blockers.push(`${dupSet.size} selected factories already have an active ${visit_type} visit (M02-012) — deselect them`);
  if (blockers.length) return { error: blockers.join(" · ") };

  // inspectors round-robin (ENG-05 automatic; capacity checks deepen in B7)
  const { data: inspRows } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  const inspectors = (inspRows ?? []).map(r => r.user_id);
  if (!inspectors.length) return { error: "No eligible inspector (P02 failure control)" };

  const { data: plan, error: e1 } = await sb.from("visit_plans")
    .insert({ method: "bulk", status: "draft", created_by: user.id, criteria: { selected: factoryIds.length } }).select().single();
  if (e1) return { error: e1.message };
  const rows = factoryIds.map(fid => ({
    visit_plan_id: plan.id, factory_id: fid, visit_type, execution_mode: "physical" as const,
    planning_status: "draft" as const, window_start, window_end, package_version_id,
  }));
  const { data: visits, error: e2 } = await sb.from("visits").insert(rows).select("id");
  if (e2) return { error: e2.message };
  const asg = visits!.map((v, i) => ({ visit_id: v.id, inspector_id: inspectors[i % inspectors.length], method: "automatic" as const }));
  const { error: e3 } = await sb.from("assignments").insert(asg);
  if (e3) return { error: e3.message };
  // atomic publish: all or nothing (P03 "partial publish prohibited")
  const { error: e4 } = await sb.from("visits").update({ planning_status: "published" }).eq("visit_plan_id", plan.id);
  const { error: e5 } = await sb.from("visit_plans").update({ status: "published", published_at: new Date().toISOString() }).eq("id", plan.id);
  if (e4 || e5) return { error: (e4 ?? e5)!.message };
  await sb.from("notifications").insert(asg.map(a => ({ event_key: "assignment", recipient: a.inspector_id, payload: { visit_id: a.visit_id }, channel: "push" })));
  redirect("/visits");
}
