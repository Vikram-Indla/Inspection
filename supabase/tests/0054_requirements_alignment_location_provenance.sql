\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729081000_requirements_alignment_location_provenance.sql

do $$
declare
  v_actor uuid := '73000000-0000-4000-8000-000000000001';
  v_factory uuid := '73000000-0000-4000-8000-000000000002';
  v_plan uuid := '73000000-0000-4000-8000-000000000003';
  v_visit uuid := '73000000-0000-4000-8000-000000000004';
  v_correction uuid := '73000000-0000-4000-8000-000000000005';
  v_corrected_at timestamptz := '2030-05-01 12:34:56+00';
begin
  insert into auth.users(id,email)
  values(v_actor,'req007-inspector@example.invalid');
  insert into public.profiles(user_id,full_name,region,account_status)
  values(v_actor,'REQ-007 Inspector','Riyadh','active');
  insert into public.factories(
    id,factory_code,name,official_lat,official_lng,source,is_temporary
  ) values (
    v_factory,'F-REQ007','REQ-007 Factory',24.7136000,46.6753000,
    'senaei',false
  );
  insert into public.visit_plans(id,method,status,created_by)
  values(v_plan,'single','published',v_actor);
  insert into public.visits(
    id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
    operational_state,window_start,window_end,planner_lat,planner_lng,
    original_lat,original_lng
  ) values (
    v_visit,v_plan,v_factory,'periodic','physical','published','arrived',
    '2030-05-01 08:00:00+00','2030-05-01 18:00:00+00',
    24.7100000,46.6700000,24.7136000,46.6753000
  );

  insert into public.visit_location_corrections(
    id,visit_id,corrected_lat,corrected_lng,accuracy_m,reason,source,
    corrected_by,corrected_at,capture_context
  ) values (
    v_correction,v_visit,24.7200000,46.6800000,5,
    'Entrance moved to the licensed eastern gate','inspector_field',
    v_actor,v_corrected_at,'online'
  );

  if not exists (
    select 1
    from public.visit_location_events e
    where e.correction_id=v_correction
      and e.visit_id=v_visit
      and e.lat=24.7200000
      and e.lng=46.6800000
      and e.source='Inspector'
      and e.actor=v_actor
      and e.created_at=v_corrected_at
      and e.note like 'Controlled correction (current effective location):%'
  ) then
    raise exception 'REQ007_ASSERT: correction provenance event missing';
  end if;

  if not exists (
    select 1 from public.factories
    where id=v_factory
      and official_lat=24.7136000
      and official_lng=46.6753000
  ) or not exists (
    select 1 from public.visits
    where id=v_visit
      and planner_lat=24.7100000
      and planner_lng=46.6700000
      and original_lat=24.7136000
      and original_lng=46.6753000
  ) then
    raise exception 'REQ007_ASSERT: master or original/planning pin was overwritten';
  end if;
end
$$;

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.append_visit_location_correction_event()',
    'execute'
  ) then
    raise exception 'REQ007_ASSERT: trigger function must not be client executable';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid='public.visit_location_corrections'::regclass
      and tgname='trg_append_visit_location_correction_event'
      and not tgisinternal
  ) then
    raise exception 'REQ007_ASSERT: correction provenance trigger missing';
  end if;
end
$$;

\ir ../migrations/20260729081000_requirements_alignment_location_provenance.sql

rollback;
