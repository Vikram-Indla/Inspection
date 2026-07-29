\set ON_ERROR_STOP on
-- REQ-002/005 compatibility probe sequence 0051.
begin;

\ir ../migrations/20260729070000_planning_closure_capability_source_repair.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.planning_closure_has_explicit_capability(text)'::regprocedure
  );
begin
  if position('role_permissions' in v_definition)=0
     or position('permission_key' in v_definition)=0
     or position('role_capabilities' in v_definition)>0
     or position('capability_key' in v_definition)>0 then
    raise exception 'RAL-P25: closure authority must use Planning permissions';
  end if;
  if position('nullif(btrim(p.region)' in v_definition)=0 then
    raise exception 'RAL-P25: regional profile guard must remain installed';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.planning_closure_has_explicit_capability(text)',
    'execute'
  ) then
    raise exception 'RAL-P25: authenticated execution must remain available';
  end if;
end
$$;

\ir ../migrations/20260729070000_planning_closure_capability_source_repair.sql

rollback;
