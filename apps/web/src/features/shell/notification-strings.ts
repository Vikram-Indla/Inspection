import { getMessages, type Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type NotificationStrings = Messages["notifications"];

export function getNotificationStrings(locale: Locale): NotificationStrings {
  return getMessages(locale).notifications;
}
