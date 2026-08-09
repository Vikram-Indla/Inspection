-- Fix duplicate_terminal_visit_atomic: it inserted planning_process_commands
-- with status='completed', then UPDATEd the same row afterward to attach
-- result. guard_planning_closure_immutable (added after this function was
-- written) blocks any UPDATE on a planning_process_commands row whose OLD
-- status is already 'completed'/'partial_failed'/'failed' — errcode 55000
-- PLANNING-CLOSURE-COMMAND-IMMUTABLE. Every call failed at that final update.
--
-- Fix: pre-generate v_command, compute v_result first, and INSERT the
-- command row once with result already populated. No column, value, or
-- ordering of audit/outbox/lifecycle inserts changes — only the two
-- commands-table statements collapse into the single legal INSERT.

create or replace function public.duplicate_terminal_visit_atomic(
  p_visit_id uuid,
  p_expected_version bigint,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_visit public.visits%rowtype;
  v_method text;
  v_packages jsonb;
  v_payload jsonb;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_plan public.visit_plans%rowtype;
  v_draft_visit public.visits%rowtype;
  v_audit bigint;
  v_outbox uuid;
  v_now timestamptz:=transaction_timestamp();
  v_result jsonb;
begin
  if v_actor is null or p_visit_id is null or p_expected_version is null
     or nullif(btrim(p_idempotency_key),'') is null or p_correlation_id is null then
    raise exception using errcode='22023',message='PLANNING-DUPLICATE-REQUEST';
  end if;
  select * into v_visit from public.visits where id=p_visit_id for update;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-DUPLICATE-NOT-FOUND';
  end if;
  if not public.planning_closure_factory_in_scope(v_visit.factory_id)
     or v_visit.planning_status not in ('cancelled','expired')
     or v_visit.planning_version<>p_expected_version then
    raise exception using errcode='40001',message='PLANNING-DUPLICATE-STALE';
  end if;
  select coalesce(vp.method,'single') into v_method
  from (select v_visit.visit_plan_id as id) x
  left join public.visit_plans vp on vp.id=x.id;
  if not public.planning_closure_has_explicit_capability(
    case v_method when 'bulk' then 'planning.create.bulk'
                  else 'planning.create.single' end
  ) then
    raise exception using errcode='42501',message='PLANNING-DUPLICATE-DENIED';
  end if;
  select coalesce(jsonb_agg(distinct package_id),'[]'::jsonb) into v_packages
  from (
    select v_visit.package_version_id as package_id
    union
    select vp.package_version_id from public.visit_packages vp
    where vp.visit_id=p_visit_id
  ) p where package_id is not null;
  v_payload:=case when v_method='bulk' then jsonb_build_object(
    'selection',jsonb_build_array(v_visit.factory_id),
    'config',jsonb_build_object('picks','{}'::jsonb,
      'package_version_ids',v_packages,'window_start',v_visit.window_start,
      'window_end',v_visit.window_end,'notes',v_visit.notes,
      'priority',v_visit.priority),
    'acknowledged',false,'duplicated_from',p_visit_id
  ) else jsonb_build_object(
    'target',jsonb_build_object('factory_id',v_visit.factory_id),
    'config',jsonb_build_object('visit_type',v_visit.visit_type,
      'package_version_ids',v_packages,'execution_mode',v_visit.execution_mode,
      'window_start',v_visit.window_start,'window_end',v_visit.window_end,
      'notes',v_visit.notes,'priority',v_visit.priority),
    'duplicated_from',p_visit_id
  ) end;
  v_request:=jsonb_build_object('visit_id',p_visit_id,
    'expected_version',p_expected_version,'method',v_method,'payload',v_payload);
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-duplicate:'||v_actor::text||':'||p_idempotency_key,0));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation='duplicate_draft'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  insert into public.visit_plans(
    method,status,created_by,draft_payload,draft_version,source_channel
  ) values(v_method::public.planning_method,'draft',v_actor,v_payload,1,'planning.duplicate')
  returning * into v_plan;
  insert into public.visits(
    visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
    operational_state,window_start,window_end,package_version_id,priority,
    notes,source_channel
  ) values(
    v_plan.id,v_visit.factory_id,v_visit.visit_type,v_visit.execution_mode,
    'draft','new',v_visit.window_start,v_visit.window_end,
    v_visit.package_version_id,v_visit.priority,v_visit.notes,
    'planning.duplicate'
  ) returning * into v_draft_visit;
  v_command:=gen_random_uuid();
  insert into public.visit_lifecycle_events(
    visit_id,event_type,actor,previous
  ) values(p_visit_id,'duplicate',v_actor,jsonb_build_object(
    'planning_status',v_visit.planning_status,'planning_version',v_visit.planning_version,
    'duplicated_to_plan',v_plan.id,'duplicated_to_visit',v_draft_visit.id));
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values(v_actor,'visits',p_visit_id,'PLANNING_VISIT_DUPLICATE',
    to_jsonb(v_visit),jsonb_build_object('source_visit_id',p_visit_id,
      'new_plan_id',v_plan.id,'new_visit_id',v_draft_visit.id,
      'correlation_id',p_correlation_id),
    array['PLN-REQ-011','CORR-PLANNING-R01-R03-002']) returning id into v_audit;
  insert into public.workflow_outbox(
    idempotency_key,aggregate_type,aggregate_id,aggregate_version,
    side_effect_kind,payload,status,created_by
  ) values('planning:duplicate:'||p_visit_id||':'||v_plan.id,
    'plan',v_plan.id,1,'notify',jsonb_build_object(
      'operation','duplicate_draft','source_visit_id',p_visit_id,
      'new_visit_id',v_draft_visit.id,'correlation_id',p_correlation_id),
    'pending',v_actor) returning id into v_outbox;
  v_result:=jsonb_build_object('command_id',v_command,'operation','duplicate_draft',
    'source_visit_id',p_visit_id,'plan_id',v_plan.id,'visit_id',v_draft_visit.id,
    'method',v_method,'draft_version',1,'correlation_id',p_correlation_id,
    'audit_event_id',v_audit,'outbox_intent_id',v_outbox,'idempotent',false);
  insert into public.planning_process_commands(
    id,actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count,completed_at,result
  ) values(v_command,v_actor,'duplicate_draft',p_idempotency_key,p_correlation_id,
    v_request,v_hash,'completed',1,1,v_now,v_result);
  return v_result;
end
$$;
