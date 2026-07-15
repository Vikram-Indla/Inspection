"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type RegResult = { error?: string; ok?: boolean };

export type ConfigurationAuditEvent = {
  id: number; actor: string | null; action: string;
  before_state: unknown; after_state: unknown; occurred_at: string;
};

export async function getRegulationAudit(regulationId: string): Promise<ConfigurationAuditEvent[]> {
  if (!regulationId) return [];
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("admin_configuration_audit", {
    p_object_type: "regulations", p_object_id: regulationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data as ConfigurationAuditEvent[];
}

// MVP1-M09-001 — regulations are the parents of clauses and inspection items.
export async function createRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  // Fail-closed config-writer guard (defense-in-depth over RLS, never a replacement).
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const userId = gate.userId;
  const sb = await supabaseServer();

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const issuing_authority = String(formData.get("issuing_authority") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  if (!code || !title) return { error: "Code and title are required." };

  // created_by anchors the DB maker-checker constraint (regulations_maker_checker):
  // a later approver must differ from this creator, enforced at the DB boundary.
  const { error } = await sb.from("regulations").insert({
    code, title, issuing_authority, status: "draft", created_by: userId,
    effective_from: effective_from || null,
  });
  if (error) { logProviderError("admin regulation", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/regulations");
  return { ok: true };
}

// M09-001 — clauses anchor inspection items to legal sources.
export async function addClause(_: RegResult, formData: FormData): Promise<RegResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const regulation_id = String(formData.get("regulation_id") ?? "");
  const clause_ref = String(formData.get("clause_ref") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const legal_source = String(formData.get("legal_source") ?? "").trim();
  if (!regulation_id || !clause_ref || !title) return { error: "Clause ref and title are required." };

  const { error } = await sb.from("regulation_clauses").insert({ regulation_id, clause_ref, title, legal_source: legal_source || null });
  if (error) { logProviderError("admin regulation clause", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function publishRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const userId = gate.userId;
  const sb = await supabaseServer();

  const id = String(formData.get("regulation_id") ?? "");
  if (!id) return { error: "Missing regulation reference." };
  const { data: clauses, error: clauseError } = await sb.from("regulation_clauses")
    .select("id, inspection_items(id)").eq("regulation_id", id);
  if (clauseError) { logProviderError("admin regulation publish validation", clauseError); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!clauses?.length) return { error: "Publish blocked: add at least one clause." };
  if (clauses.some(c => !(c.inspection_items ?? []).length)) {
    return { error: "Publish blocked: every clause must map to an inspection item." };
  }
  // approved_by + published_at record the checker leg. The DB constraint
  // regulations_maker_checker rejects self-approval (approver <> creator), and
  // trg_guard_published_regulation locks the row once published — both enforced
  // at the database boundary, so publish is now the governed maker-checker path.
  const { data, error } = await sb.from("regulations")
    .update({ status: "published", approved_by: userId, published_at: new Date().toISOString() })
    .eq("id", id).eq("status", "draft").select("id");
  if (error) { logProviderError("admin regulation status", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "The draft was not published. Refresh and verify its current status." };
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function updateRegulationDraft(_: RegResult, formData: FormData): Promise<RegResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("regulation_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const issuing_authority = String(formData.get("issuing_authority") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  if (!id || !title) return { error: "Regulation and title are required." };
  const { data, error } = await sb.from("regulations").update({
    title, issuing_authority: issuing_authority || null, effective_from: effective_from || null,
  }).eq("id", id).eq("status", "draft").select("id");
  if (error) { logProviderError("admin regulation draft", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "Only draft regulations can be edited." };
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function deactivateRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("regulation_id") ?? "");
  if (!id) return { error: "Missing regulation reference." };
  const { data, error } = await sb.from("regulations").update({
    status: "deactivated", deactivated_at: new Date().toISOString(), deactivated_by: gate.userId,
  }).eq("id", id).in("status", ["published", "locked"]).select("id");
  if (error) { logProviderError("admin regulation deactivate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "Only a published regulation can be deactivated." };
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function addRegulationAttachment(_: RegResult, formData: FormData): Promise<RegResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const regulation_id = String(formData.get("regulation_id") ?? "");
  const file_name = String(formData.get("file_name") ?? "").trim();
  const storage_path = String(formData.get("storage_path") ?? "").trim();
  const media_type = String(formData.get("media_type") ?? "").trim();
  const sha256 = String(formData.get("sha256") ?? "").trim();
  if (!regulation_id || !file_name || !storage_path) return { error: "Regulation, file name, and storage path are required." };
  const { error } = await sb.from("regulation_attachments").insert({
    regulation_id, file_name, storage_path, media_type: media_type || null,
    sha256: sha256 || null, uploaded_by: gate.userId,
  });
  if (error) { logProviderError("admin regulation attachment", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/regulations");
  return { ok: true };
}
