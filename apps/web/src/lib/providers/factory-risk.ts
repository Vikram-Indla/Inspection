// Cycle 2 Wave 2.F — synthetic factory-master + risk-provider fixtures,
// matching the shape of the real tables (factories, factory_representatives,
// factory_documents, risk_score/risk_band/risk_version columns —
// supabase/migrations/0011_factory360_gis_ksa_seed.sql) without touching
// them. For environments that need factory/risk data beyond the 20-factory
// KSA seed without inventing real-looking government registration numbers in
// a live table.
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type SyntheticLicence = { licenceNumber: string; plantCode: string; validFrom: string; validTo: string; status: "valid" | "expired" | "stale" };
export type SyntheticFactory = {
  factoryCode: string; name: string; licences: SyntheticLicence[];
  products: string[]; machines: string[]; approvalsDocumentCount: number;
  freshness: "current" | "stale" | "partial_source_failure";
};
export type RiskFactor = { key: string; weight: number; contribution: number; explanation: string };
export type SyntheticRiskResult = { riskScore: number; riskBand: "low" | "medium" | "high"; version: string; factors: RiskFactor[] };

export class SyntheticFactoryMasterProvider {
  readonly name = "stub" as const;
  constructor() { assertNonProduction("SyntheticFactoryMasterProvider"); }

  factory(seed: string): SyntheticFactory {
    const f = seededFraction(seed);
    const freshness: SyntheticFactory["freshness"] = f < 0.1 ? "partial_source_failure" : f < 0.2 ? "stale" : "current";
    const licenceCount = 1 + Math.floor(seededFraction(`${seed}:lic`) * 3);
    const licences: SyntheticLicence[] = Array.from({ length: licenceCount }, (_, i) => {
      const lf = seededFraction(`${seed}:lic:${i}`);
      return {
        licenceNumber: `SYN-LIC-${seed.slice(0, 4).toUpperCase()}-${i}`,
        plantCode: `PLANT-${i + 1}`,
        validFrom: "2024-01-01",
        validTo: lf < 0.15 ? "2025-06-01" : "2027-01-01", // some expired, most valid
        status: lf < 0.15 ? "expired" : lf < 0.25 ? "stale" : "valid",
      };
    });
    return {
      factoryCode: `SYN-${seed.slice(0, 6).toUpperCase()}`,
      name: `Synthetic Factory ${seed.slice(0, 6)}`,
      licences,
      products: ["synthetic-product-a", "synthetic-product-b"],
      machines: ["synthetic-line-1"],
      approvalsDocumentCount: 1 + Math.floor(seededFraction(`${seed}:docs`) * 5),
      freshness,
    };
  }
}

export class SyntheticRiskProvider {
  readonly name = "stub" as const;
  constructor() { assertNonProduction("SyntheticRiskProvider"); }

  /** Versioned, explainable risk factors — every result is reproducible for the same seed+version. */
  score(seed: string, version = "syn-risk-v1"): SyntheticRiskResult {
    const factors: RiskFactor[] = [
      { key: "compliance_history", weight: 0.4, contribution: Math.round(seededFraction(`${seed}:ch`) * 40), explanation: "synthetic compliance-history contribution" },
      { key: "activity_class", weight: 0.35, contribution: Math.round(seededFraction(`${seed}:ac`) * 35), explanation: "synthetic activity-class contribution" },
      { key: "geographic_factor", weight: 0.25, contribution: Math.round(seededFraction(`${seed}:gf`) * 25), explanation: "synthetic geographic-factor contribution" },
    ];
    const riskScore = factors.reduce((sum, f) => sum + f.contribution, 0);
    const riskBand: SyntheticRiskResult["riskBand"] = riskScore < 30 ? "low" : riskScore < 65 ? "medium" : "high";
    return { riskScore, riskBand, version, factors };
  }
}

export const FACTORY_RISK_FIXTURE_MODES = ["stub", "off"] as const;
export type FactoryRiskFixtureMode = (typeof FACTORY_RISK_FIXTURE_MODES)[number];

export function selectFactoryRiskProviders(): { factory: SyntheticFactoryMasterProvider; risk: SyntheticRiskProvider } | null {
  const mode = resolveFeatureFlag(process.env.FEATURE_FACTORY_RISK_FIXTURES, FACTORY_RISK_FIXTURE_MODES, "off");
  if (mode === "off") return null;
  return { factory: new SyntheticFactoryMasterProvider(), risk: new SyntheticRiskProvider() };
}
