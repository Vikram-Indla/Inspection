-- SCR-IPAD-600 · MVP1-M03-002 · STM-ASG-001
-- Canonical Assigned -> Preparing leg. The function owns authorization,
-- compare-and-set state validation and append-only audit as one transaction.
create or replace function public.accept_prepare_assignment(p_visit uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_assignment public.assignments%rowtype;
  v_planning_status public.planning_status;
begin
  if v_actor is null then
    raise insufficient_privilege using message = 'ASSIGNMENT_PREPARE_UNAUTHENTICATED';
  end if;

  select a.* into v_assignment
    from public.assignments a
   where a.visit_id = p_visit
     and a.inspector_id = v_actor
   order by a.created_at desc
   limit 1
   for update;

  if not found then
    raise insufficient_privilege using message = 'ASSIGNMENT_PREPARE_DENIED';
  end if;

  if v_assignment.status <> 'assigned' then
    raise check_violation using message = 'ASSIGNMENT_PREPARE_STATE';
  end if;

  select v.planning_status into v_planning_status
    from public.visits v
   where v.id = p_visit;
  if v_planning_status <> 'published' then
    raise check_violation using message = 'ASSIGNMENT_PREPARE_VISIT_STATE';
  end if;

  update public.assignments
     set status = 'preparing'
   where id = v_assignment.id
     and status = 'assigned';

  if not found then
    raise serialization_failure using message = 'ASSIGNMENT_PREPARE_CONFLICT';
  end if;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor,
    'assignment',
    v_assignment.id,
    'accept_prepare',
    jsonb_build_object('status', 'assigned', 'visit_id', p_visit),
    jsonb_build_object('status', 'preparing', 'visit_id', p_visit),
    array['MVP1-M03-002', 'STM-ASG-001']
  );

  return jsonb_build_object(
    'assignment_id', v_assignment.id,
    'visit_id', p_visit,
    'status', 'preparing'
  );
end
$$;

revoke all on function public.accept_prepare_assignment(uuid) from public, anon;
grant execute on function public.accept_prepare_assignment(uuid) to authenticated;

comment on function public.accept_prepare_assignment(uuid) is
  'SCR-IPAD-600 canonical STM-ASG-001 Assigned -> Preparing transition for the current assigned inspector, with append-only audit.';
