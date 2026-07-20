import "server-only";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import {
  reconcileFact,
  industrySharedUnavailable,
  type Factory360CanonicalProjection,
  type SourcedFact,
  type Discrepancy,
  type FactRole,
  type ProviderFamily,
  type ContractDisposition,
  type SourceVersion,
} from "@/lib/factory360/cross-provider-contract";

// TASK-FACTORY-360-IPAD-API-CONTRACT-CONSUMPTION-015
// Builds the provider-neutral Factory 360 canonical projection FROM the shared
// dossier, server-side only. This is the single place source precedence and
// discrepancy states are resolved; Web and iPad both consume the result through
// loadFactory360Dossier and NEVER re-resolve precedence or call a provider.
//
// Source precedence (FACTORY_360_SOURCE_PRECEDENCE_MATRIX):
//   1. Industry Shared master facts — ONLY when the contract is verified. It is
//      fail-closed today, so those master facts are `contract_unverified`.
//   2. Inspection API task-context facts (the synced values the platform holds).
//   3. Inspection-observed facts (immutable approved submission snapshot).
//   4. Approved immutable report facts (authoritative for compliance).
//   5. Risk Engine facts (unchanged; not part of this structural projection).
// Never silently overwrite: a conflict is surfaced as `conflicting`, an
// unverified master as `contract_unverified` — never collapsed to null.

const version = (provider: ProviderFamily, externalId: string | null, ts: string | null, v: string | null = null): SourceVersion =>
  ({ provider, externalId, sourceTimestamp: ts, version: v });

function fact<T>(value: T | null, role: FactRole, source: SourceVersion, disposition: ContractDisposition): SourcedFact<T> {
  return { value, role, source, disposition };
}

const lineNames = (dossier: Factory360Dossier, type: string): string[] =>
  dossier.lines.filter(row => row.item_type === type).map(row => row.name_en ?? row.name_ar ?? row.hs_code ?? row.id).filter((n): n is string => !!n);

export function buildFactory360CanonicalProjection(dossier: Factory360Dossier): Factory360CanonicalProjection {
  const cr = dossier.cr;
  const selected = dossier.selected;
  const factory = dossier.factory;
  const address = dossier.address;
  const syncedAt = selected?.source_synced_at ?? cr?.source_synced_at ?? null;
  // The synced platform values are Inspection API task-context facts (precedence
  // level 2) while Industry Shared master (level 1) is unverified.
  const ctx = (v: SourceVersion["externalId"], value: unknown, role: FactRole = "contextual", disposition: ContractDisposition = "CANONICAL_FIELD") =>
    fact(value as never, value == null ? "unavailable" : role, version("inspection_api", v ?? null, syncedAt), disposition);

  // Industry Shared master facts — fail closed for every domain it would own.
  const crMaster = industrySharedUnavailable<{ number: string | null; unifiedNumber: string | null }>(cr?.cr_number ?? null);
  const licenseMaster = industrySharedUnavailable<{ number: string | null; externalId: string | null }>(selected?.license_number ?? null);
  const plantMaster = industrySharedUnavailable<{ number: string | null; externalId: string | null }>(selected?.plant_number ?? null);
  const addressMaster = industrySharedUnavailable<{ line1: string | null; cityEn: string | null; cityAr: string | null; regionEn: string | null; regionAr: string | null }>(selected?.id ?? null);

  const commercialRegistration = ctx(cr?.cr_number ?? null, cr ? { number: cr.cr_number, unifiedNumber: cr.unified_number } : null);
  const industrialLicense = ctx(selected?.license_number ?? null, selected ? { number: selected.license_number, externalId: selected.id } : null);
  const plant = ctx(selected?.plant_number ?? null, selected ? { number: selected.plant_number, externalId: selected.id } : null);
  const addressFact = ctx(selected?.id ?? null, address ? {
    line1: (address.address_line_1 as string) ?? null,
    cityEn: (address.city_en as string) ?? null, cityAr: (address.city_ar as string) ?? null,
    regionEn: (address.region_en as string) ?? null, regionAr: (address.region_ar as string) ?? null,
  } : null);

  const activities = ctx(selected?.id ?? null, factory?.activity_class ? [factory.activity_class] : []);
  const products = ctx(selected?.id ?? null, lineNames(dossier, "product"));
  const materials = ctx(selected?.id ?? null, lineNames(dossier, "raw_material"));
  const machines = ctx(selected?.id ?? null, lineNames(dossier, "machine"));
  const spareParts = ctx(selected?.id ?? null, lineNames(dossier, "spare_part"));

  // Workforce / contacts / delegations are Industry Shared-owned domains — fail closed.
  const workforce = industrySharedUnavailable<readonly string[]>(selected?.id ?? null);
  const contacts = industrySharedUnavailable<readonly string[]>(selected?.id ?? null);
  const delegations = industrySharedUnavailable<readonly string[]>(selected?.id ?? null);

  // External task reference is not present in the read dossier context.
  const externalTaskReference = fact<string>(null, "unavailable", version("inspection_api", null, syncedAt), "SOURCE_METADATA");

  // Approved immutable report facts — authoritative (precedence level 4).
  const latestApproved = dossier.reports.find(report => report.status === "approved");
  const approvedPackageVersion = fact<string>(
    latestApproved?.package_versions?.version_label ?? null,
    latestApproved?.package_versions?.version_label ? "authoritative" : "unavailable",
    version("inspection_platform", latestApproved?.id ?? null, latestApproved?.submitted_at ?? null, latestApproved?.package_versions?.version_label ?? null),
    "CANONICAL_FIELD",
  );
  const latestSub = latestApproved ? [...(latestApproved.submission_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0] : undefined;
  const immutableSubmissionVersion = fact<string>(
    latestSub ? `v${latestSub.version_number}` : null,
    latestSub ? "authoritative" : "unavailable",
    version("inspection_platform", latestSub?.id ?? null, latestSub?.submitted_at ?? null, latestSub ? `v${latestSub.version_number}` : null),
    "CANONICAL_FIELD",
  );

  // Discrepancies: (a) Industry Shared master vs Inspection API contextual —
  // contract_unverified until the master contract exists; (b) current official
  // vs immutable approved-observed snapshot — matching/conflicting.
  const discrepancies: Discrepancy<unknown>[] = [
    reconcileFact(crMaster, commercialRegistration as SourcedFact<unknown>),
    reconcileFact(licenseMaster, industrialLicense as SourcedFact<unknown>),
    reconcileFact(plantMaster, plant as SourcedFact<unknown>),
    reconcileFact(addressMaster, addressFact as SourcedFact<unknown>),
  ];
  for (const row of dossier.observedComparison) {
    const official = fact<unknown>(row.official ?? null, row.official == null ? "unavailable" : "contextual", version("inspection_api", null, syncedAt), "CANONICAL_FIELD");
    const observedRaw = dossier.latestApprovedFactorySnapshot?.snapshot?.[row.observedKey];
    const observedValue = observedRaw == null || observedRaw === "" || typeof observedRaw === "object" ? null : String(observedRaw);
    const observed = fact<unknown>(observedValue, observedValue == null ? "unavailable" : "observed", version("inspection_platform", dossier.latestApprovedFactorySnapshot?.submission_version_id ?? null, dossier.latestApprovedFactorySnapshot?.captured_at ?? null), "CANONICAL_FIELD");
    discrepancies.push(reconcileFact(official, observed));
  }

  return {
    externalTaskReference,
    commercialRegistration,
    industrialLicense,
    plant,
    address: addressFact,
    activities,
    products,
    materials,
    machines,
    spareParts,
    workforce,
    contacts,
    delegations,
    approvedPackageVersion,
    immutableSubmissionVersion,
    discrepancies,
  };
}
