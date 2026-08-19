import { getMessages } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";

export type AdminWorkflowsMessages = ReturnType<typeof adminWorkflowsMessages>;

export function adminWorkflowsMessages(locale: Locale) {
  return getMessages(locale).adminWorkflows;
}

export function versionStatusLabel(status: string, strings: AdminWorkflowsMessages, locale: Locale): string {
  const map: Record<string, string> = strings.status;
  return map[status] ?? humaniseEnum(status, locale);
}

export function versionStatusTone(status: string): StatusTone {
  if (status === "published") return "success";
  if (status === "draft") return "warning";
  return "neutral";
}
