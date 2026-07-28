import "server-only";

// Server-only helpers for the shared dashboard KPI layer. Kept small and
// isolated: presentation and the pure projection builders do all the shaping.
// The published dashboard policy version is resolved here so every metric can
// carry the policyVersionId that produced it.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedPolicy = {
  policyVersionId: string | null;
  /**
   * Governed target per metric key, taken from the published version payload
   * (`payload.metrics.<metricKey>.target`). Empty when no version is published
   * or the payload carries no targets — a metric with no entry keeps rendering
   * as unconfigured rather than inventing a number.
   */
  targets: Record<string, number>;
  failedSources: string[];
};

/** Shape of the published `kpi_parameters` payload this loader understands. */
type KpiParameterPayload = {
  metrics?: Record<string, { target?: unknown } | null> | null;
};

function readTargets(payload: unknown): Record<string, number> {
  const metrics = (payload as KpiParameterPayload | null)?.metrics;
  if (!metrics || typeof metrics !== "object") return {};
  const targets: Record<string, number> = {};
  for (const [key, entry] of Object.entries(metrics)) {
    const target = entry?.target;
    if (typeof target === "number" && Number.isFinite(target)) targets[key] = target;
  }
  return targets;
}

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
    if (error) return { policyVersionId: null, targets: {}, failedSources: ["dashboard_config_heads"] };
    const policyVersionId = (data?.current_version_id as string | undefined) ?? null;
    if (!policyVersionId) return { policyVersionId: null, targets: {}, failedSources: [] };

    // The head only points at a version; the thresholds live on the version's
    // payload. A failed payload read degrades to "no targets" — it never falls
    // back to a previous version's numbers, because a target shown against the
    // wrong policy version is worse than no target at all.
    const version = await sb
      .from("dashboard_config_versions")
      .select("payload")
      .eq("id", policyVersionId)
      .maybeSingle();
    if (version.error) {
      return { policyVersionId, targets: {}, failedSources: ["dashboard_config_versions"] };
    }
    return { policyVersionId, targets: readTargets(version.data?.payload), failedSources: [] };
  } catch {
    return { policyVersionId: null, targets: {}, failedSources: ["dashboard_config_heads"] };
  }
}

export type ResolvedPolicyGates = {
  /** True when a governed inspection-cycle policy (ADM-DASH-005) is published. */
  cyclePolicyConfigured: boolean;
  /**
   * SLA urgency "warn at" fraction (ADM-DASH-007) from the published
   * `sla_urgency_policy` payload; null when unpublished or malformed. Feeds
   * OPS-KPI-002 "expiring soon" — never hard-coded.
   */
  slaWarnAtFraction: number | null;
  failedSources: string[];
};

/**
 * Resolve the policy gates that flip STR-KPI-007/008 and OPS-KPI-002 from
 * "Not configured" to live. Reads only published heads/versions the caller may
 * see (RLS authoritative); any read failure degrades to "not configured" rather
 * than fabricating a governed value.
 */
export async function resolveDashboardPolicyGates(sb: SupabaseClient): Promise<ResolvedPolicyGates> {
  const none: ResolvedPolicyGates = { cyclePolicyConfigured: false, slaWarnAtFraction: null, failedSources: [] };
  try {
    const { data, error } = await sb
      .from("dashboard_config_heads")
      .select("config_key, current_version_id")
      .in("config_key", ["inspection_cycle_policy", "sla_urgency_policy"]);
    if (error) return { ...none, failedSources: ["dashboard_config_heads"] };
    const heads = new Map(
      ((data ?? []) as { config_key: string; current_version_id: string | null }[])
        .map((r) => [r.config_key, r.current_version_id] as const),
    );
    const cyclePolicyConfigured = !!heads.get("inspection_cycle_policy");
    const slaVersionId = heads.get("sla_urgency_policy") ?? null;

    let slaWarnAtFraction: number | null = null;
    if (slaVersionId) {
      const version = await sb
        .from("dashboard_config_versions")
        .select("payload")
        .eq("id", slaVersionId)
        .maybeSingle();
      if (version.error) return { cyclePolicyConfigured, slaWarnAtFraction: null, failedSources: ["dashboard_config_versions"] };
      const raw = (version.data?.payload as { warn_at_fraction?: unknown } | null)?.warn_at_fraction;
      if (typeof raw === "number" && Number.isFinite(raw) && raw > 0 && raw <= 1) slaWarnAtFraction = raw;
    }
    return { cyclePolicyConfigured, slaWarnAtFraction, failedSources: [] };
  } catch {
    return { ...none, failedSources: ["dashboard_config_heads"] };
  }
}
