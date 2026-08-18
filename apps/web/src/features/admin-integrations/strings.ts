import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminIntegrationsMessages = ReturnType<typeof adminIntegrationsMessages>;

export function adminIntegrationsMessages(locale: Locale) {
  return getMessages(locale).adminIntegrations;
}
