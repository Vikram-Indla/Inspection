import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import type { RiskFactor, RiskSettingsData } from "./types";

type StoredSettings = {
  factors?: { key: string; weight: number }[];
  bands?: Record<string, number[]>;
};

export async function loadRiskSettings(locale: Locale): Promise<RiskSettingsData> {
  const strings = getMessages(locale).adminRisk;
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("engine_settings")
    .select("settings, version_label, updated_at")
    .eq("engine", "risk")
    .maybeSingle();

  if (error) {
    logProviderError("admin risk settings", error);
    return { state: "error" };
  }

  const settings = (data?.settings ?? null) as StoredSettings | null;
  if (!data || !settings?.factors) return { state: "empty" };

  const factorNames = strings.factor as Record<string, string>;
  const factors: readonly RiskFactor[] = settings.factors.map(factor => ({
    key: factor.key,
    weight: factor.weight,
    name: factorNames[factor.key] ?? factor.key.replace(/_/g, " "),
  }));

  const totalWeight = settings.factors.reduce((sum, factor) => sum + factor.weight, 0);

  return {
    state: "ready",
    factors,
    lowMax: settings.bands?.low?.[1] ?? 39,
    medMax: settings.bands?.medium?.[1] ?? 69,
    versionLabel: data.version_label ?? strings.notConfigured,
    updatedAt: data.updated_at ?? null,
    weightTotalPct: `${Math.round(totalWeight * 100)}%`,
    factorCount: settings.factors.length,
  };
}
