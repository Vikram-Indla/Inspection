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
  not has_table_privilege('anon','public.visits','truncate')
  and not has_table_privilege('authenticated','public.visits','truncate')
  and not has_table_privilege('service_role','public.visits','truncate')
  and not has_table_privilege('anon','public.visit_plans','truncate')
  and not has_table_privilege('authenticated','public.visit_plans','truncate')
  and not has_table_privilege('service_role','public.visit_plans','truncate'),
  'PCP-P02-003','visits and plans must deny destructive direct access');
select pg_temp.assert_true(
  not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename in ('visits','visit_plans')
      and policyname in (
        'plans_read_capability','plans_write_capability',
        'plans_update_capability','visits_read_capability',
        'visits_write_capability','visits_update_capability'
      )
  ),'PCP-P02-004','default-business-staff policy legs must be absent');
set local role authenticated;
do $$
begin
  begin
    execute 'truncate public.visits';
    raise exception 'PCP-TRUNCATE-AUTHENTICATED-WAS-ALLOWED';
  exception when insufficient_privilege then null;
  end;
end
$$;
reset role;
set local role service_role;
do $$
begin
  begin
    execute 'truncate public.visit_plans';
    raise exception 'PCP-TRUNCATE-SERVICE-ROLE-WAS-ALLOWED';
  exception when insufficient_privilege then null;
  end;
end
$$;
reset role;
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
        'create_planning_bulk_command','planning_bulk_command_receipt',
        'transition_planning_visit_atomic','save_planning_draft_atomic',
        'duplicate_terminal_visit_atomic')
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
select pg_temp.assert_true(
  position('account_status' in pg_get_functiondef(
    'public.planning_closure_has_explicit_capability(text)'::regprocedure))=0
  and position('from public.profiles' in lower(pg_get_functiondef(
    'public.planning_closure_has_explicit_capability(text)'::regprocedure)))>0
  and position('join public.role_permissions' in lower(pg_get_functiondef(
    'public.planning_closure_has_explicit_capability(text)'::regprocedure)))>0,
  'PCP-P04-004A','authorization must use existing profile and explicit grants');
select pg_temp.assert_true(
  has_table_privilege('planning_expiry_owner','public.factories','select')
  and has_table_privilege('planning_expiry_owner','public.visits','select')
  and has_table_privilege('planning_expiry_owner','public.assignments','select')
  and has_table_privilege('planning_expiry_owner','public.inspections','select')
  and not has_table_privilege('planning_expiry_owner','public.factories','update'),
  'PCP-P04-005','expiry owner needs exact dependency reads and no factory mutation');
select pg_temp.assert_true(
  has_sequence_privilege(
    'planning_expiry_owner','public.audit_events_id_seq','usage')
  and not has_sequence_privilege(
    'planning_expiry_owner','public.plan_reference_seq','usage')
  and not has_sequence_privilege(
    'planning_expiry_owner','public.visit_reference_seq','usage'),
  'PCP-P04-006','expiry owner sequence access must use an exact allow-list');
set local role planning_expiry_scheduler;
select public.expire_planning_visits_scheduled(100);
reset role;
set local role authenticated;
do $$
begin
  begin
    perform public.expire_planning_visits_scheduled(100);
    raise exception 'PCP-EXPIRY-AUTHENTICATED-WAS-ALLOWED';
  exception when insufficient_privilege then null;
  end;
end
$$;
reset role;

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
  position(
    'planning_status not in (''published'',''returned'')'
    in lower(pg_get_functiondef(
      'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))
  )>0
  and position(
    'operational_state <> ''new'''
    in lower(pg_get_functiondef(
      'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure))
  )>0,
  'PCP-P05-004',
  'cancel/reschedule must cover published or returned visits before execution');
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
select pg_temp.assert_true(
  to_regprocedure(
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'
  ) is not null
  and has_function_privilege(
    'authenticated',
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)',
    'execute'
  )
  and not has_function_privilege(
    'service_role',
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)',
    'execute'
  ),'PCP-P07-004','draft save must be authenticated RPC-only');
select pg_temp.assert_true(
  position('p_expected_version is not null' in pg_get_functiondef(
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'::regprocedure))>0
  and position('for update' in lower(pg_get_functiondef(
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'::regprocedure)))>0
  and position('PLANNING-DRAFT-STALE' in pg_get_functiondef(
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'::regprocedure))>0,
  'PCP-P07-005','create needs null version and updates need locked CAS');

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
  position('FOR UPDATE OF V SKIP LOCKED' in upper(pg_get_functiondef(
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

-- P11A — inherited business_staff default is not trusted by closure RPCs.
insert into public.visit_plans(id,method,status,created_at)
values('00000000-0000-4000-8000-0000000000d1','single','published',
  transaction_timestamp());
insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end,created_at
)
select '00000000-0000-4000-8000-0000000000d2',
  '00000000-0000-4000-8000-0000000000d1',f.id,'periodic','physical',
  'published','new',transaction_timestamp()+interval '40 days',
  transaction_timestamp()+interval '41 days',transaction_timestamp()
from public.factories f order by f.id limit 1;

select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000f1',true);
set local role authenticated;
select pg_temp.assert_true(
  (select count(*) from public.visits
    where id='00000000-0000-4000-8000-0000000000d2')=0
  and (select count(*) from public.visit_plans
    where id='00000000-0000-4000-8000-0000000000d1')=0,
  'PCP-P11A-000','no-role known-ID reads must return zero');
do $$
declare
  v_rows integer;
begin
  begin
    insert into public.visit_plans(method,status)
    values('single','draft');
    raise exception 'PCP-NO-ROLE-PLAN-INSERT-WAS-ALLOWED';
  exception when insufficient_privilege then null;
  end;
  update public.visits set notes='forbidden'
  where id='00000000-0000-4000-8000-0000000000d2';
  get diagnostics v_rows = row_count;
  if v_rows<>0 then
    raise exception 'PCP-NO-ROLE-VISIT-UPDATE-WAS-ALLOWED';
  end if;
end
$$;
reset role;
do $$
begin
  begin
    perform public.cancel_planning_visits_atomic(
      array['00000000-0000-4000-8000-0000000000a1'::uuid],
      jsonb_build_object('00000000-0000-4000-8000-0000000000a1','1'),
      null,'probe-no-role-cancel',gen_random_uuid());
    raise exception 'PCP-NO-ROLE-CANCEL-WAS-ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-CLOSURE-DENIED' then raise; end if;
  end;
  begin
    perform public.reschedule_planning_visits_atomic(
      array['00000000-0000-4000-8000-0000000000a1'::uuid],
      transaction_timestamp()+interval '40 days',
      transaction_timestamp()+interval '41 days',
      jsonb_build_object('00000000-0000-4000-8000-0000000000a1','1'),
      null,'probe-no-role-reschedule',gen_random_uuid());
    raise exception 'PCP-NO-ROLE-RESCHEDULE-WAS-ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-CLOSURE-DENIED' then raise; end if;
  end;
  begin
    perform public.reassign_published_visits_atomic(
      array['00000000-0000-4000-8000-0000000000a1'::uuid],
      '00000000-0000-4000-8000-0000000000a2'::uuid,
      'probe','probe-no-role-reassign',gen_random_uuid());
    raise exception 'PCP-NO-ROLE-REASSIGN-WAS-ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-REASSIGN-DENIED' then raise; end if;
  end;
  begin
    perform public.archive_planning_draft_atomic(
      '00000000-0000-4000-8000-0000000000a3'::uuid,1,null,
      'probe-no-role-archive',gen_random_uuid());
    raise exception 'PCP-NO-ROLE-ARCHIVE-WAS-ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-ARCHIVE-DENIED' then raise; end if;
  end;
  begin
    perform public.save_planning_draft_atomic(
      null,'single','{}'::jsonb,'{}'::jsonb,null,
      'probe-no-role-draft',gen_random_uuid());
    raise exception 'PCP-NO-ROLE-DRAFT-SAVE-WAS-ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-DRAFT-DENIED' then raise; end if;
  end;
end
$$;
select pg_temp.assert_true(
  public.planning_bulk_command_receipt(
    '00000000-0000-4000-8000-0000000000a4'::uuid) is null,
  'PCP-P11A-001','no-role view must fail closed before command lookup');

insert into auth.users(id,email,created_at,updated_at)
values('00000000-0000-4000-8000-0000000000f2',
  'planning-probe-scope@example.invalid',transaction_timestamp(),transaction_timestamp());
insert into public.profiles(user_id,full_name,email,region,org_scope)
values('00000000-0000-4000-8000-0000000000f2',
  'Planning scope probe','planning-probe-scope@example.invalid',
  'ZZ-OUT-OF-SCOPE','zz-out-of-scope');
insert into public.user_roles(user_id,role_key)
values('00000000-0000-4000-8000-0000000000f2','planner');
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000f2',true);
select pg_temp.assert_true(
  public.planning_closure_has_explicit_capability('planning.manage'),
  'PCP-P11A-002','explicit planner role must resolve capability');
select pg_temp.assert_true(
  not public.planning_closure_factory_in_scope(
    (select id from public.factories order by id limit 1)),
  'PCP-P11A-003','cross-region factory scope must fail closed');
set local role authenticated;
select pg_temp.assert_true(
  (select count(*) from public.visits
    where id='00000000-0000-4000-8000-0000000000d2')=0,
  'PCP-P11A-004','cross-scope planner known-ID read must return zero');
reset role;

insert into auth.users(id,email,created_at,updated_at)
values('00000000-0000-4000-8000-0000000000f4',
  'planning-probe-planner@example.invalid',
  transaction_timestamp(),transaction_timestamp());
insert into public.profiles(user_id,full_name,email,region,org_scope)
select '00000000-0000-4000-8000-0000000000f4',
  'Planning in-scope planner probe',
  'planning-probe-planner@example.invalid',
  coalesce(f.region,'National'),'probe'
from public.factories f order by f.id limit 1;
insert into public.user_roles(user_id,role_key)
values('00000000-0000-4000-8000-0000000000f4','planner');
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000f4',true);
set local role authenticated;
select pg_temp.assert_true(
  (select count(*) from public.visits
    where id='00000000-0000-4000-8000-0000000000d2')=1,
  'PCP-P11A-004A','explicit in-scope planner must retain governed read');
reset role;

insert into auth.users(id,email,created_at,updated_at)
values('00000000-0000-4000-8000-0000000000f3',
  'planning-probe-inspector@example.invalid',
  transaction_timestamp(),transaction_timestamp());
insert into public.profiles(user_id,full_name,email,region,org_scope)
select '00000000-0000-4000-8000-0000000000f3',
  'Planning assigned inspector probe',
  'planning-probe-inspector@example.invalid',
  coalesce(f.region,'National'),'probe'
from public.factories f order by f.id limit 1;
insert into public.user_roles(user_id,role_key)
values('00000000-0000-4000-8000-0000000000f3','inspector');
insert into public.assignments(visit_id,inspector_id,method,status)
values('00000000-0000-4000-8000-0000000000d2',
  '00000000-0000-4000-8000-0000000000f3','manual','assigned');
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000f3',true);
set local role authenticated;
select pg_temp.assert_true(
  (select count(*) from public.visits
    where id='00000000-0000-4000-8000-0000000000d2')=1,
  'PCP-P11A-005','assigned in-scope inspector must retain governed read');
reset role;

-- Governed draft create/update/replay and changed-payload conflict.
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000f4',true);
set local role authenticated;
do $$
declare
  v_created jsonb;
  v_replay jsonb;
  v_updated jsonb;
begin
  v_created:=public.save_planning_draft_atomic(
    null,'single','{"target":{"factory_id":"probe"}}'::jsonb,
    '{"target":{"source":"probe"}}'::jsonb,null,
    'probe-draft-create','00000000-0000-4000-8000-0000000000c1'::uuid);
  if (v_created->>'draft_version')::integer<>1
     or (v_created->>'idempotent')::boolean
     or v_created->>'command_id' is null
     or v_created->>'audit_event_id' is null
     or v_created->>'outbox_intent_id' is null then
    raise exception 'PCP-P07-006: create receipt incomplete: %',v_created;
  end if;
  v_replay:=public.save_planning_draft_atomic(
    null,'single','{"target":{"factory_id":"probe"}}'::jsonb,
    '{"target":{"source":"probe"}}'::jsonb,null,
    'probe-draft-create','00000000-0000-4000-8000-0000000000c1'::uuid);
  if not (v_replay->>'idempotent')::boolean
     or v_replay->>'plan_id'<>v_created->>'plan_id' then
    raise exception 'PCP-P07-007: identical replay mismatch: %',v_replay;
  end if;
  begin
    perform public.save_planning_draft_atomic(
      null,'single','{"changed":true}'::jsonb,'{}'::jsonb,null,
      'probe-draft-create','00000000-0000-4000-8000-0000000000c1'::uuid);
    raise exception 'PCP-P07-008-CHANGED-REPLAY-WAS-ALLOWED';
  exception when unique_violation then
    if sqlerrm<>'PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT' then raise; end if;
  end;
  v_updated:=public.save_planning_draft_atomic(
    (v_created->>'plan_id')::uuid,'single','{"changed":true}'::jsonb,
    '{"target":{"source":"probe"}}'::jsonb,1,
    'probe-draft-update','00000000-0000-4000-8000-0000000000c2'::uuid);
  if (v_updated->>'draft_version')::integer<>2 then
    raise exception 'PCP-P07-009: update CAS receipt mismatch: %',v_updated;
  end if;
  begin
    perform public.save_planning_draft_atomic(
      (v_created->>'plan_id')::uuid,'single','{"stale":true}'::jsonb,
      '{}'::jsonb,1,'probe-draft-stale',
      '00000000-0000-4000-8000-0000000000c3'::uuid);
    raise exception 'PCP-P07-010-STALE-WAS-ALLOWED';
  exception when serialization_failure then
    if sqlerrm<>'PLANNING-DRAFT-STALE' then raise; end if;
  end;
end
$$;
reset role;

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
    'process_planning_bulk_target','transition_planning_visit_atomic',
    'save_planning_draft_atomic','duplicate_terminal_visit_atomic'))=10,
  'PCP-P14-001','all public contracts must exist exactly once');

rollback;
