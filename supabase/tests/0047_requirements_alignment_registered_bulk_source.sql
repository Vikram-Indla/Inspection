\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729060000_requirements_alignment_registered_bulk_source.sql

do $$
declare
  v_actor uuid := '71000000-0000-4000-8000-000000000001';
  v_registered uuid := '71000000-0000-4000-8000-000000000002';
  v_unregistered uuid := '71000000-0000-4000-8000-000000000003';
  v_cr uuid := '71000000-0000-4000-8000-000000000004';
  v_plan uuid := '71000000-0000-4000-8000-000000000005';
  v_denied boolean := false;
begin
  insert into auth.users (id, email)
  values (v_actor, 'req006-planner@example.invalid')
  on conflict (id) do nothing;
  insert into public.profiles (user_id, full_name, account_status)
  values (v_actor, 'REQ-006 planner', 'active')
  on conflict (user_id) do nothing;

  insert into public.factories (id, factory_code, name, cr_number, source, is_temporary)
  values
    (v_registered, 'F-REQ006-R', 'REQ-006 registered', 'CR-REQ006-R', 'senaei', false),
    (v_unregistered, 'F-REQ006-U', 'REQ-006 unregistered', 'CR-REQ006-U', 'inspection_platform', false);
  insert into public.commercial_registrations (id, cr_number, source_system)
  values (v_cr, 'CR-REQ006-R', 'senaei');
  insert into public.industrial_licenses (
    factory_id, commercial_registration_id, license_number, source_system
  ) values (
    v_registered, v_cr, 'IL-REQ006-R', 'senaei'
  );
  insert into public.visit_plans (id, method, status, created_by)
  values (v_plan, 'bulk', 'draft', v_actor);

  insert into public.visits (
    visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
    window_start, window_end
  ) values (
    v_plan, v_registered, 'periodic', 'physical', 'draft',
    '2030-01-01 08:00:00+00', '2030-01-01 10:00:00+00'
  );

  begin
    insert into public.visits (
      visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
      window_start, window_end
    ) values (
      v_plan, v_unregistered, 'periodic', 'physical', 'draft',
      '2030-01-02 08:00:00+00', '2030-01-02 10:00:00+00'
    );
  exception
    when check_violation then
      v_denied := sqlerrm = 'PLANNING-BULK-REGISTERED-SOURCE-REQUIRED';
  end;
  if not v_denied then
    raise exception 'REQ006_ASSERT: unregistered bulk target was not denied';
  end if;

  update public.visit_plans set method = 'single' where id = v_plan;
  insert into public.visits (
    visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
    window_start, window_end
  ) values (
    v_plan, v_unregistered, 'complaint', 'physical', 'draft',
    '2030-01-03 08:00:00+00', '2030-01-03 10:00:00+00'
  );
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.visits'::regclass
      and tgname = 'trg_guard_bulk_visit_registered_source'
      and not tgisinternal
  ) then
    raise exception 'REQ006_ASSERT: registered-source trigger missing';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.guard_bulk_visit_registered_source()',
    'execute'
  ) then
    raise exception 'REQ006_ASSERT: trigger function must not be client executable';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'industrial_licenses'
      and policyname = 'requirements_alignment_bulk_registered_source_read'
      and 'authenticated' = any(roles)
  ) then
    raise exception 'REQ006_ASSERT: registered-source read policy missing';
  end if;
end
$$;

\ir ../migrations/20260729060000_requirements_alignment_registered_bulk_source.sql

rollback;
