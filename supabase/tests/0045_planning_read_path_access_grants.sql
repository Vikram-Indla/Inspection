\set ON_ERROR_STOP on
-- PLN-005 / PLN-006 supporting Planning read path.
-- Privilege-only convergence probe; no application row is mutated.

begin;

create temporary table visit_packages_access_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.visit_packages) as visit_packages,
  (select count(*) from public.inspections) as inspections,
  (select count(*) from public.audit_events) as audit_events;

\ir ../migrations/20260729041000_planning_read_path_access_grants.sql

do $$
declare
  v_before visit_packages_access_before%rowtype;
begin
  select * into v_before from visit_packages_access_before;

  if not has_table_privilege('authenticated', 'public.visit_packages', 'SELECT')
     or not has_table_privilege('authenticated', 'public.visit_packages', 'INSERT')
     or not has_table_privilege('authenticated', 'public.visit_packages', 'UPDATE') then
    raise exception 'PLANNING-VISIT-PACKAGES: authenticated access grant is incomplete';
  end if;

  if has_table_privilege('authenticated', 'public.visit_packages', 'DELETE')
     or has_table_privilege('authenticated', 'public.visit_packages', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.visit_packages', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.visit_packages', 'TRIGGER') then
    raise exception 'PLANNING-VISIT-PACKAGES: authenticated destructive or structural access must remain denied';
  end if;

  if has_table_privilege('anon', 'public.visit_packages', 'SELECT')
     or has_table_privilege('anon', 'public.visit_packages', 'INSERT')
     or has_table_privilege('anon', 'public.visit_packages', 'UPDATE')
     or has_table_privilege('anon', 'public.visit_packages', 'DELETE')
     or has_table_privilege('anon', 'public.visit_packages', 'TRUNCATE')
     or has_table_privilege('anon', 'public.visit_packages', 'REFERENCES')
     or has_table_privilege('anon', 'public.visit_packages', 'TRIGGER') then
    raise exception 'PLANNING-VISIT-PACKAGES: anonymous table access must remain denied';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.visit_packages'::regclass
  ) then
    raise exception 'PLANNING-VISIT-PACKAGES: RLS must remain enabled';
  end if;

  if not has_table_privilege('authenticated', 'public.inspections', 'SELECT') then
    raise exception 'PLANNING-INSPECTIONS: authenticated SELECT grant is missing';
  end if;

  if has_table_privilege('authenticated', 'public.inspections', 'INSERT')
     or has_table_privilege('authenticated', 'public.inspections', 'UPDATE')
     or has_table_privilege('authenticated', 'public.inspections', 'DELETE')
     or has_table_privilege('authenticated', 'public.inspections', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.inspections', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.inspections', 'TRIGGER') then
    raise exception 'PLANNING-INSPECTIONS: authenticated access must remain read-only';
  end if;

  if has_table_privilege('anon', 'public.inspections', 'SELECT')
     or has_table_privilege('anon', 'public.inspections', 'INSERT')
     or has_table_privilege('anon', 'public.inspections', 'UPDATE')
     or has_table_privilege('anon', 'public.inspections', 'DELETE')
     or has_table_privilege('anon', 'public.inspections', 'TRUNCATE')
     or has_table_privilege('anon', 'public.inspections', 'REFERENCES')
     or has_table_privilege('anon', 'public.inspections', 'TRIGGER') then
    raise exception 'PLANNING-INSPECTIONS: anonymous table access must remain denied';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.inspections'::regclass
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'inspections'
      and policyname = 'inspections_read'
      and cmd = 'SELECT'
  ) then
    raise exception 'PLANNING-INSPECTIONS: scoped read RLS must remain active';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_packages'
      and policyname in (
        'visit_packages_read',
        'visit_packages_write',
        'visit_packages_update'
      )
  ) <> 3 then
    raise exception 'PLANNING-VISIT-PACKAGES: expected scoped RLS policies are missing';
  end if;

  if (select count(*) from auth.users) <> v_before.auth_users
     or (select count(*) from public.profiles) <> v_before.profiles
     or (select count(*) from public.user_roles) <> v_before.user_roles
     or (select count(*) from public.visit_packages) <> v_before.visit_packages
     or (select count(*) from public.inspections) <> v_before.inspections
     or (select count(*) from public.audit_events) <> v_before.audit_events then
    raise exception 'PLANNING-VISIT-PACKAGES: protected data or audit history changed';
  end if;
end
$$;

-- Replay must be idempotent.
\ir ../migrations/20260729041000_planning_read_path_access_grants.sql

rollback;
