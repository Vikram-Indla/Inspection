import { getMessages } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Locale } from "@/lib/i18n";

export type AdminDevicesMessages = ReturnType<typeof adminDevicesMessages>;

export function adminDevicesMessages(locale: Locale) {
  return getMessages(locale).adminDevices;
}

export function deviceResultMessage(code: string, strings: AdminDevicesMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? strings.result.write_failed;
}

export function trustLabel(status: string, locale: Locale): string {
  return humaniseEnum(status, locale);
}

export function trustTone(status: string): StatusTone {
  if (status === "trusted") return "success";
  if (status === "revoked" || status === "blocked") return "danger";
  return "warning";
}

export function commandStatusLabel(status: string, locale: Locale): string {
  return humaniseEnum(status, locale);
}

export function commandStatusTone(status: string): StatusTone {
  if (status === "completed" || status === "acknowledged") return "success";
  if (status === "failed" || status === "rejected") return "danger";
  return "pending";
}
