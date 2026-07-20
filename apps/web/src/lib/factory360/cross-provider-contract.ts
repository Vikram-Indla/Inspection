/** TASK-FACTORY-360-CROSS-PROVIDER-CONTRACT-014
 * Provider-neutral, server-side-only Factory 360 structure.  It deliberately
 * carries availability/provenance instead of pretending that an unverified
 * provider field is absent or safe to overwrite.
 */
export type ContractDisposition = "CANONICAL_FIELD" | "SOURCE_METADATA" | "RAW_SNAPSHOT_ONLY" | "TRANSIENT_REQUEST_ONLY" | "SENSITIVE_RESTRICTED" | "DUPLICATE_EXTERNAL_FIELD" | "NOT_USED_WITH_REASON" | "CONTRACT_UNVERIFIED";
export type FactRole = "authoritative" | "contextual" | "observed" | "matching" | "conflicting" | "unavailable" | "contract_unverified" | "permission_restricted";
export type ProviderFamily = "inspection_api" | "industry_shared" | "inspection_platform" | "risk_engine";
export type SourceVersion = { provider: ProviderFamily; externalId: string | null; sourceTimestamp: string | null; version: string | null };
export type SourcedFact<T> = { value: T | null; role: FactRole; source: SourceVersion; disposition: ContractDisposition };
export type Discrepancy<T> = { state: "matching" | "conflicting" | "unavailable" | "contract_unverified" | "permission_restricted"; master: SourcedFact<T>; contextual: SourcedFact<T> };

export type Factory360CanonicalProjection = {
  externalTaskReference: SourcedFact<string>;
  commercialRegistration: SourcedFact<{ number: string | null; unifiedNumber: string | null }>;
  industrialLicense: SourcedFact<{ number: string | null; externalId: string | null }>;
  plant: SourcedFact<{ number: string | null; externalId: string | null }>;
  address: SourcedFact<{ line1: string | null; cityEn: string | null; cityAr: string | null; regionEn: string | null; regionAr: string | null }>;
  activities: SourcedFact<readonly string[]>;
  products: SourcedFact<readonly string[]>;
  materials: SourcedFact<readonly string[]>;
  machines: SourcedFact<readonly string[]>;
  spareParts: SourcedFact<readonly string[]>;
  workforce: SourcedFact<readonly string[]>;
  contacts: SourcedFact<readonly string[]>;
  delegations: SourcedFact<readonly string[]>;
  approvedPackageVersion: SourcedFact<string>;
  immutableSubmissionVersion: SourcedFact<string>;
  discrepancies: readonly Discrepancy<unknown>[];
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function reconcileFact<T>(master: SourcedFact<T>, contextual: SourcedFact<T>): Discrepancy<T> {
  if (master.role === "permission_restricted" || contextual.role === "permission_restricted") return { state: "permission_restricted", master, contextual };
  if (master.role === "contract_unverified" || contextual.role === "contract_unverified") return { state: "contract_unverified", master, contextual };
  if (master.value == null || contextual.value == null) return { state: "unavailable", master, contextual };
  return { state: same(master.value, contextual.value) ? "matching" : "conflicting", master, contextual };
}

export function industrySharedUnavailable<T>(externalId: string | null = null): SourcedFact<T> {
  return { value: null, role: "contract_unverified", source: { provider: "industry_shared", externalId, sourceTimestamp: null, version: null }, disposition: "CONTRACT_UNVERIFIED" };
}
