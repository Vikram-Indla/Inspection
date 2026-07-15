"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type VioResult = { error?: string; ok?: boolean };

export type ViolationUsage = { item_count: number; runtime_count: number };

export async function getViolationUsage(codeValue: string): Promise<ViolationUsage | null> {
  if (!codeValue) return null;
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("violation_code_usage", { p_code: codeValue });
  if (error || !data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  return { item_count: Number(d.item_count ?? 0), runtime_count: Number(d.runtime_count ?? 0) };
}

const LEVELS = ["L1", "L2", "L3"];
// Postgres unique_violation — the DB rejects a duplicate `code` (CD-010) or a
// second `violation_code_id` mapping (CD-011, one-to-one). Surfaced as a
// specific, non-leaky message so the negative path is legible, not a raw dump.
const UNIQUE_VIOLATION = "23505";

// ENG-08 — fixed JSON presets matching the seeded mapping style
// (0003_seed_contract_data.sql); admins never type raw penalty JSON. These are
// CONFIG TOKENS, never monetary amounts or legal text (CD-011 source-truth).
const PENALTY_RANGE_PRESETS: Record<string, object | null> = {
  schedule_approved: { schedule: "approved" },
  none: null,
};
const REPEAT_RULE_PRESETS: Record<string, object | null> = {
  escalate_one_level: { repeat_12mo: "escalate_one_level" },
  none: null,
};

function code(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}

// CD-010 · M09-003/026 — violation codes are catalogue entries; inspectors never
// type one. Writes require compliance_admin/form_admin (RLS is the authority,
// backed by the fail-closed requireConfigurationWriter guard). violation_codes
// row changes are audit-tracked (trg_audit_violation_codes → audit_events).
export async function createViolationCode(_: VioResult, formData: FormData): Promise<VioResult> {
  const { t } = await useT();
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const codeValue = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const level = String(formData.get("level") ?? "");
  const clause_id = String(formData.get("clause_id") ?? "");
  const active_from = String(formData.get("active_from") ?? "");

  if (!codeValue || !title) return { error: t("admin.viol.err.codeTitle", "Code and title are required.") };
  if (!LEVELS.includes(level)) return { error: t("admin.viol.err.level", "Level must be L1, L2 or L3.") };
  if (!clause_id) return { error: t("admin.viol.err.clause", "A regulation clause is required (legal anchor).") };
  if (!active_from) return { error: t("admin.viol.err.activeFrom", "Active-from date is required.") };

  const { error } = await sb.from("violation_codes").insert({ code: codeValue, title, level, clause_id, active_from });
  if (error) {
    logProviderError("admin violation code", error);
    if (code(error) === UNIQUE_VIOLATION) return { error: t("admin.viol.err.dupCode", "A violation code with this identifier already exists.") };
    return { error: t("admin.viol.err.write", NEUTRAL_WRITE_ERROR) };
  }
  revalidatePath("/admin/violations");
  return { ok: true };
}

export async function deactivateViolationCode(_: VioResult, formData: FormData): Promise<VioResult> {
  const { t } = await useT();
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const id = String(formData.get("violation_code_id") ?? "");
  const active_to = String(formData.get("active_to") ?? "").trim();
  if (!id) return { error: t("admin.viol.err.missing", "Missing violation reference.") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(active_to)) {
    return { error: t("admin.viol.err.activeTo", "A valid active-to date is required.") };
  }
  if (active_to > new Date().toISOString().slice(0, 10)) {
    return { error: t("admin.viol.err.futureActiveTo", "Deactivation must take effect today or earlier; future dates are scheduled expiry, not deactivation.") };
  }

  const { data: current, error: readError } = await sb.from("violation_codes")
    .select("active_from, active_to").eq("id", id).maybeSingle();
  if (readError) { logProviderError("admin violation deactivate read", readError); return { error: t("admin.viol.err.write", NEUTRAL_WRITE_ERROR) }; }
  if (!current || current.active_to) return { error: t("admin.viol.err.inactive", "This violation is already inactive or unavailable.") };
  if (current.active_from && active_to < current.active_from) {
    return { error: t("admin.viol.err.activeWindow", "Active-to date cannot be before active-from date.") };
  }

  const { data, error } = await sb.from("violation_codes")
    .update({ active_to }).eq("id", id).is("active_to", null).select("id");
  if (error) { logProviderError("admin violation deactivate", error); return { error: t("admin.viol.err.write", NEUTRAL_WRITE_ERROR) }; }
  if (!data?.length) return { error: t("admin.viol.err.inactive", "This violation is already inactive or unavailable.") };
  revalidatePath("/admin/violations");
  return { ok: true };
}

// CD-011 · M09-004 — one violation = one penalty; the DB unique constraint on
// violation_code_id rejects a second mapping. FLD-PEN-001 — inspection results
// reference the exact mapping_version forever (an immutable REFERENCE, not a row
// lock). penalty_mappings row changes are audit-tracked (trg_audit_penalty_mappings
// → audit_events); a lifecycle/maker-checker model is not yet implemented.
export async function createPenaltyMapping(_: VioResult, formData: FormData): Promise<VioResult> {
  const { t } = await useT();
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const violation_code_id = String(formData.get("violation_code_id") ?? "");
  const penalty_ref = String(formData.get("penalty_ref") ?? "").trim();
  const legal_basis = String(formData.get("legal_basis") ?? "").trim();
  const mapping_version = String(formData.get("mapping_version") ?? "").trim();
  const rangeKey = String(formData.get("penalty_range_preset") ?? "");
  const repeatKey = String(formData.get("repeat_rule_preset") ?? "");

  // Mapping Validation Lens — the four proven checks, in order.
  if (!violation_code_id) return { error: t("admin.viol.map.err.pickViolation", "Pick the violation code to map.") };
  if (!penalty_ref || !mapping_version) return { error: t("admin.viol.map.err.refVersion", "Penalty ref and mapping version are required.") };
  if (!legal_basis) return { error: t("admin.viol.map.err.legalBasis", "Legal basis is required (never invent one).") };
  if (!(rangeKey in PENALTY_RANGE_PRESETS)) return { error: t("admin.viol.map.err.range", "Pick a penalty range preset.") };
  if (!(repeatKey in REPEAT_RULE_PRESETS)) return { error: t("admin.viol.map.err.repeat", "Pick a repeat rule preset.") };

  const { error } = await sb.from("penalty_mappings").insert({
    violation_code_id, penalty_ref, legal_basis, mapping_version,
    penalty_range: PENALTY_RANGE_PRESETS[rangeKey],
    repeat_rule: REPEAT_RULE_PRESETS[repeatKey],
  });
  if (error) {
    logProviderError("admin penalty mapping", error);
    if (code(error) === UNIQUE_VIOLATION) return { error: t("admin.viol.map.err.dupMapping", "This violation already has a penalty mapping (one mapping per violation).") };
    return { error: t("admin.viol.err.write", NEUTRAL_WRITE_ERROR) };
  }
  revalidatePath("/admin/violations");
  return { ok: true };
}
