// Role-based home routing for the four canonical roles. Legacy entries remain
// only while historical sessions finish their compatibility transition.
// Matched first: an operational role always wins over a concurrent admin grant.
// Shared by /launch (server fallback) and the login client (K-005: the
// post-submit navigation resolves the home directly and skips the /launch
// server round trip).
export const ROLE_HOME: [string, string][] = [
  ["supervisor", "/dashboard"],
  ["inspector", "/dashboard"],
  ["planner", "/dashboard"],
  ["admin", "/dashboard"],
  // Legacy compatibility aliases (non-assignable after migration).
  ["ops", "/dashboard"],
  ["leadership", "/dashboard"],
  ["reviewer", "/dashboard"],
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
