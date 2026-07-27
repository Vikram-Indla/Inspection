-- Rollback/security probe for 20260727032528. Isolated database only.
begin;
do $$
declare d text; kinds text;
begin
  if to_regprocedure('public.decide_enforcement_recommendation(uuid,public.enforcement_recommendation_decision,text,uuid,uuid)') is null
    or to_regprocedure('public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid)') is null then
    raise exception 'Approval/Enforcement RPC surface missing'; end if;
  if has_function_privilege('anon','public.decide_enforcement_recommendation(uuid,public.enforcement_recommendation_decision,text,uuid,uuid)','EXECUTE')
    or has_function_privilege('anon','public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.issue_bulk_violation(uuid,uuid[],text,text)','EXECUTE') then
    raise exception 'unsafe RPC execute grant'; end if;
  if has_table_privilege('authenticated','public.enforcement_recommendations','UPDATE')
    or has_table_privilege('authenticated','public.bulk_violation_batches','INSERT')
    or has_table_privilege('authenticated','public.bulk_violation_batches','UPDATE')
    or has_table_privilege('authenticated','public.bulk_violation_batches','DELETE')
    or has_table_privilege('authenticated','public.bulk_violation_batch_items','INSERT')
    or has_table_privilege('authenticated','public.bulk_violation_batch_items','UPDATE')
    or has_table_privilege('authenticated','public.bulk_violation_batch_items','DELETE') then
    raise exception 'direct mutation grant remains'; end if;
  d:=pg_get_functiondef('public.decide_enforcement_recommendation(uuid,public.enforcement_recommendation_decision,text,uuid,uuid)'::regprocedure);
  if d not like '%for update%' or d not like '%ENF_MAKER_CHECKER%' or d not like '%ENF_DECISION_IDEMPOTENCY_CONFLICT%'
    or d not like '%audit_events%' then raise exception 'enforcement guard incomplete'; end if;
  d:=pg_get_functiondef('public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid)'::regprocedure);
  if d not like '%BULK_ACKNOWLEDGEMENT_REQUIRED%' or d not like '%BULK_IDEMPOTENCY_CONFLICT%'
    or d not like '%status=''locked''%' or d not like '%published_at is not null%'
    or d not like '%deactivation_reason is null%' or d like '%order by published_at%'
    or d not like '%order by x%' or d like '%exception when others%'
    or d not like '%SET search_path TO ''''%'
    or d not like '%extensions.digest%'
  then raise exception 'bulk atomic or explicit published-active-locked contract incomplete'; end if;
  if to_regprocedure('private.ccr_validate_snapshot(text,jsonb)') is null
    or has_function_privilege('authenticated','private.ccr_validate_snapshot(text,jsonb)','EXECUTE') then
    raise exception 'CCR validator exposure invalid'; end if;
  select pg_get_constraintdef(oid) into kinds from pg_constraint
   where conrelid='public.compliance_request_components'::regclass
     and conname='compliance_request_components_entity_kind_check';
  if kinds not like '%action_form_requirement%' or kinds like '%item_score%' or kinds like '%score_exclusion%' then
    raise exception 'CCR explicit vocabulary or CR-471/472 hold invalid'; end if;
  d:=pg_get_functiondef('private.guard_submission_action_forms_and_config()'::regprocedure);
  if d not like '%owner_name%' or d not like '%owner_role%' or d not like '%due_at%'
    or d not like '%required_correction%' or d not like '%EXE-SUBMIT-CONFIG-CHECKSUM-MISMATCH%'
    or d not like '%EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED%' or d not like '%af.form_type=f->>''key''%'
    or d not like '%SET search_path TO ''''%' or d not like '%extensions.digest%' then
    raise exception 'canonical action-form/config lock incomplete'; end if;
end $$;

-- Syntax/error-contract regression for every condition-name RAISE corrected
-- after the first remote parser rejection. Function definitions must preserve
-- every stable message and the three governed SQLSTATE classes.
do $$
declare
  defs text;
  token text;
  check_tokens text[]:=array[
    'CCR_SNAPSHOT_OBJECT_REQUIRED','CCR_COMPONENT_KIND_INVALID','CCR_REQUIRED_FIELD:',
    'CCR_VERSION_REFERENCE_INVALID:','CCR_BOOLEAN_REQUIRED:mandatory','CCR_DISPLAY_ORDER_INVALID',
    'CCR_EVIDENCE_TYPES_ARRAY_REQUIRED','CCR_SECTIONS_ARRAY_REQUIRED','CCR_NOT_EDITABLE',
    'CCR_MODIFY_TARGET_REQUIRED','CCR_PUBLICATION_COMPONENT_INVALID',
    'CCR_TEMPLATE_VERSION_NOT_PUBLISHED','CCR_DEPENDENCY_VERSION_MISSING:',
    'ENF_DECISION_IDEMPOTENCY_REQUIRED','ENF_DECISION_REASON_REQUIRED','ENF_DECISION_CONFLICT',
    'BULK_REQUEST_ID_REQUIRED','BULK_ACKNOWLEDGEMENT_REQUIRED','BULK_FACTORY_REQUIRED',
    'BULK_DUPLICATE_FACTORY','BULK_FACTORY_NOT_FOUND','BULK_VIOLATION_NOT_GOVERNED',
    'BULK_PENALTY_MAPPING_REQUIRED','BULK_PACKAGE_VERSION_NOT_PUBLISHED_ACTIVE_LOCKED',
    'EXE-SUBMIT-NOT-FOUND','EXE-SUBMIT-CONFIG-VERSION-MISMATCH',
    'EXE-SUBMIT-CONFIG-CHECKSUM-MISMATCH','EXE-SUBMIT-SNAPSHOT-VERSION-MISMATCH',
    'EXE-SUBMIT-ACTION-FORM-MISSING','EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED',
    'EXE-SUBMIT-ACTION-FORM-INCOMPLETE:'
  ];
  auth_tokens text[]:=array[
    'CCR_NOT_AUTHORIZED','ENF_DECISION_NOT_AUTHORIZED','ENF_MAKER_CHECKER',
    'BULK_VIOLATION_NOT_AUTHORIZED'
  ];
  unique_tokens text[]:=array[
    'ENF_DECISION_IDEMPOTENCY_CONFLICT','BULK_IDEMPOTENCY_CONFLICT'
  ];
begin
  select string_agg(pg_get_functiondef(p.oid),E'\n') into defs
  from pg_proc p
  where p.oid in (
    'private.ccr_validate_snapshot(text,jsonb)'::regprocedure,
    'private.ccr_validate_component_trigger()'::regprocedure,
    'public.add_compliance_request_component(uuid,text,uuid,jsonb,jsonb,text)'::regprocedure,
    'private.ccr_validate_publication_trigger()'::regprocedure,
    'public.decide_enforcement_recommendation(uuid,public.enforcement_recommendation_decision,text,uuid,uuid)'::regprocedure,
    'public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid)'::regprocedure,
    'private.guard_submission_action_forms_and_config()'::regprocedure
  );
  if defs is null or defs ilike '%raise check_violation%'
     or defs ilike '%raise insufficient_privilege%'
     or defs ilike '%raise unique_violation%' then
    raise exception 'invalid condition-name RAISE remains';
  end if;
  foreach token in array check_tokens loop
    if defs not like '%'||token||'%' then
      raise exception 'missing 23514 branch:%',token;
    end if;
  end loop;
  foreach token in array auth_tokens loop
    if defs not like '%'||token||'%' then
      raise exception 'missing 42501 branch:%',token;
    end if;
  end loop;
  foreach token in array unique_tokens loop
    if defs not like '%'||token||'%' then
      raise exception 'missing 23505 branch:%',token;
    end if;
  end loop;
  if defs not like '%errcode=''23514''%'
     or defs not like '%errcode=''42501''%'
     or defs not like '%errcode=''23505''%' then
    raise exception 'explicit SQLSTATE class missing';
  end if;
  if regexp_count(defs,'errcode=''23514''')<>33
     or regexp_count(defs,'errcode=''42501''')<>4
     or regexp_count(defs,'errcode=''23505''')<>3 then
    raise exception 'explicit SQLSTATE branch count changed';
  end if;
end $$;

-- Deterministic behavioral fixtures. User triggers are bypassed only while the
-- fixture graph is assembled; every contract invocation below runs normally.
set local session_replication_role = replica;
insert into auth.users(id,email) values
  ('39000000-0000-0000-0000-000000000001','p0-inspector@test.invalid'),
  ('39000000-0000-0000-0000-000000000002','p0-ops@test.invalid'),
  ('39000000-0000-0000-0000-000000000003','p0-compliance@test.invalid');
insert into public.profiles(user_id,full_name,email,region) values
  ('39000000-0000-0000-0000-000000000001','P0 Inspector','p0-inspector@test.invalid','Riyadh'),
  ('39000000-0000-0000-0000-000000000002','P0 Operations','p0-ops@test.invalid','Riyadh'),
  ('39000000-0000-0000-0000-000000000003','P0 Compliance','p0-compliance@test.invalid','Riyadh');
insert into public.user_roles(user_id,role_key) values
  ('39000000-0000-0000-0000-000000000001','inspector'),
  ('39000000-0000-0000-0000-000000000002','ops'),
  ('39000000-0000-0000-0000-000000000003','compliance_admin');
insert into public.factories(id,factory_code,name,region) values
  ('39000000-0000-0000-0000-000000000010','P0-F1','P0 Factory One','Riyadh'),
  ('39000000-0000-0000-0000-000000000011','P0-F2','P0 Factory Two','Riyadh');
insert into public.packages(id,code,title) values
  ('39000000-0000-0000-0000-000000000020','P0-PKG','P0 governed package');
insert into public.package_versions(
  id,package_id,version_label,status,definition,published_at,deactivation_reason
) values
  ('39000000-0000-0000-0000-000000000021','39000000-0000-0000-0000-000000000020',
   'locked','locked','{"sections":[{"key":"main"}]}',clock_timestamp(),null),
  ('39000000-0000-0000-0000-000000000022','39000000-0000-0000-0000-000000000020',
   'draft','draft','{"sections":[{"key":"main"}]}',null,null);
insert into public.violation_codes(
  id,code,title,level,active_from,status,configuration_version,published_at
) values (
  '39000000-0000-0000-0000-000000000030','P0-VIO','P0 governed violation','major',
  current_date,'locked',1,clock_timestamp()
);
insert into public.penalty_mappings(
  id,violation_code_id,penalty_ref,mapping_version,status
) values (
  '39000000-0000-0000-0000-000000000031','39000000-0000-0000-0000-000000000030',
  'P0-PEN','P0-MAP-1','locked'
);
insert into public.enforcement_recommendations(
  id,factory_id,recommended_action,recommended_by,status
) values
  ('39000000-0000-0000-0000-000000000040','39000000-0000-0000-0000-000000000010',
   'fine','39000000-0000-0000-0000-000000000002','pending'),
  ('39000000-0000-0000-0000-000000000041','39000000-0000-0000-0000-000000000010',
   'warning','39000000-0000-0000-0000-000000000001','pending'),
  ('39000000-0000-0000-0000-000000000042','39000000-0000-0000-0000-000000000010',
   'committee','39000000-0000-0000-0000-000000000001','approved');
set local session_replication_role = origin;

-- Negative RBAC and acknowledgement/package-governance behavior.
set local role authenticated;
select set_config('request.jwt.claim.sub','39000000-0000-0000-0000-000000000001',true);
do $$
begin
  begin
    perform public.issue_bulk_violation(
      '39000000-0000-0000-0000-000000000100',
      array['39000000-0000-0000-0000-000000000010'::uuid],
      'P0-VIO','39000000-0000-0000-0000-000000000021',null,true,null
    );
    raise exception 'expected BULK_VIOLATION_NOT_AUTHORIZED';
  exception when insufficient_privilege then
    if sqlerrm <> 'BULK_VIOLATION_NOT_AUTHORIZED' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub','39000000-0000-0000-0000-000000000002',true);
do $$
begin
  begin
    perform public.issue_bulk_violation(
      '39000000-0000-0000-0000-000000000101',
      array['39000000-0000-0000-0000-000000000010'::uuid],
      'P0-VIO','39000000-0000-0000-0000-000000000021',null,false,null
    );
    raise exception 'expected BULK_ACKNOWLEDGEMENT_REQUIRED';
  exception when check_violation then
    if sqlerrm <> 'BULK_ACKNOWLEDGEMENT_REQUIRED' then raise; end if;
  end;
  begin
    perform public.issue_bulk_violation(
      '39000000-0000-0000-0000-000000000102',
      array['39000000-0000-0000-0000-000000000010'::uuid],
      'P0-VIO','39000000-0000-0000-0000-000000000022',null,true,null
    );
    raise exception 'expected BULK_PACKAGE_VERSION_NOT_PUBLISHED_ACTIVE_LOCKED';
  exception when check_violation then
    if sqlerrm <> 'BULK_PACKAGE_VERSION_NOT_PUBLISHED_ACTIVE_LOCKED' then raise; end if;
  end;
end $$;

-- Recommendation maker-checker, CAS, replay, and mismatch rejection.
do $$
declare first_receipt jsonb; replay_receipt jsonb;
begin
  begin
    perform public.decide_enforcement_recommendation(
      '39000000-0000-0000-0000-000000000040','approve','same actor',
      '39000000-0000-0000-0000-000000000110',null
    );
    raise exception 'expected ENF_MAKER_CHECKER';
  exception when insufficient_privilege then
    if sqlerrm <> 'ENF_MAKER_CHECKER' then raise; end if;
  end;
  begin
    perform public.decide_enforcement_recommendation(
      '39000000-0000-0000-0000-000000000042','reject','already decided',
      '39000000-0000-0000-0000-000000000111',null
    );
    raise exception 'expected ENF_DECISION_CONFLICT';
  exception when check_violation then
    if sqlerrm <> 'ENF_DECISION_CONFLICT' then raise; end if;
  end;
  first_receipt:=public.decide_enforcement_recommendation(
    '39000000-0000-0000-0000-000000000041','approve','governed approval',
    '39000000-0000-0000-0000-000000000112','39000000-0000-0000-0000-000000000113'
  );
  replay_receipt:=public.decide_enforcement_recommendation(
    '39000000-0000-0000-0000-000000000041','approve','governed approval',
    '39000000-0000-0000-0000-000000000112','39000000-0000-0000-0000-000000000113'
  );
  if first_receipt->>'replayed'<>'false' or replay_receipt->>'replayed'<>'true' then
    raise exception 'decision replay receipt invalid';
  end if;
  begin
    perform public.decide_enforcement_recommendation(
      '39000000-0000-0000-0000-000000000041','approve','different payload',
      '39000000-0000-0000-0000-000000000112',null
    );
    raise exception 'expected ENF_DECISION_IDEMPOTENCY_CONFLICT';
  exception when unique_violation then
    if sqlerrm <> 'ENF_DECISION_IDEMPOTENCY_CONFLICT' then raise; end if;
  end;
  if not exists(
    select 1 from public.audit_events
    where object_type='enforcement_recommendation'
      and object_id='39000000-0000-0000-0000-000000000041'
      and action='decision'
  ) then raise exception 'decision audit missing'; end if;
end $$;
reset role;

-- Inject a deterministic second-target failure. The RPC call runs in a PL/pgSQL
-- subtransaction; catching the propagated error must leave no partial graph.
create or replace function pg_temp.reject_second_bulk_target()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.factory_id='39000000-0000-0000-0000-000000000011'::uuid
     and new.notes like 'DEC-L bulk violation issuance%' then
    raise exception using errcode='23514',message='PROBE_SECOND_TARGET_FAILURE';
  end if;
  return new;
end $$;
create trigger probe_reject_second_bulk_target
before insert on public.visits for each row execute function pg_temp.reject_second_bulk_target();
set local role authenticated;
select set_config('request.jwt.claim.sub','39000000-0000-0000-0000-000000000002',true);
do $$
declare before_audits bigint; before_visits bigint; before_inspections bigint; before_violations bigint;
begin
  select count(*) into before_audits from public.audit_events
   where config_versions->>'request_id'='39000000-0000-0000-0000-000000000120';
  select count(*) into before_visits from public.visits where visit_type='administrative_enforcement';
  select count(*) into before_inspections from public.inspections;
  select count(*) into before_violations from public.violations;
  begin
    perform public.issue_bulk_violation(
      '39000000-0000-0000-0000-000000000120',
      array[
        '39000000-0000-0000-0000-000000000010'::uuid,
        '39000000-0000-0000-0000-000000000011'::uuid
      ],
      'P0-VIO','39000000-0000-0000-0000-000000000021','atomic failure probe',true,
      '39000000-0000-0000-0000-000000000121'
    );
    raise exception 'expected PROBE_SECOND_TARGET_FAILURE';
  exception when check_violation then
    if sqlerrm <> 'PROBE_SECOND_TARGET_FAILURE' then raise; end if;
  end;
  if exists(select 1 from public.bulk_violation_batches where request_id='39000000-0000-0000-0000-000000000120')
    or (select count(*) from public.visits where visit_type='administrative_enforcement')<>before_visits
    or (select count(*) from public.inspections)<>before_inspections
    or (select count(*) from public.violations)<>before_violations
    or (select count(*) from public.audit_events
        where config_versions->>'request_id'='39000000-0000-0000-0000-000000000120')<>before_audits
  then raise exception 'bulk failure left partial rows or audit'; end if;
end $$;
reset role;
drop trigger probe_reject_second_bulk_target on public.visits;

-- Successful all-target issuance, exact replay, and payload mismatch.
set local role authenticated;
select set_config('request.jwt.claim.sub','39000000-0000-0000-0000-000000000002',true);
do $$
declare first_result jsonb; replay_result jsonb; v_batch_id uuid;
begin
  first_result:=public.issue_bulk_violation(
    '39000000-0000-0000-0000-000000000130',
    array[
      '39000000-0000-0000-0000-000000000010'::uuid,
      '39000000-0000-0000-0000-000000000011'::uuid
    ],
    'P0-VIO','39000000-0000-0000-0000-000000000021','atomic success',true,
    '39000000-0000-0000-0000-000000000131'
  );
  v_batch_id:=(first_result->>'batch_id')::uuid;
  if first_result->>'status'<>'ok' or first_result->>'replayed'<>'false'
     or (first_result->>'success_count')::int<>2 or (first_result->>'total')::int<>2
     or (select count(*) from public.bulk_violation_batch_items
         where bulk_violation_batch_items.batch_id=v_batch_id and status='success')<>2
  then raise exception 'all-target success contract invalid'; end if;
  replay_result:=public.issue_bulk_violation(
    '39000000-0000-0000-0000-000000000130',
    array[
      '39000000-0000-0000-0000-000000000010'::uuid,
      '39000000-0000-0000-0000-000000000011'::uuid
    ],
    'P0-VIO','39000000-0000-0000-0000-000000000021','atomic success',true,
    '39000000-0000-0000-0000-000000000131'
  );
  if replay_result->>'replayed'<>'true' or replay_result->>'batch_id'<>v_batch_id::text then
    raise exception 'bulk replay invalid';
  end if;
  begin
    perform public.issue_bulk_violation(
      '39000000-0000-0000-0000-000000000130',
      array[
        '39000000-0000-0000-0000-000000000010'::uuid,
        '39000000-0000-0000-0000-000000000011'::uuid
      ],
      'P0-VIO','39000000-0000-0000-0000-000000000021','changed payload',true,null
    );
    raise exception 'expected BULK_IDEMPOTENCY_CONFLICT';
  exception when unique_violation then
    if sqlerrm <> 'BULK_IDEMPOTENCY_CONFLICT' then raise; end if;
  end;
end $$;
reset role;

-- Submission enforcement: missing mandatory form, incomplete canonical fields,
-- then a complete canonical form with the exact locked snapshot.
set local session_replication_role = replica;
insert into public.visits(
  id,factory_id,visit_type,execution_mode,planning_status,operational_state,
  window_start,window_end,package_version_id
) values (
  '39000000-0000-0000-0000-000000000200','39000000-0000-0000-0000-000000000010',
  'routine','physical','published','executing',clock_timestamp(),clock_timestamp()+interval '1 hour',
  '39000000-0000-0000-0000-000000000021'
);
insert into public.inspections(id,visit_id,status,package_version_id,started_at) values (
  '39000000-0000-0000-0000-000000000201','39000000-0000-0000-0000-000000000200',
  'executing','39000000-0000-0000-0000-000000000021',clock_timestamp()
);
insert into public.visit_package_snapshots(
  id,visit_id,preparation_version,package_version_id,definition,checksum,created_by
) values (
  '39000000-0000-0000-0000-000000000202','39000000-0000-0000-0000-000000000200',1,
  '39000000-0000-0000-0000-000000000021',
  '{"action_forms":[{"key":"corrective","mandatory":true}]}'::jsonb,
  encode(extensions.digest('{"action_forms": [{"key": "corrective", "mandatory": true}]}'::jsonb::text,'sha256'),'hex'),
  '39000000-0000-0000-0000-000000000001'
);
set local session_replication_role = origin;
do $$
begin
  begin
    insert into public.submission_versions(
      inspection_id,version_number,snapshot,submitted_by
    ) values (
      '39000000-0000-0000-0000-000000000201',1,
      '{"package_version_id":"39000000-0000-0000-0000-000000000021"}',
      '39000000-0000-0000-0000-000000000001'
    );
    raise exception 'expected EXE-SUBMIT-ACTION-FORM-MISSING';
  exception when check_violation then
    if sqlerrm <> 'EXE-SUBMIT-ACTION-FORM-MISSING' then raise; end if;
  end;
  insert into public.action_forms(
    id,inspection_id,form_type,is_blocking
  ) values (
    '39000000-0000-0000-0000-000000000203','39000000-0000-0000-0000-000000000201',
    'corrective',true
  );
  begin
    insert into public.submission_versions(
      inspection_id,version_number,snapshot,submitted_by
    ) values (
      '39000000-0000-0000-0000-000000000201',1,
      '{"package_version_id":"39000000-0000-0000-0000-000000000021"}',
      '39000000-0000-0000-0000-000000000001'
    );
    raise exception 'expected EXE-SUBMIT-ACTION-FORM-INCOMPLETE';
  exception when check_violation then
    if sqlerrm <> 'EXE-SUBMIT-ACTION-FORM-INCOMPLETE:1' then raise; end if;
  end;
  update public.action_forms set owner_name='Owner',owner_role='Responsible manager',
    due_at=clock_timestamp()+interval '1 day',required_correction='Correct governed issue'
  where id='39000000-0000-0000-0000-000000000203';
  insert into public.submission_versions(
    id,inspection_id,version_number,snapshot,submitted_by
  ) values (
    '39000000-0000-0000-0000-000000000204','39000000-0000-0000-0000-000000000201',1,
    '{"package_version_id":"39000000-0000-0000-0000-000000000021"}',
    '39000000-0000-0000-0000-000000000001'
  );
end $$;

select 'Approval/Enforcement P0 contracts present; CR-471/472 and extra action-form fields Not configured; rollback follows' assertion;
rollback;
