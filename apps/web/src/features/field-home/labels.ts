import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Messages } from "@/i18n/messages";

export type FieldHomeCopy = Messages["fieldHome"];
export type VisitEnumCopy = Messages["visits"]["enum"];

export function enumLabel(enums: VisitEnumCopy, value: string | null, fallback: string): string {
  if (value === null) return fallback;
  const table: Readonly<Record<string, string>> = enums;
  return table[value] ?? fallback;
}

export function riskTone(band: string | null): StatusTone {
  switch (band) {
    case "high": return "danger";
    case "medium": return "warning";
    case "low": return "success";
    default: return "neutral";
  }
}

export function visitTone(planningStatus: string, operationalState: string): StatusTone {
  if (planningStatus === "expired") return "warning";
  if (operationalState === "submitted") return "success";
  return "info";
}

export function visitStateValue(planningStatus: string, operationalState: string): string {
  return planningStatus === "expired" ? "expired" : operationalState;
}

export function riskBandLabel(copy: FieldHomeCopy, band: string | null): string | null {
  switch (band) {
    case "high": return copy.reco.bandHigh;
    case "medium": return copy.reco.bandMedium;
    case "low": return copy.reco.bandLow;
    default: return null;
  }
}
