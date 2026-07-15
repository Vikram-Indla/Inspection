"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { configurationFailure, requireConfigurationWriter } from "@/lib/admin-configuration";

export type RegResult = { error?: string; ok?: boolean };

// MVP1-M09-001 — regulations are the parents of clauses and inspection items.
export async function createRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const access = await requireConfigurationWriter();
  if (!access.ok) return { error: access.message };
  const sb = await supabaseServer();

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const issuing_authority = String(formData.get("issuing_authority") ?? "").trim();
  if (!code || !title) return { error: "Code and title are required." };

  const { error } = await sb.from("regulations").insert({
    code, title, issuing_authority, status: "draft", created_by: access.userId,
  });
  if (error) return configurationFailure("create regulation", error);
  revalidatePath("/admin/regulations");
  return { ok: true };
}

// M09-001 — clauses anchor inspection items to legal sources.
export async function addClause(_: RegResult, formData: FormData): Promise<RegResult> {
  const access = await requireConfigurationWriter();
  if (!access.ok) return { error: access.message };
  const sb = await supabaseServer();

  const regulation_id = String(formData.get("regulation_id") ?? "");
  const clause_ref = String(formData.get("clause_ref") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const legal_source = String(formData.get("legal_source") ?? "").trim();
  if (!regulation_id || !clause_ref || !title) return { error: "Clause ref and title are required." };

  const { error } = await sb.from("regulation_clauses").insert({ regulation_id, clause_ref, title, legal_source: legal_source || null });
  if (error) return configurationFailure("add regulation clause", error);
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function publishRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const access = await requireConfigurationWriter();
  if (!access.ok) return { error: access.message };
  const sb = await supabaseServer();

  const id = String(formData.get("regulation_id") ?? "");
  if (!id) return { error: "Missing regulation reference." };

  // A regulation cannot be published while one of its clauses has no concrete
  // inspection-item consumer. This is the smallest proven dependency gate;
  // package lineage/version comparison remains a separate backend contract.
  const { data: clauses, error: clausesError } = await sb
    .from("regulation_clauses")
    .select("id, clause_ref, inspection_items(id)")
    .eq("regulation_id", id)
    .order("clause_ref");
  if (clausesError) return configurationFailure("validate regulation publish", clausesError);
  if (!clauses?.length) return { error: "Publish blocked: add at least one clause first." };
  const unmapped = clauses.filter(clause => !(clause.inspection_items ?? []).length);
  if (unmapped.length) {
    return { error: `Publish blocked: ${unmapped.length} clause(s) have no inspection-item mapping.` };
  }

  const { error } = await sb.from("regulations").update({
    status: "published", approved_by: access.userId, published_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "draft");
  if (error) return configurationFailure("publish regulation", error);
  revalidatePath("/admin/regulations");
  return { ok: true };
}
