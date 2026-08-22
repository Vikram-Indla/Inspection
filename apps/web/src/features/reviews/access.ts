export function hasQueueAccess(roleRows: { role_key: string }[] | null): boolean {
  return roleRows !== null;
}
