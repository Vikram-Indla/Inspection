// M2-04 Risk, Targeting & Planning — pure risk-model domain logic.
// TASK-MVP2-M2-04-RISK-TARGETING-001 · MVP2-REQ-0001..0024 · CD-032.
//
// Deterministic, DB-free. Reused by the governed risk_models draft layer and the
// risk workbench UI. POLICY BOUNDARY (DEC-001): this module invents NO weight,
// band or threshold VALUES — it only enforces the accepted STRUCTURE (weights in
// [0,1] summing to 1.00; contiguous 0..100 bands). The exact sum/band rule is
// ported verbatim from the accepted admin/risk saveRiskSettings guard so the
// draft layer and the live path stay parity-identical (CD-032 W3 regression).

export type RiskFactor = { key: string; weight: number };
export type RiskBands = { low: [number, number]; medium: [number, number]; high: [number, number] };
export type RiskModelPayload = { factors: RiskFactor[]; bands: RiskBands };

export type ValidationResult = { ok: boolean; why: string };

/** Weights-sum guard — ported verbatim from saveRiskSettings (±0.001 tolerance). */
export function validateWeights(factors: RiskFactor[]): ValidationResult {
  if (!factors.length) return { ok: false, why: "At least one factor is required." };
  if (factors.some((f) => !Number.isFinite(f.weight) || f.weight < 0 || f.weight > 1)) {
    return { ok: false, why: "Every weight must be a number between 0 and 1." };
  }
  const total = factors.reduce((s, f) => s + f.weight, 0);
  if (Math.abs(total - 1) > 0.001) {
    return { ok: false, why: `Weights must sum to 1.00 (got ${total.toFixed(2)}).` };
  }
  return { ok: true, why: "Weights valid." };
}

/** Band guard — 0 ≤ low.max < medium.max ≤ 99, high runs to 100, contiguous. */
export function validateBands(bands: RiskBands): ValidationResult {
  const lowMax = bands.low?.[1];
  const medMax = bands.medium?.[1];
  if (!Number.isInteger(lowMax) || !Number.isInteger(medMax) || lowMax < 0 || medMax > 99 || medMax <= lowMax) {
    return { ok: false, why: "Band boundaries must be whole numbers with 0 ≤ low < medium ≤ 99." };
  }
  const contiguous =
    bands.low[0] === 0 &&
    bands.medium[0] === lowMax + 1 &&
    bands.high[0] === medMax + 1 &&
    bands.high[1] === 100;
  if (!contiguous) return { ok: false, why: "Bands must be contiguous and cover 0..100." };
  return { ok: true, why: "Bands valid." };
}

export function validateRiskModelPayload(payload: RiskModelPayload): ValidationResult {
  const w = validateWeights(payload.factors ?? []);
  if (!w.ok) return w;
  return validateBands(payload.bands);
}

/** Weighted score in [0,100]. Weights come from the model (never invented here);
 *  inputs are normalised 0..1 factor readings keyed by factor.key. */
export function computeRiskScore(factors: RiskFactor[], inputs: Record<string, number>): number {
  const raw = factors.reduce((s, f) => {
    const v = inputs[f.key];
    return s + (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0) * f.weight;
  }, 0);
  return Math.round(raw * 100);
}

export type RiskBand = "low" | "medium" | "high";
export function bandFor(score: number, bands: RiskBands): RiskBand {
  if (score <= bands.low[1]) return "low";
  if (score <= bands.medium[1]) return "medium";
  return "high";
}

// ---------- governed model lifecycle machine (mirrors risk_model_transition) --
export const RISK_MODEL_STATUSES = ["draft", "review", "approved", "published", "retired"] as const;
export type RiskModelStatus = (typeof RISK_MODEL_STATUSES)[number];

const RISK_MODEL_TRANSITIONS: Record<RiskModelStatus, RiskModelStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["retired"],
  retired: [],
};

export function isRiskModelTransitionAllowed(from: RiskModelStatus, to: RiskModelStatus): boolean {
  return RISK_MODEL_TRANSITIONS[from]?.includes(to) ?? false;
}
