-- SAQEEL canonical four-role reset: prevent planners from reading every grant.
-- A planner may discover people through the governed profile surface when
-- proposing an assignment, but may not inspect system-wide role grants.

drop policy if exists user_roles_read on public.user_roles;
create policy user_roles_read on public.user_roles
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.has_internal_role('admin'))
  or (select public.has_internal_role('supervisor'))
);

-- The historic direct-insert policy depended on the retired security_admin
-- role. Governed admin_grant_role() remains the write route, but this policy
-- must agree with the canonical admin definition for any approved admin UI.
drop policy if exists user_roles_admin on public.user_roles;
create policy user_roles_admin on public.user_roles
for insert to authenticated
with check ((select public.has_internal_role('admin')));
