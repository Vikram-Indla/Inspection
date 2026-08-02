export type DashboardPersona = "admin" | "planner" | "supervisor" | "inspector";

export function dashboardPersonaFor(roleKeys: Iterable<string>): DashboardPersona | null {
  const roles = new Set(roleKeys);
  if (["supervisor", "ops", "leadership", "reviewer"].some(role => roles.has(role))) return "supervisor";
  if (roles.has("inspector")) return "inspector";
  if (roles.has("planner")) return "planner";
  if (["admin", "compliance_admin", "form_admin", "workflow_admin", "security_admin", "gis_admin", "risk_owner"].some(role => roles.has(role))) return "admin";
  return null;
}

export const ROLE_DASHBOARD_METRICS: Record<DashboardPersona, readonly string[]> = {
  admin: ["STR-KPI-009", "OPS-KPI-004", "STR-KPI-003", "OPS-KPI-008"],
  planner: ["OPS-KPI-001", "OPS-KPI-002", "OPS-KPI-006", "STR-KPI-006"],
  supervisor: ["OPS-KPI-003", "OPS-KPI-007", "OPS-KPI-004", "OPS-KPI-008"],
  inspector: ["IPAD-KPI-001", "IPAD-KPI-002", "IPAD-KPI-003", "IPAD-KPI-004"],
};
