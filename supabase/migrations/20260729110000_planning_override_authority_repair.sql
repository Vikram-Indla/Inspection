-- REQ-008 · Assignment override authority
-- Planning override/reassign permissions live in role_permissions. Replace the
-- two stale execution-capability lookups without changing the governed
-- reassignment, reason, idempotency, receipt or audit behavior.

do $migration$
declare
  v_oid oid;
  v_definition text;
  v_repaired text;
begin
  select p.oid into v_oid
  from pg_proc p
  where p.pronamespace='public'::regnamespace
    and p.proname='override_planning_assignment_atomic'
    and pg_get_function_identity_arguments(p.oid)=
      'p_visit_id uuid, p_inspector_id uuid, p_reason_key text, p_comment text, p_idempotency_key text, p_correlation_id uuid';
  if v_oid is null then
    raise exception 'planning override authority repair target is missing';
  end if;

  v_definition:=pg_get_functiondef(v_oid);
  if position(
       'planning_closure_has_explicit_capability(''planning.override_assignment'')'
       in v_definition
     )>0
     and position(
       'planning_closure_has_explicit_capability(''planning.reassign'')'
       in v_definition
     )>0
     and position('has_capability(' in v_definition)=0 then
    v_repaired:=v_definition;
  elsif position(
          'public.has_capability(''planning.override_assignment'')'
          in v_definition
        )=0
        or position(
          'public.has_capability(''planning.reassign'')'
          in v_definition
        )=0 then
    raise exception 'planning override authority repair target changed';
  else
    v_repaired:=replace(
      v_definition,
      'public.has_capability(''planning.override_assignment'')',
      'public.planning_closure_has_explicit_capability(''planning.override_assignment'')'
    );
    v_repaired:=replace(
      v_repaired,
      'public.has_capability(''planning.reassign'')',
      'public.planning_closure_has_explicit_capability(''planning.reassign'')'
    );
    execute v_repaired;
  end if;
end
$migration$;

revoke all on function public.override_planning_assignment_atomic(
  uuid,uuid,text,text,text,uuid
) from public,anon,service_role;
grant execute on function public.override_planning_assignment_atomic(
  uuid,uuid,text,text,text,uuid
) to authenticated;
