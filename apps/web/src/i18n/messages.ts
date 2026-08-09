import type { Locale } from "@/lib/i18n";
import arApprovals from "./locales/ar/approvals.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arFactories from "./locales/ar/factories.json";
import arOperations from "./locales/ar/operations.json";
import arPlanning from "./locales/ar/planning.json";
import arRegulations from "./locales/ar/regulations.json";
import arShell from "./locales/ar/shell.json";
import enApprovals from "./locales/en/approvals.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enFactories from "./locales/en/factories.json";
import enOperations from "./locales/en/operations.json";
import enPlanning from "./locales/en/planning.json";
import enRegulations from "./locales/en/regulations.json";
import enShell from "./locales/en/shell.json";

export type Messages = {
  readonly approvals: typeof enApprovals;
  readonly common: typeof enCommon;
  readonly dashboard: typeof enDashboard;
  readonly factories: typeof enFactories;
  readonly operations: typeof enOperations;
  readonly planning: typeof enPlanning;
  readonly regulations: typeof enRegulations;
  readonly shell: typeof enShell;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { approvals: enApprovals, common: enCommon, dashboard: enDashboard, factories: enFactories, operations: enOperations, planning: enPlanning, regulations: enRegulations, shell: enShell },
  ar: { approvals: arApprovals, common: arCommon, dashboard: arDashboard, factories: arFactories, operations: arOperations, planning: arPlanning, regulations: arRegulations, shell: arShell },
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
