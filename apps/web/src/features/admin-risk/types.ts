export type RiskFactor = {
  readonly key: string;
  readonly name: string;
  readonly weight: number;
};

export type RiskSettingsReady = {
  readonly state: "ready";
  readonly factors: readonly RiskFactor[];
  readonly lowMax: number;
  readonly medMax: number;
  readonly versionLabel: string;
  readonly updatedAt: string | null;
  readonly weightTotalPct: string;
  readonly factorCount: number;
};

export type RiskSettingsData =
  | { readonly state: "error" }
  | { readonly state: "empty" }
  | RiskSettingsReady;

export type RiskSaveErrorCode = "weight_range" | "weight_sum" | "band_bounds" | "provider";

export type RiskSaveResult = { error?: RiskSaveErrorCode; ok?: boolean };
