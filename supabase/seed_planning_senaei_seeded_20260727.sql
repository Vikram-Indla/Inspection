-- Planning external-dependency fixture custody.
-- Seeded fixture only: never live/current Senaei data or provider proof.
-- Required psql variable: allow_seeded_senaei_fixture = true
\set ON_ERROR_STOP on

begin;

select set_config('saqeel.seed.allow_seeded_senaei_fixture',:'allow_seeded_senaei_fixture',true);

do $$
begin
  if current_setting('saqeel.seed.allow_seeded_senaei_fixture') <> 'true' then
    raise exception 'SEEDED_SENAEI_FIXTURE_DISABLED';
  end if;
  if current_database() ilike '%prod%' then
    raise exception 'SEEDED_SENAEI_FIXTURE_REFUSED_PRODUCTION';
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
values
 ('5ee10000-0000-4000-8000-000000000011','5ee10000-0000-4000-8000-000000000002',
  'GET /api/v3/inspection/plants','GET','fixture:not-configured','dependency_blocked',
  null,'SENAEI_AUTH_MODE_REQUIRED',null,timestamptz '2026-07-27 12:00:01+00'),
 ('5ee10000-0000-4000-8000-000000000012','5ee10000-0000-4000-8000-000000000002',
  'GET /api/v3/inspection/plants','GET','fixture:degraded','dependency_blocked',
  null,'SENAEI_HTTP_ERROR',null,timestamptz '2026-07-27 12:00:02+00'),
 ('5ee10000-0000-4000-8000-000000000013','5ee10000-0000-4000-8000-000000000002',
  'GET /api/v3/inspection/plants','GET','fixture:timeout','dependency_blocked',
  null,'SENAEI_TIMEOUT',null,timestamptz '2026-07-27 12:00:03+00'),
 ('5ee10000-0000-4000-8000-000000000014','5ee10000-0000-4000-8000-000000000002',
  'GET /api/v3/inspection/plants','GET','fixture:invalid-response','failed',
  null,'SENAEI_INVALID_RESPONSE',null,timestamptz '2026-07-27 12:00:04+00')
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
          and http_status is null and response_sha256 is null)<>4
    or exists(select 1 from public.senaei_raw_snapshots
        where sync_run_id='5ee10000-0000-4000-8000-000000000002')
    or exists(select 1 from public.senaei_reconciliation_records
        where sync_run_id='5ee10000-0000-4000-8000-000000000002')
  then raise exception 'SEEDED_SENAEI_FIXTURE_CONTRACT_MISMATCH'; end if;
end $$;

-- Registered-factory Planning remains on approved canonical fixtures. This
-- packet intentionally performs zero writes to factories, registrations,
-- licences, addresses, visits, assignments or unregistered lifecycle data.
select 'Seeded fixture — not live Senaei data' provenance,
  'Fixture timestamp — provider freshness not proven' freshness,
  'External source unavailable — local canonical records remain unchanged' state;

commit;

-- Rollback (separate explicitly approved transaction):
-- delete from public.senaei_sync_calls
--  where sync_run_id='5ee10000-0000-4000-8000-000000000002';
-- delete from public.senaei_sync_runs
--  where id='5ee10000-0000-4000-8000-000000000002';
-- delete from public.external_source_connections
--  where id='5ee10000-0000-4000-8000-000000000001';
-- Generic audit rows are immutable residual evidence and are never deleted.
