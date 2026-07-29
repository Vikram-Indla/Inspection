-- ACT-004 / REQ-005 / REQ-008 · forward sequence 20260729061000
-- Preserve the governed planning_method enum when saving or resuming drafts.
-- The original closure function accepted text at its API boundary but passed
-- it into visit_plans.method without an explicit cast (SQLSTATE 42804).
create or replace function public.save_planning_draft_atomic(
  p_plan_id uuid,
  p_method text,
  p_draft_payload jsonb,
  p_criteria jsonb,
  p_expected_version integer,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_plan public.visit_plans%rowtype;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_audit bigint;
  v_outbox uuid;
  v_now timestamptz:=transaction_timestamp();
  v_result jsonb;
begin
  if v_actor is null or p_method not in ('single','bulk')
     or jsonb_typeof(coalesce(p_draft_payload,'{}'))<>'object'
     or jsonb_typeof(coalesce(p_criteria,'{}'))<>'object'
     or nullif(btrim(p_idempotency_key),'') is null
     or p_correlation_id is null
     or not public.planning_closure_has_explicit_capability(
       case p_method when 'single' then 'planning.create.single'
                     else 'planning.create.bulk' end
     ) then
    raise exception using errcode='42501',message='PLANNING-DRAFT-DENIED';
  end if;
  v_request:=jsonb_build_object('plan_id',p_plan_id,'method',p_method,
    'draft_payload',p_draft_payload,'criteria',p_criteria,
    'expected_version',p_expected_version);
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-draft:'||v_actor::text||':'||p_idempotency_key,0));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation='draft_save'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  if p_plan_id is null then
    if p_expected_version is not null then
      raise exception using errcode='22023',message='PLANNING-DRAFT-VERSION';
    end if;
    insert into public.visit_plans(
      method,status,created_by,draft_payload,draft_version,source_channel,criteria
    ) values (
      p_method::public.planning_method,'draft',v_actor,p_draft_payload,1,
      'planning.'||p_method,p_criteria
    ) returning * into v_plan;
  else
    select * into v_plan from public.visit_plans where id=p_plan_id for update;
    if not found or v_plan.created_by<>v_actor
       or v_plan.method<>p_method::public.planning_method
       or v_plan.status<>'draft' or v_plan.archived_at is not null
       or v_plan.draft_version is distinct from p_expected_version then
      raise exception using errcode='40001',message='PLANNING-DRAFT-STALE';
    end if;
    update public.visit_plans set draft_payload=p_draft_payload,
      criteria=p_criteria,draft_version=draft_version+1,
      source_channel='planning.'||p_method
    where id=p_plan_id returning * into v_plan;
  end if;

  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count,completed_at
  ) values(v_actor,'draft_save',p_idempotency_key,p_correlation_id,v_request,
    v_hash,'running',1,0,null) returning id into v_command;
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values(v_actor,'visit_plans',v_plan.id,'PLANNING_DRAFT_SAVE',null,
    to_jsonb(v_plan)||jsonb_build_object('correlation_id',p_correlation_id),
    array['CORR-PLANNING-R01-R03-002']) returning id into v_audit;
  insert into public.workflow_outbox(
    idempotency_key,aggregate_type,aggregate_id,aggregate_version,
    side_effect_kind,payload,status,created_by
  ) values('planning:draft-save:'||v_plan.id||':'||v_plan.draft_version,
    'plan',v_plan.id,v_plan.draft_version,'notify',
    jsonb_build_object('operation','draft_save','plan_id',v_plan.id,
      'correlation_id',p_correlation_id),'pending',v_actor)
  returning id into v_outbox;
  v_result:=jsonb_build_object('command_id',v_command,'plan_id',v_plan.id,
    'plan_reference',v_plan.plan_reference,'method',v_plan.method,
    'draft_version',v_plan.draft_version,'server_transaction_time',v_now,
    'correlation_id',p_correlation_id,'audit_event_id',v_audit,
    'outbox_intent_id',v_outbox,'idempotent',false);
  update public.planning_process_commands
  set status='completed',applied_count=1,completed_at=v_now,result=v_result
  where id=v_command;
  return v_result;
end
$$;

revoke all on function public.save_planning_draft_atomic(
  uuid,text,jsonb,jsonb,integer,text,uuid
) from public, anon;
grant execute on function public.save_planning_draft_atomic(
  uuid,text,jsonb,jsonb,integer,text,uuid
) to authenticated;
