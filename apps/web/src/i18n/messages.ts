import type { Locale } from "@/lib/i18n";
import arCommon from "./locales/ar/common.json";
import arCompliance from "./locales/ar/compliance.json";
import arDashboard from "./locales/ar/dashboard.json";
import arEnforcement from "./locales/ar/enforcement.json";
import arOperations from "./locales/ar/operations.json";
import arPlanning from "./locales/ar/planning.json";
import arShell from "./locales/ar/shell.json";
import enCommon from "./locales/en/common.json";
import enCompliance from "./locales/en/compliance.json";
import enDashboard from "./locales/en/dashboard.json";
import enEnforcement from "./locales/en/enforcement.json";
import enOperations from "./locales/en/operations.json";
import enPlanning from "./locales/en/planning.json";
import enShell from "./locales/en/shell.json";

export type Messages = {
  readonly common: typeof enCommon;
  readonly compliance: typeof enCompliance;
  readonly dashboard: typeof enDashboard;
  readonly enforcement: typeof enEnforcement;
  readonly operations: typeof enOperations;
  readonly planning: typeof enPlanning;
  readonly shell: typeof enShell;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { common: enCommon, compliance: enCompliance, dashboard: enDashboard, enforcement: enEnforcement, operations: enOperations, planning: enPlanning, shell: enShell },
  ar: { common: arCommon, compliance: arCompliance, dashboard: arDashboard, enforcement: arEnforcement, operations: arOperations, planning: arPlanning, shell: arShell },
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
