import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Messages } from "@/i18n/messages";

export type MyTasksCopy = Messages["fieldMyTasks"];
export type VisitEnumCopy = Messages["visits"]["enum"];

export function statusLabel(copy: MyTasksCopy, value: string | null): string {
  if (value === null || value === "") return copy.noValue;
  const table: Readonly<Record<string, string>> = copy.status;
  return table[value] ?? value;
}

export function enumLabel(enums: VisitEnumCopy, value: string | null, fallback: string): string {
  if (value === null || value === "") return fallback;
  const table: Readonly<Record<string, string>> = enums;
  return table[value] ?? value;
}

export function dataOrDash(copy: MyTasksCopy, value: string | number | null): string {
  if (value === null || value === "") return copy.noValue;
  return String(value);
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
