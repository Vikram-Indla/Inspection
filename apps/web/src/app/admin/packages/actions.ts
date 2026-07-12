"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type PkgResult = { error?: string; ok?: boolean };

// M09-030 — new draft version clones the latest definition; published versions stay immutable.
export async function createDraftVersion(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const package_id = String(formData.get("package_id") ?? "");
  const version_label = String(formData.get("version_label") ?? "").trim();
  if (!package_id || !version_label) return { error: "Version label is required." };

  const { data: latest } = await sb.from("package_versions")
    .select("definition").eq("package_id", package_id)
    .order("published_at", { ascending: false, nullsFirst: false }).limit(1).single();

  const { error } = await sb.from("package_versions").insert({
    package_id, version_label, status: "draft",
    definition: latest?.definition ?? { sections: [], action_forms: [] },
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}

// M09-019/025 — draft definitions are editable; published versions are immutable
// (trg_guard_pkg). Save is rejected server-side unless status is still draft.
export async function saveDraftDefinition(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  let definition: unknown;
  try { definition = JSON.parse(String(formData.get("definition") ?? "")); }
  catch { return { error: "Definition payload was not valid JSON." }; }

  const { error, count } = await sb.from("package_versions")
    .update({ definition }, { count: "exact" })
    .eq("id", version_id).eq("status", "draft");
  if (error) return { error: error.message };
  if (!count) return { error: "Only draft versions are editable (M09-030 — published is immutable)." };
  revalidatePath("/admin/packages");
  return { ok: true };
}

// RBAC-002 maker-checker — approver must differ from creator; the database
// constraint pkg_maker_checker + trg_pkg_approver reject self-approval.
export async function approveAndPublish(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  const { error } = await sb.from("package_versions").update({
    approved_by: user.id, status: "published", published_at: new Date().toISOString(),
  }).eq("id", version_id).eq("status", "draft");
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}
