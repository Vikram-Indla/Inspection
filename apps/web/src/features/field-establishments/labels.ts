import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Messages } from "@/i18n/messages";

export type EstablishmentsCopy = Messages["fieldEstablishments"];

export function riskTone(band: string | null): StatusTone {
  switch (band) {
    case "high": return "danger";
    case "medium": return "warning";
    case "low": return "success";
    default: return "neutral";
  }
}

export function riskLabel(copy: EstablishmentsCopy, band: string | null): string | null {
  switch (band) {
    case "high": return copy.risk.high;
    case "medium": return copy.risk.medium;
    case "low": return copy.risk.low;
    default: return null;
  }
}
