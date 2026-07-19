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

export type ShellIcon =
  | "dashboard" | "radar" | "factory" | "calendar" | "visits"
  | "inspect" | "virtual" | "review" | "admin" | "library"
  | "forms" | "enforcement" | "workflow" | "risk" | "map"
  | "access" | "notify" | "insights";

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
const businessRoles = [...BUSINESS_ROLE_KEYS, ...ADMIN_ROLE_KEYS] as readonly string[];
const primaryAdmin = (
  item: Omit<ShellNavItemDefinition, "visibility">,
): ShellNavItemDefinition => ({ ...item, visibility: "admin-primary" });
const advancedAdmin = (
  item: Omit<ShellNavItemDefinition, "visibility">,
): ShellNavItemDefinition => ({ ...item, visibility: "admin-advanced" });

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
      { id: "inspection-execution", labelKey: "shell.nav.execution", labelEn: "Execution", labelAr: "التنفيذ", href: "/field", icon: "inspect", roles: businessRoles, businessTab: "Inspection / Execution", visibility: "business", parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
      { id: "inspection-review", labelKey: "nav.reviews", labelEn: "Review & Approval", labelAr: "المراجعة والاعتماد", href: "/reviews", icon: "review", roles: businessRoles, businessTab: "Inspection / Review & Approval", visibility: "business", parentId: "inspection", parentLabelKey: "shell.nav.inspection", parentLabelEn: "Inspection", parentLabelAr: "التفتيش" },
    ],
  },
  {
    id: "compliance",
    labelKey: "shell.group.compliance",
    labelEn: "Compliance",
    labelAr: "الامتثال",
    items: [
      { id: "compliance-library", labelKey: "shell.nav.regulations", labelEn: "Compliance Library", labelAr: "مكتبة الامتثال", href: "/admin/regulations", icon: "library", roles: businessRoles, businessTab: "Compliance Library", visibility: "business" },
      { id: "approval-queue", labelKey: "shell.nav.approvalQueue", labelEn: "Approval Queue", labelAr: "قائمة انتظار الموافقات", href: "/admin", icon: "review", roles: businessRoles, businessTab: "Approval Queue", visibility: "business" },
      { id: "enforcement-library", labelKey: "shell.nav.enforcement", labelEn: "Enforcement Library", labelAr: "مكتبة الإنفاذ", href: "/admin/violations", icon: "enforcement", roles: businessRoles, businessTab: "Enforcement Library", visibility: "business" },
    ],
  },
  {
    id: "insights",
    labelKey: "shell.group.insights",
    labelEn: "Insights",
    labelAr: "الرؤى",
    items: [
      { id: "ai-insights", labelKey: "shell.nav.aiInsights", labelEn: "AI Insights", labelAr: "رؤى الذكاء الاصطناعي", href: "/ai/suggestions", icon: "insights", roles: businessRoles, businessTab: "AI Insights", visibility: "business" },
    ],
  },
  {
    id: "administration",
    labelKey: "shell.group.administration",
    labelEn: "Administration",
    labelAr: "الإدارة",
    items: [
      primaryAdmin({ id: "users", labelKey: "shell.nav.users", labelEn: "Users", labelAr: "المستخدمون", href: "/admin/access", icon: "access", roles: ["security_admin"], businessTab: "Users" }),
      primaryAdmin({ id: "roles", labelKey: "shell.nav.roles", labelEn: "Roles", labelAr: "الأدوار", href: "/admin/access?view=roles", icon: "access", roles: ["security_admin"], businessTab: "Roles" }),
      primaryAdmin({ id: "lookups", labelKey: "shell.nav.lookups", labelEn: "Lookup Management", labelAr: "إدارة القوائم المرجعية", href: "/admin/localization", icon: "library", roles: ["compliance_admin", "workflow_admin", "security_admin"], businessTab: "Lookup Management" }),
      primaryAdmin({ id: "risk", labelKey: "shell.nav.risk", labelEn: "Risk Configuration", labelAr: "تهيئة المخاطر", href: "/admin/risk", icon: "risk", roles: ["risk_owner"], businessTab: "Risk Configuration" }),
      primaryAdmin({ id: "surveys", labelKey: "shell.nav.surveys", labelEn: "Survey Configuration", labelAr: "تهيئة الاستبيانات", href: "/admin/packages", icon: "forms", roles: ["form_admin", "compliance_admin"], businessTab: "Survey Configuration" }),
      primaryAdmin({ id: "notifications", labelKey: "shell.nav.notificationConfiguration", labelEn: "Notification Configuration", labelAr: "تهيئة الإشعارات", href: "/admin/notifications", icon: "notify", roles: adminRoles, businessTab: "Notification Configuration" }),
      primaryAdmin({ id: "integrations", labelKey: "shell.nav.integrationManagement", labelEn: "Integration Management", labelAr: "إدارة التكاملات", href: "/admin/integrations", icon: "workflow", roles: ["security_admin", "workflow_admin"], businessTab: "Integration Management" }),
      advancedAdmin({ id: "workflows", labelKey: "shell.nav.workflows", labelEn: "Workflow Configuration", labelAr: "تهيئة سير العمل", href: "/admin/workflows", icon: "workflow", roles: ["workflow_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "gis", labelKey: "shell.nav.gis", labelEn: "GIS Configuration", labelAr: "تهيئة نظم المعلومات الجغرافية", href: "/admin/gis", icon: "map", roles: ["gis_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "audit", labelKey: "shell.nav.audit", labelEn: "Audit Trail", labelAr: "سجل التدقيق", href: "/admin/audit", icon: "access", roles: adminRoles, businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "platform-operations", labelKey: "shell.nav.platformOperations", labelEn: "Platform Operations", labelAr: "عمليات المنصة", href: "/admin/operations", icon: "radar", roles: ["security_admin", "workflow_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "security-access", labelKey: "shell.nav.securityAccess", labelEn: "Security & Access Review", labelAr: "مراجعة الأمن والوصول", href: "/admin/security-access", icon: "access", roles: ["security_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "devices", labelKey: "shell.nav.devices", labelEn: "Trusted Devices", labelAr: "الأجهزة الموثوقة", href: "/admin/devices", icon: "inspect", roles: ["security_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
      advancedAdmin({ id: "enforcement-cases", labelKey: "shell.nav.enforcementCases", labelEn: "Enforcement Cases", labelAr: "قضايا الإنفاذ", href: "/enforcement", icon: "enforcement", roles: ["compliance_admin"], businessTab: "Advanced Administration", parentId: "advanced-administration", parentLabelKey: "shell.nav.advancedAdministration", parentLabelEn: "Advanced Administration", parentLabelAr: "الإدارة المتقدمة" }),
    ],
  },
] as const;

export function isAdminPersona(roleKeys: readonly string[]) {
  return roleKeys.some(role => adminRoles.includes(role));
}

export function buildShellNavigation(roleKeys: readonly string[]): BuiltShellNavGroup[] {
  const roles = new Set(roleKeys);
  return SHELL_NAVIGATION.map(group => ({
    ...group,
    items: group.items.flatMap(item => {
      const allowed = item.roles.some(role => roles.has(role));
      if (item.visibility === "admin-advanced" && !allowed) return [];
      return [{
        ...item,
        enabled: item.visibility === "business" || allowed,
        ...(item.visibility === "admin-primary" && !allowed ? {
          disabledReasonKey: "shell.adminRequired",
          disabledReasonEn: "Administrator access required.",
          disabledReasonAr: "يتطلب الوصول صلاحية المسؤول.",
        } : {}),
      }];
    }),
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
