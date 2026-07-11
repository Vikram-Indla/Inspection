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

  // Publish validation gate (M01-041) — exact blockers, work preserved
  const blockers: string[] = [];
  if (!factory_id) blockers.push("Factory not selected (M01-035)");
  if (!package_version_id) blockers.push("No published package selected (ERR-PUB-001)");
  if (!inspector_id) blockers.push("Every visit needs an assigned inspector before publish (M01-040)");
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

  const { data: plan, error: e1 } = await sb.from("visit_plans")
    .insert({ method: "single", status: "draft", created_by: user.id }).select().single();
  if (e1) return { error: e1.message };
  const { data: visit, error: e2 } = await sb.from("visits").insert({
    visit_plan_id: plan.id, factory_id, visit_type, execution_mode: mode,
    planning_status: "draft", window_start, window_end, package_version_id,
  }).select().single();
  if (e2) return { error: e2.message };
  const { error: e3 } = await sb.from("assignments").insert({ visit_id: visit.id, inspector_id, method: "manual" });
  if (e3) return { error: e3.message };
  // Atomic publish step (STM-PLAN-002 side effects; notification row = ENG-11)
  const { error: e4 } = await sb.from("visits").update({ planning_status: "published" }).eq("id", visit.id);
  const { error: e5 } = await sb.from("visit_plans").update({ status: "published", published_at: new Date().toISOString() }).eq("id", plan.id);
  if (e4 || e5) return { error: (e4 ?? e5)!.message };
  await sb.from("notifications").insert({ event_key: "assignment", recipient: inspector_id, payload: { visit_id: visit.id }, channel: "push" });
  redirect(`/visits/${visit.id}`);
}
