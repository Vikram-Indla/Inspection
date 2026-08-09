import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type PlanningRecommendationReason = "noVisit" | "draft" | "returned" | "highRisk";

export type PlanningRecommendation = {
  readonly factoryId: string;
  readonly factoryName: string;
  readonly factoryCode: string | null;
  readonly riskBand: string | null;
  readonly riskTone: StatusTone;
  readonly riskScore: number | null;
  readonly reason: PlanningRecommendationReason;
  readonly planHref: string;
  readonly reviewHref: string;
};

export type PlanningAssistantData = {
  readonly highRiskFactories: number | null;
  readonly aiSuggested: number | null;
  readonly recommendations: readonly PlanningRecommendation[];
};

export const RISK_BAND_TONE: Record<string, StatusTone> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

const RECOMMENDATION_LIMIT = 4;
const PLANNING_AI_SURFACES = ["planning_summary", "planning_insights", "planning_recommendations"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const number = (source: Record<string, unknown>, key: string): number | null => {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

function reasonFor(statuses: readonly string[]): PlanningRecommendationReason {
  if (statuses.length === 0) return "noVisit";
  if (statuses.includes("returned")) return "returned";
  if (statuses.includes("draft") || statuses.includes("validated")) return "draft";
  return "highRisk";
}

export async function queryPlanningAssistant(sb: SupabaseClient): Promise<PlanningAssistantData> {
  const [highRiskRead, suggestedRead, candidateRead] = await Promise.all([
    sb.from("factories").select("id", { count: "exact", head: true }).eq("risk_band", "high"),
    sb.from("ai_suggestions").select("id", { count: "exact", head: true })
      .in("surface", PLANNING_AI_SURFACES).eq("disposition", "proposed"),
    sb.from("factories").select("id, name, factory_code, risk_band, risk_score")
      .eq("risk_band", "high").order("risk_score", { ascending: false, nullsFirst: false })
      .limit(RECOMMENDATION_LIMIT),
  ]);

  if (highRiskRead.error) console.error(`[planning.assistant] high-risk count failed: ${highRiskRead.error.message}`);
  if (suggestedRead.error) console.error(`[planning.assistant] suggestion count failed: ${suggestedRead.error.message}`);
  if (candidateRead.error) console.error(`[planning.assistant] candidate read failed: ${candidateRead.error.message}`);

  const candidates = rows(candidateRead.data);
  const candidateIds = candidates.map(row => text(row, "id")).filter((id): id is string => id !== null);

  const statusByFactory = new Map<string, string[]>();
  if (candidateIds.length > 0) {
    const visitRead = await sb.from("visits").select("factory_id, planning_status").in("factory_id", candidateIds);
    if (visitRead.error) console.error(`[planning.assistant] visit read failed: ${visitRead.error.message}`);
    for (const row of rows(visitRead.data)) {
      const factoryId = text(row, "factory_id");
      const status = text(row, "planning_status");
      if (!factoryId || !status) continue;
      statusByFactory.set(factoryId, [...(statusByFactory.get(factoryId) ?? []), status]);
    }
  }

  const recommendations: PlanningRecommendation[] = candidates.flatMap(row => {
    const factoryId = text(row, "id");
    const factoryName = text(row, "name");
    if (!factoryId || !factoryName) return [];
    const band = text(row, "risk_band");
    return [{
      factoryId,
      factoryName,
      factoryCode: text(row, "factory_code"),
      riskBand: band,
      riskTone: band === null ? "neutral" : RISK_BAND_TONE[band] ?? "neutral",
      riskScore: number(row, "risk_score"),
      reason: reasonFor(statusByFactory.get(factoryId) ?? []),
      planHref: `/planning/single?factory=${factoryId}`,
      reviewHref: `/factories/${factoryId}`,
    }];
  });

  return {
    highRiskFactories: highRiskRead.error ? null : highRiskRead.count ?? 0,
    aiSuggested: suggestedRead.error ? null : suggestedRead.count ?? 0,
    recommendations,
  };
}
