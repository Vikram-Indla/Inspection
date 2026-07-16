"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type RegResult = { error?: string; ok?: boolean };

// MVP1-M09-001 — regulations are the parents of clauses and inspection items.
export async function createRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const issuing_authority = String(formData.get("issuing_authority") ?? "").trim();
  if (!code || !title) return { error: "Code and title are required." };

  const { error } = await sb.from("regulations").insert({ code, title, issuing_authority, status: "draft" });
  if (error) return { error: error.message };
  revalidatePath("/admin/regulations");
  return { ok: true };
}

// M09-001 — clauses anchor inspection items to legal sources.
export async function addClause(_: RegResult, formData: FormData): Promise<RegResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const regulation_id = String(formData.get("regulation_id") ?? "");
  const clause_ref = String(formData.get("clause_ref") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const legal_source = String(formData.get("legal_source") ?? "").trim();
  if (!regulation_id || !clause_ref || !title) return { error: "Clause ref and title are required." };

  const { error } = await sb.from("regulation_clauses").insert({ regulation_id, clause_ref, title, legal_source: legal_source || null });
  if (error) return { error: error.message };
  revalidatePath("/admin/regulations");
  return { ok: true };
}

export async function publishRegulation(_: RegResult, formData: FormData): Promise<RegResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const id = String(formData.get("regulation_id") ?? "");
  const { error } = await sb.from("regulations").update({ status: "published" }).eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  revalidatePath("/admin/regulations");
  return { ok: true };
}
