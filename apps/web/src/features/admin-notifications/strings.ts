import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminNotificationsMessages = ReturnType<typeof adminNotificationsMessages>;

export function adminNotificationsMessages(locale: Locale) {
  return getMessages(locale).adminNotifications;
}

export function notifResultMessage(code: string, strings: AdminNotificationsMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? code;
}

export function eventLabel(key: string, strings: AdminNotificationsMessages): string {
  const map: Record<string, string> = strings.eventLabels;
  return map[key] ?? key;
}

export function channelLabel(key: string, strings: AdminNotificationsMessages): string {
  const map: Record<string, string> = strings.channelLabels;
  return map[key] ?? key;
}
