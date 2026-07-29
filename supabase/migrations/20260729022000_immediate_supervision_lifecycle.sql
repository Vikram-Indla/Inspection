-- Immediate visits are urgent, not an approval bypass. A Planner or
-- Supervisor may submit one only for an exact registered target; a different
-- Supervisor confirms the Inspector and releases it through the shared queue.

create or replace function public.submit_immediate_visit_for_supervision(
  p_request_id uuid,
  p_factory_id uuid,
  p_package_version_id uuid default null,
  p_proposed_inspector_id uuid default null,
  p_visit_type text default 'complaint',
  p_window_start timestamptz default null,
  p_window_end timestamptz default null,
  p_urgency_reason text default null,
  p_priority text default null,
  p_notes text default null,
  p_lat numeric default null,
  p_lng numeric default null,
  p_location_source text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_factory record;
  v_license record;
  v_count integer;
  v_visit_id uuid;
  v_plan_id uuid;
  v_reason text := nullif(btrim(coalesce(p_urgency_reason,'')), '');
begin
  if v_actor is null
     or not (public.has_internal_role('planner') or public.has_internal_role('supervisor'))
     or not public.has_planning_capability('planning.create.immediate') then
    raise exception 'IMMEDIATE-SUPERVISION-SUBMIT-DENIED' using errcode='42501';
  end if;
  if p_request_id is null then raise exception 'IMMEDIATE-SUPERVISION-REQUEST' using errcode='22023'; end if;
  select id into v_visit_id from public.visits
    where creation_request_id=p_request_id and created_by=v_actor;
  if v_visit_id is not null then return v_visit_id; end if;
  if v_reason not in ('Complaint received','Incident / accident report','Referral from authority','Other') then
    raise exception 'IMMEDIATE-SUPERVISION-REASON' using errcode='22023';
  end if;
  if p_visit_type not in ('periodic','follow_up','complaint') then raise exception 'IMMEDIATE-SUPERVISION-VISIT-TYPE' using errcode='22023'; end if;
  if p_window_start is null or p_window_end is null or p_window_end<=p_window_start
     or p_window_start < clock_timestamp() - interval '15 minutes'
     or p_window_start > clock_timestamp() + interval '24 hours' then
    raise exception 'IMMEDIATE-SUPERVISION-WINDOW' using errcode='22023';
  end if;
  select * into v_factory from public.factories where id=p_factory_id and not is_temporary for share;
  if not found then raise exception 'IMMEDIATE-SUPERVISION-FACTORY' using errcode='22023'; end if;
  if p_location_source not in ('official','manual') or p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'IMMEDIATE-SUPERVISION-LOCATION' using errcode='22023';
  end if;
  if p_location_source='official' and (v_factory.official_lat is distinct from p_lat or v_factory.official_lng is distinct from p_lng) then
    raise exception 'IMMEDIATE-SUPERVISION-OFFICIAL-LOCATION' using errcode='22023';
  end if;
  select count(*) into v_count from public.industrial_licenses where factory_id=p_factory_id;
  if v_count <> 1 then raise exception 'IMMEDIATE-SUPERVISION-TARGET-AMBIGUOUS' using errcode='22023'; end if;
  select il.license_number, il.plant_number, cr.cr_number into v_license
  from public.industrial_licenses il join public.commercial_registrations cr on cr.id=il.commercial_registration_id
  where il.factory_id=p_factory_id;
  if p_package_version_id is not null and not exists (
    select 1 from public.package_versions where id=p_package_version_id and status in ('published','locked')
      and (effective_from is null or effective_from<=current_date) and (effective_to is null or effective_to>=current_date)
  ) then raise exception 'IMMEDIATE-SUPERVISION-PACKAGE' using errcode='22023'; end if;
  if p_proposed_inspector_id is not null and not exists (
    select 1 from public.user_roles where user_id=p_proposed_inspector_id and role_key='inspector'
  ) then raise exception 'IMMEDIATE-SUPERVISION-PROPOSED-INSPECTOR' using errcode='22023'; end if;
  if exists(select 1 from public.visits where factory_id=p_factory_id and planning_status in ('draft','validated','pending_supervision','published','returned')) then
    raise exception 'IMMEDIATE-SUPERVISION-DUPLICATE' using errcode='23505';
  end if;

  insert into public.visit_plans(method,status,created_by,criteria,source_channel)
  values ('immediate','pending_supervision',v_actor,
    jsonb_build_object('target',jsonb_build_object('factory_id',p_factory_id,'cr_number',v_license.cr_number,'license_number',v_license.license_number,'plant_number',v_license.plant_number,'source','canonical'),'urgency_reason',v_reason),
    'planning.immediate') returning id into v_plan_id;
  insert into public.visits(
    visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,
    window_start,window_end,package_version_id,planner_lat,planner_lng,notes,source_channel,internal_reference,
    created_by,immediate_creator_role,immediate_reason,creation_request_id,visit_location_source,priority
  ) values (
    v_plan_id,p_factory_id,p_visit_type,'physical','pending_supervision','new',p_window_start,p_window_end,p_package_version_id,
    p_lat,p_lng,nullif(btrim(p_notes),''),'planning.immediate',concat_ws('/',v_license.cr_number,v_license.license_number,v_license.plant_number),
    v_actor,'planner',v_reason,p_request_id,p_location_source,nullif(btrim(p_priority),'')
  ) returning id into v_visit_id;
  if p_package_version_id is not null then
    insert into public.visit_packages(visit_id,package_version_id,snapshot,added_by)
    select v_visit_id,pv.id,jsonb_build_object('package_version_id',pv.id,'code',p.code,'title',p.title,'version_label',pv.version_label,'status',pv.status,'captured_at',now()),v_actor
    from public.package_versions pv join public.packages p on p.id=pv.package_id where pv.id=p_package_version_id;
  end if;
  insert into public.planning_supervision_requests(visit_plan_id,visit_id,submitted_by,proposed_inspector_id)
    values(v_plan_id,v_visit_id,v_actor,p_proposed_inspector_id);
  insert into public.notifications(event_key,recipient,payload,channel)
    select 'planning_supervision_requested',ur.user_id,jsonb_build_object('visit_id',v_visit_id,'plan_id',v_plan_id,'immediate',true,'urgency_reason',v_reason),'inapp'
    from public.user_roles ur where ur.role_key='supervisor';
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
    values(v_actor,'visit_plans',v_plan_id,'IMMEDIATE_VISIT_SUBMITTED_FOR_SUPERVISION',jsonb_build_object('visit_id',v_visit_id,'urgency_reason',v_reason,'target',jsonb_build_object('factory_id',p_factory_id,'cr_number',v_license.cr_number,'license_number',v_license.license_number,'plant_number',v_license.plant_number),'proposed_inspector_id',p_proposed_inspector_id),array['PLN-IMM-001','PLN-SUP-001','PLN-SUP-003']);
  return v_visit_id;
end $$;

revoke all on function public.submit_immediate_visit_for_supervision(uuid,uuid,uuid,uuid,text,timestamptz,timestamptz,text,text,text,numeric,numeric,text) from public,anon;
grant execute on function public.submit_immediate_visit_for_supervision(uuid,uuid,uuid,uuid,text,timestamptz,timestamptz,text,text,text,numeric,numeric,text) to authenticated;
