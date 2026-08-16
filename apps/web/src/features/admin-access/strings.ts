import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminAccessMessages = ReturnType<typeof adminAccessMessages>;

export function adminAccessMessages(locale: Locale) {
  return getMessages(locale).adminAccess;
}
