-- Bulk planning creates one governed plan and one supervision request per
-- target. It is deliberately atomic: either the whole batch reaches the
-- Supervisor queue, or no target is submitted. Supervisors may then decide
-- each row independently through the shared queue.

create or replace function public.submit_bulk_plan_for_supervision(
  p_factory_ids uuid[],
  p_package_version_ids uuid[],
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_visit_type text,
  p_priority text default null,
  p_notes text default null,
  p_proposed_inspectors jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_plan_id uuid;
  v_factory_id uuid;
  v_factory record;
  v_license record;
  v_license_count integer;
  v_visit_id uuid;
  v_package_id uuid;
  v_proposed uuid;
  v_ids uuid[] := coalesce(p_factory_ids, '{}'::uuid[]);
  v_package_ids uuid[] := coalesce(p_package_version_ids, '{}'::uuid[]);
begin
  if v_actor is null or not public.has_planning_capability('planning.create.bulk')
     or not public.has_planning_capability('planning.submit_for_supervision') then
    raise exception 'BULK-SUPERVISION-SUBMIT-DENIED' using errcode='42501';
  end if;
  if cardinality(v_ids) is null or cardinality(v_ids)=0 or cardinality(v_ids)>500
     or cardinality(v_ids)<>(select count(distinct id) from unnest(v_ids) id) then
    raise exception 'BULK-SUPERVISION-TARGETS' using errcode='22023';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end<=p_window_start
     or p_visit_type not in ('periodic','follow_up','complaint') then
    raise exception 'BULK-SUPERVISION-CONFIGURATION' using errcode='22023';
  end if;
  if cardinality(v_package_ids)>20 or cardinality(v_package_ids)<>(select count(distinct id) from unnest(v_package_ids) id) then
    raise exception 'BULK-SUPERVISION-PACKAGES' using errcode='22023';
  end if;
  if exists(select 1 from unnest(v_package_ids) id where not exists(
    select 1 from public.package_versions pv where pv.id=id and pv.status in ('published','locked')
      and (pv.effective_from is null or pv.effective_from<=current_date) and (pv.effective_to is null or pv.effective_to>=current_date)
  )) then raise exception 'BULK-SUPERVISION-PACKAGE' using errcode='22023'; end if;
  if jsonb_typeof(p_proposed_inspectors) <> 'object' then raise exception 'BULK-SUPERVISION-PROPOSALS' using errcode='22023'; end if;

  -- Lock and validate every target before creating the batch aggregate.
  foreach v_factory_id in array v_ids loop
    select * into v_factory from public.factories where id=v_factory_id for share;
    if not found or v_factory.official_lat is null or v_factory.official_lng is null then
      raise exception 'BULK-SUPERVISION-FACTORY' using errcode='22023';
    end if;
    select count(*) into v_license_count from public.industrial_licenses where factory_id=v_factory_id;
    if v_license_count <> 1 then raise exception 'BULK-SUPERVISION-TARGET-AMBIGUOUS' using errcode='22023'; end if;
    if exists(select 1 from public.visits where factory_id=v_factory_id and visit_type=p_visit_type
      and planning_status in ('draft','validated','pending_supervision','published','returned')) then
      raise exception 'BULK-SUPERVISION-DUPLICATE' using errcode='23505';
    end if;
    begin v_proposed := nullif(p_proposed_inspectors->>v_factory_id::text,'')::uuid;
    exception when invalid_text_representation then raise exception 'BULK-SUPERVISION-PROPOSAL' using errcode='22023'; end;
    if v_proposed is not null and not exists(select 1 from public.user_roles where user_id=v_proposed and role_key='inspector') then
      raise exception 'BULK-SUPERVISION-PROPOSAL' using errcode='22023';
    end if;
  end loop;

  insert into public.visit_plans(method,status,created_by,criteria,source_channel)
    values ('bulk','pending_supervision',v_actor,jsonb_build_object('factory_ids',to_jsonb(v_ids),'visit_type',p_visit_type),'planning.bulk')
    returning id into v_plan_id;
  foreach v_factory_id in array v_ids loop
    select * into v_factory from public.factories where id=v_factory_id;
    select il.license_number,il.plant_number,cr.cr_number into v_license from public.industrial_licenses il join public.commercial_registrations cr on cr.id=il.commercial_registration_id where il.factory_id=v_factory_id;
    begin v_proposed := nullif(p_proposed_inspectors->>v_factory_id::text,'')::uuid;
    exception when invalid_text_representation then v_proposed:=null; end;
    insert into public.visits(visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,window_start,window_end,package_version_id,notes,priority,source_channel,internal_reference)
      values(v_plan_id,v_factory_id,p_visit_type,'physical','pending_supervision','new',p_window_start,p_window_end,
        case when cardinality(v_package_ids)>0 then v_package_ids[1] else null end,nullif(btrim(p_notes),''),nullif(btrim(p_priority),''),'planning.bulk',concat_ws('/',v_license.cr_number,v_license.license_number,v_license.plant_number)) returning id into v_visit_id;
    foreach v_package_id in array v_package_ids loop
      insert into public.visit_packages(visit_id,package_version_id,snapshot,added_by)
      select v_visit_id,pv.id,jsonb_build_object('package_version_id',pv.id,'code',p.code,'title',p.title,'version_label',pv.version_label,'status',pv.status,'captured_at',now()),v_actor
      from public.package_versions pv join public.packages p on p.id=pv.package_id where pv.id=v_package_id;
    end loop;
    insert into public.planning_supervision_requests(visit_plan_id,visit_id,submitted_by,proposed_inspector_id) values(v_plan_id,v_visit_id,v_actor,v_proposed);
  end loop;
  insert into public.notifications(event_key,recipient,payload,channel)
    select 'planning_supervision_requested',ur.user_id,jsonb_build_object('plan_id',v_plan_id,'bulk',true,'target_count',cardinality(v_ids)),'inapp'
    from public.user_roles ur where ur.role_key='supervisor';
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
    values(v_actor,'visit_plans',v_plan_id,'BULK_PLAN_SUBMITTED_FOR_SUPERVISION',jsonb_build_object('target_count',cardinality(v_ids),'proposed_inspectors',p_proposed_inspectors),array['PLN-BULK-001','PLN-SUP-001','PLN-SUP-003']);
  return v_plan_id;
end $$;

revoke all on function public.submit_bulk_plan_for_supervision(uuid[],uuid[],timestamptz,timestamptz,text,text,text,jsonb) from public,anon;
grant execute on function public.submit_bulk_plan_for_supervision(uuid[],uuid[],timestamptz,timestamptz,text,text,text,jsonb) to authenticated;
