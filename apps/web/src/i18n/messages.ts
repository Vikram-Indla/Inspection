import type { Locale } from "@/lib/i18n";
import arAdminAccess from "./locales/ar/admin-access.json";
import arAdminLocalization from "./locales/ar/admin-localization.json";
import arAdminPackages from "./locales/ar/admin-packages.json";
import arAdminComplianceRequests from "./locales/ar/admin-compliance-requests.json";
import arAdminDelegation from "./locales/ar/admin-delegation.json";
import arAdminEnforcementRecommendations from "./locales/ar/admin-enforcement-recommendations.json";
import arAdminWorkflows from "./locales/ar/admin-workflows.json";
import arAdminFactoryData from "./locales/ar/admin-factory-data.json";
import arAdminGis from "./locales/ar/admin-gis.json";
import arAdminNotifications from "./locales/ar/admin-notifications.json";
import arAdminOperations from "./locales/ar/admin-operations.json";
import arAdminIntegrations from "./locales/ar/admin-integrations.json";
import arAdminSenaiData from "./locales/ar/admin-senai-data.json";
import arAdminPlanningExpiry from "./locales/ar/admin-planning-expiry.json";
import arAdminPlanningLookups from "./locales/ar/admin-planning-lookups.json";
import arAdminPlanningStatus from "./locales/ar/admin-planning-status.json";
import arAdminRiskModels from "./locales/ar/admin-risk-models.json";
import arAnalytics from "./locales/ar/analytics.json";
import arApprovals from "./locales/ar/approvals.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arExecution from "./locales/ar/execution.json";
import arEnforcement from "./locales/ar/enforcement.json";
import arFactories from "./locales/ar/factories.json";
import arFieldCompleted from "./locales/ar/field-completed.json";
import arFieldDrafts from "./locales/ar/field-drafts.json";
import arFieldEstablishments from "./locales/ar/field-establishments.json";
import arFieldHome from "./locales/ar/field-home.json";
import arFieldNotifications from "./locales/ar/field-notifications.json";
import arFieldReports from "./locales/ar/field-reports.json";
import arFieldSettings from "./locales/ar/field-settings.json";
import arFieldUnregistered from "./locales/ar/field-unregistered.json";
import arFieldVisits from "./locales/ar/field-visits.json";
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
import enAdminComplianceRequests from "./locales/en/admin-compliance-requests.json";
import enAdminDelegation from "./locales/en/admin-delegation.json";
import enAdminEnforcementRecommendations from "./locales/en/admin-enforcement-recommendations.json";
import enAdminWorkflows from "./locales/en/admin-workflows.json";
import enAdminFactoryData from "./locales/en/admin-factory-data.json";
import enAdminGis from "./locales/en/admin-gis.json";
import enAdminNotifications from "./locales/en/admin-notifications.json";
import enAdminOperations from "./locales/en/admin-operations.json";
import enAdminIntegrations from "./locales/en/admin-integrations.json";
import enAdminSenaiData from "./locales/en/admin-senai-data.json";
import enAdminPlanningExpiry from "./locales/en/admin-planning-expiry.json";
import enAdminPlanningLookups from "./locales/en/admin-planning-lookups.json";
import enAdminPlanningStatus from "./locales/en/admin-planning-status.json";
import enAdminRiskModels from "./locales/en/admin-risk-models.json";
import enAnalytics from "./locales/en/analytics.json";
import enApprovals from "./locales/en/approvals.json";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enExecution from "./locales/en/execution.json";
import enEnforcement from "./locales/en/enforcement.json";
import enFactories from "./locales/en/factories.json";
import enFieldCompleted from "./locales/en/field-completed.json";
import enFieldDrafts from "./locales/en/field-drafts.json";
import enFieldEstablishments from "./locales/en/field-establishments.json";
import enFieldHome from "./locales/en/field-home.json";
import enFieldNotifications from "./locales/en/field-notifications.json";
import enFieldReports from "./locales/en/field-reports.json";
import enFieldSettings from "./locales/en/field-settings.json";
import enFieldUnregistered from "./locales/en/field-unregistered.json";
import enFieldVisits from "./locales/en/field-visits.json";
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
  readonly adminComplianceRequests: typeof enAdminComplianceRequests;
  readonly adminDelegation: typeof enAdminDelegation;
  readonly adminEnforcementRecommendations: typeof enAdminEnforcementRecommendations;
  readonly adminWorkflows: typeof enAdminWorkflows;
  readonly adminIntegrations: typeof enAdminIntegrations;
  readonly adminFactoryData: typeof enAdminFactoryData;
  readonly adminGis: typeof enAdminGis;
  readonly adminNotifications: typeof enAdminNotifications;
  readonly adminOperations: typeof enAdminOperations;
  readonly adminSenaiData: typeof enAdminSenaiData;
  readonly adminPlanningExpiry: typeof enAdminPlanningExpiry;
  readonly adminPlanningLookups: typeof enAdminPlanningLookups;
  readonly adminPlanningStatus: typeof enAdminPlanningStatus;
  readonly adminRiskModels: typeof enAdminRiskModels;
  readonly analytics: typeof enAnalytics;
  readonly approvals: typeof enApprovals;
  readonly common: typeof enCommon;
  readonly dashboard: typeof enDashboard;
  readonly enforcement: typeof enEnforcement;
  readonly execution: typeof enExecution;
  readonly factories: typeof enFactories;
  readonly fieldCompleted: typeof enFieldCompleted;
  readonly fieldDrafts: typeof enFieldDrafts;
  readonly fieldEstablishments: typeof enFieldEstablishments;
  readonly fieldHome: typeof enFieldHome;
  readonly fieldNotifications: typeof enFieldNotifications;
  readonly fieldReports: typeof enFieldReports;
  readonly fieldSettings: typeof enFieldSettings;
  readonly fieldUnregistered: typeof enFieldUnregistered;
  readonly fieldVisits: typeof enFieldVisits;
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
  en: { adminComplianceRequests: enAdminComplianceRequests, adminDelegation: enAdminDelegation, adminEnforcementRecommendations: enAdminEnforcementRecommendations, adminWorkflows: enAdminWorkflows, adminIntegrations: enAdminIntegrations, adminFactoryData: enAdminFactoryData, adminGis: enAdminGis, adminNotifications: enAdminNotifications, adminOperations: enAdminOperations, adminSenaiData: enAdminSenaiData, adminAccess: enAdminAccess, adminLocalization: enAdminLocalization, adminPackages: enAdminPackages, adminPlanningExpiry: enAdminPlanningExpiry, adminPlanningLookups: enAdminPlanningLookups, adminPlanningStatus: enAdminPlanningStatus, adminRiskModels: enAdminRiskModels, analytics: enAnalytics, approvals: enApprovals, common: enCommon, dashboard: enDashboard, enforcement: enEnforcement, execution: enExecution, factories: enFactories, fieldCompleted: enFieldCompleted, fieldDrafts: enFieldDrafts, fieldEstablishments: enFieldEstablishments, fieldHome: enFieldHome, fieldMyTasks: enFieldMyTasks, fieldNotifications: enFieldNotifications, fieldReports: enFieldReports, fieldSettings: enFieldSettings, fieldUnregistered: enFieldUnregistered, fieldVisits: enFieldVisits, notifications: enNotifications, operations: enOperations, planning: enPlanning, regulations: enRegulations, reviews: enReviews, shell: enShell, visits: enVisits },
  ar: { adminComplianceRequests: arAdminComplianceRequests, adminDelegation: arAdminDelegation, adminEnforcementRecommendations: arAdminEnforcementRecommendations, adminWorkflows: arAdminWorkflows, adminIntegrations: arAdminIntegrations, adminFactoryData: arAdminFactoryData, adminGis: arAdminGis, adminNotifications: arAdminNotifications, adminOperations: arAdminOperations, adminSenaiData: arAdminSenaiData, adminAccess: arAdminAccess, adminLocalization: arAdminLocalization, adminPackages: arAdminPackages, adminPlanningExpiry: arAdminPlanningExpiry, adminPlanningLookups: arAdminPlanningLookups, adminPlanningStatus: arAdminPlanningStatus, adminRiskModels: arAdminRiskModels, analytics: arAnalytics, approvals: arApprovals, common: arCommon, dashboard: arDashboard, enforcement: arEnforcement, execution: arExecution, factories: arFactories, fieldCompleted: arFieldCompleted, fieldDrafts: arFieldDrafts, fieldEstablishments: arFieldEstablishments, fieldHome: arFieldHome, fieldMyTasks: arFieldMyTasks, fieldNotifications: arFieldNotifications, fieldReports: arFieldReports, fieldSettings: arFieldSettings, fieldUnregistered: arFieldUnregistered, fieldVisits: arFieldVisits, notifications: arNotifications, operations: arOperations, planning: arPlanning, regulations: arRegulations, reviews: arReviews, shell: arShell, visits: arVisits },
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
