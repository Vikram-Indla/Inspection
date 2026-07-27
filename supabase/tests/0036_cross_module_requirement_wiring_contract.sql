-- Contract probe for 20260727021000. Isolated database only.
begin;

do $$
begin
  if to_regprocedure('public.authorize_factory_document_download(uuid,text,uuid)') is null then
    raise exception 'CR-425 download audit RPC missing';
  end if;
  if to_regprocedure('public.factory_timeline(uuid)') is null then
    raise exception 'CR-426 factory timeline missing';
  end if;
  if to_regprocedure('public.decide_review_with_handoff(uuid,text,text,text,jsonb,uuid)') is null then
    raise exception 'review decision/handoff RPC missing';
  end if;
  if to_regprocedure('public.review_timeline(uuid)') is null then
    raise exception 'review timeline missing';
  end if;
  if to_regprocedure('public.operations_visit_timeline(uuid)') is null then
    raise exception 'CR-444 operations timeline missing';
  end if;
  if to_regprocedure('public.operations_kpi_contract()') is null then
    raise exception 'CR-445 KPI contract missing';
  end if;
  if to_regprocedure('public.authorize_operations_export(text,jsonb,integer,uuid)') is null then
    raise exception 'CR-446 export audit RPC missing';
  end if;
  if has_function_privilege(
    'anon',
    'public.authorize_operations_export(text,jsonb,integer,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can authorize operations exports';
  end if;
  if has_function_privilege(
    'anon',
    'public.authorize_factory_document_download(uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can authorize document downloads';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'factory_risk_snapshots'
      and policyname = 'factory_risk_snapshots_read'
      and qual like '%view_risk_details%'
  ) then
    raise exception 'CR-424 risk policy is not capability-bound';
  end if;
  if position('view_factory_360' in pg_get_functiondef(
    'public.factory_timeline(uuid)'::regprocedure
  )) = 0 then
    raise exception 'CR-428 factory timeline is not capability-bound';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.review_comments'::regclass
      and tgname = 'trg_review_comments_immutable'
      and not tgisinternal
  ) then
    raise exception 'CR-408 immutable comment trigger missing';
  end if;
end $$;

select
  'CR-360/365/366/405/407/408, CR-424/425/426/428 and '
  || 'CR-444/445/446 backend contracts present; rollback follows'
  as assertion;

rollback;
