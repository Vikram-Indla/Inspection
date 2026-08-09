import type { ResolvedPortfolio } from "@/lib/planning/factory-resolver";

export type LegacyFactory = {
  id: string;
  name: string;
  cr_number: string | null;
  license_number: string | null;
  region: string | null;
  city: string | null;
  risk_band: string | null;
  risk_score: number | null;
  official_lat: number | null;
  official_lng: number | null;
  source_synced_at: string | null;
  master_source: string | null;
};

/**
 * The resolved publish target, unified across the two source models.
 *
 * Every hidden form field is built from this rather than read back out of the
 * radio DOM — the value that is published is the one the app resolved, not
 * whatever a control happens to be showing.
 */
export type PublishTarget = {
  readonly kind: "canonical" | "legacy";
  readonly factoryId: string;
  readonly name: string;
  readonly crNumber: string | null;
  /** `factories.license_number` — the value the publish RPC revalidates against. */
  readonly factoryLicenseNumber: string | null;
  readonly canonicalLicenseNumber: string | null;
  readonly plantNumber: string | null;
  readonly officialLat: number | null;
  readonly officialLng: number | null;
  readonly riskBand: string | null;
  readonly riskScore: number | null;
  readonly sourceSyncedAt: string | null;
  readonly officialAddress: string;
  readonly masterSource: string | null;
};

export type LicenceEntry = {
  readonly portfolio: ResolvedPortfolio;
  readonly licence: ResolvedPortfolio["licences"][number];
};

const joinAddress = (parts: readonly (string | null | undefined)[]): string =>
  [...new Set(parts.filter((part): part is string => Boolean(part)))].join(", ") || "—";

export function licenceEntries(portfolios: readonly ResolvedPortfolio[]): readonly LicenceEntry[] {
  return portfolios.flatMap(portfolio => portfolio.licences.map(licence => ({ portfolio, licence })));
}

export function resolveTarget(
  entry: LicenceEntry | null,
  legacy: LegacyFactory | null,
): PublishTarget | null {
  const factory = entry?.licence.factory;
  if (entry && factory) {
    const { licence, portfolio } = entry;
    return {
      kind: "canonical",
      factoryId: factory.id,
      name: factory.name,
      crNumber: portfolio.crNumber,
      factoryLicenseNumber: factory.licenseNumber,
      canonicalLicenseNumber: licence.licenseNumber,
      plantNumber: licence.plantNumber,
      officialLat: factory.officialLat,
      officialLng: factory.officialLng,
      riskBand: factory.riskBand,
      riskScore: factory.riskScore,
      sourceSyncedAt: factory.sourceSyncedAt ?? licence.sourceSyncedAt,
      officialAddress: joinAddress([
        licence.plantAddress?.addressLine1,
        licence.plantAddress?.districtEn,
        licence.plantAddress?.cityEn ?? factory.city,
        licence.plantAddress?.regionEn ?? factory.region,
      ]),
      masterSource: licence.plantAddress?.sourceSystem ?? factory.source ?? licence.sourceSystem,
    };
  }

  if (!legacy) return null;
  return {
    kind: "legacy",
    factoryId: legacy.id,
    name: legacy.name,
    crNumber: legacy.cr_number,
    factoryLicenseNumber: legacy.license_number,
    canonicalLicenseNumber: null,
    plantNumber: null,
    officialLat: legacy.official_lat,
    officialLng: legacy.official_lng,
    riskBand: legacy.risk_band,
    riskScore: legacy.risk_score,
    sourceSyncedAt: legacy.source_synced_at,
    officialAddress: joinAddress([legacy.city, legacy.region]),
    masterSource: legacy.master_source,
  };
}

export type ExecutionMode = "physical" | "virtual";

export type ModeEligibility = {
  readonly physical: boolean;
  readonly virtual: boolean;
};

/**
 * M03-011 — physical execution needs a GIS-verifiable official master location;
 * virtual needs the OTP engine configured.
 */
export function modeEligibility(target: PublishTarget | null, virtualEligible: boolean): ModeEligibility {
  return {
    physical: target != null && target.officialLat != null && target.officialLng != null,
    virtual: virtualEligible,
  };
}

/**
 * The mode a target can actually run in.
 *
 * The legacy screen corrected an ineligible mode inside a `useEffect`, which
 * meant the rendered value briefly disagreed with the value that would be
 * submitted. Deriving it makes the disagreement unrepresentable — and this is a
 * pure function of the chosen mode and what the target supports, which is
 * exactly the kind of thing that never needed state.
 */
export function effectiveMode(chosen: ExecutionMode, eligibility: ModeEligibility): ExecutionMode {
  if (chosen === "physical" && !eligibility.physical && eligibility.virtual) return "virtual";
  if (chosen === "virtual" && !eligibility.virtual && eligibility.physical) return "physical";
  return chosen;
}

export type Readiness = {
  readonly licenceOk: boolean;
  readonly configUnlocked: boolean;
  readonly scheduleReady: boolean;
  readonly publishReady: boolean;
};

/**
 * Progressive configuration: unlocked once identity, licence and location are
 * confirmed. For a canonical target the licence **is** the selection and is
 * already confirmed; the legacy path keeps its explicit licence-number step.
 *
 * A named inspector is deliberately not required — a planner may suggest one
 * but cannot release a visit, and the supervisor names the final assignment.
 */
export function readinessOf(input: {
  readonly target: PublishTarget | null;
  readonly licenseNumber: string;
  readonly locationConfirmed: boolean;
  readonly windowStart: string;
  readonly windowEnd: string;
}): Readiness {
  const { target, licenseNumber, locationConfirmed, windowStart, windowEnd } = input;
  const licenceOk = target != null && (
    target.kind === "canonical"
    || !target.factoryLicenseNumber
    || licenseNumber === target.factoryLicenseNumber
  );
  const configUnlocked = target != null && licenceOk && locationConfirmed;
  const scheduleReady = windowStart !== "" && windowEnd !== "" && windowEnd > windowStart;
  return { licenceOk, configUnlocked, scheduleReady, publishReady: configUnlocked && scheduleReady };
}
