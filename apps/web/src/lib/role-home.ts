// Role-based home routing for the four canonical roles.
// Matched first: an operational role always wins over a concurrent admin grant.
// Shared by /launch (server fallback) and the login client (K-005: the
// post-submit navigation resolves the home directly and skips the /launch
// server round trip).
export const ROLE_HOME: [string, string][] = [
  ["supervisor", "/dashboard"],
  ["inspector", "/field"],
  ["planner", "/planning"],
  ["admin", "/admin"],
];

export function homeForRoles(roleKeys: Iterable<string>): string | null {
  const keys = new Set(roleKeys);
  for (const [role, home] of ROLE_HOME) if (keys.has(role)) return home;
  return null;
}
