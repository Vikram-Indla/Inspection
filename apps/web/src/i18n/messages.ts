import type { Locale } from "@/lib/i18n";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arShell from "./locales/ar/shell.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enShell from "./locales/en/shell.json";

export type Messages = {
  readonly common: typeof enCommon;
  readonly dashboard: typeof enDashboard;
  readonly shell: typeof enShell;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { common: enCommon, dashboard: enDashboard, shell: enShell },
  ar: { common: arCommon, dashboard: arDashboard, shell: arShell },
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
