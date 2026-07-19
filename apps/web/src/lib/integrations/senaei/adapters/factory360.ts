import { contractNotSupplied } from "../errors";
import { mapInspectionObservation } from "../schemas";
import type { DomainResult, InspectionObservation, InspectionObservationWire } from "../types";

export const UNDOCUMENTED_FACTORY_360_DOMAINS = ["commercial registration portfolio search", "incentives", "approved government services", "chemical permits", "customs exemptions", "land-provider history", "factory document retrieval", "risk history", "risk explanation", "factory inspection-report history", "factory compliance history", "violations and penalties", "Factory 360 PDF export"] as const;
export type UndocumentedFactory360Domain = (typeof UNDOCUMENTED_FACTORY_360_DOMAINS)[number];
export function unavailableFactory360Domain<T>(domain: UndocumentedFactory360Domain): DomainResult<T> { return contractNotSupplied(domain); }
export function canonicalizeInspectionObservation(wire: InspectionObservationWire): InspectionObservation { return mapInspectionObservation(wire); }
