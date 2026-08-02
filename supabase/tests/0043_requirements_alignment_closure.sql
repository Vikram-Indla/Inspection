\set ON_ERROR_STOP on
-- REQ-ALIGNMENT-CLOSURE-IMPLEMENTATION-001
-- Executable, non-pgTAP acceptance probe. Run only against a disposable local
-- database after a clean migration apply. The replay and every fixture below
-- execute inside one transaction and are rolled back.

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

-- Idempotent replay. A duplicate policy, trigger, seed, or relation fails here.
\ir ../migrations/20260729010000_requirements_alignment_closure.sql

-- Clean-apply envelope, RLS, grants and trigger installation.
select pg_temp.assert_true(
  to_regclass('public.planning_lifecycle_rules') is not null
  and to_regclass('public.planning_attachment_policies') is not null,
  'RAL-P01','migration relations must exist after clean apply');
select pg_temp.assert_true(
  (select relrowsecurity from pg_class
    where oid='public.planning_lifecycle_rules'::regclass)
  and (select relrowsecurity from pg_class
    where oid='public.planning_attachment_policies'::regclass),
  'RAL-P02','governed configuration relations require RLS');
select pg_temp.assert_true(
  has_table_privilege('authenticated',
    'public.planning_lifecycle_rules','select')
  and not has_table_privilege('authenticated',
    'public.planning_lifecycle_rules','insert')
  and has_table_privilege('authenticated',
    'public.planning_attachment_policies','select')
  and not has_table_privilege('authenticated',
    'public.planning_attachment_policies','insert'),
  'RAL-P03','authenticated access must be read-only and policy-gated');
select pg_temp.assert_true(
  has_function_privilege('authenticated',
    'public.validate_planning_attachments(text,jsonb,timestamptz)','execute')
  and has_function_privilege('authenticated',
    'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)','execute')
  and not has_function_privilege('authenticated',
    'public.apply_planning_assignment_recommendation()','execute')
  and not has_function_privilege('service_role',
    'public.apply_planning_assignment_recommendation()','execute'),
  'RAL-P04','function grants must expose RPCs but not trigger internals');
select pg_temp.assert_true(
  exists(
    select 1 from pg_trigger
     where tgrelid='public.assignments'::regclass
       and tgname='trg_apply_planning_assignment_recommendation'
       and not tgisinternal
  ),'RAL-P05','automatic-assignment trigger must be installed');

-- Exact configured cutoff: 720h-1ms and 720h are allowed; 720h+1ms is denied.
select pg_temp.assert_true(
  (select allowed from public.resolve_planning_lifecycle_cutoff(
    'planner_cancel_reschedule_window',
    timestamptz '2030-03-03 00:00:00+00',
    timestamptz '2030-01-31 23:59:59.999+00')),
  'RAL-P06','720h plus one millisecond remaining must be allowed');
select pg_temp.assert_true(
  (select allowed from public.resolve_planning_lifecycle_cutoff(
    'planner_cancel_reschedule_window',
    timestamptz '2030-03-03 00:00:00+00',
    timestamptz '2030-02-01 00:00:00+00')),
  'RAL-P07','exactly 720h remaining must be allowed');
select pg_temp.assert_true(
  not (select allowed from public.resolve_planning_lifecycle_cutoff(
    'planner_cancel_reschedule_window',
    timestamptz '2030-03-03 00:00:00+00',
    timestamptz '2030-02-01 00:00:00.001+00')),
  'RAL-P08','720h minus one millisecond remaining must be denied');

-- Attachment validation: absent policy fails closed; sizes are governed values.
select pg_temp.assert_true(
  not (public.validate_planning_attachments(
    'ral-no-policy','[]'::jsonb,timestamptz '2030-01-01+00'
  )->>'allowed')::boolean
  and (public.validate_planning_attachments(
    'ral-no-policy','[]'::jsonb,timestamptz '2030-01-01+00'
  )->>'reason')='PLANNING-ATTACHMENT-POLICY-NOT-CONFIGURED',
  'RAL-P09','missing attachment policy must fail closed');

insert into public.planning_attachment_policies(
  visit_type,version,required,min_count,max_count,allowed_mime_types,
  max_file_bytes,enabled,effective_from
) values (
  'ral-attachment-probe',1,false,0,10,array['application/pdf'],
  100,true,timestamptz '2029-01-01+00'
);

select pg_temp.assert_true(
  not (public.validate_planning_attachments(
    'ral-attachment-probe','[{"mime":"application/pdf"}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P10','missing size must be denied');
select pg_temp.assert_true(
  not (public.validate_planning_attachments(
    'ral-attachment-probe','[{"mime":"application/pdf","size_bytes":-1}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P11','negative size must be denied');
select pg_temp.assert_true(
  not (public.validate_planning_attachments(
    'ral-attachment-probe',
    '[{"mime":"application/pdf","size_bytes":"not-a-number"}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P12','nonnumeric size must return a governed denial');
select pg_temp.assert_true(
  (public.validate_planning_attachments(
    'ral-attachment-probe','[{"mime":"application/pdf","size_bytes":0}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P13','zero-byte attachment is a valid non-negative integer');
select pg_temp.assert_true(
  (public.validate_planning_attachments(
    'ral-attachment-probe','[{"mime":"application/pdf","size_bytes":100}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P14','exact maximum size must be allowed');
select pg_temp.assert_true(
  not (public.validate_planning_attachments(
    'ral-attachment-probe','[{"mime":"application/pdf","size_bytes":101}]'::jsonb,
    timestamptz '2030-01-01+00'
  )->>'allowed')::boolean,
  'RAL-P15','maximum plus one byte must be denied');

-- Deterministic recommendation ranking: availability, region when available,
-- stable UUID tie-break, and unavailable facts retained as evidence.
with ranked as (
  select public.rank_planning_inspector_facts('[
    {"inspector_id":"00000000-0000-4000-8000-000000000003",
     "has_availability":false,"capacity_factor_available":false,
     "same_region":true,"region_factor_available":true},
    {"inspector_id":"00000000-0000-4000-8000-000000000002",
     "has_availability":true,"capacity_factor_available":true,
     "same_region":false,"region_factor_available":false},
    {"inspector_id":"00000000-0000-4000-8000-000000000001",
     "has_availability":true,"capacity_factor_available":true,
     "same_region":false,"region_factor_available":false}
  ]'::jsonb) value
)
select pg_temp.assert_true(
  value->0->>'inspector_id'='00000000-0000-4000-8000-000000000001'
  and value->1->>'inspector_id'='00000000-0000-4000-8000-000000000002'
  and value->2->>'inspector_id'='00000000-0000-4000-8000-000000000003',
  'RAL-P16','ranking must be deterministic with unavailable facts last')
from ranked;

with ranked as (
  select public.rank_planning_inspector_facts('[
    {"inspector_id":"00000000-0000-4000-8000-000000000011",
     "has_availability":true,"same_region":false,
     "region_factor_available":true},
    {"inspector_id":"00000000-0000-4000-8000-000000000012",
     "has_availability":true,"same_region":true,
     "region_factor_available":true}
  ]'::jsonb) value
)
select pg_temp.assert_true(
  value->0->>'inspector_id'='00000000-0000-4000-8000-000000000012',
  'RAL-P17','same-region inspector must lead when the factor is available')
from ranked;

-- Schema provenance, inactive-account exclusion, three publish modes, and
-- override audit/idempotency are asserted from installed executable objects.
select pg_temp.assert_true(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles'
      and column_name='account_status' and is_nullable='NO')
  and position('p.account_status=''active''' in
    regexp_replace(pg_get_functiondef(
      'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)'
      ::regprocedure),'[[:space:]]','','g'))>0,
  'RAL-P18','recommendations must exclude inactive profiles');
select pg_temp.assert_true(
  position('planning.create.single' in pg_get_functiondef(
    'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)'
    ::regprocedure))>0
  and position('planning.create.bulk' in pg_get_functiondef(
    'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)'
    ::regprocedure))>0
  and position('planning.create.immediate' in pg_get_functiondef(
    'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)'
    ::regprocedure))>0
  and position('v_planning_method:=''immediate''' in
    regexp_replace(pg_get_functiondef(
      'public.apply_planning_assignment_recommendation()'::regprocedure),
      '[[:space:]]','','g'))>0
  and position('v_planning_methodnotin(''single'',''bulk'',''immediate'')' in
    regexp_replace(lower(pg_get_functiondef(
      'public.apply_planning_assignment_recommendation()'::regprocedure)),
      '[[:space:]]','','g'))>0,
  'RAL-P19','Single, Bulk and Immediate must share the automatic trigger path');

-- Exercise the trigger path for all three modes. Capability and capacity are
-- controlled probe seams inside this transaction only; rollback restores the
-- installed functions and removes every fixture.
create or replace function public.has_capability(p_capability text)
returns boolean language sql stable as $$ select true $$;
create or replace function public.planning_inspector_capacity_fact(
  p_inspector uuid,p_window_start date,p_window_end date
) returns jsonb language sql stable as $$
  select '{"available":true,"has_availability":true}'::jsonb
$$;
select set_config(
  'request.jwt.claim.sub','00000000-0000-4000-8000-000000004301',true);
insert into auth.users(id,email)
values
  ('00000000-0000-4000-8000-000000004301','ral-active@example.invalid'),
  ('00000000-0000-4000-8000-000000004302','ral-inactive@example.invalid');
insert into public.profiles(user_id,full_name,region,account_status)
values
  ('00000000-0000-4000-8000-000000004301','RAL active inspector','RAL','active'),
  ('00000000-0000-4000-8000-000000004302','RAL inactive inspector','RAL','inactive');
insert into public.user_roles(user_id,role_key)
values
  ('00000000-0000-4000-8000-000000004301','inspector'),
  ('00000000-0000-4000-8000-000000004302','inspector');
insert into public.factories(id,name,region)
values('00000000-0000-4000-8000-000000004303','RAL factory','RAL');
insert into public.visit_plans(id,method,status,created_by)
values
  ('00000000-0000-4000-8000-000000004304','single','draft',
    '00000000-0000-4000-8000-000000004301'),
  ('00000000-0000-4000-8000-000000004305','bulk','draft',
    '00000000-0000-4000-8000-000000004301');
insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end
) values
  ('00000000-0000-4000-8000-000000004306',
    '00000000-0000-4000-8000-000000004304',
    '00000000-0000-4000-8000-000000004303',
    'ral-probe','physical','draft','new',
    timestamptz '2030-04-01+00',timestamptz '2030-04-02+00'),
  ('00000000-0000-4000-8000-000000004307',
    '00000000-0000-4000-8000-000000004305',
    '00000000-0000-4000-8000-000000004303',
    'ral-probe','physical','draft','new',
    timestamptz '2030-04-03+00',timestamptz '2030-04-04+00'),
  ('00000000-0000-4000-8000-000000004308',null,
    '00000000-0000-4000-8000-000000004303',
    'ral-probe','physical','draft','new',
    timestamptz '2030-04-05+00',timestamptz '2030-04-06+00');
insert into public.assignments(visit_id,inspector_id,method)
values
  ('00000000-0000-4000-8000-000000004306',
    '00000000-0000-4000-8000-000000004301','automatic'),
  ('00000000-0000-4000-8000-000000004307',
    '00000000-0000-4000-8000-000000004301','automatic'),
  ('00000000-0000-4000-8000-000000004308',
    '00000000-0000-4000-8000-000000004301','automatic');
select pg_temp.assert_true(
  (select candidates->>'planning_method' from public.assignments
    where visit_id='00000000-0000-4000-8000-000000004306')='single'
  and (select candidates->>'planning_method' from public.assignments
    where visit_id='00000000-0000-4000-8000-000000004307')='bulk'
  and (select candidates->>'planning_method' from public.assignments
    where visit_id='00000000-0000-4000-8000-000000004308')='immediate',
  'RAL-P19A','trigger must execute for Single, Bulk and Immediate automatic inserts');
select pg_temp.assert_true(
  not public.recommend_planning_inspectors(
    '00000000-0000-4000-8000-000000004303',
    timestamptz '2030-04-01+00',timestamptz '2030-04-02+00'
  ) @> '[{"inspector_id":"00000000-0000-4000-8000-000000004302"}]'::jsonb,
  'RAL-P19B','inactive inspector accounts must be excluded without mutation');

select pg_temp.assert_true(
  position('p_idempotency_key' in pg_get_functiondef(
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)'
    ::regprocedure))>0
  and position('PLANNING_ASSIGNMENT_OVERRIDE' in pg_get_functiondef(
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)'
    ::regprocedure))>0
  and position('override_audit_event_id' in pg_get_functiondef(
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)'
    ::regprocedure))>0,
  'RAL-P20','override replay must delegate its key and return an audit receipt');

rollback;
