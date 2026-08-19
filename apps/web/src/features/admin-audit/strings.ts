import { getMessages } from "@/i18n/messages";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";
import type { ReplayEvent } from "@/lib/audit-replay";

export type AdminAuditMessages = ReturnType<typeof adminAuditMessages>;

export function adminAuditMessages(locale: Locale) {
  return getMessages(locale).adminAudit;
}

export function provenanceLabel(event: ReplayEvent, strings: AdminAuditMessages): string {
  return event.provenance === "semantic" ? strings.terms.semantic : strings.terms.generic;
}

export function provenanceTone(event: ReplayEvent): StatusTone {
  return event.provenance === "semantic" ? "success" : "warning";
}

export function ledgerTone(found: boolean, defaultStatus: string): StatusTone {
  if (found) return "success";
  return defaultStatus === "needs_contract" ? "warning" : "danger";
}
