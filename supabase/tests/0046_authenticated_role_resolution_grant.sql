\set ON_ERROR_STOP on
begin;

revoke select on table
  public.user_roles,
  public.profiles,
  public.packages,
  public.package_versions,
  public.engine_settings,
  public.planning_lookups,
  public.factories,
  public.visit_plans,
  public.visits,
  public.assignments
from authenticated;

\ir ../migrations/20260729050000_authenticated_role_resolution_grant.sql

do $$
begin
  if exists (
    select 1
    from unnest(array[
      'public.user_roles', 'public.profiles', 'public.packages',
      'public.package_versions', 'public.engine_settings',
      'public.planning_lookups', 'public.factories', 'public.visit_plans',
      'public.visits', 'public.assignments'
    ]) as required_table(name)
    where not has_table_privilege('authenticated', name, 'select')
  ) then
    raise exception 'RAL-P23: authenticated planning reads must have SELECT';
  end if;
  if has_table_privilege('authenticated', 'public.user_roles', 'insert')
     or has_table_privilege('authenticated', 'public.user_roles', 'update')
     or has_table_privilege('authenticated', 'public.user_roles', 'delete') then
    raise exception 'RAL-P23: role resolution grant must remain read-only';
  end if;
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'user_roles_read'
  ) then
    raise exception 'RAL-P23: existing row-visibility policy must remain installed';
  end if;
end
$$;

-- Replay must be harmless.
\ir ../migrations/20260729050000_authenticated_role_resolution_grant.sql

do $$
begin
  if not has_table_privilege('authenticated', 'public.user_roles', 'select')
     or not has_table_privilege('authenticated', 'public.package_versions', 'select')
     or not has_table_privilege('authenticated', 'public.assignments', 'select') then
    raise exception 'RAL-P23: replay must preserve planning SELECT grants';
  end if;
end
$$;

rollback;
