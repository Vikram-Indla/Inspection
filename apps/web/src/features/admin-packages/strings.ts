import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminPackagesMessages = ReturnType<typeof adminPackagesMessages>;

export function adminPackagesMessages(locale: Locale) {
  return getMessages(locale).adminPackages;
}
