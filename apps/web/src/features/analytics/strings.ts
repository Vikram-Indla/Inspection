import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { BlockedMetric } from "./view";

export type AnalyticsMessages = ReturnType<typeof analyticsMessages>;

export function analyticsMessages(locale: Locale) {
  return getMessages(locale).analytics;
}

export function buildScreenStrings(locale: Locale) {
  return analyticsMessages(locale);
}

export function blockedLabel(status: BlockedMetric["status"], locale: Locale): string {
  const blocked = analyticsMessages(locale).unavailable;
  if (status === "not_applicable") return blocked.notApplicable;
  if (status === "not_configured") return blocked.notConfigured;
  if (status === "decision_required") return blocked.decisionRequired;
  return blocked.unavailable;
}
