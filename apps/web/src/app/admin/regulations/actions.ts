"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type RegResult = { error?: string; ok?: boolean };

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
  if (!code || !title) return { error: "Code and title are required." };

  // created_by anchors the DB maker-checker constraint (regulations_maker_checker):
  // a later approver must differ from this creator, enforced at the DB boundary.
  const { error } = await sb.from("regulations").insert({ code, title, issuing_authority, status: "draft", created_by: userId });
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
  // approved_by + published_at record the checker leg. The DB constraint
  // regulations_maker_checker rejects self-approval (approver <> creator), and
  // trg_guard_published_regulation locks the row once published — both enforced
  // at the database boundary, so publish is now the governed maker-checker path.
  const { error } = await sb.from("regulations")
    .update({ status: "published", approved_by: userId, published_at: new Date().toISOString() })
    .eq("id", id).eq("status", "draft");
  if (!id) return { error: "Missing regulation id." };
  // CD006-WA-01 — record approval provenance; the gate user is the checker.
  const { data, error } = await sb.from("regulations")
    .update({ status: "published", approved_by: userId, published_at: new Date().toISOString() })
    .eq("id", id).eq("status", "draft").select("id");
  if (error) { logProviderError("admin regulation status", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "This regulation could not be published — it is not in draft, or you are not authorized." };
  revalidatePath("/admin/regulations");
  return { ok: true };
}
