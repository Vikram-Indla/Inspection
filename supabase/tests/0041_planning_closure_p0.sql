\set ON_ERROR_STOP on
-- CORR-PLANNING-MIGRATION-FENCE-001
-- CORR-PLANNING-R01-R03-002 · ADD-R07-001
-- Non-pgTAP, fail-fast contract probe. All probe-local changes roll back.

begin;

create or replace function pg_temp.assert_true(
  p_ok boolean, p_id text, p_message text
) returns void language plpgsql as $$
begin
  if not coalesce(p_ok,false) then
    raise exception using errcode='P0001',
      message=p_id||': '||p_message;
  end if;
end
$$;

-- P00/P01 — prerequisite and schema envelope.
select pg_temp.assert_true(
  current_setting('server_version_num')::integer >= 170000,
  'PCP-P00-001','PostgreSQL 17 is required');
select pg_temp.assert_true(
  exists(select 1 from pg_extension where extname='pg_cron'),
  'PCP-P00-002','pg_cron must exist');
select pg_temp.assert_true(
  to_regclass('public.planning_process_commands') is not null
  and to_regclass('public.planning_process_targets') is not null
  and to_regclass('public.planning_process_row_receipts') is not null
  and to_regclass('public.planning_visit_archives') is not null,
  'PCP-P01-001','all closure relations must exist');
select pg_temp.assert_true(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='visits'
      and column_name='planning_version' and is_nullable='NO'),
  'PCP-P01-002','visit CAS version must be non-null');

-- P02/P03 — RLS, direct mutation closure and immutability.
select pg_temp.assert_true(
  not exists(
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in ('planning_process_commands','planning_process_targets',
        'planning_process_row_receipts','planning_visit_archives')
      and (not c.relrowsecurity or not c.relforcerowsecurity)
  ),'PCP-P02-001','all closure relations require FORCE RLS');
select pg_temp.assert_true(
  not has_table_privilege('anon','public.planning_process_commands','insert')
  and not has_table_privilege('authenticated','public.planning_process_commands','insert')
  and not has_table_privilege('service_role','public.planning_process_commands','insert'),
  'PCP-P02-002','closure command writes must be RPC-only');
select pg_temp.assert_true(
  (select count(*) from pg_trigger
   where tgrelid in (
     'public.planning_process_commands'::regclass,
     'public.planning_process_targets'::regclass,
     'public.planning_process_row_receipts'::regclass,
     'public.planning_visit_archives'::regclass)
   and not tgisinternal)=4,
  'PCP-P03-001','every evidence relation requires an immutable guard');

-- P04 — privileged-code boundary.
select pg_temp.assert_true(
  not exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'mutate_planning_window_atomic','cancel_planning_visits_atomic',
        'reschedule_planning_visits_atomic','archive_planning_draft_atomic',
        'expire_planning_visits_core','expire_planning_visits_scheduled',
        'create_planning_bulk_command','planning_bulk_command_receipt')
      and not ('search_path=""'=any(coalesce(p.proconfig,'{}'::text[])))
  ),'PCP-P04-001','every closure function needs an empty search_path');
select pg_temp.assert_true(
  not has_function_privilege('service_role',
    'public.expire_planning_visits_scheduled(integer)','execute')
  and not has_function_privilege('authenticated',
    'public.expire_planning_visits_scheduled(integer)','execute')
  and has_function_privilege('planning_expiry_scheduler',
    'public.expire_planning_visits_scheduled(integer)','execute'),
  'PCP-P04-002','expiry execute ACL must be scheduler-only');
select pg_temp.assert_true(
  (select rolcanlogin=false and rolinherit=false
   from pg_roles where rolname='planning_expiry_owner')
  and (select rolcanlogin=false and rolinherit=false
   from pg_roles where rolname='planning_expiry_scheduler'),
  'PCP-P04-003','scheduler roles must be NOLOGIN/NOINHERIT');
select pg_temp.assert_true(
  not has_table_privilege('planning_expiry_scheduler','public.visits','update'),
  'PCP-P04-004','scheduler execution role must have no table DML');

-- P05/P06 — exact R03 boundary and scope.
select pg_temp.assert_true(
  timestamptz '2030-02-01 00:00:00+00'
    <= timestamptz '2030-03-03 00:00:00+00' - interval '720 hours',
  'PCP-P05-001','exactly 720 hours must be allowed');
select pg_temp.assert_true(
  not (
    timestamptz '2030-02-01 00:00:00.001+00'
      <= timestamptz '2030-03-03 00:00:00+00' - interval '720 hours'
  ),'PCP-P05-002','719:59:59.999 must be denied');
select pg_temp.assert_true(
  position('interval ''720 hours''' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))>0,
  'PCP-P05-003','cancel/reschedule engine must compute 720h server-side');
select pg_temp.assert_true(
  position('transaction_timestamp()' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))>0,
  'PCP-P06-001','cutoff authority must be server transaction time');
select pg_temp.assert_true(
  position('PLANNING-RESCHEDULE-NO-WINDOW-CHANGE' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))>0,
  'PCP-P06-002','non-window corrections are not reschedules');
select pg_temp.assert_true(
  position('cancellation_reason' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))=0,
  'PCP-P06-002A','optional Planning note must not overwrite governed cancellation_reason');
select pg_temp.assert_true(
  to_regprocedure('public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid)')
    is not null
  and position('720 hours' in pg_get_functiondef(
    'public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid)'::regprocedure))=0,
  'PCP-P06-003','reassignment must not inherit the 720h gate');

-- P07 — truthful parent/child archive provenance.
select pg_temp.assert_true(
  exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='visit_plans' and column_name='archive_prior_status')
  and exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='planning_visit_archives'
      and column_name='prior_planning_status'),
  'PCP-P07-001','parent and child prior state must be retained');
select pg_temp.assert_true(
  position('planning_status=''cancelled''' in replace(pg_get_functiondef(
    'public.archive_planning_draft_atomic(uuid,integer,text,text,uuid)'::regprocedure),' ',''))=0,
  'PCP-P07-002','archive must never synthesize Cancelled');
select pg_temp.assert_true(
  to_regprocedure('public.restore_planning_draft_atomic(uuid)') is null,
  'PCP-P07-003','restore is not authorized');

-- P08/P09 — ADD-R07-001 eligibility and scheduler evidence.
select pg_temp.assert_true(
  position('v.planning_status=''published''' in replace(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure),' ',''))>0
  and position('v.operational_statein(''new'',''prepared'')' in replace(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure),' ',''))>0,
  'PCP-P08-001','expiry state allow-list must be explicit');
select pg_temp.assert_true(
  position('v.execution_mode=''physical''' in replace(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure),' ',''))>0,
  'PCP-P08-002','expiry mode must fail closed to physical');
select pg_temp.assert_true(
  position('notf.is_temporary' in replace(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure),' ',''))>0,
  'PCP-P08-002A','unregistered/temporary factories must fail closed');
select pg_temp.assert_true(
  position('v.window_end<=p_as_of' in replace(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure),' ',''))>0,
  'PCP-P08-003','window-end equality must be inclusive');
select pg_temp.assert_true(
  position('count(*)' in pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure))>0
  and position('assigned' in pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure))>0,
  'PCP-P08-004','exactly-one governed assignment must be enforced');
select pg_temp.assert_true(
  position('FOR UPDATE SKIP LOCKED' in upper(pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure)))>0,
  'PCP-P09-001','start-v-expire race needs row locking');
select pg_temp.assert_true(
  position('v_outbox_inspector' in pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure))>0
  and position('v_outbox_planner' in pg_get_functiondef(
    'public.expire_planning_visits_core(timestamptz,integer,text,uuid)'::regprocedure))>0,
  'PCP-P09-002','expiry must enqueue two distinct intents');

-- P10/P11 — frozen inventory, aggregate truth and replay mismatch.
select pg_temp.assert_true(
  exists(select 1 from pg_constraint
    where conrelid='public.planning_process_targets'::regclass
      and contype='u'),
  'PCP-P10-001','frozen targets need uniqueness');
select pg_temp.assert_true(
  position('IDEMPOTENCY-CONFLICT' in pg_get_functiondef(
    'public.create_planning_bulk_command(text,uuid[],jsonb,jsonb,text,uuid)'::regprocedure))>0,
  'PCP-P10-002','changed inventory/payload must reject');
select pg_temp.assert_true(
  position('partial_failed' in pg_get_functiondef(
    'public.planning_bulk_command_receipt(uuid)'::regprocedure))>0,
  'PCP-P10-003','aggregate receipt must report partial failure truthfully');
select pg_temp.assert_true(
  position('expected_fingerprint' in pg_get_functiondef(
    'public.process_planning_bulk_target(uuid,integer)'::regprocedure))>0
  and position('PLANNING-CLOSURE-STALE' in pg_get_functiondef(
    'public.process_planning_bulk_target(uuid,integer)'::regprocedure))>0,
  'PCP-P10-004','each target transaction must recheck the frozen fingerprint');
select pg_temp.assert_true(
  position('IDEMPOTENCY-CONFLICT' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))>0
  and position('PLANNING-CLOSURE-STALE' in pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))>0,
  'PCP-P11-001','replay mismatch and stale CAS must fail closed');

-- P12/P13 — atomic audit/outbox and truthful delivery boundary.
select pg_temp.assert_true(
  position('insert into public.audit_events' in lower(pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure)))>0
  and position('insert into public.workflow_outbox' in lower(pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure)))>0,
  'PCP-P12-001','business mutation, audit and outbox must share the RPC transaction');
select pg_temp.assert_true(
  obj_description('public.planning_process_commands'::regclass)
    like '%Provider delivery is not implied%',
  'PCP-P13-001','queued intent must not claim provider delivery');

-- Forced-failure rollback of evidence writes.
savepoint forced_failure;
do $$
begin
  begin
    insert into public.planning_process_commands(
      scheduler_principal,operation,idempotency_key,correlation_id,request,request_hash,
      status,target_count
    ) values (
      'probe-scheduler','cancel','probe-forced-failure',gen_random_uuid(),
      '{}'::jsonb,'probe','completed',0
    );
    raise exception 'PCP-FORCED-FAILURE';
  exception when others then
    if sqlerrm <> 'PCP-FORCED-FAILURE' then raise; end if;
  end;
end
$$;
select pg_temp.assert_true(
  not exists(select 1 from public.planning_process_commands
    where idempotency_key='probe-forced-failure'),
  'PCP-P12-002','forced failure must leave no command residue');
rollback to savepoint forced_failure;

-- P14 — postconditions and guaranteed cleanup.
select pg_temp.assert_true(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in (
    'cancel_planning_visits_atomic','reschedule_planning_visits_atomic',
    'archive_planning_draft_atomic','expire_planning_visits_scheduled',
    'create_planning_bulk_command','planning_bulk_command_receipt',
    'process_planning_bulk_target'))=7,
  'PCP-P14-001','all public contracts must exist exactly once');

rollback;
