// Role-based home routing — each persona lands on their own channel,
// not on a screen scoped to someone else's job (RBAC-001..014). The admin
// family has no single "admin" role_key — RBAC-001..006 each grant one of
// six granular role_keys, all landing on the same /admin console. Matched
// first: an operational role always wins over a concurrent admin grant.
// Shared by /launch (server fallback) and the login client (K-005: the
// post-submit navigation resolves the home directly and skips the /launch
// server round trip).
export const ROLE_HOME: [string, string][] = [
  ["ops", "/dashboard"],
  ["leadership", "/dashboard"],
  ["inspector", "/field"],
  ["reviewer", "/reviews"],
  ["planner", "/planning"],
  ["compliance_admin", "/admin"],
  ["form_admin", "/admin"],
  ["workflow_admin", "/admin"],
  ["security_admin", "/admin"],
  ["gis_admin", "/admin"],
  ["risk_owner", "/admin"],
];

export function homeForRoles(roleKeys: Iterable<string>): string | null {
  const keys = new Set(roleKeys);
  for (const [role, home] of ROLE_HOME) if (keys.has(role)) return home;
  return null;
}
