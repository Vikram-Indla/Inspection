// TASK-WEB-SHELL-001 · RBAC-001..014
// Shared shell visibility is a server-rendered convenience layer over the
// canonical database/RLS authorization. It must never be treated as the
// enforcement boundary; every destination keeps its own RLS/state guards.

export const ADMIN_ROLE_KEYS = [
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "security_admin",
  "gis_admin",
  "risk_owner",
] as const;

// Business (non-admin) personas. The shared Command destinations — Dashboard,
// Operations Center and Factory 360 — are visible to every non-admin persona
// (business direction 2026-07-16). Admin-only personas do not see them.
// Menu visibility is not authorization: each destination keeps its own route
// guard and RLS/data scoping (RBAC-001..014).
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
  | "forms" | "enforcement" | "workflow" | "risk" | "map" | "access";

export type ShellNavItemDefinition = {
  id: string;
  labelKey: string;
  labelEn: string;
  labelAr: string;
  href: string;
  icon: ShellIcon;
  roles: readonly string[];
  businessTab: string;
};

export type ShellNavGroupDefinition = {
  id: string;
  labelKey: string;
  labelEn: string;
  labelAr: string;
  items: readonly ShellNavItemDefinition[];
};

const adminRoles = ADMIN_ROLE_KEYS as readonly string[];
const businessRoles = BUSINESS_ROLE_KEYS as readonly string[];

export const SHELL_NAVIGATION: readonly ShellNavGroupDefinition[] = [
  {
    id: "command",
    labelKey: "shell.group.command",
    labelEn: "Command",
    labelAr: "القيادة",
    items: [
      { id: "dashboard", labelKey: "shell.nav.dashboard", labelEn: "Dashboard", labelAr: "لوحة القيادة", href: "/dashboard", icon: "dashboard", roles: businessRoles, businessTab: "Dashboard" },
      { id: "operations-live", labelKey: "shell.nav.operationsLive", labelEn: "Operations Center", labelAr: "مركز العمليات", href: "/operations", icon: "radar", roles: businessRoles, businessTab: "Operations Center" },
      { id: "factory-360", labelKey: "nav.factory360", labelEn: "Factory 360", labelAr: "المصنع 360", href: "/factories", icon: "factory", roles: ["planner", "inspector", "reviewer", "ops", "leadership"], businessTab: "Factory 360" },
    ],
  },
  {
    id: "inspection",
    labelKey: "shell.group.inspection",
    labelEn: "Inspection",
    labelAr: "التفتيش",
    items: [
      { id: "planning", labelKey: "nav.planning", labelEn: "Planning", labelAr: "التخطيط", href: "/planning", icon: "calendar", roles: ["planner"], businessTab: "Planning" },
      { id: "visits", labelKey: "nav.visits", labelEn: "Visit Management", labelAr: "إدارة الزيارات", href: "/visits", icon: "visits", roles: ["planner", "ops"], businessTab: "Inspection / Visit Management" },
      { id: "field", labelKey: "shell.nav.execution", labelEn: "Inspection Execution", labelAr: "تنفيذ التفتيش", href: "/field", icon: "inspect", roles: ["inspector"], businessTab: "Inspection Execution" },
      { id: "virtual", labelKey: "nav.virtual", labelEn: "Virtual Inspections", labelAr: "التفتيش الافتراضي", href: "/virtual", icon: "virtual", roles: ["inspector"], businessTab: "Inspection Execution" },
      { id: "reviews", labelKey: "nav.reviews", labelEn: "Review & Approval", labelAr: "المراجعة والاعتماد", href: "/reviews", icon: "review", roles: ["reviewer"], businessTab: "Review & Approval" },
    ],
  },
  {
    id: "control",
    labelKey: "shell.group.control",
    labelEn: "Control plane",
    labelAr: "منظومة التحكم",
    items: [
      { id: "admin-home", labelKey: "shell.nav.adminHome", labelEn: "Approval & Configuration", labelAr: "الاعتماد والتهيئة", href: "/admin", icon: "admin", roles: adminRoles, businessTab: "Approval Queue / Administration" },
      { id: "regulations", labelKey: "shell.nav.regulations", labelEn: "Compliance Library", labelAr: "مكتبة الامتثال", href: "/admin/regulations", icon: "library", roles: ["compliance_admin"], businessTab: "Compliance Library" },
      { id: "packages", labelKey: "shell.nav.packages", labelEn: "Packages & Surveys", labelAr: "الحزم والاستبيانات", href: "/admin/packages", icon: "forms", roles: ["form_admin", "compliance_admin"], businessTab: "Survey Configuration" },
      { id: "violations", labelKey: "shell.nav.enforcement", labelEn: "Enforcement Library", labelAr: "مكتبة الإنفاذ", href: "/admin/violations", icon: "enforcement", roles: ["compliance_admin"], businessTab: "Enforcement" },
      { id: "items", labelKey: "shell.nav.items", labelEn: "Inspection Items", labelAr: "بنود التفتيش", href: "/admin/items", icon: "forms", roles: ["compliance_admin", "form_admin"], businessTab: "Inspection Item Catalogue" },
      { id: "workflows", labelKey: "shell.nav.workflows", labelEn: "Workflow Configuration", labelAr: "تهيئة سير العمل", href: "/admin/workflows", icon: "workflow", roles: ["workflow_admin"], businessTab: "Administration" },
      { id: "risk", labelKey: "shell.nav.risk", labelEn: "Risk Configuration", labelAr: "تهيئة المخاطر", href: "/admin/risk", icon: "risk", roles: ["risk_owner"], businessTab: "Risk Configuration" },
      { id: "gis", labelKey: "shell.nav.gis", labelEn: "GIS Configuration", labelAr: "تهيئة نظم المعلومات الجغرافية", href: "/admin/gis", icon: "map", roles: ["gis_admin"], businessTab: "Administration" },
      { id: "access", labelKey: "shell.nav.access", labelEn: "Users & Roles", labelAr: "المستخدمون والأدوار", href: "/admin/access", icon: "access", roles: ["security_admin"], businessTab: "Users & Roles" },
      { id: "localization", labelKey: "shell.nav.localization", labelEn: "Localization", labelAr: "الترجمة", href: "/admin/localization", icon: "library", roles: ["compliance_admin", "security_admin", "workflow_admin"], businessTab: "Localization" },
      { id: "audit", labelKey: "shell.nav.audit", labelEn: "Audit Trail", labelAr: "سجل التدقيق", href: "/admin/audit", icon: "access", roles: adminRoles, businessTab: "Audit" },
    ],
  },
] as const;

export function buildShellNavigation(roleKeys: readonly string[]) {
  const roles = new Set(roleKeys);
  return SHELL_NAVIGATION
    .map(group => ({ ...group, items: group.items.filter(item => item.roles.some(role => roles.has(role))) }))
    .filter(group => group.items.length > 0);
}

export function isShellRouteCurrent(current: string, href: string) {
  if (href === "/dashboard") return current === href;
  if (href === "/operations") return current === href || current.startsWith(`${href}/`);
  if (href === "/admin") return current === href;
  return current === href || current.startsWith(`${href}/`);
}
