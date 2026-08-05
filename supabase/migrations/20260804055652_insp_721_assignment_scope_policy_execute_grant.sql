-- INSP-721 second forward repair: PostgreSQL evaluates function ACLs while
-- applying RLS policies. Permit only the authenticated role to execute the
-- tightly guarded private helper used by assignments_read.

revoke all on function private.assignment_read_in_governed_scope(uuid)
  from public, anon, service_role;
grant execute on function private.assignment_read_in_governed_scope(uuid)
  to authenticated;
