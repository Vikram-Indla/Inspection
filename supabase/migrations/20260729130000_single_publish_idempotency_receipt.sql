-- REQ-012 · Idempotent aggregate publish receipt
-- Wrap the existing all-or-nothing publisher with a stable command key and
-- receipt. A retry with the same request returns the original visit; a reused
-- key with different content fails. Any inner failure rolls back the command.

alter table public.planning_process_commands
  drop constraint if exists planning_process_commands_operation_check;
alter table public.planning_process_commands
  add constraint planning_process_commands_operation_check check (
    operation in (
      'cancel','reschedule','archive_draft','expire','bulk',
      'return','republish','repackage','metadata',
      'duplicate_draft','draft_save','publish_single'
    )
  );

create or replace function public.publish_single_visit_atomic_v2(
  p_factory_id uuid,
  p_package_version_ids uuid[],
  p_inspector_id uuid,
  p_visit_type text,
  p_execution_mode public.execution_mode,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_license_number text,
  p_location_confirmed boolean,
  p_planner_lat numeric,
  p_planner_lng numeric,
  p_notes text,
  p_target jsonb,
  p_source_channel text,
  p_resume_plan_id uuid,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_visit uuid;
  v_plan uuid;
  v_assignment uuid;
  v_audit bigint;
  v_notification_count integer;
  v_result jsonb;
begin
  if v_actor is null
     or nullif(btrim(p_idempotency_key),'') is null
     or p_correlation_id is null then
    raise exception using errcode='42501',
      message='PLANNING-SINGLE-PUBLISH-REQUEST';
  end if;
  v_request:=jsonb_build_object(
    'factory_id',p_factory_id,
    'package_version_ids',coalesce(p_package_version_ids,'{}'::uuid[]),
    'inspector_id',p_inspector_id,
    'visit_type',p_visit_type,
    'execution_mode',p_execution_mode,
    'window_start',p_window_start,
    'window_end',p_window_end,
    'license_number',p_license_number,
    'location_confirmed',p_location_confirmed,
    'planner_lat',p_planner_lat,
    'planner_lng',p_planner_lng,
    'notes',p_notes,
    'target',p_target,
    'source_channel',p_source_channel,
    'resume_plan_id',p_resume_plan_id
  );
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-publish-single:'||v_actor::text||':'||p_idempotency_key,0
  ));
  select * into v_existing
  from public.planning_process_commands
  where actor=v_actor
    and operation='publish_single'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count
  ) values (
    v_actor,'publish_single',p_idempotency_key,p_correlation_id,v_request,
    v_hash,'running',1,0
  ) returning id into v_command;

  v_visit:=public.publish_single_visit_atomic(
    p_factory_id,p_package_version_ids,p_inspector_id,p_visit_type,
    p_execution_mode,p_window_start,p_window_end,p_license_number,
    p_location_confirmed,p_planner_lat,p_planner_lng,p_notes,p_target,
    p_source_channel,p_resume_plan_id
  );
  select visit_plan_id into v_plan from public.visits where id=v_visit;
  select id into v_assignment
    from public.assignments where visit_id=v_visit
    order by created_at desc limit 1;
  select id into v_audit
    from public.audit_events
    where object_type='visit_plans'
      and object_id=v_plan
      and action='SINGLE_VISIT_PUBLISHED_ATOMIC'
    order by occurred_at desc limit 1;
  select count(*) into v_notification_count
    from public.notifications n
    where n.payload->>'visit_id'=v_visit::text;
  if v_plan is null or v_assignment is null or v_audit is null
     or v_notification_count<1 then
    raise exception using errcode='P0001',
      message='PLANNING-SINGLE-PUBLISH-RECEIPT';
  end if;

  v_result:=jsonb_build_object(
    'command_id',v_command,
    'visit_id',v_visit,
    'plan_id',v_plan,
    'assignment_id',v_assignment,
    'audit_event_id',v_audit,
    'notification_count',v_notification_count,
    'correlation_id',p_correlation_id,
    'request_hash',v_hash,
    'server_transaction_time',transaction_timestamp(),
    'idempotent',false
  );
  update public.planning_process_commands
  set status='completed',applied_count=1,
      completed_at=transaction_timestamp(),result=v_result
  where id=v_command;
  return v_result;
end
$$;

revoke all on function public.publish_single_visit_atomic_v2(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid,text,uuid
) from public,anon,service_role;
grant execute on function public.publish_single_visit_atomic_v2(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid,text,uuid
) to authenticated;
