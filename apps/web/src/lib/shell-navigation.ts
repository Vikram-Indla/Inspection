// TASK-WEB-COMPLIANCE-SHARED-SHELL-001 · CMP-REQ-SHELL-001..003
// Menu visibility is presentation only. Every destination retains its route
// guard, RLS, action permission, workflow and audit enforcement.

export const ADMIN_ROLE_KEYS = [
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "security_admin",
  "gis_admin",
  "risk_owner",
] as const;

export const BUSINESS_ROLE_KEYS = [
  "planner",
  "inspector",
  "reviewer",
  "ops",
  "leadership",
] as const;

// TASK-WEB-CHANNEL-ACCESS-GATE-001 · rbac_matrix.csv channel column.
// Field-channel personas (RBAC-009/010: Inspector = iPad) never receive the
// web portal or admin chrome. A user is "field-only" when every granted role
// belongs to this set. Multi-role accounts that also hold a web/admin role
// keep the full web experience — an operational grant always wins.
export const FIELD_CHANNEL_ROLE_KEYS = ["inspector"] as const;

export function isFieldOnlyPersona(roleKeys: readonly string[]): boolean {
  return roleKeys.length > 0
    && roleKeys.every(role => (FIELD_CHANNEL_ROLE_KEYS as readonly string[]).includes(role));
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

// PLAN v7 item 1 — preserve the API-provided console/admin destination exactly,
// and rewrite only field-only Inspector sessions to field-channel routes.
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

// PLAN v7 item 2 — notification planning links use the same persona-aware
// visit resolver as global search. The supplied web href (including a focus
// query) is preserved byte-for-byte for non-field sessions.
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
  | "access" | "notify" | "ai" | "analytics";

type Visibility = "business" | "admin-primary" | "admin-advanced";

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
  // Channels that may see this destination in the shared chrome. Absent = web
  // only. A field-only persona sees exactly the items marked "field".
  channels?: readonly ("web" | "field")[];
  parentId?: string;
  parentLabelKey?: string;
  parentLabelEn?: string;
  parentLabelAr?: string;
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

const adminRoles = ADMIN_ROLE_KEYS as readonly string[];
// Web-portal business roles exclude the field-only Inspector (RBAC-009/010).
// Inspector reaches Execution through the field channel, not the web nav.
const businessRoles = [
  ...BUSINESS_ROLE_KEYS.filter(role => !(FIELD_CHANNEL_ROLE_KEYS as readonly string[]).includes(role)),
  ...ADMIN_ROLE_KEYS,
] as readonly string[];
const primaryAdmin = (
  item: Omit<ShellNavItemDefinition, "visibility">,
): ShellNavItemDefinition => ({ ...item, visibility: "admin-primary" });

export const SHELL_NAVIGATION: readonly ShellNavGroupDefinition[] = [
  {
    id: "overview",
    labelKey: "shell.group.overview",
    labelEn: "Overview",
    labelAr: "نظرة عامة",
    items: [
      { id: "dashboard", labelKey: "shell.nav.dashboard", labelEn: "Dashboard", labelAr: "لوحة القيادة", href: "/dashboard", icon: "dashboard", roles: businessRoles, businessTab: "Dashboard", visibility: "business" },
      { id: "operations-center", labelKey: "shell.nav.operationsLive", labelEn: "Operations Center", labelAr: "مركز العمليات", href: "/operations", icon: "radar", roles: businessRoles, businessTab: "Operations Center", visibility: "business" },
      { id: "factory-360", labelKey: "nav.factory360", labelEn: "Factory 360", labelAr: "المصنع 360", href: "/factories", icon: "factory", roles: businessRoles, businessTab: "Factory 360", visibility: "business" },
    ],
  },
  {
    id: "operations",
    labelKey: "shell.group.operations",
    labelEn: "Operations",
    labelAr: "العمليات",
    items: [
      { id: "planning", labelKey: "nav.planning", labelEn: "Planning", labelAr: "التخطيط", href: "/planning", icon: "calendar", roles: businessRoles, businessTab: "Planning", visibility: "business" },
      { id: "inspection-execution", labelKey: "shell.nav.execution", labelEn: "Execution", labelAr: "التنفيذ", href: "/planning/visits?view=execution", icon: "inspect", roles: businessRoles, businessTab: "Inspection / Execution", visibility: "business", channels: ["web", "field"], parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
      { id: "inspection-review", labelKey: "nav.reviews", labelEn: "Review & Approval", labelAr: "المراجعة والاعتماد", href: "/reviews", icon: "review", roles: businessRoles, businessTab: "Inspection / Review & Approval", visibility: "business", parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
    ],
  },
  {
    id: "compliance",
    labelKey: "shell.group.compliance",
    labelEn: "Compliance",
    labelAr: "الامتثال",
    items: [
      { id: "compliance-library", labelKey: "shell.nav.complianceLibrary", labelEn: "Compliance Library", labelAr: "مكتبة الامتثال", href: "/admin/regulations", icon: "library", roles: businessRoles, businessTab: "Compliance Library", visibility: "business" },
      { id: "approval-queue", labelKey: "shell.nav.approvalQueue", labelEn: "Approval Queue", labelAr: "قائمة انتظار الاعتماد", href: "/admin/compliance-approvals", icon: "review", roles: businessRoles, businessTab: "Approval Queue", visibility: "business" },
      { id: "enforcement-library", labelKey: "shell.nav.enforcementLibrary", labelEn: "Enforcement Library", labelAr: "مكتبة الإنفاذ", href: "/enforcement", icon: "enforcement", roles: businessRoles, businessTab: "Enforcement Library", visibility: "business" },
    ],
  },
  {
    id: "insights",
    labelKey: "shell.group.insights",
    labelEn: "Insights",
    labelAr: "الرؤى",
    items: [
      { id: "analytics", labelKey: "shell.nav.analytics", labelEn: "Analytics", labelAr: "التحليلات", href: "/dashboard?view=analytics", icon: "analytics", roles: businessRoles, businessTab: "Analytics", visibility: "business" },
    ],
  },
  {
    id: "administration",
    labelKey: "shell.group.administration",
    labelEn: "Administration",
    labelAr: "الإدارة",
    items: [
      primaryAdmin({ id: "users-roles", labelKey: "shell.nav.usersRoles", labelEn: "Users & Roles", labelAr: "المستخدمون والأدوار", href: "/admin/access", icon: "access", roles: ["security_admin"], businessTab: "Users & Roles" }),
      primaryAdmin({ id: "lookup-management", labelKey: "shell.nav.lookupManagement", labelEn: "Lookup Management", labelAr: "إدارة القوائم المرجعية", href: "/admin/planning/lookups", icon: "library", roles: ["compliance_admin", "workflow_admin", "security_admin"], businessTab: "Lookup Management" }),
      primaryAdmin({ id: "risk-configuration", labelKey: "shell.nav.riskConfiguration", labelEn: "Risk Configuration", labelAr: "تهيئة المخاطر", href: "/admin/risk", icon: "risk", roles: ["risk_owner"], businessTab: "Risk Configuration" }),
      primaryAdmin({ id: "survey-configuration", labelKey: "shell.nav.surveyConfiguration", labelEn: "Survey Configuration", labelAr: "تهيئة الاستبيانات", href: "/admin/items", icon: "forms", roles: ["form_admin", "compliance_admin", "workflow_admin"], businessTab: "Survey Configuration" }),
      primaryAdmin({ id: "notification-configuration", labelKey: "shell.nav.notificationConfiguration", labelEn: "Notification Configuration", labelAr: "تهيئة الإشعارات", href: "/admin/notifications", icon: "notify", roles: adminRoles, businessTab: "Notification Configuration" }),
      primaryAdmin({ id: "integration-management", labelKey: "shell.nav.integrationManagement", labelEn: "Integration Management", labelAr: "إدارة التكاملات", href: "/admin/integrations", icon: "workflow", roles: ["security_admin", "workflow_admin", "gis_admin"], businessTab: "Integration Management" }),
    ],
  },
] as const;

export function isAdminPersona(roleKeys: readonly string[]) {
  return roleKeys.some(role => adminRoles.includes(role));
}

export function buildShellNavigation(roleKeys: readonly string[]): BuiltShellNavGroup[] {
  const roles = new Set(roleKeys);
  // Field-only personas get the field channel only: no web-portal destinations,
  // no admin group (not even a locked one). Web/admin personas are unaffected.
  const fieldOnly = isFieldOnlyPersona(roleKeys);
  return SHELL_NAVIGATION.map(group => ({
    ...group,
    items: group.items.flatMap(item => {
      if (fieldOnly && !(item.channels ?? ["web"]).includes("field")) return [];
      const allowed = item.roles.some(role => roles.has(role));
      if (item.visibility === "admin-advanced" && !allowed) return [];
      return [{
        ...item,
        ...(item.id === "inspection-execution"
          ? { href: fieldOnly ? "/field" : "/visits" }
          : {}),
        enabled: item.id !== "analytics" && (item.visibility === "business" || allowed),
        ...(item.id === "analytics" ? {
          disabledReasonKey: "shell.notYetWired",
          disabledReasonEn: "Analytics is awaiting its approved module wiring.",
          disabledReasonAr: "التحليلات بانتظار ربط الوحدة المعتمدة.",
        } : {}),
        ...(item.visibility === "admin-primary" && !allowed ? {
          disabledReasonKey: "shell.adminRequired",
          disabledReasonEn: "Administrator access required.",
          disabledReasonAr: "يتطلب الوصول صلاحية المسؤول.",
        } : {}),
      }];
    }),
  })).filter(group => group.items.length > 0);
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
