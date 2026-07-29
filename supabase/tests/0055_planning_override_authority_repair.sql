\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729110000_planning_override_authority_repair.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)'
    ::regprocedure
  );
begin
  if position(
       'planning_closure_has_explicit_capability(''planning.override_assignment'')'
       in v_definition
     )=0
     or position(
       'planning_closure_has_explicit_capability(''planning.reassign'')'
       in v_definition
     )=0
     or position('has_capability(' in v_definition)>0 then
    raise exception 'REQ008_ASSERT: override must use Planning permissions';
  end if;
  if position('reassign_published_visits_atomic' in v_definition)=0
     or position('PLANNING_ASSIGNMENT_OVERRIDE' in v_definition)=0
     or position('override_audit_event_id' in v_definition)=0
     or position('override_reason_key' in v_definition)=0 then
    raise exception 'REQ008_ASSERT: reassignment, audit and receipt contract changed';
  end if;
end
$$;

-- Replay must be harmless and retain the same executable boundary.
\ir ../migrations/20260729110000_planning_override_authority_repair.sql

do $$
begin
  if not has_function_privilege(
    'authenticated',
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.override_planning_assignment_atomic(uuid,uuid,text,text,text,uuid)',
    'execute'
  ) then
    raise exception 'REQ008_ASSERT: override RPC grants are incorrect';
  end if;
end
$$;

rollback;
