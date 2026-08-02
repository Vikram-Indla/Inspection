-- A Planner who is allowed to create a visit needs a minimal, non-sensitive
-- assignment roster.  The existing user_roles policy exposed only self,
-- Supervisor and Admin rows, which made the Single Visit picker render an
-- empty manual roster even while eligible Inspectors existed.
--
-- This is deliberately additive and narrow: it exposes only rows whose
-- canonical role is Inspector, only to canonical Planners.  It does not
-- change users, profiles, assignments, visits or any existing policy.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'user_roles_planner_inspector_roster_read'
  ) then
    create policy user_roles_planner_inspector_roster_read
      on public.user_roles
      for select
      using (
        role_key = 'inspector'
        and public.has_internal_role('planner')
      );
  end if;
end;
$$;
