\set ON_ERROR_STOP on
-- PLN-007 supporting Bulk Planning route read path.

begin;

create temporary table planning_bulk_history_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.violations) as violations,
  (select count(*) from public.reviews) as reviews,
  (select count(*) from public.audit_events) as audit_events;

\ir ../migrations/20260729042000_planning_bulk_history_access_grants.sql

do $$
declare
  v_before planning_bulk_history_before%rowtype;
begin
  select * into v_before from planning_bulk_history_before;

  if not has_table_privilege('authenticated', 'public.violations', 'SELECT') then
    raise exception 'PLANNING-BULK-HISTORY: authenticated SELECT grant is missing';
  end if;

  if has_table_privilege('authenticated', 'public.violations', 'INSERT')
     or has_table_privilege('authenticated', 'public.violations', 'UPDATE')
     or has_table_privilege('authenticated', 'public.violations', 'DELETE')
     or has_table_privilege('authenticated', 'public.violations', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.violations', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.violations', 'TRIGGER') then
    raise exception 'PLANNING-BULK-HISTORY: authenticated access must remain read-only';
  end if;

  if has_table_privilege('anon', 'public.violations', 'SELECT')
     or has_table_privilege('anon', 'public.violations', 'INSERT')
     or has_table_privilege('anon', 'public.violations', 'UPDATE')
     or has_table_privilege('anon', 'public.violations', 'DELETE')
     or has_table_privilege('anon', 'public.violations', 'TRUNCATE')
     or has_table_privilege('anon', 'public.violations', 'REFERENCES')
     or has_table_privilege('anon', 'public.violations', 'TRIGGER') then
    raise exception 'PLANNING-BULK-HISTORY: anonymous access must remain denied';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.violations'::regclass
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'violations'
      and policyname = 'violations_read'
      and cmd = 'SELECT'
  ) then
    raise exception 'PLANNING-BULK-HISTORY: authenticated read RLS must remain active';
  end if;

  if not has_table_privilege('authenticated', 'public.reviews', 'SELECT') then
    raise exception 'PLANNING-BULK-HISTORY: authenticated reviews SELECT grant is missing';
  end if;

  if has_table_privilege('authenticated', 'public.reviews', 'INSERT')
     or has_table_privilege('authenticated', 'public.reviews', 'UPDATE')
     or has_table_privilege('authenticated', 'public.reviews', 'DELETE')
     or has_table_privilege('authenticated', 'public.reviews', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.reviews', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.reviews', 'TRIGGER') then
    raise exception 'PLANNING-BULK-HISTORY: authenticated reviews access must remain RLS-scoped read-only';
  end if;

  if has_table_privilege('anon', 'public.reviews', 'SELECT')
     or has_table_privilege('anon', 'public.reviews', 'INSERT')
     or has_table_privilege('anon', 'public.reviews', 'UPDATE')
     or has_table_privilege('anon', 'public.reviews', 'DELETE')
     or has_table_privilege('anon', 'public.reviews', 'TRUNCATE')
     or has_table_privilege('anon', 'public.reviews', 'REFERENCES')
     or has_table_privilege('anon', 'public.reviews', 'TRIGGER') then
    raise exception 'PLANNING-BULK-HISTORY: anonymous reviews access must remain denied';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.reviews'::regclass
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_read'
      and cmd = 'SELECT'
  ) then
    raise exception 'PLANNING-BULK-HISTORY: reviews read RLS must remain active';
  end if;

  if (select count(*) from auth.users) <> v_before.auth_users
     or (select count(*) from public.profiles) <> v_before.profiles
     or (select count(*) from public.user_roles) <> v_before.user_roles
     or (select count(*) from public.violations) <> v_before.violations
     or (select count(*) from public.reviews) <> v_before.reviews
     or (select count(*) from public.audit_events) <> v_before.audit_events then
    raise exception 'PLANNING-BULK-HISTORY: protected data or audit history changed';
  end if;
end
$$;

\ir ../migrations/20260729042000_planning_bulk_history_access_grants.sql

rollback;
