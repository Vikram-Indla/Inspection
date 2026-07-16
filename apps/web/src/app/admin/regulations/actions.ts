"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";
import { createHash, randomUUID } from "node:crypto";

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
  const version_label = String(formData.get("version_label") ?? "v1").trim();
  if (!code || !title) return { error: "Code and title are required." };
  if (!version_label) return { error: "Version label is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) return { error: "A valid effective-from date is required." };

  // created_by anchors the DB maker-checker constraint (regulations_maker_checker):
  // a later approver must differ from this creator, enforced at the DB boundary.
  const { error } = await sb.from("regulations").insert({
    code, title, issuing_authority, status: "draft", created_by: userId,
    effective_from, version_label,
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
  const sb = await supabaseServer();

  const id = String(formData.get("regulation_id") ?? "");
  if (!id) return { error: "Missing regulation reference." };
  const { error } = await sb.rpc("publish_regulation", { p_regulation_id: id });
  if (error) {
    logProviderError("admin regulation status", error);
    const message = String(error.message ?? "");
    if (message.includes("maker-checker")) return { error: "A different configuration writer must approve this draft." };
    if (message.includes("clause")) return { error: "Publish blocked: every clause must map to an inspection item." };
    if (message.includes("successor effective date")) return { error: "The successor effective date must follow the active version." };
    return { error: NEUTRAL_WRITE_ERROR };
  }
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
  const reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!id) return { error: "Missing regulation reference." };
  if (!reason) return { error: "A deactivation reason is required." };
  const { data, error } = await sb.from("regulations").update({
    status: "deactivated", effective_to: new Date().toISOString().slice(0, 10), deactivated_at: new Date().toISOString(), deactivated_by: gate.userId,
    deactivation_reason: reason,
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
  const file = formData.get("file");
  if (!regulation_id || !(file instanceof File) || file.size === 0) return { error: "Regulation and source file are required." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120) || "source-document";
  const storage_path = `${regulation_id}/${randomUUID()}-${safeName}`;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const upload = await sb.storage.from("regulation-documents").upload(storage_path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upload.error) { logProviderError("admin regulation attachment upload", upload.error); return { error: NEUTRAL_WRITE_ERROR }; }
  const { error } = await sb.from("regulation_attachments").insert({
    regulation_id, file_name: file.name, storage_path, media_type: file.type || null,
    sha256, uploaded_by: gate.userId,
  });
  if (error) {
    await sb.storage.from("regulation-documents").remove([storage_path]);
    logProviderError("admin regulation attachment", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/regulations");
  return { ok: true };
}
