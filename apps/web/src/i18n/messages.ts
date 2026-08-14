import type { Locale } from "@/lib/i18n";
import arApprovals from "./locales/ar/approvals.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arExecution from "./locales/ar/execution.json";
import arEnforcement from "./locales/ar/enforcement.json";
import arFactories from "./locales/ar/factories.json";
import arNotifications from "./locales/ar/notifications.json";
import arOperations from "./locales/ar/operations.json";
import arPlanning from "./locales/ar/planning.json";
import arReviews from "./locales/ar/reviews.json";
import arRegulations from "./locales/ar/regulations.json";
import arShell from "./locales/ar/shell.json";
import arVisits from "./locales/ar/visits.json";
import enApprovals from "./locales/en/approvals.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enExecution from "./locales/en/execution.json";
import enEnforcement from "./locales/en/enforcement.json";
import enFactories from "./locales/en/factories.json";
import enNotifications from "./locales/en/notifications.json";
import enOperations from "./locales/en/operations.json";
import enPlanning from "./locales/en/planning.json";
import enReviews from "./locales/en/reviews.json";
import enRegulations from "./locales/en/regulations.json";
import enShell from "./locales/en/shell.json";
import enVisits from "./locales/en/visits.json";

export type Messages = {
  readonly approvals: typeof enApprovals;
  readonly common: typeof enCommon;
  readonly dashboard: typeof enDashboard;
  readonly enforcement: typeof enEnforcement;
  readonly execution: typeof enExecution;
  readonly factories: typeof enFactories;
  readonly notifications: typeof enNotifications;
  readonly operations: typeof enOperations;
  readonly planning: typeof enPlanning;
  readonly regulations: typeof enRegulations;
  readonly reviews: typeof enReviews;
  readonly shell: typeof enShell;
  readonly visits: typeof enVisits;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { approvals: enApprovals, common: enCommon, dashboard: enDashboard, enforcement: enEnforcement, execution: enExecution, factories: enFactories, notifications: enNotifications, operations: enOperations, planning: enPlanning, regulations: enRegulations, reviews: enReviews, shell: enShell, visits: enVisits },
  ar: { approvals: arApprovals, common: arCommon, dashboard: arDashboard, enforcement: arEnforcement, execution: arExecution, factories: arFactories, notifications: arNotifications, operations: arOperations, planning: arPlanning, regulations: arRegulations, reviews: arReviews, shell: arShell, visits: arVisits },
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
