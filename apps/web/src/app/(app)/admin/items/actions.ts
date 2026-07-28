"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type ItemResult = { error?: string; ok?: boolean };

export type ItemUsage = { package_count: number; version_count: number };

export async function getItemUsage(code: string): Promise<ItemUsage | null> {
  if (!code) return null;
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("inspection_item_usage", { p_code: code });
  if (error || !data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  return { package_count: Number(d.package_count ?? 0), version_count: Number(d.version_count ?? 0) };
}

// M09-019/020 — response models are configured presets, never free text.
// Shapes mirror the seeded catalogue (0003_seed_contract_data.sql).
const RESPONSE_PRESETS: Record<string, object> = {
  tri_state: {
    responses: ["compliant", "non_compliant", "na", "needs_review"],
    mapping: {
      compliant: { result: "compliant" },
      non_compliant: { result: "non_compliant" },
      needs_review: { result: "needs_review", reviewer_flag: true },
    },
    score_excluded_on: ["na"],
  },
  binary: {
    responses: ["compliant", "non_compliant"],
    mapping: { compliant: { result: "compliant" }, non_compliant: { result: "non_compliant" } },
  },
  value_date: { responses: ["value_date"] },
};

// M09-005 — base evidence rule presets (overridable per package, M09-025).
const EVIDENCE_PRESETS: Record<string, object | null> = {
  none: null,
  photo_nc_mandatory: { on: "non_compliant", type: "photo", min: 1, mandatory: true },
  video_nc_mandatory: { on: "non_compliant", type: "video", min: 1, mandatory: true },
  document_nc_mandatory: { on: "non_compliant", type: "document", min: 1, mandatory: true },
  comment_nc_mandatory: { on: "non_compliant", type: "comment", min: 1, mandatory: true },
};

// M09-002 — item belongs to a regulation clause and is reused across packages.
export async function createItem(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const clause_id = String(formData.get("clause_id") ?? "");
  const guidance_en = String(formData.get("guidance_en") ?? "").trim();
  const responseKey = String(formData.get("response_preset") ?? "");
  const evidenceKey = String(formData.get("evidence_preset") ?? "");
  const weightRaw = String(formData.get("score_weight") ?? "").trim();
  const scoringEnabled = String(formData.get("scoring_enabled") ?? "true") !== "false";

  if (!code || !title) return { error: "Code and title are required." };
  if (!clause_id) return { error: "A regulation clause is required." };
  if (!(responseKey in RESPONSE_PRESETS)) return { error: "Pick a response model preset." };
  if (!(evidenceKey in EVIDENCE_PRESETS)) return { error: "Pick an evidence rule preset." };
  const score_weight = weightRaw === "" ? null : Number(weightRaw);
  if (score_weight !== null && (!Number.isFinite(score_weight) || score_weight < 0)) {
    return { error: "Score weight must be a non-negative number." };
  }

  const response_model = {
    ...RESPONSE_PRESETS[responseKey],
    scoring_enabled: scoringEnabled,
  };
  const responses = (response_model as { responses?: string[] }).responses ?? [];
  const presetExcluded = (response_model as { score_excluded_on?: string[] }).score_excluded_on ?? [];
  const { error } = await sb.from("inspection_items").insert({
    code, title, clause_id,
    response_model,
    evidence_rule: EVIDENCE_PRESETS[evidenceKey],
    score_weight: scoringEnabled ? score_weight : null,
    score_excluded_on: scoringEnabled ? presetExcluded : responses,
    guidance_en: guidance_en || null,
    active: true,
  });
  if (error) {
    logProviderError("admin inspection item", error);
    // Duplicate item code is enforced by the inspection_items UNIQUE(code)
    // constraint (Postgres 23505). Surface that proven fact instead of a generic
    // failure so the writer can correct it; every other provider error stays neutral.
    const code23505 = (error as { code?: string }).code === "23505";
    return { error: code23505 ? `Item code “${code}” already exists — codes are unique.` : NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/items");
  return { ok: true };
}

// M09-014/030 — edit the current catalogue version only after every governed
// package that references the code carries an immutable item snapshot.
export async function updateItem(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("item_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const clause_id = String(formData.get("clause_id") ?? "");
  const guidance_en = String(formData.get("guidance_en") ?? "").trim();
  if (!id || !title || !clause_id) return { error: "Item, title, and regulation clause are required." };

  const { data: current, error: readError } = await sb.from("inspection_items")
    .select("code, configuration_version").eq("id", id).maybeSingle();
  if (readError || !current) { if (readError) logProviderError("admin item edit read", readError); return { error: NEUTRAL_WRITE_ERROR }; }
  const { data: frozen, error: frozenError } = await sb.rpc("inspection_item_versions_are_frozen", { p_code: current.code });
  if (frozenError) { logProviderError("admin item frozen-version check", frozenError); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!frozen) return { error: "Edit blocked: a governed package version does not yet contain a frozen item snapshot." };

  const { data, error } = await sb.from("inspection_items").update({
    title, clause_id, guidance_en: guidance_en || null,
    configuration_version: Number(current.configuration_version ?? 1) + 1,
  }).eq("id", id).eq("configuration_version", current.configuration_version).select("id");
  if (error) { logProviderError("admin item edit", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "The item changed while you were editing. Refresh before retrying." };
  revalidatePath("/admin/items");
  return { ok: true };
}

// M09-014 — deactivation preserves history; items are never deleted.
export async function toggleItemActive(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const id = String(formData.get("item_id") ?? "");
  const next = String(formData.get("next_active") ?? "") === "true";
  const reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!id) return { error: "Missing item reference." };
  if (!next && !reason) return { error: "A deactivation reason is required." };

  const { error, count } = await sb.from("inspection_items")
    .update(next ? {
      active: true, deactivated_at: null, deactivated_by: null, deactivation_reason: null,
    } : {
      active: false, deactivated_at: new Date().toISOString(), deactivated_by: gate.userId, deactivation_reason: reason,
    }, { count: "exact" }).eq("id", id);
  if (error) { logProviderError("admin inspection item status", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "No row updated — RLS requires compliance_admin/form_admin." };
  revalidatePath("/admin/items");
  return { ok: true };
}
