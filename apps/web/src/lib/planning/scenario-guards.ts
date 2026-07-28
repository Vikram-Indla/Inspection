// Legacy aliases remain so existing sessions stay safe until their canonical
// supervisor grant has been observed everywhere.
const SUPERVISOR_ROLES = new Set(["supervisor", "ops", "leadership"]);

export function requiresMixedAcknowledgement(selectedCount: number, excludedCount: number): boolean {
  return selectedCount > 0 && excludedCount > 0;
}

export function hasPlanningSupervisorRole(roleKeys: Iterable<string>): boolean {
  for (const role of roleKeys) {
    if (SUPERVISOR_ROLES.has(role)) return true;
  }
  return false;
}
