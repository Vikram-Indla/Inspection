-- TASK-SUPERVISOR-JOURNEY-RESPONSIVE-20260802 · DEC-032
-- Forward-only repair for the submission_versions snapshot trigger.
--
-- The trigger function historically resolved digest() through search_path.
-- Environments where pgcrypto lives in the extensions schema therefore fail
-- every new immutable submission version with SQLSTATE 42883. Pin the
-- extension schema and call extensions.digest explicitly. The trigger timing,
-- immutable source row, RLS, review RPC, audit and notification contracts are
-- unchanged.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_schema is distinct from 'extensions' then
    alter extension pgcrypto set schema extensions;
  end if;
end $$;

create or replace function public.capture_inspection_factory_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  captured jsonb;
  captured_factory_id uuid;
  captured_cr_id uuid;
  captured_license_id uuid;
begin
  select
    v.factory_id,
    il.commercial_registration_id,
    il.id,
    jsonb_build_object(
      'factory_code', f.factory_code,
      'factory_name', f.name,
      'cr_number', cr.cr_number,
      'unified_number', cr.unified_number,
      'industrial_license_number', il.license_number,
      'plant_number', il.plant_number,
      'license_status', il.status,
      'region', f.region,
      'city', f.city,
      'official_lat', f.official_lat,
      'official_lng', f.official_lng,
      'source_system', coalesce(il.source_system, f.source),
      'source_synced_at', coalesce(il.source_synced_at, f.source_synced_at),
      'inspection_observation', coalesce(
        new.snapshot -> 'factory_information',
        new.snapshot -> 'factory_observation',
        new.snapshot -> 'inspection_observation',
        '{}'::jsonb
      )
    )
  into captured_factory_id, captured_cr_id, captured_license_id, captured
  from public.inspections i
  join public.visits v on v.id = i.visit_id
  join public.factories f on f.id = v.factory_id
  left join public.industrial_licenses il on il.factory_id = f.id
  left join public.commercial_registrations cr
    on cr.id = il.commercial_registration_id
  where i.id = new.inspection_id;

  if captured_factory_id is not null then
    insert into public.inspection_factory_snapshots (
      submission_version_id, factory_id, commercial_registration_id,
      industrial_license_id, snapshot, snapshot_sha256
    ) values (
      new.id, captured_factory_id, captured_cr_id, captured_license_id,
      captured,
      encode(extensions.digest(convert_to(captured::text, 'UTF8'), 'sha256'), 'hex')
    )
    on conflict (submission_version_id) do nothing;
  end if;
  return new;
end $$;

revoke all on function public.capture_inspection_factory_snapshot()
  from public, anon, authenticated;
