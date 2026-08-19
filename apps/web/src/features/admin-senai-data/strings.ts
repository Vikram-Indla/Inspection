import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminSenaiDataMessages = ReturnType<typeof adminSenaiDataMessages>;

export function adminSenaiDataMessages(locale: Locale) {
  return getMessages(locale).adminSenaiData;
}

export const SENAI_TABS = ["sources", "endpoints", "mapping", "reconcile"] as const;

export type SenaiTab = (typeof SENAI_TABS)[number];

export function resolveSenaiTab(value: string | undefined): SenaiTab {
  return SENAI_TABS.includes(value as SenaiTab) ? (value as SenaiTab) : "sources";
}
