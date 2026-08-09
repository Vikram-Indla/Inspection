const QUEUE_ROLES = ["supervisor", "admin", "planner", "inspector"];

export function hasQueueAccess(roleRows: { role_key: string }[] | null): boolean {
  const roles = new Set((roleRows ?? []).map(row => row.role_key));
  return QUEUE_ROLES.some(role => roles.has(role));
}
