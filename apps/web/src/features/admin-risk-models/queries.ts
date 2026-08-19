import { logProviderError } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import type { RiskModelPayload, RiskModelStatus } from "@/lib/risk/model";
import { supabaseServer } from "@/lib/supabase-server";

export type RiskModelRow = {
  id: string;
  version_label: string;
  status: RiskModelStatus;
  row_version: number;
  payload: RiskModelPayload;
  created_at: string;
  updated_at: string;
};

export type RiskModelsData = {
  enabled: boolean;
  rows: readonly RiskModelRow[];
  readFailed: boolean;
};

const MODES = ["off", "on"] as const;

export async function loadRiskModels(): Promise<RiskModelsData> {
  const enabled = resolveFeatureFlag(process.env.FEATURE_RISK_WORKBENCH, MODES, "off") === "on";
  if (!enabled) return { enabled: false, rows: [], readFailed: false };

  const sb = await supabaseServer();
  const { data, error } = await sb.from("risk_models")
    .select("id, version_label, status, row_version, payload, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) logProviderError("risk models load", error);

  return { enabled: true, rows: (data ?? []) as RiskModelRow[], readFailed: Boolean(error) };
}
