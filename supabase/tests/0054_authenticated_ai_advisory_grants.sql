\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729110000_authenticated_ai_advisory_grants.sql

do $$
begin
  if not has_table_privilege('authenticated','public.ai_suggestions','select')
     or not has_table_privilege('authenticated','public.ai_suggestions','insert')
     or not has_table_privilege('authenticated','public.ai_suggestions','update')
     or has_table_privilege('authenticated','public.ai_suggestions','delete') then
    raise exception 'RAL-P29: suggestion privileges do not match advisory workflow';
  end if;
  if not has_table_privilege('authenticated','public.ai_events','select')
     or not has_table_privilege('authenticated','public.ai_events','insert')
     or has_table_privilege('authenticated','public.ai_events','update')
     or has_table_privilege('authenticated','public.ai_events','delete') then
    raise exception 'RAL-P29: AI event log must remain append-only';
  end if;
  if not has_table_privilege('authenticated','public.inspector_briefing_cache','select')
     or not has_table_privilege('authenticated','public.inspector_briefing_cache','insert')
     or not has_table_privilege('authenticated','public.inspector_briefing_cache','update')
     or has_table_privilege('authenticated','public.inspector_briefing_cache','delete') then
    raise exception 'RAL-P29: inspector briefing cache privileges are incomplete';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='inspector_briefing_cache'
      and policyname='inspector_briefing_cache_insert'
  ) or not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ai_suggestions'
      and policyname='ai_suggestions_write'
  ) then
    raise exception 'RAL-P29: authenticated grants must remain RLS-bounded';
  end if;
end
$$;

\ir ../migrations/20260729110000_authenticated_ai_advisory_grants.sql

rollback;
