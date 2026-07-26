// PKT-RESPONSIVE-ADMIN-RBAC-008
//
// This is a presentation and compatibility map, not an authorization engine.
// Existing role keys continue to drive route guards, RPCs, RLS and audit
// attribution until a separately approved additive database migration proves
// equivalent least-privilege outcomes.

export const CANONICAL_ROLE_KEYS = ["planner", "inspector", "administrator"] as const;
export type CanonicalRoleKey = (typeof CANONICAL_ROLE_KEYS)[number];

export const ADMINISTRATOR_CAPABILITY_ROLES = [
  "admin",
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "security_admin",
  "gis_admin",
  "risk_owner",
  "reviewer",
  "ops",
  "auditor",
  "leadership",
] as const;

export type AdministratorCapabilityRole = (typeof ADMINISTRATOR_CAPABILITY_ROLES)[number];
export type InternalLegacyRole = "planner" | "inspector" | AdministratorCapabilityRole;

const LEGACY_TO_CANONICAL: Readonly<Record<InternalLegacyRole, CanonicalRoleKey>> = {
  planner: "planner",
  inspector: "inspector",
  admin: "administrator",
  compliance_admin: "administrator",
  form_admin: "administrator",
  workflow_admin: "administrator",
  security_admin: "administrator",
  gis_admin: "administrator",
  risk_owner: "administrator",
  reviewer: "administrator",
  ops: "administrator",
  auditor: "administrator",
  leadership: "administrator",
};

const CAPABILITY_PROFILE_LABELS: Readonly<Record<InternalLegacyRole, { en: string; ar: string }>> = {
  planner: { en: "Planning", ar: "التخطيط" },
  inspector: { en: "Field inspection", ar: "التفتيش الميداني" },
  admin: { en: "Platform administration", ar: "إدارة المنصة" },
  compliance_admin: { en: "Compliance administration", ar: "إدارة الامتثال" },
  form_admin: { en: "Inspection forms", ar: "نماذج التفتيش" },
  workflow_admin: { en: "Workflow administration", ar: "إدارة سير العمل" },
  security_admin: { en: "Security and access", ar: "الأمن والوصول" },
  gis_admin: { en: "Geospatial administration", ar: "الإدارة الجغرافية المكانية" },
  risk_owner: { en: "Risk governance", ar: "حوكمة المخاطر" },
  reviewer: { en: "Review decisions", ar: "قرارات المراجعة" },
  ops: { en: "Operations oversight", ar: "الإشراف على العمليات" },
  auditor: { en: "Read-only audit", ar: "التدقيق للقراءة فقط" },
  leadership: { en: "Leadership read-only", ar: "عرض القيادة للقراءة فقط" },
};

export const CANONICAL_ROLE_PRESENTATION: ReadonlyArray<{
  key: CanonicalRoleKey;
  label: { en: string; ar: string };
  description: { en: string; ar: string };
}> = [
  {
    key: "planner",
    label: { en: "Planner", ar: "المخطط" },
    description: {
      en: "Plans and coordinates inspection work within the assigned operational scope.",
      ar: "يخطط أعمال التفتيش وينسقها ضمن النطاق التشغيلي المسند إليه.",
    },
  },
  {
    key: "inspector",
    label: { en: "Inspector", ar: "المفتش" },
    description: {
      en: "Executes assigned field inspections under the preserved field-channel boundary.",
      ar: "ينفذ أعمال التفتيش الميداني المسندة إليه ضمن حدود قناة العمل الميداني المعتمدة.",
    },
  },
  {
    key: "administrator",
    label: { en: "Administrator", ar: "المسؤول" },
    description: {
      en: "Uses approved capability profiles; the title never grants blanket administration authority.",
      ar: "يستخدم ملفات صلاحيات معتمدة، ولا يمنح المسمى صلاحية إدارية شاملة.",
    },
  },
];

export function canonicalRoleForLegacy(roleKey: string): CanonicalRoleKey | null {
  if (roleKey === "factory_rep") return null;
  return LEGACY_TO_CANONICAL[roleKey as InternalLegacyRole] ?? null;
}

export function canonicalRolesForLegacy(roleKeys: readonly string[]): CanonicalRoleKey[] {
  const mapped = new Set<CanonicalRoleKey>();
  for (const roleKey of roleKeys) {
    const canonical = canonicalRoleForLegacy(roleKey);
    if (canonical) mapped.add(canonical);
  }
  return CANONICAL_ROLE_KEYS.filter(role => mapped.has(role));
}

export function canonicalRoleLabel(role: CanonicalRoleKey, locale: "en" | "ar"): string {
  return CANONICAL_ROLE_PRESENTATION.find(item => item.key === role)?.label[locale] ?? role;
}

export function capabilityProfileLabel(roleKey: string, locale: "en" | "ar"): string {
  const label = CAPABILITY_PROFILE_LABELS[roleKey as InternalLegacyRole];
  return label?.[locale] ?? roleKey;
}

export function rolePresentationLabel(roleKey: string, locale: "en" | "ar"): string {
  const canonical = canonicalRoleForLegacy(roleKey);
  if (!canonical) return capabilityProfileLabel(roleKey, locale);
  const role = canonicalRoleLabel(canonical, locale);
  const profile = capabilityProfileLabel(roleKey, locale);
  return canonical === "administrator" ? `${role} · ${profile}` : role;
}
