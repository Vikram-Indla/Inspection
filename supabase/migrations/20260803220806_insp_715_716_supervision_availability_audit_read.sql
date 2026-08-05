-- INSP-715 / INSP-716: one availability predicate for supervision display and
-- release, plus least-privilege read access to the resulting audit evidence.

create or replace function private.supervision_inspector_is_available(
  p_inspector_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_exclude_visit_id uuid default null
) returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_inspector_id and ur.role_key = 'inspector'
  ) and not exists (
    select 1
    from public.assignments a
    join public.visits v on v.id = a.visit_id
    where a.inspector_id = p_inspector_id
      and v.planning_status in ('published','returned')
      and v.id is distinct from p_exclude_visit_id
      and v.window_start < p_window_end
      and v.window_end > p_window_start
  );
$$;

revoke all on function private.supervision_inspector_is_available(uuid,timestamptz,timestamptz,uuid) from public, anon, authenticated;

create or replace function public.list_available_supervision_inspectors(
  p_visit_ids uuid[]
) returns table(visit_id uuid, inspector_id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_permission('planning.approve') then
    raise exception 'PLANNING-SUPERVISION-ROSTER-DENIED' using errcode='42501';
  end if;
  if coalesce(cardinality(p_visit_ids), 0) = 0 or cardinality(p_visit_ids) > 100 then
    raise exception 'PLANNING-SUPERVISION-ROSTER-SCOPE' using errcode='22023';
  end if;
  return query
    select r.visit_id, ur.user_id, p.full_name
    from public.planning_supervision_requests r
    join public.visits v on v.id = r.visit_id
    cross join public.user_roles ur
    left join public.profiles p on p.user_id = ur.user_id
    where r.visit_id = any(p_visit_ids)
      and r.status = 'pending'
      and v.planning_status = 'pending_supervision'
      and ur.role_key = 'inspector'
      and private.supervision_inspector_is_available(ur.user_id, v.window_start, v.window_end, v.id)
    order by r.visit_id, coalesce(nullif(btrim(p.full_name), ''), ur.user_id::text);
end;
$$;

revoke all on function public.list_available_supervision_inspectors(uuid[]) from public, anon;
grant execute on function public.list_available_supervision_inspectors(uuid[]) to authenticated;

create or replace function public.decide_single_visit_supervision(
  p_visit_id uuid,
  p_decision text,
  p_inspector_id uuid default null,
  p_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.planning_supervision_requests%rowtype;
  v_visit public.visits%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
begin
  if v_actor is null then raise exception 'PLANNING-SUPERVISION-DECISION-DENIED' using errcode='42501'; end if;
  if p_decision='approve' and not public.has_permission('planning.approve') then raise exception 'PLANNING-SUPERVISION-DECISION-DENIED' using errcode='42501'; end if;
  if p_decision='return' and not public.has_permission('planning.return') then raise exception 'PLANNING-SUPERVISION-DECISION-DENIED' using errcode='42501'; end if;
  if p_decision='reject' and not public.has_permission('planning.reject') then raise exception 'PLANNING-SUPERVISION-DECISION-DENIED' using errcode='42501'; end if;
  if p_decision not in ('approve','return','reject') then raise exception 'PLANNING-SUPERVISION-DECISION' using errcode='22023'; end if;
  if p_decision in ('return','reject') and v_reason is null then raise exception 'PLANNING-SUPERVISION-REASON' using errcode='22023'; end if;

  select * into v_request from public.planning_supervision_requests where visit_id=p_visit_id for update;
  if not found or v_request.status<>'pending' then raise exception 'PLANNING-SUPERVISION-NOT-PENDING' using errcode='22023'; end if;
  if v_request.submitted_by=v_actor then raise exception 'PLANNING-SUPERVISION-SELF-DECISION' using errcode='42501'; end if;
  select * into v_visit from public.visits where id=p_visit_id for update;
  if not found or v_visit.planning_status<>'pending_supervision' then raise exception 'PLANNING-SUPERVISION-VISIT-STATE' using errcode='22023'; end if;

  if p_decision='approve' then
    if p_inspector_id is null then
      raise exception 'PLANNING-SUPERVISION-INSPECTOR-REQUIRED' using errcode='22023';
    end if;
    if not private.supervision_inspector_is_available(p_inspector_id, v_visit.window_start, v_visit.window_end, v_visit.id) then
      raise exception 'PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE' using errcode='23505';
    end if;
    insert into public.assignments(visit_id,inspector_id,method,candidates)
      values(p_visit_id,p_inspector_id,'manual',jsonb_build_object('confirmed_by',v_actor,'proposed_inspector_id',v_request.proposed_inspector_id));
    update public.visits set planning_status='published' where id=p_visit_id;
    update public.visit_plans set status='published',published_at=now() where id=v_request.visit_plan_id;
    update public.planning_supervision_requests set status='approved',decision_by=v_actor,decision_reason=v_reason,decided_at=now() where id=v_request.id;
    insert into public.notifications(event_key,recipient,payload,channel)
      values('assignment',p_inspector_id,jsonb_build_object('visit_id',p_visit_id,'supervised',true),'push');
  else
    update public.visits set planning_status=case when p_decision='return' then 'returned'::public.planning_status else 'cancelled'::public.planning_status end where id=p_visit_id;
    update public.visit_plans set status=case when p_decision='return' then 'returned'::public.planning_status else 'cancelled'::public.planning_status end where id=v_request.visit_plan_id;
    update public.planning_supervision_requests set status=case when p_decision='return' then 'returned' else 'rejected' end, decision_by=v_actor,decision_reason=v_reason,decided_at=now() where id=v_request.id;
    insert into public.notifications(event_key,recipient,payload,channel)
      values('planning_supervision_'||case when p_decision='return' then 'returned' else 'rejected' end,v_request.submitted_by,jsonb_build_object('visit_id',p_visit_id,'reason',v_reason),'inapp');
  end if;
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
    values(v_actor,'planning_supervision_requests',v_request.id,'SINGLE_VISIT_SUPERVISION_'||upper(p_decision),
      jsonb_build_object('visit_id',p_visit_id,'inspector_id',p_inspector_id,'reason',v_reason),array['PLN-SUP-003']);
  return p_visit_id;
end;
$$;

revoke all on function public.decide_single_visit_supervision(uuid,text,uuid,text) from public, anon;
grant execute on function public.decide_single_visit_supervision(uuid,text,uuid,text) to authenticated;

drop policy if exists audit_read_planning_supervision on public.audit_events;
create policy audit_read_planning_supervision on public.audit_events for select to authenticated
using (
  object_type = 'planning_supervision_requests'
  and (select public.has_permission('planning.approve'))
  and exists (
    select 1 from public.planning_supervision_requests r
    where r.id = audit_events.object_id
  )
);
