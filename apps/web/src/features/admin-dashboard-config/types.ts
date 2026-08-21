export const CONFIG_DOMAINS = [
  "kpi_parameters", "factory_eligibility", "inspection_cycle_policy", "sla_urgency_policy",
  "health_risk_presentation", "health_risk_engine_refs", "layout_visibility", "map_profile",
  "strategic_summary_policy", "operational_nudge_policy", "freshness_offline_policy",
  "localization", "masking_export", "pre_inspection_pack",
] as const;

export type DraftRow = {
  id: string;
  config_key: string;
  title: string;
  status: string;
  revision: number;
  owner_id: string;
  return_reason: string | null;
};

export type ActiveVersion = { versionNumber: number; effectiveFrom: string | null };
export type InFlight = { status: string; revision: number };

export type DashboardConfigRead = {
  migrationApplied: boolean;
  seededMetricKeys: readonly string[];
  activeByDomain: Readonly<Record<string, ActiveVersion | null>>;
  inFlightByDomain: Readonly<Record<string, InFlight | null>>;
  drafts: readonly DraftRow[];
  canWrite: boolean;
  canReview: boolean;
  userId: string | null;
};
