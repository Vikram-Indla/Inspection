"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export async function saveRiskSettings(formData: FormData) {
  const sb = await supabaseServer();
  const keys = ["violation_history_24mo", "last_outcome_recency_severity", "license_status", "activity_hazard_class", "open_corrective_actions"];
  const factors = keys.map(k => ({ key: k, weight: Number(formData.get(k)) }));
  if (factors.some(f => !Number.isFinite(f.weight) || f.weight < 0 || f.weight > 1)) {
    return { error: "Every weight must be a number between 0 and 1 — draft preserved." };
  }
  const total = factors.reduce((s, f) => s + f.weight, 0);
  if (Math.abs(total - 1) > 0.001) return { error: `Weights must sum to 1.00 (got ${total.toFixed(2)}) — draft preserved (ERR pattern: exact blocker)` };
  const lowMax = Number(formData.get("low_max"));
  const medMax = Number(formData.get("med_max"));
  if (!Number.isInteger(lowMax) || !Number.isInteger(medMax) || lowMax < 0 || medMax > 99 || medMax <= lowMax) {
    return { error: "Band boundaries must be whole numbers with 0 ≤ low < medium ≤ 99 — draft preserved." };
  }
  const bands = {
    low: [0, lowMax],
    medium: [lowMax + 1, medMax],
    high: [medMax + 1, 100],
  };
  const version = new Date().toISOString().replace(/[:.]/g, "-");
  const { error } = await sb.from("engine_settings")
    .update({ settings: { factors, bands }, version_label: `v-edit-${version}`, updated_at: new Date().toISOString() })
    .eq("engine", "risk");
  if (error) { logProviderError("admin risk settings", error); return { error: `${NEUTRAL_WRITE_ERROR} (risk-owner scope required — RBAC-004).` }; }
  revalidatePath("/admin/risk");
  return { ok: true };
}
