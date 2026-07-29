-- Single visit supervision lifecycle
-- Planner submits a complete target and optional preferred inspector. A
-- Supervisor then confirms/replaces the inspector and releases the visit in
-- one audited transaction. No pending request can reach Execution.

create table if not exists public.planning_supervision_requests (
  id uuid primary key default gen_random_uuid(),
  visit_plan_id uuid not null unique references public.visit_plans(id) on delete cascade,
  visit_id uuid not null unique references public.visits(id) on delete cascade,
  submitted_by uuid not null references public.profiles(user_id),
  proposed_inspector_id uuid references public.profiles(user_id),
  status text not null default 'pending' check (status in ('pending','approved','returned','rejected')),
  decision_by uuid references public.profiles(user_id),
  decision_reason text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  check ((status = 'pending' and decision_by is null and decided_at is null)
      or (status <> 'pending' and decision_by is not null and decided_at is not null))
);

alter table public.planning_supervision_requests enable row level security;
drop policy if exists planning_supervision_requests_read on public.planning_supervision_requests;
create policy planning_supervision_requests_read on public.planning_supervision_requests for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('planning.approve'));

create or replace function public.submit_single_visit_for_supervision(
  p_factory_id uuid,
  p_package_version_ids uuid[],
  p_proposed_inspector_id uuid,
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
  p_resume_plan_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_visit_id uuid;
  v_plan_id uuid;
  v_package_ids uuid[] := coalesce(p_package_version_ids, '{}'::uuid[]);
  v_package_id uuid;
  v_source text := nullif(btrim(p_source_channel), '');
  v_target_source text;
  v_target_license text;
  v_target_cr text;
  v_target_plant text;
  v_internal_reference text;
  v_factory record;
begin
  if v_actor is null or not public.has_planning_capability('planning.submit_for_supervision') then
    raise exception 'PLANNING-SUPERVISION-SUBMIT-DENIED' using errcode = '42501';
  end if;
  if p_window_end <= p_window_start then
    raise exception 'PLANNING-SUPERVISION-WINDOW' using errcode = '22023';
  end if;
  if p_visit_type not in ('periodic','follow_up','complaint') then
    raise exception 'PLANNING-SUPERVISION-VISIT-TYPE' using errcode = '22023';
  end if;
  if not p_location_confirmed then
    raise exception 'PLANNING-SUPERVISION-LOCATION' using errcode = '22023';
  end if;
  if v_source is null or v_source !~ '^[a-z0-9][a-z0-9._-]{0,39}$' then
    raise exception 'PLANNING-SUPERVISION-SOURCE' using errcode = '22023';
  end if;
  if cardinality(v_package_ids) > 20
     or cardinality(v_package_ids) <> (select count(distinct id) from unnest(v_package_ids) id) then
    raise exception 'PLANNING-SUPERVISION-PACKAGES' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(v_package_ids) id where not exists (
      select 1 from public.package_versions pv
      where pv.id = id and pv.status in ('published','locked')
        and (pv.effective_from is null or pv.effective_from <= current_date)
        and (pv.effective_to is null or pv.effective_to >= current_date)
    )
  ) then raise exception 'PLANNING-SUPERVISION-PACKAGE' using errcode = '22023'; end if;

  select id, license_number, official_lat, official_lng into v_factory
  from public.factories where id = p_factory_id for share;
  if not found then raise exception 'PLANNING-SUPERVISION-FACTORY' using errcode = '22023'; end if;
  if p_license_number is distinct from v_factory.license_number then
    raise exception 'PLANNING-SUPERVISION-LICENSE' using errcode = '22023';
  end if;
  if v_factory.official_lat is null or v_factory.official_lng is null then
    if p_planner_lat is null or p_planner_lng is null then
      raise exception 'PLANNING-SUPERVISION-LOCATION' using errcode = '22023';
    end if;
  end if;

  if jsonb_typeof(p_target) is distinct from 'object'
     or nullif(p_target ->> 'factory_id','') is null
     or p_target ->> 'factory_id' <> p_factory_id::text then
    raise exception 'PLANNING-SUPERVISION-TARGET' using errcode = '22023';
  end if;
  v_target_source := coalesce(nullif(p_target ->> 'source',''), 'legacy');
  v_target_license := nullif(p_target ->> 'license_number','');
  v_target_cr := nullif(p_target ->> 'cr_number','');
  v_target_plant := nullif(p_target ->> 'plant_number','');
  if v_target_source = 'canonical' and (
    v_target_license is null or v_target_cr is null or v_target_plant is null or not exists (
      select 1 from public.industrial_licenses il
      join public.commercial_registrations cr on cr.id=il.commercial_registration_id
      where il.factory_id=p_factory_id and il.license_number=v_target_license
        and il.plant_number=v_target_plant and cr.cr_number=v_target_cr
    )
  ) then raise exception 'PLANNING-SUPERVISION-CANONICAL-TARGET' using errcode='22023'; end if;
  if v_target_source not in ('canonical','legacy') then
    raise exception 'PLANNING-SUPERVISION-TARGET-SOURCE' using errcode='22023';
  end if;

  if p_proposed_inspector_id is not null and not exists (
    select 1 from public.user_roles where user_id=p_proposed_inspector_id and role_key='inspector'
  ) then raise exception 'PLANNING-SUPERVISION-PROPOSED-INSPECTOR' using errcode='22023'; end if;
  if exists (
    select 1 from public.visits v where v.factory_id=p_factory_id and v.visit_type=p_visit_type
      and v.planning_status in ('draft','validated','pending_supervision','published','returned')
  ) then raise exception 'PLANNING-SUPERVISION-DUPLICATE' using errcode='23505'; end if;

  if p_resume_plan_id is not null then
    select id into v_plan_id from public.visit_plans
      where id=p_resume_plan_id and created_by=v_actor and method='single' and status='draft'
        and not exists (select 1 from public.visits v where v.visit_plan_id=visit_plans.id)
      for update;
    if v_plan_id is null then raise exception 'PLANNING-SUPERVISION-RESUME' using errcode='22023'; end if;
    update public.visit_plans set status='pending_supervision', source_channel=v_source,
      criteria=coalesce(criteria,'{}'::jsonb)||jsonb_build_object('target',p_target)
      where id=v_plan_id;
  else
    insert into public.visit_plans(method,status,created_by,criteria,source_channel)
      values ('single','pending_supervision',v_actor,jsonb_build_object('target',p_target),v_source)
      returning id into v_plan_id;
  end if;

  v_internal_reference := concat_ws('/',v_target_cr,v_target_license,v_target_plant);
  insert into public.visits(
    visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,
    window_start,window_end,package_version_id,planner_lat,planner_lng,notes,source_channel,internal_reference
  ) values (
    v_plan_id,p_factory_id,p_visit_type,p_execution_mode,'pending_supervision','new',
    p_window_start,p_window_end,case when cardinality(v_package_ids)>0 then v_package_ids[1] else null end,
    p_planner_lat,p_planner_lng,nullif(btrim(p_notes),''),v_source,nullif(v_internal_reference,'')
  ) returning id into v_visit_id;

  foreach v_package_id in array v_package_ids loop
    insert into public.visit_packages(visit_id,package_version_id,snapshot,added_by)
    select v_visit_id,pv.id,jsonb_build_object(
      'package_version_id',pv.id,'code',p.code,'title',p.title,'version_label',pv.version_label,
      'status',pv.status,'captured_at',now()),v_actor
    from public.package_versions pv join public.packages p on p.id=pv.package_id where pv.id=v_package_id;
  end loop;

  insert into public.planning_supervision_requests(visit_plan_id,visit_id,submitted_by,proposed_inspector_id)
    values(v_plan_id,v_visit_id,v_actor,p_proposed_inspector_id);
  insert into public.notifications(event_key,recipient,payload,channel)
    select 'planning_supervision_requested',ur.user_id,
      jsonb_build_object('visit_id',v_visit_id,'plan_id',v_plan_id,'submitted_by',v_actor),'inapp'
    from public.user_roles ur where ur.role_key='supervisor';
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
    values(v_actor,'visit_plans',v_plan_id,'SINGLE_VISIT_SUBMITTED_FOR_SUPERVISION',
      jsonb_build_object('visit_id',v_visit_id,'target',p_target,'proposed_inspector_id',p_proposed_inspector_id),
      array['PLN-SUP-001','PLN-SUP-002']);
  return v_visit_id;
end $$;

create or replace function public.decide_single_visit_supervision(
  p_visit_id uuid,
  p_decision text,
  p_inspector_id uuid default null,
  p_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = public
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
    if p_inspector_id is null or not exists(select 1 from public.user_roles where user_id=p_inspector_id and role_key='inspector') then
      raise exception 'PLANNING-SUPERVISION-INSPECTOR-REQUIRED' using errcode='22023';
    end if;
    if exists(
      select 1 from public.assignments a join public.visits v on v.id=a.visit_id
      where a.inspector_id=p_inspector_id and v.planning_status in ('published','returned')
        and v.window_start<v_visit.window_end and v.window_end>v_visit.window_start
    ) then raise exception 'PLANNING-SUPERVISION-INSPECTOR-UNAVAILABLE' using errcode='23505'; end if;
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
end $$;

revoke all on function public.submit_single_visit_for_supervision(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid) from public,anon;
grant execute on function public.submit_single_visit_for_supervision(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid) to authenticated;
revoke all on function public.decide_single_visit_supervision(uuid,text,uuid,text) from public,anon;
grant execute on function public.decide_single_visit_supervision(uuid,text,uuid,text) to authenticated;
