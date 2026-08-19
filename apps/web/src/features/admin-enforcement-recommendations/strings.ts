import { getMessages } from "@/i18n/messages";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";

export type EnforcementRecommendationsMessages = ReturnType<typeof enforcementRecommendationsMessages>;

export function enforcementRecommendationsMessages(locale: Locale) {
  return getMessages(locale).adminEnforcementRecommendations;
}

export function measureLabel(action: string, strings: EnforcementRecommendationsMessages): string {
  const map: Record<string, string> = strings.measure;
  return map[action] ?? strings.measure.unavailable;
}

export function decideResultMessage(code: string, strings: EnforcementRecommendationsMessages): string {
  const map: Record<string, string> = strings.error;
  return map[code] ?? strings.error.write_failed;
}

export function decisionStatusLabel(status: string, strings: EnforcementRecommendationsMessages): string {
  return status === "approved" ? strings.status.approved : strings.status.rejected;
}

export function decisionStatusTone(status: string): StatusTone {
  return status === "approved" ? "success" : "danger";
}
