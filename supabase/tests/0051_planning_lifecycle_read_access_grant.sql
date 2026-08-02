\set ON_ERROR_STOP on
-- PLN-002 / PLN-REQ-017

begin;

\ir ../migrations/20260729045000_planning_lifecycle_read_access_grant.sql

do $$
begin
  if not has_table_privilege(
    'authenticated',
    'public.visit_lifecycle_events',
    'SELECT'
  ) then
    raise exception 'PLN-002: lifecycle SELECT is missing';
  end if;

  if has_table_privilege('anon','public.visit_lifecycle_events','SELECT')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','INSERT')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','UPDATE')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','DELETE')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','TRUNCATE')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','REFERENCES')
     or has_table_privilege('authenticated','public.visit_lifecycle_events','TRIGGER') then
    raise exception 'PLN-002: lifecycle access is wider than authenticated SELECT';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid='public.visit_lifecycle_events'::regclass
  ) or not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='visit_lifecycle_events'
      and policyname='visit_lifecycle_events_read'
      and cmd='SELECT'
  ) then
    raise exception 'PLN-002: lifecycle RLS read boundary is missing';
  end if;
end
$$;

\ir ../migrations/20260729045000_planning_lifecycle_read_access_grant.sql

rollback;
