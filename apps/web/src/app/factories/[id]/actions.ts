"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type F360Result = { error?: string; ok?: boolean };

const DOC_TYPES = ["license", "cr", "safety_cert", "layout", "other"];

// SB11 / M07-013 — document metadata registry. File custody stays in the
// evidence pipeline; storage_path remains null from this surface.
export async function addFactoryDocument(_: F360Result, formData: FormData): Promise<F360Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const factory_id = String(formData.get("factory_id") ?? "");
  const doc_type = String(formData.get("doc_type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const reference_no = String(formData.get("reference_no") ?? "").trim();
  const valid_from = String(formData.get("valid_from") ?? "").trim();
  const valid_to = String(formData.get("valid_to") ?? "").trim();

  if (!factory_id) return { error: "Missing factory id." };
  if (!DOC_TYPES.includes(doc_type)) return { error: "Pick a document type." };
  if (!title) return { error: "Title is required." };
  if (valid_from && valid_to && valid_to < valid_from) return { error: "Valid-to must be on or after valid-from." };

  const { error } = await sb.from("factory_documents").insert({
    factory_id, doc_type, title,
    reference_no: reference_no || null,
    valid_from: valid_from || null,
    valid_to: valid_to || null,
    storage_path: null, // file custody via evidence pipeline — metadata only here
    uploaded_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/factories/${factory_id}`);
  return { ok: true };
}

// SB11 / M07-014 — factory representatives roster.
export async function addRepresentative(_: F360Result, formData: FormData): Promise<F360Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const factory_id = String(formData.get("factory_id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role_title = String(formData.get("role_title") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const is_primary = formData.get("is_primary") === "on";

  if (!factory_id) return { error: "Missing factory id." };
  if (!full_name) return { error: "Full name is required." };

  const { error } = await sb.from("factory_representatives").insert({
    factory_id, full_name,
    role_title: role_title || null,
    phone: phone || null,
    email: email || null,
    is_primary,
  });
  if (error) return { error: error.message };
  revalidatePath(`/factories/${factory_id}`);
  return { ok: true };
}

// W3 / M07-006 — factory product list (HS codes, capacity). Maintainable:
// RLS fprod_write restricts inserts to planner/ops/compliance_admin (0017).
export async function addFactoryProduct(_: F360Result, formData: FormData): Promise<F360Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const factory_id = String(formData.get("factory_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hs_code = String(formData.get("hs_code") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const capacityRaw = String(formData.get("annual_capacity") ?? "").trim();
  const is_primary = formData.get("is_primary") === "on";

  if (!factory_id) return { error: "Missing factory id." };
  if (!name) return { error: "Product name is required." };
  let annual_capacity: number | null = null;
  if (capacityRaw) {
    annual_capacity = Number(capacityRaw);
    if (!Number.isFinite(annual_capacity) || annual_capacity < 0) return { error: "Annual capacity must be a non-negative number." };
  }

  const { error } = await sb.from("factory_products").insert({
    factory_id, name,
    hs_code: hs_code || null,
    unit: unit || null,
    annual_capacity,
    is_primary,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/factories/${factory_id}`);
  return { ok: true };
}

const MATERIAL_SOURCES = ["local", "imported"];

// W3 / M07-007 — raw material list (source local|imported). Maintainable:
// RLS fmat_write restricts inserts to planner/ops/compliance_admin (0017).
export async function addFactoryMaterial(_: F360Result, formData: FormData): Promise<F360Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const factory_id = String(formData.get("factory_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const hs_code = String(formData.get("hs_code") ?? "").trim();

  if (!factory_id) return { error: "Missing factory id." };
  if (!name) return { error: "Material name is required." };
  if (!MATERIAL_SOURCES.includes(source)) return { error: "Pick a material source." };

  const { error } = await sb.from("factory_materials").insert({
    factory_id, name, source,
    hs_code: hs_code || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/factories/${factory_id}`);
  return { ok: true };
}

// SB11 / M07-014 — deactivate/reactivate a representative (no deletes; roster is historical).
export async function toggleRepresentativeActive(_: F360Result, formData: FormData): Promise<F360Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const rep_id = String(formData.get("rep_id") ?? "");
  const factory_id = String(formData.get("factory_id") ?? "");
  const next_active = String(formData.get("next_active") ?? "") === "true";
  if (!rep_id || !factory_id) return { error: "Missing representative id." };

  const { error } = await sb.from("factory_representatives").update({ active: next_active }).eq("id", rep_id);
  if (error) return { error: error.message };
  revalidatePath(`/factories/${factory_id}`);
  return { ok: true };
}
