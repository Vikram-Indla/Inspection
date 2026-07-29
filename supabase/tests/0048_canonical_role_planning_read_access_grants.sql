\set ON_ERROR_STOP on
-- PLN-012 / REQ-002 / ACT-004

begin;

create temporary table canonical_role_read_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.audit_events) as audit_events;

\ir ../migrations/20260729043000_canonical_role_planning_read_access_grants.sql

do $$
declare
  v_before canonical_role_read_before%rowtype;
begin
  select * into v_before from canonical_role_read_before;

  if not has_table_privilege('authenticated', 'public.user_roles', 'SELECT') then
    raise exception 'PLN-012: authenticated user_roles SELECT is missing';
  end if;

  if has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
     or has_table_privilege('authenticated', 'public.user_roles', 'UPDATE')
     or has_table_privilege('authenticated', 'public.user_roles', 'DELETE')
     or has_table_privilege('authenticated', 'public.user_roles', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.user_roles', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.user_roles', 'TRIGGER') then
    raise exception 'PLN-012: authenticated user_roles access is wider than read-only';
  end if;

  if has_table_privilege('anon', 'public.user_roles', 'SELECT')
     or has_table_privilege('anon', 'public.user_roles', 'INSERT')
     or has_table_privilege('anon', 'public.user_roles', 'UPDATE')
     or has_table_privilege('anon', 'public.user_roles', 'DELETE')
     or has_table_privilege('anon', 'public.user_roles', 'TRUNCATE')
     or has_table_privilege('anon', 'public.user_roles', 'REFERENCES')
     or has_table_privilege('anon', 'public.user_roles', 'TRIGGER') then
    raise exception 'PLN-012: anonymous user_roles access must remain denied';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.user_roles'::regclass
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'user_roles_read'
      and cmd = 'SELECT'
  ) then
    raise exception 'PLN-012: user_roles read RLS must remain active';
  end if;

  if exists (
    select 1
    from unnest(array[
      'assignments',
      'factories',
      'package_versions',
      'packages',
      'planning_lookups',
      'profiles',
      'roles',
      'visit_plans',
      'visits'
    ]) table_name
    where not has_table_privilege(
      'authenticated',
      'public.' || table_name,
      'SELECT'
    )
  ) then
    raise exception 'PLN-012: a Planning read table is not available to authenticated RLS';
  end if;

  if exists (
    select 1
    from unnest(array[
      'assignments',
      'factories',
      'package_versions',
      'packages',
      'planning_lookups',
      'profiles',
      'roles',
      'visit_plans',
      'visits'
    ]) table_name
    where has_table_privilege('anon','public.' || table_name,'SELECT')
       or has_table_privilege('authenticated','public.' || table_name,'INSERT')
       or has_table_privilege('authenticated','public.' || table_name,'UPDATE')
       or has_table_privilege('authenticated','public.' || table_name,'DELETE')
       or has_table_privilege('authenticated','public.' || table_name,'TRUNCATE')
       or has_table_privilege('authenticated','public.' || table_name,'REFERENCES')
       or has_table_privilege('authenticated','public.' || table_name,'TRIGGER')
  ) then
    raise exception 'PLN-012: a Planning read table has wider base privileges';
  end if;

  if exists (
    select 1
    from unnest(array[
      'assignments',
      'factories',
      'package_versions',
      'packages',
      'planning_lookups',
      'profiles',
      'roles',
      'visit_plans',
      'visits'
    ]) table_name
    where not (
      select relrowsecurity
      from pg_class
      where oid = to_regclass('public.' || table_name)
    ) or not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and cmd = 'SELECT'
    )
  ) then
    raise exception 'PLN-012: Planning read RLS or policy is missing';
  end if;

  if (select count(*) from auth.users) <> v_before.auth_users
     or (select count(*) from public.profiles) <> v_before.profiles
     or (select count(*) from public.user_roles) <> v_before.user_roles
     or (select count(*) from public.audit_events) <> v_before.audit_events then
    raise exception 'PLN-012: role read convergence changed protected data';
  end if;
end
$$;

\ir ../migrations/20260729043000_canonical_role_planning_read_access_grants.sql

rollback;
