"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { CASE_TYPES } from "@/lib/cases/spine";

// TASK-MVP2-M2-10-CASE-SPINE-001 · MVP2-REQ-0114..0119 · CD-046.
// Open a case. The DB unique index cases_one_open_per_origin enforces one open
// case per origin; RLS restricts to compliance/reviewer roles.
export type CaseResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;

export async function openCase(_: CaseResult, formData: FormData): Promise<CaseResult> {
  if (resolveFeatureFlag(process.env.FEATURE_CASE_SPINE, MODES, "off") !== "on")
    return { error: "Case spine is feature-flagged off (FEATURE_CASE_SPINE)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const factory_id = String(formData.get("factory_id") ?? "");
  const case_type = String(formData.get("case_type") ?? "");
  if (!factory_id) return { error: "A factory is required to open a case." };
  if (!CASE_TYPES.includes(case_type as (typeof CASE_TYPES)[number])) return { error: "Invalid case type." };
  const { error } = await sb.from("cases").insert({
    factory_id, case_type, status: "open", origin_type: "inspection", opened_by: user.id,
  });
  if (error) { logProviderError("open case", error); return { error: `${NEUTRAL_WRITE_ERROR} (compliance/reviewer scope required).` }; }
  return { ok: true };
}
