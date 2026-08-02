\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260802120000_planning_reschedule_inspector_overlap.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure
  );
begin
  if position('assignment-inspector:' in v_definition)=0
     or position('pg_advisory_xact_lock' in v_definition)=0
     or position('order by assignment.inspector_id' in v_definition)=0
     or position('other_assignment.visit_id<>v_visit.id' in v_definition)=0
     or position('PLANNING-RESCHEDULE-CONFLICT' in v_definition)=0 then
    raise exception 'TASK-PLANNING-RESCHEDULE-INTEGRITY-001: guard contract incomplete';
  end if;
  if position('PLANNING-CLOSURE-STALE' in v_definition)=0
     or position('PLANNING-CLOSURE-720H' in v_definition)=0
     or position('PLANNING-CLOSURE-SCOPE-DENIED' in v_definition)=0
     or position('insert into public.audit_events' in lower(v_definition))=0
     or position('insert into public.workflow_outbox' in lower(v_definition))=0
     or position('insert into public.planning_process_row_receipts' in lower(v_definition))=0 then
    raise exception 'TASK-PLANNING-RESCHEDULE-INTEGRITY-001: protected atomic behavior changed';
  end if;
end
$$;

-- Focused transaction integration matrix. All fixtures and mutations roll back.
insert into auth.users(id,email,created_at,updated_at) values
  ('10000000-0000-4000-8000-000000000001','reschedule-planner@example.invalid',now(),now()),
  ('10000000-0000-4000-8000-000000000002','reschedule-inspector-a@example.invalid',now(),now()),
  ('10000000-0000-4000-8000-000000000003','reschedule-inspector-b@example.invalid',now(),now()),
  ('10000000-0000-4000-8000-000000000004','reschedule-outsider@example.invalid',now(),now());
insert into public.profiles(user_id,full_name,email,region,org_scope)
select actor.id,actor.name,actor.email,
  coalesce(actor.region,(select f.region from public.factories f order by f.id limit 1),'National'),
  actor.scope
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid,'Reschedule planner','reschedule-planner@example.invalid',null,'probe'),
  ('10000000-0000-4000-8000-000000000002'::uuid,'Inspector A','reschedule-inspector-a@example.invalid',null,'probe'),
  ('10000000-0000-4000-8000-000000000003'::uuid,'Inspector B','reschedule-inspector-b@example.invalid',null,'probe'),
  ('10000000-0000-4000-8000-000000000004'::uuid,'Out-of-scope planner','reschedule-outsider@example.invalid','ZZ-OUT-OF-SCOPE','probe')
) actor(id,name,email,region,scope);
insert into public.user_roles(user_id,role_key) values
  ('10000000-0000-4000-8000-000000000001','planner'),
  ('10000000-0000-4000-8000-000000000002','inspector'),
  ('10000000-0000-4000-8000-000000000003','inspector'),
  ('10000000-0000-4000-8000-000000000004','planner');

insert into public.visits(
  id,factory_id,visit_type,execution_mode,planning_status,operational_state,
  window_start,window_end,created_at
)
select fixture.id,f.id,'periodic','physical','published','new',
  transaction_timestamp()+fixture.start_offset,
  transaction_timestamp()+fixture.end_offset,transaction_timestamp()
from public.factories f
cross join (values
  ('10000000-0000-4000-8000-000000000101'::uuid,interval '40 days',interval '41 days'),
  ('10000000-0000-4000-8000-000000000102'::uuid,interval '50 days',interval '51 days'),
  ('10000000-0000-4000-8000-000000000103'::uuid,interval '60 days',interval '61 days'),
  ('10000000-0000-4000-8000-000000000104'::uuid,interval '70 days',interval '71 days'),
  ('10000000-0000-4000-8000-000000000105'::uuid,interval '20 days',interval '21 days'),
  ('10000000-0000-4000-8000-000000000106'::uuid,interval '80 days',interval '81 days')
) fixture(id,start_offset,end_offset)
where f.id=(select id from public.factories order by id limit 1);
insert into public.assignments(visit_id,inspector_id,method,status) values
  ('10000000-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000002','manual','assigned'),
  ('10000000-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000002','manual','assigned'),
  ('10000000-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000003','manual','assigned'),
  ('10000000-0000-4000-8000-000000000104','10000000-0000-4000-8000-000000000003','manual','assigned'),
  ('10000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000003','manual','assigned'),
  ('10000000-0000-4000-8000-000000000106','10000000-0000-4000-8000-000000000002','manual','assigned');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;

-- Non-conflicting reschedule succeeds with its audit, outbox and applied receipt.
do $$
declare v_result jsonb;
begin
  v_result:=public.reschedule_planning_visits_atomic(
    array['10000000-0000-4000-8000-000000000103'::uuid],
    transaction_timestamp()+interval '65 days',transaction_timestamp()+interval '66 days',
    '{"10000000-0000-4000-8000-000000000103":1}'::jsonb,null,
    'reschedule-integrity-success','10000000-0000-4000-8000-000000000201'::uuid
  );
  if (v_result->>'updated_count')::integer<>1
     or not exists(select 1 from public.audit_events where object_id='10000000-0000-4000-8000-000000000103' and action='PLANNING_VISIT_RESCHEDULE')
     or not exists(select 1 from public.workflow_outbox where aggregate_id='10000000-0000-4000-8000-000000000103')
     or not exists(select 1 from public.planning_process_row_receipts where visit_id='10000000-0000-4000-8000-000000000103' and outcome='applied') then
    raise exception 'non-conflicting reschedule evidence is incomplete';
  end if;
end
$$;

-- Same-Inspector overlap rejects atomically: no visit/evidence/applied receipt changes.
do $$
declare
  v_version bigint;
  v_audits bigint;
  v_outbox bigint;
  v_receipts bigint;
begin
  select planning_version into v_version from public.visits where id='10000000-0000-4000-8000-000000000101';
  select count(*) into v_audits from public.audit_events where object_id='10000000-0000-4000-8000-000000000101';
  select count(*) into v_outbox from public.workflow_outbox where aggregate_id='10000000-0000-4000-8000-000000000101';
  select count(*) into v_receipts from public.planning_process_row_receipts where visit_id='10000000-0000-4000-8000-000000000101' and outcome='applied';
  begin
    perform public.reschedule_planning_visits_atomic(
      array['10000000-0000-4000-8000-000000000101'::uuid],
      transaction_timestamp()+interval '50 hours' + interval '48 days',
      transaction_timestamp()+interval '74 hours' + interval '48 days',
      jsonb_build_object('10000000-0000-4000-8000-000000000101',v_version),null,
      'reschedule-integrity-conflict','10000000-0000-4000-8000-000000000202'::uuid
    );
    raise exception 'same-Inspector overlap was allowed';
  exception when unique_violation then
    if sqlerrm<>'PLANNING-RESCHEDULE-CONFLICT' then raise; end if;
  end;
  if (select planning_version from public.visits where id='10000000-0000-4000-8000-000000000101')<>v_version
     or (select count(*) from public.audit_events where object_id='10000000-0000-4000-8000-000000000101')<>v_audits
     or (select count(*) from public.workflow_outbox where aggregate_id='10000000-0000-4000-8000-000000000101')<>v_outbox
     or (select count(*) from public.planning_process_row_receipts where visit_id='10000000-0000-4000-8000-000000000101' and outcome='applied')<>v_receipts then
    raise exception 'conflicting reschedule was not atomic';
  end if;
end
$$;

-- A different Inspector may occupy the same window; a target never conflicts with itself.
select public.reschedule_planning_visits_atomic(
  array['10000000-0000-4000-8000-000000000104'::uuid],
  transaction_timestamp()+interval '50 days',transaction_timestamp()+interval '51 days',
  '{"10000000-0000-4000-8000-000000000104":1}'::jsonb,null,
  'reschedule-integrity-different-inspector','10000000-0000-4000-8000-000000000203'::uuid
);
select public.reschedule_planning_visits_atomic(
  array['10000000-0000-4000-8000-000000000106'::uuid],
  transaction_timestamp()+interval '80 days 1 hour',transaction_timestamp()+interval '80 days 23 hours',
  '{"10000000-0000-4000-8000-000000000106":1}'::jsonb,null,
  'reschedule-integrity-self','10000000-0000-4000-8000-000000000204'::uuid
);

-- Existing stale-version and cutoff errors keep precedence and stable messages.
do $$ begin
  begin
    perform public.reschedule_planning_visits_atomic(
      array['10000000-0000-4000-8000-000000000101'::uuid],
      transaction_timestamp()+interval '45 days',transaction_timestamp()+interval '46 days',
      '{"10000000-0000-4000-8000-000000000101":0}'::jsonb,null,
      'reschedule-integrity-stale','10000000-0000-4000-8000-000000000205'::uuid);
    raise exception 'stale reschedule was allowed';
  exception when serialization_failure then
    if sqlerrm<>'PLANNING-CLOSURE-STALE' then raise; end if;
  end;
  begin
    perform public.reschedule_planning_visits_atomic(
      array['10000000-0000-4000-8000-000000000105'::uuid],
      transaction_timestamp()+interval '25 days',transaction_timestamp()+interval '26 days',
      '{"10000000-0000-4000-8000-000000000105":1}'::jsonb,null,
      'reschedule-integrity-cutoff','10000000-0000-4000-8000-000000000206'::uuid);
    raise exception 'cutoff reschedule was allowed';
  exception when check_violation then
    if sqlerrm<>'PLANNING-CLOSURE-720H' then raise; end if;
  end;
end $$;

reset role;

-- Unauthorized and cross-scope actors remain denied before mutation.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
  begin
    perform public.reschedule_planning_visits_atomic(
      array['10000000-0000-4000-8000-000000000101'::uuid],now()+interval '45 days',now()+interval '46 days',
      '{"10000000-0000-4000-8000-000000000101":1}'::jsonb,null,
      'reschedule-integrity-denied','10000000-0000-4000-8000-000000000207'::uuid);
    raise exception 'unauthorized reschedule was allowed';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-CLOSURE-DENIED' then raise; end if;
  end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$ begin
  begin
    perform public.reschedule_planning_visits_atomic(
      array['10000000-0000-4000-8000-000000000101'::uuid],now()+interval '45 days',now()+interval '46 days',
      '{"10000000-0000-4000-8000-000000000101":1}'::jsonb,null,
      'reschedule-integrity-scope','10000000-0000-4000-8000-000000000208'::uuid);
    raise exception 'cross-scope reschedule was allowed';
  exception when insufficient_privilege then
    if sqlerrm<>'PLANNING-CLOSURE-SCOPE-DENIED' then raise; end if;
  end;
end $$;
reset role;

-- Reapplication is intentionally safe and must not duplicate the injected guard.
\ir ../migrations/20260802120000_planning_reschedule_inspector_overlap.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure
  );
begin
  if (length(v_definition)-length(replace(v_definition,'PLANNING-RESCHEDULE-CONFLICT','')))
       / length('PLANNING-RESCHEDULE-CONFLICT') <> 1 then
    raise exception 'TASK-PLANNING-RESCHEDULE-INTEGRITY-001: guard is not idempotent';
  end if;
end
$$;

rollback;
