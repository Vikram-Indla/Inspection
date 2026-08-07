import type { Locale } from "@/lib/i18n";
import arCommon from "./locales/ar/common.json";
import arShell from "./locales/ar/shell.json";
import enCommon from "./locales/en/common.json";
import enShell from "./locales/en/shell.json";

export type Messages = {
  readonly common: typeof enCommon;
  readonly shell: typeof enShell;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { common: enCommon, shell: enShell },
  ar: { common: arCommon, shell: arShell },
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
