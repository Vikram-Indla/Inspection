import { getMessages } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";

export type AdminOperationsMessages = ReturnType<typeof adminOperationsMessages>;

export function adminOperationsMessages(locale: Locale) {
  return getMessages(locale).adminOperations;
}

export function opsResultMessage(code: string, strings: AdminOperationsMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? strings.result.write_failed;
}

export function errorStatusLabel(status: string, strings: AdminOperationsMessages, locale: Locale): string {
  const map: Record<string, string> = strings.errorStatus;
  return map[status] ?? humaniseEnum(status, locale);
}

export function errorSourceLabel(source: string, locale: Locale): string {
  return humaniseEnum(source, locale);
}

export function flagStatusLabel(status: string, strings: AdminOperationsMessages, locale: Locale): string {
  const map: Record<string, string> = strings.flagStatus;
  return map[status] ?? humaniseEnum(status, locale);
}

export function errorStatusTone(status: string): StatusTone {
  if (status === "failed" || status === "dead_letter") return "danger";
  if (status === "dependency_blocked") return "warning";
  if (status === "retry_requested") return "pending";
  if (status === "resolved") return "success";
  return "neutral";
}

export function flagStatusTone(status: string): StatusTone {
  if (status === "published") return "success";
  if (status === "draft") return "warning";
  return "neutral";
}

export const RETRYABLE_ERROR_STATUSES = ["failed", "dependency_blocked"];
