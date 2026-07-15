"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type VioResult = { error?: string; ok?: boolean };

const LEVELS = ["L1", "L2", "L3"];

// ENG-08 — fixed JSON presets matching the seeded mapping style
// (0003_seed_contract_data.sql); admins never type raw penalty JSON.
const PENALTY_RANGE_PRESETS: Record<string, object | null> = {
  schedule_approved: { schedule: "approved" },
  none: null,
};
const REPEAT_RULE_PRESETS: Record<string, object | null> = {
  escalate_one_level: { repeat_12mo: "escalate_one_level" },
  none: null,
};

// M09-003/026 — violation codes are catalogue entries; inspectors never type one.
export async function createViolationCode(_: VioResult, formData: FormData): Promise<VioResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const level = String(formData.get("level") ?? "");
  const clause_id = String(formData.get("clause_id") ?? "");
  const active_from = String(formData.get("active_from") ?? "");

  if (!code || !title) return { error: "Code and title are required." };
  if (!LEVELS.includes(level)) return { error: "Level must be L1, L2 or L3." };
  if (!clause_id) return { error: "A regulation clause is required (legal anchor)." };
  if (!active_from) return { error: "Active-from date is required." };

  const { error } = await sb.from("violation_codes").insert({ code, title, level, clause_id, active_from });
  if (error) return { error: error.message };
  revalidatePath("/admin/violations");
  return { ok: true };
}

// M09-004 — one violation = one penalty; the DB unique constraint on
// violation_code_id rejects a second mapping. FLD-PEN-001 — results reference
// the exact mapping_version forever.
export async function createPenaltyMapping(_: VioResult, formData: FormData): Promise<VioResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const violation_code_id = String(formData.get("violation_code_id") ?? "");
  const penalty_ref = String(formData.get("penalty_ref") ?? "").trim();
  const legal_basis = String(formData.get("legal_basis") ?? "").trim();
  const mapping_version = String(formData.get("mapping_version") ?? "").trim();
  const rangeKey = String(formData.get("penalty_range_preset") ?? "");
  const repeatKey = String(formData.get("repeat_rule_preset") ?? "");

  if (!violation_code_id) return { error: "Pick the violation code to map." };
  if (!penalty_ref || !mapping_version) return { error: "Penalty ref and mapping version are required." };
  if (!legal_basis) return { error: "Legal basis is required (never invent one)." };
  if (!(rangeKey in PENALTY_RANGE_PRESETS)) return { error: "Pick a penalty range preset." };
  if (!(repeatKey in REPEAT_RULE_PRESETS)) return { error: "Pick a repeat rule preset." };

  const { error } = await sb.from("penalty_mappings").insert({
    violation_code_id, penalty_ref, legal_basis, mapping_version,
    penalty_range: PENALTY_RANGE_PRESETS[rangeKey],
    repeat_rule: REPEAT_RULE_PRESETS[repeatKey],
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/violations");
  return { ok: true };
}
