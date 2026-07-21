import "server-only";

// Server-only helpers for the shared dashboard KPI layer. Kept small and
// isolated: presentation and the pure projection builders do all the shaping.
// The published dashboard policy version is resolved here so every metric can
// carry the policyVersionId that produced it.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedPolicy = {
  policyVersionId: string | null;
  failedSources: string[];
};

/**
 * Resolve the currently-effective published dashboard configuration version for
 * a given config key (default: the KPI parameters set). Returns null when no
 * version has been published yet, or when the table is not present (migration
 * not applied). RLS is authoritative — this only reads what the caller may see.
 */
export async function resolveDashboardPolicyVersion(
  sb: SupabaseClient,
  configKey = "kpi_parameters",
): Promise<ResolvedPolicy> {
  try {
    const { data, error } = await sb
      .from("dashboard_config_heads")
      .select("current_version_id, config_key")
      .eq("config_key", configKey)
      .maybeSingle();
    if (error) return { policyVersionId: null, failedSources: ["dashboard_config_heads"] };
    return { policyVersionId: (data?.current_version_id as string | undefined) ?? null, failedSources: [] };
  } catch {
    return { policyVersionId: null, failedSources: ["dashboard_config_heads"] };
  }
}
