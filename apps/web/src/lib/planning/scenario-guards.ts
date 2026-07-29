// The approved role model has one supervision authority. Do not accept legacy
// aliases here: accepting `ops` or `leadership` would silently grant publish,
// return, and reassignment rights outside the four canonical roles.
const SUPERVISOR_ROLES = new Set(["supervisor"]);

export function requiresMixedAcknowledgement(selectedCount: number, excludedCount: number): boolean {
  return selectedCount > 0 && excludedCount > 0;
}

export function hasPlanningSupervisorRole(roleKeys: Iterable<string>): boolean {
  for (const role of roleKeys) {
    if (SUPERVISOR_ROLES.has(role)) return true;
  }
  return false;
}
