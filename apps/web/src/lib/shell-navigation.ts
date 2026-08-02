// CC-SAQEEL-RESPONSIVE-REVAMP-001 · PKT-RESPONSIVE-FOUNDATION-SHELL-001
// Canonical Claude Design: project 939e349f-dd7e-481e-8cc7-f7bc85e6e31b,
// artifact Saqeel Revamp.dc.html. Navigation visibility is presentation only;
// route guards, service authorization, RLS and audit remain authoritative.

export const ADMIN_ROLE_KEYS = [
  "admin",
] as const;

export const BUSINESS_ROLE_KEYS = [
  "supervisor",
  "planner",
  "inspector",
] as const;

// Retained only for compatibility with field business-logic consumers while
// the role migration is performed. It must never select a second shell or a
// reduced navigation catalogue.
export const FIELD_CHANNEL_ROLE_KEYS = ["inspector"] as const;

export function isFieldOnlyPersona(roleKeys: readonly string[]): boolean {
  return roleKeys.length > 0
    && roleKeys.every(role => (FIELD_CHANNEL_ROLE_KEYS as readonly string[]).includes(role));
}

export function isAdminOnlyPersona(roleKeys: readonly string[]): boolean {
  const roles = new Set(roleKeys);
  return roleKeys.some(role => (ADMIN_ROLE_KEYS as readonly string[]).includes(role))
    && !BUSINESS_ROLE_KEYS.some(role => roles.has(role));
}

export type ShellGlobalSearchResultType =
  | "commercial_registration"
  | "industrial_license"
  | "plant"
  | "factory"
  | "visit"
  | "inspection";

export type ShellGlobalSearchResultHref = {
  id: string;
  type: ShellGlobalSearchResultType;
  href: string;
};

export function shellGlobalSearchHref(
  result: ShellGlobalSearchResultHref,
  fieldOnly: boolean,
): string {
  if (!fieldOnly) return result.href;
  switch (result.type) {
    case "commercial_registration":
      return `/field/factory-360?cr=${encodeURIComponent(result.id)}`;
    case "industrial_license":
    case "plant":
      return `/field/factory-360?license=${encodeURIComponent(result.id)}`;
    case "factory":
      return `/field/factory-360?factory=${encodeURIComponent(result.id)}`;
    case "visit":
      return `/field/${encodeURIComponent(result.id)}`;
    case "inspection":
      return result.href;
  }
}

export function shellNotificationVisitHref(
  visitId: string,
  webHref: string,
  fieldOnly: boolean,
): string {
  return shellGlobalSearchHref({ id: visitId, type: "visit", href: webHref }, fieldOnly);
}

export type ShellIcon =
  | "dashboard" | "radar" | "factory" | "calendar" | "visits"
  | "inspect" | "virtual" | "review" | "admin" | "library"
  | "forms" | "enforcement" | "workflow" | "risk" | "map"
  | "access" | "notify" | "ai";

type Visibility = "business" | "canonical-admin";

export type ShellNavItemDefinition = {
  id: string;
  labelKey: string;
  labelEn: string;
  labelAr: string;
  href: string;
  icon: ShellIcon;
  roles: readonly string[];
  businessTab: string;
  visibility: Visibility;
  badge?: number;
  parentId?: string;
  parentLabelKey?: string;
  parentLabelEn?: string;
  parentLabelAr?: string;
  available?: boolean;
  unavailableReasonKey?: string;
  unavailableReasonEn?: string;
  unavailableReasonAr?: string;
};

export type ShellNavGroupDefinition = {
  id: string;
  labelKey: string;
  labelEn: string;
  labelAr: string;
  items: readonly ShellNavItemDefinition[];
};

export type BuiltShellNavItem = ShellNavItemDefinition & {
  enabled: boolean;
  disabledReasonKey?: string;
  disabledReasonEn?: string;
  disabledReasonAr?: string;
};

export type BuiltShellNavGroup = Omit<ShellNavGroupDefinition, "items"> & {
  items: BuiltShellNavItem[];
};

const allPresentationRoles = [
  ...BUSINESS_ROLE_KEYS,
  ...ADMIN_ROLE_KEYS,
] as readonly string[];

// Exact rail inventory transcribed from the live canonical Claude Design
// artifact on 2026-07-27. Unsupported analytics remains visible so the design
// hierarchy does not drift, but fails closed until a governed route exists.
export const SHELL_NAVIGATION: readonly ShellNavGroupDefinition[] = [
  {
    id: "overview",
    labelKey: "shell.group.overview",
    labelEn: "Overview",
    labelAr: "نظرة عامة",
    items: [
      { id: "dashboard", labelKey: "shell.nav.dashboard", labelEn: "Dashboard", labelAr: "لوحة القيادة", href: "/dashboard", icon: "dashboard", roles: allPresentationRoles, businessTab: "Dashboard", visibility: "business" },
      { id: "operations-center", labelKey: "shell.nav.operationsLive", labelEn: "Operations Center", labelAr: "مركز العمليات", href: "/operations", icon: "radar", roles: allPresentationRoles, businessTab: "Operations Center", visibility: "business" },
      { id: "factory-360", labelKey: "nav.factory360", labelEn: "Factory 360", labelAr: "المصنع 360", href: "/factories", icon: "factory", roles: allPresentationRoles, businessTab: "Factory 360", visibility: "business" },
    ],
  },
  {
    id: "operations",
    labelKey: "shell.group.operations",
    labelEn: "Operations",
    labelAr: "العمليات",
    items: [
      { id: "planning", labelKey: "nav.planning", labelEn: "Planning", labelAr: "التخطيط", href: "/planning", icon: "calendar", roles: allPresentationRoles, businessTab: "Planning", visibility: "business" },
      { id: "inspection-execution", labelKey: "shell.nav.execution", labelEn: "Execution", labelAr: "التنفيذ", href: "/execution", icon: "inspect", roles: allPresentationRoles, businessTab: "Inspection / Execution", visibility: "business", parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
      { id: "inspection-review", labelKey: "nav.reviews", labelEn: "Review & Approval", labelAr: "المراجعة والاعتماد", href: "/reviews", icon: "review", roles: allPresentationRoles, businessTab: "Inspection / Review & Approval", visibility: "business", parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
    ],
  },
  {
    id: "compliance",
    labelKey: "shell.group.compliance",
    labelEn: "Compliance",
    labelAr: "الامتثال",
    items: [
      { id: "compliance-library", labelKey: "shell.nav.complianceLibrary", labelEn: "Compliance Library", labelAr: "مكتبة الامتثال", href: "/admin/regulations", icon: "library", roles: allPresentationRoles, businessTab: "Compliance Library", visibility: "business" },
      { id: "approval-queue", labelKey: "shell.nav.approvalQueue", labelEn: "Approval Queue", labelAr: "قائمة الاعتماد", href: "/admin/compliance-approvals", icon: "review", roles: allPresentationRoles, businessTab: "Approval Queue", visibility: "business" },
      { id: "enforcement-library", labelKey: "shell.nav.enforcementLibrary", labelEn: "Enforcement Library", labelAr: "مكتبة الإنفاذ", href: "/admin/violations", icon: "enforcement", roles: allPresentationRoles, businessTab: "Enforcement Library", visibility: "business" },
    ],
  },
  {
    id: "insights",
    labelKey: "shell.group.insights",
    labelEn: "Insights",
    labelAr: "الرؤى",
    items: [
      { id: "analytics", labelKey: "shell.nav.analytics", labelEn: "Analytics", labelAr: "التحليلات", href: "/analytics", icon: "radar", roles: allPresentationRoles, businessTab: "Analytics", visibility: "business" },
    ],
  },
  {
    id: "administration",
    labelKey: "shell.nav.administration",
    labelEn: "Administration",
    labelAr: "الإدارة",
    items: [
      { id: "adm-users", labelKey: "shell.nav.usersRoles", labelEn: "Users & Roles", labelAr: "المستخدمون والأدوار", href: "/admin/access", icon: "access", roles: allPresentationRoles, businessTab: "Users & Roles", visibility: "canonical-admin" },
      { id: "adm-lookup", labelKey: "shell.nav.lookupManagement", labelEn: "Lookup Management", labelAr: "إدارة القوائم المرجعية", href: "/admin/localization", icon: "library", roles: allPresentationRoles, businessTab: "Lookup Management", visibility: "canonical-admin" },
      { id: "adm-risk", labelKey: "shell.nav.riskConfiguration", labelEn: "Risk Configuration", labelAr: "تهيئة المخاطر", href: "/admin/risk", icon: "risk", roles: allPresentationRoles, businessTab: "Risk Configuration", visibility: "canonical-admin" },
      { id: "adm-survey", labelKey: "shell.nav.surveyConfiguration", labelEn: "Survey Configuration", labelAr: "تهيئة النماذج", href: "/admin/packages", icon: "forms", roles: allPresentationRoles, businessTab: "Survey Configuration", visibility: "canonical-admin" },
      { id: "adm-notif", labelKey: "shell.nav.notificationConfiguration", labelEn: "Notification Configuration", labelAr: "تهيئة الإشعارات", href: "/admin/notifications", icon: "notify", roles: allPresentationRoles, businessTab: "Notification Configuration", visibility: "canonical-admin" },
      { id: "adm-delegation", labelKey: "shell.nav.delegation", labelEn: "Delegation", labelAr: "التفويض", href: "/admin/delegation", icon: "access", roles: allPresentationRoles, businessTab: "Delegation", visibility: "canonical-admin" },
      { id: "adm-integration", labelKey: "shell.nav.integrationManagement", labelEn: "Integration Management", labelAr: "إدارة التكاملات", href: "/admin/integrations", icon: "workflow", roles: allPresentationRoles, businessTab: "Integration Management", visibility: "canonical-admin" },
    ],
  },
] as const;

export function isAdminPersona(roleKeys: readonly string[]) {
  return roleKeys.some(role => (ADMIN_ROLE_KEYS as readonly string[]).includes(role));
}

export function buildShellNavigation(
  roleKeys: readonly string[],
  options?: { narrowToFieldChannel?: boolean },
): BuiltShellNavGroup[] {
  void roleKeys;
  void options;
  return SHELL_NAVIGATION.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      enabled: item.available !== false,
      disabledReasonKey: item.available === false ? item.unavailableReasonKey : undefined,
      disabledReasonEn: item.available === false ? item.unavailableReasonEn : undefined,
      disabledReasonAr: item.available === false ? item.unavailableReasonAr : undefined,
    })),
  }));
}

export function isShellRouteCurrent(current: string, href: string) {
  const hrefPath = href.split(/[?#]/, 1)[0];
  if (href.includes("?")) return current === href;
  if (hrefPath === "/dashboard") return current === hrefPath;
  if (hrefPath === "/operations") return current === hrefPath || current.startsWith(`${hrefPath}/`);
  if (hrefPath === "/admin") return current === hrefPath;
  return current === hrefPath || current.startsWith(`${hrefPath}/`);
}

export type ShellScopeContract = { date: boolean; region: boolean };
export function shellScopeForRoute(current: string): ShellScopeContract {
  if (current === "/dashboard") return { date: true, region: true };
  if (current === "/operations" || current.startsWith("/operations/")) return { date: false, region: true };
  return { date: false, region: false };
}
