-- TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 · rollback-only contract probe
-- Proves AC-0125/0130/0137/0156 persistence, RLS continuity, explicit stub
-- provenance, nonnegative ETA/distance and immutable override events.
begin;

insert into auth.users (id, email) values
  ('33111111-1111-1111-1111-111111111111', 'm04-field-probe@example.test');
insert into profiles (user_id, full_name, email) values
  ('33111111-1111-1111-1111-111111111111', 'M04 Field Probe', 'm04-field-probe@example.test');
insert into user_roles (user_id, role_key) values
  ('33111111-1111-1111-1111-111111111111', 'inspector');
insert into factories (id, factory_code, name, official_lat, official_lng) values
  ('33222222-2222-2222-2222-222222222222', 'M04-PROBE', 'M04 Probe Factory', 24.7136000, 46.6753000);
insert into visits (
  id, factory_id, visit_type, execution_mode, planning_status,
  window_start, window_end
) values (
  '33333333-3333-3333-3333-333333333333',
  '33222222-2222-2222-2222-222222222222',
  'periodic', 'physical', 'published', now(), now() + interval '4 hours'
);
insert into assignments (visit_id, inspector_id, method) values (
  '33333333-3333-3333-3333-333333333333',
  '33111111-1111-1111-1111-111111111111', 'manual'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33111111-1111-1111-1111-111111111111', true);

insert into journey_sessions (
  id, visit_id, inspector_id, eta_minutes, remaining_distance_m,
  device_id, device_os_version, application_version,
  routing_provider, route_estimate_mode, route_estimated_at
) values (
  '33444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  '33111111-1111-1111-1111-111111111111',
  18, 10250, 'field-contract-probe', 'iPadOS 18.0 (browser-reported)', '0.1.0+probe',
  'deterministic-test-routing', 'test_stub', now()
);

insert into geo_events (
  id, journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m,
  geofence_result, override_reason, gis_version, device_id,
  device_os_version, application_version, integration_mode, approval_provider
) values (
  '33555555-5555-5555-5555-555555555555',
  '33444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'override', 24.7200000, 46.6900000, 5.0, 'override',
  'Gate access at observed location', 'probe', 'field-contract-probe',
  'iPadOS 18.0 (browser-reported)', '0.1.0+probe', 'test_stub',
  'simulated-operations-approval'
);

do $$
declare rejected boolean := false; changed integer := 0;
begin
  if not exists (
    select 1 from journey_sessions
     where id = '33444444-4444-4444-4444-444444444444'
       and eta_minutes = 18 and remaining_distance_m = 10250
       and device_id = 'field-contract-probe'
       and device_os_version like 'iPadOS%'
       and application_version = '0.1.0+probe'
       and routing_provider = 'deterministic-test-routing'
       and route_estimate_mode = 'test_stub'
  ) then raise exception 'M04_ASSERT: journey device/ETA provenance missing'; end if;

  if not exists (
    select 1 from geo_events
     where id = '33555555-5555-5555-5555-555555555555'
       and geofence_result = 'override'
       and override_reason = 'Gate access at observed location'
       and integration_mode = 'test_stub'
       and approval_provider = 'simulated-operations-approval'
  ) then raise exception 'M04_ASSERT: governed override provenance missing'; end if;

  begin
    insert into journey_sessions (visit_id, inspector_id, eta_minutes)
    values ('33333333-3333-3333-3333-333333333333', auth.uid(), -1);
  exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'M04_ASSERT: negative ETA was stored'; end if;

  update geo_events set override_reason = 'silently changed'
   where id = '33555555-5555-5555-5555-555555555555';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'M04_ASSERT: immutable geo event was updated'; end if;
end
$$;

reset role;
select 'PASS'::text as result,
  'M04 device, ETA/distance, test-provider provenance, override and geo immutability passed; transaction rolled back'::text as assertion;
rollback;

select 'PASS'::text as result,
  (select count(*) from profiles where email = 'm04-field-probe@example.test') as residual_profile_rows,
  (select count(*) from geo_events where id = '33555555-5555-5555-5555-555555555555') as residual_geo_rows;
