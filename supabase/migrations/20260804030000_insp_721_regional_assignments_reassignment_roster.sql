-- INSP-721: fail-closed regional assignment reads and request-scoped reassignment.
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using (
  inspector_id=(select auth.uid())
  or (select public.has_internal_role('admin'))
  or (select public.has_any_role(array['ops','reviewer','auditor']))
  or ((select public.planning_closure_has_explicit_capability('planning.view'))
      and public.planning_closure_factory_in_scope(
        (select v.factory_id from public.visits v where v.id=assignments.visit_id)))
);

create or replace function public.list_available_reassignment_inspectors(p_visit_ids uuid[])
returns table(visit_id uuid,inspector_id uuid,full_name text)
language plpgsql stable security definer set search_path=''
as $$
declare v_requested integer:=coalesce(cardinality(p_visit_ids),0);
begin
  if auth.uid() is null or not public.planning_closure_has_explicit_capability('planning.reassign') then
    raise exception 'PLANNING-REASSIGN-ROSTER-DENIED' using errcode='42501';
  end if;
  if v_requested=0 or v_requested>100 then
    raise exception 'PLANNING-REASSIGN-ROSTER-SCOPE' using errcode='22023';
  end if;
  if (select count(distinct v.id) from public.visits v where v.id=any(p_visit_ids))<>v_requested
     or exists(select 1 from public.visits v where v.id=any(p_visit_ids)
       and not public.planning_closure_factory_in_scope(v.factory_id)) then
    raise exception 'PLANNING-REASSIGN-ROSTER-DENIED' using errcode='42501';
  end if;
  return query select v.id,ur.user_id,coalesce(nullif(btrim(p.full_name),''),ur.user_id::text)
    from public.visits v cross join public.user_roles ur
    left join public.profiles p on p.user_id=ur.user_id
    where v.id=any(p_visit_ids) and v.planning_status in ('published','returned')
      and v.operational_state='new' and ur.role_key='inspector'
      and private.supervision_inspector_is_available(ur.user_id,v.window_start,v.window_end,v.id)
    order by v.id,coalesce(nullif(btrim(p.full_name),''),ur.user_id::text);
end $$;
revoke all on function public.list_available_reassignment_inspectors(uuid[]) from public,anon,service_role;
grant execute on function public.list_available_reassignment_inspectors(uuid[]) to authenticated;

create or replace function public.reassign_published_visits_atomic(
  p_visit_ids uuid[],p_inspector_id uuid,p_reason text,p_idempotency_key text,
  p_correlation_id uuid default gen_random_uuid()) returns jsonb
language plpgsql security definer set search_path=''
as $$
begin
  if not public.planning_closure_has_explicit_capability('planning.reassign') then
    raise exception 'PLANNING-REASSIGN-DENIED' using errcode='42501'; end if;
  if coalesce(cardinality(p_visit_ids),0)=0 or exists(select 1 from public.visits v
    where v.id=any(coalesce(p_visit_ids,'{}'::uuid[]))
      and not public.planning_closure_factory_in_scope(v.factory_id)) then
    raise exception 'PLANNING-CLOSURE-SCOPE-DENIED' using errcode='42501'; end if;
  if exists(select 1 from public.visits v where v.id=any(p_visit_ids)
    and not private.supervision_inspector_is_available(p_inspector_id,v.window_start,v.window_end,v.id)) then
    raise exception 'PLANNING-REASSIGN-INSPECTOR-UNAVAILABLE' using errcode='23505'; end if;
  if exists(select 1 from public.visits a join public.visits b on a.id<b.id
    and a.window_start<b.window_end and a.window_end>b.window_start
    where a.id=any(p_visit_ids) and b.id=any(p_visit_ids)) then
    raise exception 'PLANNING-REASSIGN-SELECTION-OVERLAP' using errcode='23505'; end if;
  return public.mutate_published_visits_atomic(p_visit_ids,'reassign',
    jsonb_build_object('inspector_id',p_inspector_id),p_reason,p_idempotency_key,p_correlation_id);
end $$;
revoke all on function public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid) from public,anon,service_role;
grant execute on function public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid) to authenticated;
