import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminLocalizationMessages = ReturnType<typeof adminLocalizationMessages>;

export function adminLocalizationMessages(locale: Locale) {
  return getMessages(locale).adminLocalization;
}
