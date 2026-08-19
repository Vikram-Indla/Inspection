import { getMessages } from "@/i18n/messages";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";
import type { GrantState } from "./types";

export type AdminSecurityAccessMessages = ReturnType<typeof adminSecurityAccessMessages>;

export function adminSecurityAccessMessages(locale: Locale) {
  return getMessages(locale).adminSecurityAccess;
}

export function accessResultMessage(code: string, strings: AdminSecurityAccessMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? strings.result.write_failed;
}

export function reviewStatusLabel(status: string, strings: AdminSecurityAccessMessages): string {
  return status === "open" ? strings.status.open : strings.status.closed;
}

export function reviewStatusTone(status: string): StatusTone {
  return status === "open" ? "warning" : "success";
}

export function grantStateLabel(state: GrantState, strings: AdminSecurityAccessMessages): string {
  return strings.grants[state];
}

export function grantStateTone(state: GrantState): StatusTone {
  if (state === "active") return "success";
  if (state === "revoked") return "danger";
  return "neutral";
}
