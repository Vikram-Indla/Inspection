"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type ItemResult = { error?: string; ok?: boolean };

// M09-019/020 — response models are configured presets, never free text.
// Shapes mirror the seeded catalogue (0003_seed_contract_data.sql).
const RESPONSE_PRESETS: Record<string, object> = {
  tri_state: {
    responses: ["compliant", "non_compliant", "na"],
    mapping: { non_compliant: { result: "Non-Compliant" } },
    score_excluded_on: ["na"],
  },
  binary: {
    responses: ["compliant", "non_compliant"],
    mapping: { non_compliant: { result: "Non-Compliant" } },
  },
  value_date: { responses: ["value_date"] },
};

// M09-005 — base evidence rule presets (overridable per package, M09-025).
const EVIDENCE_PRESETS: Record<string, object | null> = {
  none: null,
  photo_nc_mandatory: { on: "non_compliant", type: "photo", min: 1, mandatory: true },
};

// M09-002 — item belongs to a regulation clause and is reused across packages.
export async function createItem(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const clause_id = String(formData.get("clause_id") ?? "");
  const guidance_en = String(formData.get("guidance_en") ?? "").trim();
  const responseKey = String(formData.get("response_preset") ?? "");
  const evidenceKey = String(formData.get("evidence_preset") ?? "");
  const weightRaw = String(formData.get("score_weight") ?? "").trim();

  if (!code || !title) return { error: "Code and title are required." };
  if (!clause_id) return { error: "A regulation clause is required (M09-002)." };
  if (!(responseKey in RESPONSE_PRESETS)) return { error: "Pick a response model preset (M09-019)." };
  if (!(evidenceKey in EVIDENCE_PRESETS)) return { error: "Pick an evidence rule preset (M09-005)." };
  const score_weight = weightRaw === "" ? null : Number(weightRaw);
  if (score_weight !== null && (!Number.isFinite(score_weight) || score_weight < 0)) {
    return { error: "Score weight must be a non-negative number." };
  }

  const { error } = await sb.from("inspection_items").insert({
    code, title, clause_id,
    response_model: RESPONSE_PRESETS[responseKey],
    evidence_rule: EVIDENCE_PRESETS[evidenceKey],
    score_weight,
    guidance_en: guidance_en || null,
    active: true,
  });
  if (error) { logProviderError("admin inspection item", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/items");
  return { ok: true };
}

// M09-014 — deactivation preserves history; items are never deleted.
export async function toggleItemActive(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const id = String(formData.get("item_id") ?? "");
  const next = String(formData.get("next_active") ?? "") === "true";
  if (!id) return { error: "Missing item reference." };

  const { error, count } = await sb.from("inspection_items")
    .update({ active: next }, { count: "exact" }).eq("id", id);
  if (error) { logProviderError("admin inspection item status", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "No row updated — RLS requires compliance_admin/form_admin." };
  revalidatePath("/admin/items");
  return { ok: true };
}
