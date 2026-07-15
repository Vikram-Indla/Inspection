"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function saveRiskSettings(formData: FormData) {
  const sb = await supabaseServer();
  const keys = ["violation_history_24mo", "outcome_recency_severity", "activity_hazard_class", "license_status", "open_corrective_actions"];
  const factors = keys.map(k => ({ key: k, weight: Number(formData.get(k)) }));
  const total = factors.reduce((s, f) => s + f.weight, 0);
  if (Math.abs(total - 1) > 0.001) return { error: `Weights must sum to 1.00 (got ${total.toFixed(2)}) — draft preserved (ERR pattern: exact blocker)` };
  const bands = {
    low: [0, Number(formData.get("low_max"))],
    medium: [Number(formData.get("low_max")) + 1, Number(formData.get("med_max"))],
    high: [Number(formData.get("med_max")) + 1, 100],
  };
  const { error } = await sb.from("engine_settings")
    .update({ settings: { factors, bands }, version_label: `v-edit-${new Date().toISOString().slice(0, 10)}`, updated_at: new Date().toISOString() })
    .eq("engine", "risk");
  if (error) return { error: `${error.message} (RLS: risk_owner scope required — RBAC-004)` };
  revalidatePath("/admin/risk");
  return { ok: true };
}
