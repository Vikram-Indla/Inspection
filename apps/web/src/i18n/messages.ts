import type { Locale } from "@/lib/i18n";
import arAdminAccess from "./locales/ar/admin-access.json";
import arAdminLocalization from "./locales/ar/admin-localization.json";
import arAdminPackages from "./locales/ar/admin-packages.json";
import arAdminPlanningExpiry from "./locales/ar/admin-planning-expiry.json";
import arAnalytics from "./locales/ar/analytics.json";
import arApprovals from "./locales/ar/approvals.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arExecution from "./locales/ar/execution.json";
import arEnforcement from "./locales/ar/enforcement.json";
import arFactories from "./locales/ar/factories.json";
import arFieldDrafts from "./locales/ar/field-drafts.json";
import arFieldHome from "./locales/ar/field-home.json";
import arFieldMyTasks from "./locales/ar/field-my-tasks.json";
import arNotifications from "./locales/ar/notifications.json";
import arOperations from "./locales/ar/operations.json";
import arPlanning from "./locales/ar/planning.json";
import arReviews from "./locales/ar/reviews.json";
import arRegulations from "./locales/ar/regulations.json";
import arShell from "./locales/ar/shell.json";
import arVisits from "./locales/ar/visits.json";
import enAdminAccess from "./locales/en/admin-access.json";
import enAdminLocalization from "./locales/en/admin-localization.json";
import enAdminPackages from "./locales/en/admin-packages.json";
import enAdminPlanningExpiry from "./locales/en/admin-planning-expiry.json";
import enAnalytics from "./locales/en/analytics.json";
import enApprovals from "./locales/en/approvals.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enExecution from "./locales/en/execution.json";
import enEnforcement from "./locales/en/enforcement.json";
import enFactories from "./locales/en/factories.json";
import enFieldDrafts from "./locales/en/field-drafts.json";
import enFieldHome from "./locales/en/field-home.json";
import enFieldMyTasks from "./locales/en/field-my-tasks.json";
import enNotifications from "./locales/en/notifications.json";
import enOperations from "./locales/en/operations.json";
import enPlanning from "./locales/en/planning.json";
import enReviews from "./locales/en/reviews.json";
import enRegulations from "./locales/en/regulations.json";
import enShell from "./locales/en/shell.json";
import enVisits from "./locales/en/visits.json";

export type Messages = {
  readonly adminAccess: typeof enAdminAccess;
  readonly adminLocalization: typeof enAdminLocalization;
  readonly adminPackages: typeof enAdminPackages;
  readonly adminPlanningExpiry: typeof enAdminPlanningExpiry;
  readonly analytics: typeof enAnalytics;
  readonly approvals: typeof enApprovals;
  readonly common: typeof enCommon;
  readonly dashboard: typeof enDashboard;
  readonly enforcement: typeof enEnforcement;
  readonly execution: typeof enExecution;
  readonly factories: typeof enFactories;
  readonly fieldDrafts: typeof enFieldDrafts;
  readonly fieldHome: typeof enFieldHome;
  readonly fieldMyTasks: typeof enFieldMyTasks;
  readonly notifications: typeof enNotifications;
  readonly operations: typeof enOperations;
  readonly planning: typeof enPlanning;
  readonly regulations: typeof enRegulations;
  readonly reviews: typeof enReviews;
  readonly shell: typeof enShell;
  readonly visits: typeof enVisits;
};

const MESSAGES: Readonly<Record<Locale, Messages>> = {
  en: { adminAccess: enAdminAccess, adminLocalization: enAdminLocalization, adminPackages: enAdminPackages, adminPlanningExpiry: enAdminPlanningExpiry, analytics: enAnalytics, approvals: enApprovals, common: enCommon, dashboard: enDashboard, enforcement: enEnforcement, execution: enExecution, factories: enFactories, fieldDrafts: enFieldDrafts, fieldHome: enFieldHome, fieldMyTasks: enFieldMyTasks, notifications: enNotifications, operations: enOperations, planning: enPlanning, regulations: enRegulations, reviews: enReviews, shell: enShell, visits: enVisits },
  ar: { adminAccess: arAdminAccess, adminLocalization: arAdminLocalization, adminPackages: arAdminPackages, adminPlanningExpiry: arAdminPlanningExpiry, analytics: arAnalytics, approvals: arApprovals, common: arCommon, dashboard: arDashboard, enforcement: arEnforcement, execution: arExecution, factories: arFactories, fieldDrafts: arFieldDrafts, fieldHome: arFieldHome, fieldMyTasks: arFieldMyTasks, notifications: arNotifications, operations: arOperations, planning: arPlanning, regulations: arRegulations, reviews: arReviews, shell: arShell, visits: arVisits },
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
