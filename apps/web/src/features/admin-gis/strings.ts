import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminGisMessages = ReturnType<typeof adminGisMessages>;

export function adminGisMessages(locale: Locale) {
  return getMessages(locale).adminGis;
}

export function resultMessage(code: string, strings: AdminGisMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? code;
}

export function bandTone(band: string | null): StatusTone {
  if (band === "high") return "danger";
  if (band === "medium") return "warning";
  if (band === "low") return "success";
  return "neutral";
}

export function bandLabel(band: string | null, strings: AdminGisMessages): string {
  if (band === "high") return strings.band.high;
  if (band === "medium") return strings.band.medium;
  if (band === "low") return strings.band.low;
  return strings.band.unbanded;
}
