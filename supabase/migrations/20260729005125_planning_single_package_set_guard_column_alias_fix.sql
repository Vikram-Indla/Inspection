-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Planning single-visit atomic publication convergence.
--
-- The legacy publish_single_visit command owns the guarded plan/visit/
-- assignment/state/notification transition, but its caller previously wrote
-- canonical target provenance and the complete visit_packages snapshot array
-- after that command had committed. This wrapper keeps those writes in the
-- same PostgreSQL transaction: an error in any one of them rolls the whole
-- publication back.

create or replace function public.publish_single_visit_atomic(
  p_factory_id uuid,
  p_package_version_ids uuid[],
  p_inspector_id uuid,
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
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_visit_id uuid;
  v_plan_id uuid;
  v_package_ids uuid[] := coalesce(p_package_version_ids, '{}'::uuid[]);
  v_package_id uuid;
  v_source_channel text := nullif(btrim(p_source_channel), '');
  v_target_source text;
  v_target_license text;
  v_target_cr text;
  v_target_plant text;
  v_internal_reference text;
begin
  -- Validate the complete package set before the legacy guarded publisher
  -- creates anything. Package order is retained: element one remains the
  -- compatibility primary in visits.package_version_id.
  if cardinality(v_package_ids) > 20
     or cardinality(v_package_ids) <> (
       select count(distinct package_version_id) from unnest(v_package_ids) as x(package_version_id)
     ) then
    raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-PACKAGES';
  end if;
  if exists (
    select 1 from unnest(v_package_ids) package_id
    where not exists (
      select 1 from public.package_versions pv
      where pv.id = package_id
        and pv.status in ('published', 'locked')
        and (pv.effective_from is null or pv.effective_from <= current_date)
        and (pv.effective_to is null or pv.effective_to >= current_date)
    )
  ) then
    raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-PACKAGE';
  end if;

  if jsonb_typeof(p_target) is distinct from 'object'
     or nullif(p_target ->> 'factory_id', '') is null
     or p_target ->> 'factory_id' <> p_factory_id::text then
    raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-TARGET';
  end if;
  if v_source_channel is null
     or v_source_channel !~ '^[a-z0-9][a-z0-9._-]{0,39}$' then
    raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-SOURCE';
  end if;

  v_target_source := coalesce(nullif(p_target ->> 'source', ''), 'legacy');
  if v_target_source not in ('canonical', 'legacy') then
    raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-TARGET-SOURCE';
  end if;
  v_target_license := nullif(p_target ->> 'license_number', '');
  v_target_cr := nullif(p_target ->> 'cr_number', '');
  v_target_plant := nullif(p_target ->> 'plant_number', '');

  -- A canonical handoff must remain the exact CR -> licence -> plant target
  -- selected by the planner. Legacy targets retain the existing factory guard
  -- in publish_single_visit and are never upgraded silently.
  if v_target_source = 'canonical' then
    if v_target_license is null or v_target_cr is null or v_target_plant is null
       or not exists (
         select 1
         from public.industrial_licenses il
         join public.commercial_registrations cr
           on cr.id = il.commercial_registration_id
         where il.factory_id = p_factory_id
           and il.license_number = v_target_license
           and il.plant_number = v_target_plant
           and cr.cr_number = v_target_cr
       ) then
      raise invalid_parameter_value using message = 'PLANNING-SINGLE-PUBLISH-CANONICAL-TARGET';
    end if;
  end if;

  -- This call and all writes below share one outer transaction. Any raised
  -- exception rolls back the legacy publisher's plan, visit, assignment,
  -- state transitions, audit and notification as well.
  v_visit_id := public.publish_single_visit(
    p_factory_id,
    case when cardinality(v_package_ids) > 0 then v_package_ids[1] else null end,
    p_inspector_id,
    p_visit_type,
    p_execution_mode,
    p_window_start,
    p_window_end,
    p_license_number,
    p_location_confirmed,
    p_planner_lat,
    p_planner_lng,
    p_notes,
    p_resume_plan_id
  );

  select visit_plan_id into v_plan_id
  from public.visits where id = v_visit_id for update;
  if v_plan_id is null then
    raise exception using errcode = 'P0001', message = 'PLANNING-SINGLE-PUBLISH-PLAN';
  end if;

  v_internal_reference := concat_ws('/', v_target_cr, v_target_license, v_target_plant);
  update public.visits
     set source_channel = v_source_channel,
         internal_reference = nullif(v_internal_reference, '')
   where id = v_visit_id;
  update public.visit_plans
     set source_channel = v_source_channel,
         criteria = coalesce(criteria, '{}'::jsonb)
           || jsonb_build_object('target', p_target)
   where id = v_plan_id;

  foreach v_package_id in array v_package_ids loop
    insert into public.visit_packages(
      visit_id, package_version_id, snapshot, added_by
    )
    select
      v_visit_id,
      pv.id,
      jsonb_build_object(
        'package_version_id', pv.id,
        'code', package.code,
        'title', package.title,
        'version_label', pv.version_label,
        'status', pv.status,
        'captured_at', now()
      ),
      v_actor
    from public.package_versions pv
    join public.packages package on package.id = pv.package_id
    where pv.id = v_package_id
    on conflict (visit_id, package_version_id) do nothing;
  end loop;

  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor,
    'visit_plans',
    v_plan_id,
    'SINGLE_VISIT_PUBLISHED_ATOMIC',
    jsonb_build_object(
      'visit_id', v_visit_id,
      'target', p_target,
      'package_version_ids', to_jsonb(v_package_ids),
      'source_channel', v_source_channel
    ),
    array['MVP1-M01-035','MVP1-M01-042','PLN-CON-003','PLN-REQ-023']
  );

  return v_visit_id;
end
$$;

revoke all on function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) from public, anon;
grant execute on function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) to authenticated;

comment on function public.publish_single_visit_atomic is
  'Atomic single Planning publication: guarded visit/assignment/state/notification plus exact target provenance and all selected package snapshots.';
