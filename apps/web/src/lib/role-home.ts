// Role-based home routing — each persona lands on their own channel,
// not on a screen scoped to someone else's job (RBAC-001..014). The admin
// family has no single "admin" role_key — RBAC-001..006 each grant one of
// six granular role_keys, all landing on the same /admin console. Matched
// last: an operational role always wins over a concurrent admin grant,
// matching prior behavior for multi-role accounts.
// Shared by /launch (server fallback) and the login client (K-005: the
// post-submit navigation resolves the home directly and skips the /launch
// server round trip).
export const ROLE_HOME: [string, string][] = [
  ["inspector", "/field"],
  ["reviewer", "/dashboard"],
  ["planner", "/dashboard"],
  ["ops", "/dashboard"],
  ["leadership", "/dashboard"],
  ["compliance_admin", "/dashboard"],
  ["form_admin", "/dashboard"],
  ["workflow_admin", "/dashboard"],
  ["security_admin", "/dashboard"],
  ["gis_admin", "/dashboard"],
  ["risk_owner", "/dashboard"],
];

export function homeForRoles(roleKeys: Iterable<string>): string | null {
  const keys = new Set(roleKeys);
  for (const [role, home] of ROLE_HOME) if (keys.has(role)) return home;
  return null;
}
