-- DM-006 / PLN-READ-CONTRACT
-- One fail-closed, Planner-only readiness boundary for the Single Planning
-- screen and its post-schedule detail route.
--
-- SECURITY INVOKER is deliberate: every probe runs with the authenticated
-- caller's table grants and RLS policies. The function does not bypass RLS,
-- does not add table grants, and returns only the configuration already needed
-- by the Planner screen. Missing relations, functions, columns, or grants are
-- converted into a stable contract response with a caller-supplied correlation
-- id; raw database messages never cross the UI boundary.

create or replace function public.planning_read_contract(
  p_surface text,
  p_visit_id uuid default null,
  p_correlation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_dependency text := 'authorization';
  v_packages jsonb := '[]'::jsonb;
  v_inspectors jsonb := '[]'::jsonb;
  v_virtual_eligible boolean := false;
  v_visit_visible boolean := false;
begin
  if v_actor is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-AUTH-REQUIRED',
      'correlation_id', p_correlation_id
    );
  end if;

  if p_surface not in ('single', 'visit_detail') then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-SURFACE-INVALID',
      'correlation_id', p_correlation_id
    );
  end if;

  -- Planner is explicit. The historical business_staff class is intentionally
  -- not accepted here: an unrelated authenticated account must not inherit a
  -- Planner read path merely because it is neither admin nor inspector.
  if not public.has_internal_role('planner') then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-DENIED',
      'correlation_id', p_correlation_id
    );
  end if;

  if p_surface = 'single' then
    if not public.has_planning_capability('planning.create.single') then
      return jsonb_build_object(
        'ok', false,
        'code', 'PLN-READ-DENIED',
        'correlation_id', p_correlation_id
      );
    end if;

    v_dependency := 'package_versions';
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pv.id,
          'version_label', pv.version_label,
          'packages', jsonb_build_object('code', p.code, 'title', p.title)
        )
        order by pv.published_at desc
      ),
      '[]'::jsonb
    )
    into v_packages
    from public.package_versions pv
    join public.packages p on p.id = pv.package_id
    where pv.status in ('published', 'locked')
      and pv.effective_from <= current_date
      and (pv.effective_to is null or pv.effective_to >= current_date);

    v_dependency := 'inspector_roster';
    select coalesce(
      jsonb_agg(
        jsonb_build_object('user_id', ur.user_id, 'full_name', pr.full_name)
        order by pr.full_name, ur.user_id
      ),
      '[]'::jsonb
    )
    into v_inspectors
    from public.user_roles ur
    join public.profiles pr on pr.user_id = ur.user_id
    where ur.role_key = 'inspector';

    v_dependency := 'engine_settings';
    select exists(
      select 1 from public.engine_settings where engine = 'otp'
    )
    into v_virtual_eligible;

    -- Search, handoff, draft-resume, and duplicate-warning dependencies. These
    -- probes return no records; they only verify the caller's current contract.
    v_dependency := 'visit_plans';
    perform 1 from public.visit_plans limit 1;
    v_dependency := 'visits';
    perform 1 from public.visits limit 1;
    v_dependency := 'factories';
    perform 1 from public.factories limit 1;
    v_dependency := 'commercial_registrations';
    perform 1 from public.commercial_registrations limit 1;
    v_dependency := 'industrial_licenses';
    perform 1 from public.industrial_licenses limit 1;
    v_dependency := 'plant_addresses';
    perform 1 from public.plant_addresses limit 1;

    v_dependency := 'planning_publish_capability';
    return jsonb_build_object(
      'ok', true,
      'surface', p_surface,
      'correlation_id', p_correlation_id,
      'data', jsonb_build_object(
        'packages', v_packages,
        'inspectors', v_inspectors,
        'virtual_eligible', v_virtual_eligible,
        'can_publish', public.has_planning_capability('planning.publish')
      )
    );
  end if;

  if p_visit_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-VISIT-REQUIRED',
      'correlation_id', p_correlation_id
    );
  end if;

  if not public.has_planning_capability('planning.view') then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-DENIED',
      'correlation_id', p_correlation_id
    );
  end if;

  -- The probes below deliberately select no payload. They prove that every
  -- relation used by the post-schedule detail path is available through the
  -- caller's current grants/RLS before the page performs its normal reads.
  v_dependency := 'visits';
  select exists(select 1 from public.visits where id = p_visit_id)
  into v_visit_visible;
  if not v_visit_visible then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-NOT-AVAILABLE',
      'correlation_id', p_correlation_id
    );
  end if;

  v_dependency := 'profiles';
  perform 1 from public.profiles limit 1;
  v_dependency := 'user_roles';
  perform 1 from public.user_roles where role_key = 'inspector' limit 1;
  v_dependency := 'visit_plans';
  perform 1 from public.visit_plans where id = (
    select visit_plan_id from public.visits where id = p_visit_id
  ) limit 1;
  v_dependency := 'factories';
  perform 1 from public.factories where id = (
    select factory_id from public.visits where id = p_visit_id
  ) limit 1;
  v_dependency := 'package_versions';
  perform 1 from public.package_versions where id = (
    select package_version_id from public.visits where id = p_visit_id
  ) limit 1;
  v_dependency := 'packages';
  perform 1 from public.packages limit 1;
  v_dependency := 'assignments';
  perform 1 from public.assignments where visit_id = p_visit_id limit 1;
  v_dependency := 'journey_sessions';
  perform 1 from public.journey_sessions where visit_id = p_visit_id limit 1;
  v_dependency := 'geo_events';
  perform 1 from public.geo_events where visit_id = p_visit_id limit 1;
  v_dependency := 'inspections';
  perform 1 from public.inspections where visit_id = p_visit_id limit 1;
  v_dependency := 'submission_versions';
  perform 1
  from public.submission_versions sv
  join public.inspections i on i.id = sv.inspection_id
  where i.visit_id = p_visit_id
  limit 1;
  v_dependency := 'reviews';
  perform 1
  from public.reviews r
  join public.inspections i on i.id = r.inspection_id
  where i.visit_id = p_visit_id
  limit 1;
  v_dependency := 'audit_events';
  perform 1
  from public.audit_events
  where object_type = 'visits' and object_id = p_visit_id
  limit 1;
  v_dependency := 'visit_lifecycle_events';
  perform 1 from public.visit_lifecycle_events where visit_id = p_visit_id limit 1;
  v_dependency := 'visit_location_events';
  perform 1 from public.visit_location_events where visit_id = p_visit_id limit 1;
  v_dependency := 'visit_packages';
  perform 1 from public.visit_packages where visit_id = p_visit_id limit 1;
  v_dependency := 'planning_lookups';
  perform 1 from public.planning_lookups limit 1;
  v_dependency := 'planning_expiry_rules';
  perform 1 from public.planning_expiry_rules limit 1;
  v_dependency := 'visit_attachments';
  perform 1 from public.visit_attachments where visit_id = p_visit_id limit 1;

  return jsonb_build_object(
    'ok', true,
    'surface', p_surface,
    'correlation_id', p_correlation_id,
    'data', jsonb_build_object('visit_id', p_visit_id)
  );
exception
  when insufficient_privilege or undefined_table or undefined_function or undefined_column then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLN-READ-CONTRACT-GAP',
      'correlation_id', p_correlation_id,
      'dependency', v_dependency,
      'sqlstate', sqlstate
    );
end;
$$;

revoke all on function public.planning_read_contract(text, uuid, uuid) from public;
revoke all on function public.planning_read_contract(text, uuid, uuid) from anon;
grant execute on function public.planning_read_contract(text, uuid, uuid) to authenticated;
