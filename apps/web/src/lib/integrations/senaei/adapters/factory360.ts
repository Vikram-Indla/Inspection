import { contractNotSupplied, failed, forwardUnavailable } from "../errors";
import { mapInspectionObservation, parseChemicalPermitList, parseCustomsExemptionList } from "../schemas";
import type { ChemicalPermit, CustomsExemption, DomainResult, InspectionObservation, InspectionObservationWire, SenaeiClient } from "../types";

export const UNDOCUMENTED_FACTORY_360_DOMAINS = ["commercial registration portfolio search", "incentives", "approved government services", "land-provider history", "factory document retrieval", "risk history", "risk explanation", "factory inspection-report history", "factory compliance history", "violations and penalties", "Factory 360 PDF export"] as const;
export type UndocumentedFactory360Domain = (typeof UNDOCUMENTED_FACTORY_360_DOMAINS)[number];
export function unavailableFactory360Domain<T>(domain: UndocumentedFactory360Domain): DomainResult<T> { return contractNotSupplied(domain); }
export function canonicalizeInspectionObservation(wire: InspectionObservationWire): InspectionObservation { return mapInspectionObservation(wire); }

// chemicalcustoms.json: GET /api/v3/inspection/plants/{plant_number}/chemical-permits
// and /customs-exemptions — confirmed live (2026-07) to require no auth despite
// the OpenAPI spec's boilerplate bearer-security block; every call here is
// explicit auth:"none", not a client-default fallthrough.
export async function listChemicalPermitsByPlant(client: SenaeiClient, plantNumber: string): Promise<DomainResult<ChemicalPermit[]>> {
  const result = await client.requestJson(`/api/v3/inspection/plants/${encodeURIComponent(plantNumber)}/chemical-permits`, { auth: "none", query: { limit: 100 } });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseChemicalPermitList(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei chemical permits did not match the documented contract."); }
}

export async function listCustomsExemptionsByPlant(client: SenaeiClient, plantNumber: string): Promise<DomainResult<CustomsExemption[]>> {
  const result = await client.requestJson(`/api/v3/inspection/plants/${encodeURIComponent(plantNumber)}/customs-exemptions`, { auth: "none", query: { limit: 100 } });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseCustomsExemptionList(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei customs exemptions did not match the documented contract."); }
}
