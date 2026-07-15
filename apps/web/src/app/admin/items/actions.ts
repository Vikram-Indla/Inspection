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
  const requirement = String(formData.get("requirement_mode") ?? "required");
  const visibleWhen = String(formData.get("visible_when") ?? "").trim();
  const mandatoryWhenVisible = String(formData.get("mandatory_when_visible") ?? "") === "true";
  const scoringEnabled = String(formData.get("scoring_enabled") ?? "true") !== "false";

  if (!code || !title) return { error: "Code and title are required." };
  if (!clause_id) return { error: "A regulation clause is required (M09-002)." };
  if (!(responseKey in RESPONSE_PRESETS)) return { error: "Pick a response model preset (M09-019)." };
  if (!(evidenceKey in EVIDENCE_PRESETS)) return { error: "Pick an evidence rule preset (M09-005)." };
  if (!["required", "optional", "conditional"].includes(requirement)) return { error: "Pick required, optional, or conditional." };
  if (requirement === "conditional" && !/^[A-Za-z0-9_.-]+=[A-Za-z0-9_.-]+$/.test(visibleWhen)) {
    return { error: "Conditional items require a key=value visibility rule." };
  }
  const score_weight = weightRaw === "" ? null : Number(weightRaw);
  if (score_weight !== null && (!Number.isFinite(score_weight) || score_weight < 0)) {
    return { error: "Score weight must be a non-negative number." };
  }

  const response_model = {
    ...RESPONSE_PRESETS[responseKey],
    requirement,
    scoring_enabled: scoringEnabled,
    ...(requirement === "conditional" ? { conditional: { visible_when: visibleWhen, mandatory_when_visible: mandatoryWhenVisible } } : {}),
  };
  const responses = (response_model as { responses?: string[] }).responses ?? [];
  const { error } = await sb.from("inspection_items").insert({
    code, title, clause_id,
    response_model,
    evidence_rule: EVIDENCE_PRESETS[evidenceKey],
    score_weight: scoringEnabled ? score_weight : null,
    score_excluded_on: scoringEnabled ? null : responses,
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

// M09-014 — deactivation preserves history; items are never deleted.
export async function toggleItemActive(_: ItemResult, formData: FormData): Promise<ItemResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

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
