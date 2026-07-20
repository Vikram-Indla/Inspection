-- TASK-WEB-COMPLIANCE-REQUEST-ENGINE-002
-- Read-only deployment probe. Run after migrations; raises on any missing
-- governed contract without altering runtime data.
do $$
declare
  v_missing text[];
  v_rls_missing text[];
begin
  select array_agg(name order by name) into v_missing
  from unnest(array[
    'compliance_configuration_requests','compliance_request_revisions','compliance_request_components',
    'compliance_request_component_dependencies','compliance_request_decisions','compliance_entity_versions',
    'compliance_entity_heads','compliance_request_publications'
  ]) name
  where to_regclass('public.' || name) is null;
  if v_missing is not null then raise exception 'CCR tables missing: %', v_missing; end if;

  select array_agg(c.relname order by c.relname) into v_rls_missing
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname=any(array[
    'compliance_configuration_requests','compliance_request_revisions','compliance_request_components',
    'compliance_request_component_dependencies','compliance_request_decisions','compliance_entity_versions',
    'compliance_entity_heads','compliance_request_publications'
  ]) and not c.relrowsecurity;
  if v_rls_missing is not null then raise exception 'CCR RLS missing: %', v_rls_missing; end if;

  if to_regprocedure('public.create_compliance_request(text,text,text,text)') is null
     or to_regprocedure('public.submit_compliance_request(uuid)') is null
     or to_regprocedure('public.decide_compliance_request_component(uuid,text,text)') is null
     or to_regprocedure('public.publish_compliance_request(uuid)') is null
  then raise exception 'CCR RPC contract incomplete'; end if;

  if not exists(select 1 from pg_trigger where tgname='trg_ccr_versions_immutable' and tgenabled<>'D')
     or not exists(select 1 from pg_trigger where tgname='trg_ccr_decisions_immutable' and tgenabled<>'D')
  then raise exception 'CCR immutable guards missing'; end if;

  if has_table_privilege('authenticated','public.compliance_configuration_requests','INSERT')
     or has_table_privilege('authenticated','public.compliance_request_components','UPDATE')
     or has_table_privilege('authenticated','public.compliance_entity_versions','DELETE')
  then raise exception 'CCR direct authenticated DML must remain revoked'; end if;
end $$;
