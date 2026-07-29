-- Senaei source readiness — read-only verification.
--
-- Purpose: prove that a named non-production database can accept the
-- separately governed Senaei fixture/import layer before anyone loads seed
-- data. This script NEVER inserts, updates, deletes, truncates or creates
-- persistent objects. It is safe to execute against a candidate environment.
--
-- Usage (after the target environment and backup/restore route are approved):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verify_senaei_source_readiness.sql
--
-- This verifies the custody boundary, not provider connectivity. A passing
-- result means the database can record fixture or live-source provenance; it
-- does not mean Senaei is configured, reachable, or fresh.

begin read only;

do $$
declare
  required_tables text[] := array[
    'external_source_connections',
    'senaei_sync_runs',
    'senaei_sync_calls',
    'senaei_raw_snapshots',
    'factory_import_batches',
    'factory_import_rows',
    'commercial_registrations',
    'industrial_licenses',
    'plant_addresses',
    'factories'
  ];
  missing_tables text[];
  missing_columns text[];
begin
  select array_agg(table_name order by table_name)
    into missing_tables
  from unnest(required_tables) as required(table_name)
  where to_regclass(format('public.%I', required.table_name)) is null;

  if missing_tables is not null then
    raise exception 'SENAEI_SOURCE_SCHEMA_MISSING_TABLES: %', array_to_string(missing_tables, ', ');
  end if;

  with required(table_name, column_name) as (
    values
      ('external_source_connections', 'provider_key'),
      ('external_source_connections', 'environment'),
      ('external_source_connections', 'configuration_status'),
      ('external_source_connections', 'enabled'),
      ('senaei_sync_runs', 'connection_id'),
      ('senaei_sync_runs', 'status'),
      ('senaei_sync_runs', 'correlation_id'),
      ('senaei_raw_snapshots', 'payload_sha256'),
      ('commercial_registrations', 'source_system'),
      ('commercial_registrations', 'source_snapshot_id'),
      ('industrial_licenses', 'source_system'),
      ('industrial_licenses', 'source_snapshot_id'),
      ('plant_addresses', 'source_system'),
      ('plant_addresses', 'source_snapshot_id'),
      ('factories', 'source'),
      ('factories', 'source_synced_at')
  )
  select array_agg(format('%s.%s', required.table_name, required.column_name) order by required.table_name, required.column_name)
    into missing_columns
  from required
  left join information_schema.columns columns
    on columns.table_schema = 'public'
   and columns.table_name = required.table_name
   and columns.column_name = required.column_name
  where columns.column_name is null;

  if missing_columns is not null then
    raise exception 'SENAEI_SOURCE_SCHEMA_MISSING_COLUMNS: %', array_to_string(missing_columns, ', ');
  end if;
end $$;

with fixture_connection as (
  select
    count(*) filter (
      where provider_key = 'senaei_seeded_fixture'
        and environment = 'test_fixture'
        and configuration_status = 'disabled'
        and enabled = false
        and base_url_origin is null
        and auth_mode is null
    ) as safely_disabled_fixture_connections
  from public.external_source_connections
), canonical_projection as (
  select
    count(*) filter (
      where cr.source_system is not null
        and il.source_system is not null
        and pa.source_system is not null
        and f.source is not null
    ) as fully_provenanced_targets,
    count(*) filter (
      where cr.source_snapshot_id is not null
        and il.source_snapshot_id is not null
        and pa.source_snapshot_id is not null
    ) as snapshot_linked_targets
  from public.factories f
  join public.industrial_licenses il on il.factory_id = f.id
  join public.commercial_registrations cr on cr.id = il.commercial_registration_id
  join public.plant_addresses pa
    on pa.factory_id = f.id
   and pa.industrial_license_id = il.id
   and pa.is_current = true
)
select
  current_database() as database_name,
  current_user as database_user,
  'READ_ONLY' as verification_mode,
  fixture_connection.safely_disabled_fixture_connections,
  canonical_projection.fully_provenanced_targets,
  canonical_projection.snapshot_linked_targets,
  case
    when fixture_connection.safely_disabled_fixture_connections > 0
      then 'fixture custody recorded; fixture is disabled and cannot make a live-source claim'
    else 'no fixture custody row recorded; apply only the approved fixture packet to a proven non-production target'
  end as fixture_custody_status,
  case
    when canonical_projection.fully_provenanced_targets > 0
      then 'canonical targets carry source labels; resolver can expose truthful provenance'
    else 'no fully provenanced canonical CR/licence/plant target found; do not present source freshness as known'
  end as projection_status,
  'No data reset is authorised by this check. Reset requires a named non-production target plus a tested backup and restore path.' as destructive_reset_gate
from fixture_connection cross join canonical_projection;

rollback;
