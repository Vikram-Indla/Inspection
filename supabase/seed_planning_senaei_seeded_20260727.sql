-- Planning external-dependency fixture custody.
-- Seeded fixture only: never live/current Senaei data or provider proof.
-- Required psql variable: allow_seeded_senaei_fixture = true
\set ON_ERROR_STOP on

begin;

select set_config('saqeel.seed.allow_seeded_senaei_fixture',:'allow_seeded_senaei_fixture',true);

create temporary table seed_planning_senaei_registered_projection (
  ordinal integer primary key,
  factory_code text not null unique
) on commit drop;

insert into seed_planning_senaei_registered_projection(ordinal,factory_code)
values
  (1,'F-3305'),
  (2,'F-4402'),
  (3,'F-5502'),
  (4,'F-6601'),
  (5,'F-6602');

create temporary table seed_planning_senaei_expected_calls (
  id uuid primary key,
  request_id text not null unique,
  outcome text not null,
  safe_error_code text not null,
  occurred_at timestamptz not null
) on commit drop;

insert into seed_planning_senaei_expected_calls
  (id,request_id,outcome,safe_error_code,occurred_at)
values
 ('5ee10000-0000-4000-8000-000000000011','fixture:not-configured',
  'dependency_blocked','SENAEI_AUTH_MODE_REQUIRED',timestamptz '2026-07-27 12:00:01+00'),
 ('5ee10000-0000-4000-8000-000000000012','fixture:degraded',
  'dependency_blocked','SENAEI_HTTP_ERROR',timestamptz '2026-07-27 12:00:02+00'),
 ('5ee10000-0000-4000-8000-000000000013','fixture:timeout',
  'dependency_blocked','SENAEI_TIMEOUT',timestamptz '2026-07-27 12:00:03+00'),
 ('5ee10000-0000-4000-8000-000000000014','fixture:invalid-response',
  'failed','SENAEI_INVALID_RESPONSE',timestamptz '2026-07-27 12:00:04+00'),
 ('5ee10000-0000-4000-8000-000000000015','fixture:no-match',
  'dependency_blocked','SENAEI_NO_MATCH_FIXTURE_ONLY',timestamptz '2026-07-27 12:00:05+00'),
 ('5ee10000-0000-4000-8000-000000000016','fixture:duplicate',
  'dependency_blocked','SENAEI_DUPLICATE_FIXTURE_ONLY',timestamptz '2026-07-27 12:00:06+00');

create temporary table seed_planning_senaei_before_counts on commit drop as
select
  (select count(*) from public.external_source_connections
    where id='5ee10000-0000-4000-8000-000000000001')::integer as connections,
  (select count(*) from public.senaei_sync_runs
    where id='5ee10000-0000-4000-8000-000000000002')::integer as sync_runs,
  (select count(*) from public.senaei_sync_calls
    where sync_run_id='5ee10000-0000-4000-8000-000000000002')::integer as sync_calls;

do $$
begin
  if current_setting('saqeel.seed.allow_seeded_senaei_fixture') <> 'true' then
    raise exception 'SEEDED_SENAEI_FIXTURE_DISABLED';
  end if;
  if current_database() ilike '%prod%' then
    raise exception 'SEEDED_SENAEI_FIXTURE_REFUSED_PRODUCTION';
  end if;
  if (select count(*) from seed_planning_senaei_registered_projection) <> 5 then
    raise exception 'SEEDED_SENAEI_REGISTERED_INVENTORY_MISMATCH';
  end if;
  if (
    select count(*)
    from seed_planning_senaei_registered_projection expected
    join public.factories f on f.factory_code=expected.factory_code
    join public.industrial_licenses il on il.factory_id=f.id
    join public.commercial_registrations cr on cr.id=il.commercial_registration_id
    join public.plant_addresses pa
      on pa.factory_id=f.id and pa.industrial_license_id=il.id and pa.is_current
    where nullif(btrim(cr.cr_number),'') is not null
      and nullif(btrim(il.license_number),'') is not null
      and f.source_synced_at is not null
      and pa.latitude is not null and pa.longitude is not null
  ) <> 5 then
    raise exception 'SEEDED_SENAEI_CANONICAL_PROJECTION_PREFLIGHT_FAILED';
  end if;
end $$;

-- This connection cannot connect: it has no URL, auth mode or credentials and
-- is explicitly disabled. Its provider key names fixture custody, not Senaei.
insert into public.external_source_connections(
  id,provider_key,environment,contract_version,base_url_origin,auth_mode,
  configuration_status,enabled,last_validated_at,created_at,updated_at
)
values (
  '5ee10000-0000-4000-8000-000000000001',
  'senaei_seeded_fixture','test_fixture','fixture-envelope-v1',
  null,null,'disabled',false,null,
  timestamptz '2026-07-27 12:00:00+00',
  timestamptz '2026-07-27 12:00:00+00'
)
on conflict (provider_key,environment) do nothing;

insert into public.senaei_sync_runs(
  id,connection_id,mode,status,correlation_id,contract_version,requested_by,
  source_file_name,source_file_sha256,rows_received,rows_accepted,rows_rejected,
  started_at,completed_at,created_at
)
values (
  '5ee10000-0000-4000-8000-000000000002',
  '5ee10000-0000-4000-8000-000000000001',
  'api','dependency_blocked',
  '5ee10000-0000-4000-8000-000000000003',
  'fixture-envelope-v1',null,null,null,0,0,0,
  timestamptz '2026-07-27 12:00:00+00',
  timestamptz '2026-07-27 12:00:00+00',
  timestamptz '2026-07-27 12:00:00+00'
)
on conflict (correlation_id) do nothing;

insert into public.senaei_sync_calls(
  id,sync_run_id,endpoint_key,http_method,request_id,outcome,http_status,
  safe_error_code,response_sha256,occurred_at
)
select id,'5ee10000-0000-4000-8000-000000000002',
  'GET /api/v3/inspection/plants','GET',request_id,outcome,
  null,safe_error_code,null,occurred_at
from seed_planning_senaei_expected_calls
on conflict (sync_run_id,endpoint_key,request_id) do nothing;

do $$
begin
  if (select count(*) from public.external_source_connections
      where id='5ee10000-0000-4000-8000-000000000001'
        and provider_key='senaei_seeded_fixture'
        and environment='test_fixture'
        and configuration_status='disabled' and not enabled
        and base_url_origin is null and auth_mode is null
        and last_validated_at is null)<>1
    or (select count(*) from public.senaei_sync_runs
        where id='5ee10000-0000-4000-8000-000000000002'
          and status='dependency_blocked' and rows_received=0
          and rows_accepted=0 and rows_rejected=0)<>1
    or (select count(*) from public.senaei_sync_calls
        where sync_run_id='5ee10000-0000-4000-8000-000000000002'
          and outcome in('dependency_blocked','failed')
          and http_status is null and response_sha256 is null)<>6
    or exists (
      select expected.id
      from seed_planning_senaei_expected_calls expected
      left join public.senaei_sync_calls actual
        on actual.id=expected.id
       and actual.sync_run_id='5ee10000-0000-4000-8000-000000000002'
       and actual.endpoint_key='GET /api/v3/inspection/plants'
       and actual.http_method='GET'
       and actual.request_id=expected.request_id
       and actual.outcome=expected.outcome
       and actual.safe_error_code=expected.safe_error_code
       and actual.occurred_at=expected.occurred_at
       and actual.http_status is null
       and actual.response_sha256 is null
      where actual.id is null
    )
    or exists(select 1 from public.senaei_raw_snapshots
        where sync_run_id='5ee10000-0000-4000-8000-000000000002')
    or exists(select 1 from public.senaei_reconciliation_records
        where sync_run_id='5ee10000-0000-4000-8000-000000000002')
  then raise exception 'SEEDED_SENAEI_FIXTURE_CONTRACT_MISMATCH'; end if;
end $$;

-- Registered Planning consumes the existing canonical synthetic projections.
-- This packet validates them but performs zero writes to factory master,
-- registrations, licences, addresses, visits, assignments or R05/R06 data.
select
  expected.ordinal,
  f.factory_code,
  cr.id as commercial_registration_id,
  il.id as industrial_license_id,
  pa.id as plant_address_id,
  f.region,
  f.city,
  f.source_synced_at,
  'Registered canonical demo projection — seeded, not live Senaei' provenance,
  'Fixture timestamp — provider freshness not proven' freshness
from seed_planning_senaei_registered_projection expected
join public.factories f on f.factory_code=expected.factory_code
join public.industrial_licenses il on il.factory_id=f.id
join public.commercial_registrations cr on cr.id=il.commercial_registration_id
join public.plant_addresses pa
  on pa.factory_id=f.id and pa.industrial_license_id=il.id and pa.is_current
order by expected.ordinal;

select
  before_counts.connections as before_connections,
  1 as after_connections,
  before_counts.sync_runs as before_sync_runs,
  1 as after_sync_runs,
  before_counts.sync_calls as before_sync_calls,
  6 as after_sync_calls,
  5 as registered_projection_rows,
  0 as factory_master_writes,
  0 as unregistered_lifecycle_writes
from seed_planning_senaei_before_counts before_counts;

commit;

-- Rollback (separate explicitly approved transaction):
-- delete from public.senaei_sync_calls
--  where sync_run_id='5ee10000-0000-4000-8000-000000000002';
-- delete from public.senaei_sync_runs
--  where id='5ee10000-0000-4000-8000-000000000002';
-- delete from public.external_source_connections
--  where id='5ee10000-0000-4000-8000-000000000001';
-- Registered factory/CR/licence/address rows are pre-existing inputs and are
-- neither owned nor changed by this packet; rollback must not touch them.
-- Generic audit rows are immutable residual evidence and are never deleted.
