-- TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001
-- MVP1-M04-012/017/024/043 · AC-0125/0130/0137/0156
-- Additive provenance only. Existing journey/geo RLS and geo immutability stay
-- unchanged. Historical rows remain nullable; new application writes carry the
-- fields. test_stub is an explicit provenance value, never a production claim.

alter table if exists public.journey_sessions
  add column if not exists device_id text,
  add column if not exists device_os_version text,
  add column if not exists application_version text,
  add column if not exists routing_provider text,
  add column if not exists route_estimate_mode text,
  add column if not exists route_estimated_at timestamptz;

alter table if exists public.geo_events
  add column if not exists device_os_version text,
  add column if not exists application_version text,
  add column if not exists integration_mode text,
  add column if not exists approval_provider text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'journey_eta_nonnegative') then
    alter table public.journey_sessions
      add constraint journey_eta_nonnegative
      check (eta_minutes is null or eta_minutes >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'journey_remaining_distance_nonnegative') then
    alter table public.journey_sessions
      add constraint journey_remaining_distance_nonnegative
      check (remaining_distance_m is null or remaining_distance_m >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'journey_route_estimate_mode_valid') then
    alter table public.journey_sessions
      add constraint journey_route_estimate_mode_valid
      check (route_estimate_mode is null or route_estimate_mode in ('production', 'test_stub')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'geo_integration_mode_valid') then
    alter table public.geo_events
      add constraint geo_integration_mode_valid
      check (integration_mode is null or integration_mode in ('production', 'test_stub')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'geo_stub_override_provider_required') then
    alter table public.geo_events
      add constraint geo_stub_override_provider_required
      check (
        kind <> 'override'
        or integration_mode is distinct from 'test_stub'
        or nullif(btrim(approval_provider), '') is not null
      ) not valid;
  end if;
end
$$;

comment on column public.journey_sessions.device_id is
  'M04-012 stable per-install field client identifier; not a hardware serial number.';
comment on column public.journey_sessions.device_os_version is
  'M04-012 browser-reported OS name/version.';
comment on column public.journey_sessions.application_version is
  'M04-012 deployed application version/build identifier.';
comment on column public.journey_sessions.routing_provider is
  'M04-017/024 provider provenance; deterministic-test-routing is test-only.';
comment on column public.journey_sessions.route_estimate_mode is
  'production or visibly isolated test_stub provenance.';
comment on column public.geo_events.approval_provider is
  'M04-043 governed override approval provider; simulated value is test-only.';
