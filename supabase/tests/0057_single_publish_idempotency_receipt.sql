\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729130000_single_publish_idempotency_receipt.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.publish_single_visit_atomic_v2(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid,text,uuid)'
    ::regprocedure
  );
begin
  if position('pg_advisory_xact_lock' in v_definition)=0
     or position('planning_process_commands' in v_definition)=0
     or position('PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT' in v_definition)=0
     or position('publish_single_visit_atomic(' in v_definition)=0
     or position('assignment_id' in v_definition)=0
     or position('audit_event_id' in v_definition)=0
     or position('notification_count' in v_definition)=0
     or position('request_hash' in v_definition)=0
     or position('idempotent' in v_definition)=0 then
    raise exception 'REQ012_ASSERT: idempotent aggregate receipt is incomplete';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.planning_process_commands'::regclass
      and conname='planning_process_commands_operation_check'
      and pg_get_constraintdef(oid) like '%publish_single%'
  ) then
    raise exception 'REQ012_ASSERT: publish command operation is unavailable';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.publish_single_visit_atomic_v2(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid,text,uuid)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.publish_single_visit_atomic_v2(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid,text,uuid)',
    'execute'
  ) then
    raise exception 'REQ012_ASSERT: publish receipt RPC grants are incorrect';
  end if;
end
$$;

\ir ../migrations/20260729130000_single_publish_idempotency_receipt.sql

rollback;
