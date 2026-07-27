-- Contract probe for 20260727023541. Isolated database only.
begin;

do $$
begin
  if to_regprocedure(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
  ) is null then
    raise exception 'post-publication Planning mutation core missing';
  end if;
  if to_regprocedure(
    'public.reschedule_published_visits_atomic(uuid[],timestamp with time zone,timestamp with time zone,text,text,uuid)'
  ) is null
     or to_regprocedure(
       'public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid)'
     ) is null
     or to_regprocedure(
       'public.cancel_published_visits_atomic(uuid[],text,text,uuid)'
     ) is null
     or to_regprocedure(
       'public.edit_published_visits_atomic(uuid[],text,text,text,text,uuid)'
     ) is null
     or to_regprocedure(
       'public.edit_published_visits_atomic(uuid[],text,text,boolean,text,text,uuid)'
     ) is null then
    raise exception 'post-publication Planning wrapper surface missing';
  end if;
  if has_function_privilege(
    'anon',
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can call the Planning mutation core';
  end if;
  if has_function_privilege(
    'anon',
    'public.cancel_published_visits_atomic(uuid[],text,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can call a Planning mutation wrapper';
  end if;
  if to_regclass('public.planning_visit_mutation_receipts') is null then
    raise exception 'Planning mutation receipt table missing';
  end if;
  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.planning_visit_mutation_receipts'::regclass
  ) then
    raise exception 'Planning mutation receipts do not have RLS enabled';
  end if;
  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'planning_visit_mutation_receipts'
      and grantee in ('anon','authenticated')
  ) then
    raise exception 'Planning mutation receipts are directly exposed';
  end if;
  if pg_get_functiondef(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
      ::regprocedure
  ) not like '%order by v.id%for update%' then
    raise exception 'deterministic visit locking contract missing';
  end if;
  if pg_get_functiondef(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
      ::regprocedure
  ) not like '%l.is_active%' then
    raise exception 'visit-type validation does not use planning_lookups.is_active';
  end if;
  if pg_get_functiondef(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
      ::regprocedure
  ) not like '%planning-mutation:%pg_advisory_xact_lock%' then
    raise exception 'idempotency retry serialization is missing';
  end if;
  if pg_get_functiondef(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
      ::regprocedure
  ) like '%''request''%''correlation_id''%' then
    raise exception 'retry identity is incorrectly coupled to generated correlation';
  end if;
  if pg_get_functiondef(
    'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
      ::regprocedure
  ) not like '%PLANNING-REASSIGN-CONFLICT%'
     or pg_get_functiondef(
       'public.mutate_published_visits_atomic(uuid[],text,jsonb,text,text,uuid)'
         ::regprocedure
     ) not like '%cancellation_reason%l.is_active%' then
    raise exception 'reassignment conflict or cancellation governance guard missing';
  end if;
end $$;

select
  'CR-032/033/059/063/083..086 post-publication Planning contracts '
  || 'present; transaction rolled back' as assertion;

rollback;
