-- TASK-FACTORY-360-COMPLETE-010 · Factory 360 v2 foundation contract
-- Owner-run and transaction-wrapped. All fixtures and grants roll back.
begin;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into auth.users (id, email) values
  ('36111111-1111-1111-1111-111111111111', 'f360v2-planner@example.test'),
  ('36222222-2222-2222-2222-222222222222', 'f360v2-outsider@example.test');
insert into profiles (user_id, full_name, email) values
  ('36111111-1111-1111-1111-111111111111', 'F360 v2 Planner', 'f360v2-planner@example.test'),
  ('36222222-2222-2222-2222-222222222222', 'F360 v2 Factory Rep', 'f360v2-outsider@example.test');
insert into user_roles (user_id, role_key) values
  ('36111111-1111-1111-1111-111111111111', 'planner'),
  ('36222222-2222-2222-2222-222222222222', 'factory_rep');

insert into factories (
  id, factory_code, name, cr_number, license_number, region, city, source
) values (
  '36333333-3333-3333-3333-333333333333', 'F360V2-P1', 'F360 v2 plant',
  'F360V2-CR', 'F360V2-LIC', 'Riyadh', 'Riyadh', 'contract-test'
), (
  '36333333-3333-3333-3333-333333333334', 'F360V2-P2', 'F360 v2 second plant',
  'F360V2-CR', 'F360V2-LIC-2', 'Riyadh', 'Riyadh', 'contract-test'
);
insert into commercial_registrations (
  id, cr_number, unified_number, legal_name, legal_name_en, legal_name_ar, source_system
) values (
  '36444444-4444-4444-4444-444444444441', 'F360V2-CR', '7000000001',
  'F360 v2 legal entity', 'F360 v2 legal entity', 'الكيان القانوني 360', 'contract-test'
);
insert into industrial_licenses (
  id, commercial_registration_id, factory_id, license_number, source_system
) values (
  '36444444-4444-4444-4444-444444444442',
  '36444444-4444-4444-4444-444444444441',
  '36333333-3333-3333-3333-333333333333', 'F360V2-LIC', 'contract-test'
);
insert into plant_production_line_items (
  factory_id, industrial_license_id, item_type, source_item_id, name_en,
  real_production, maximum_production, price, is_primary, source_system
) values (
  '36333333-3333-3333-3333-333333333333',
  '36444444-4444-4444-4444-444444444442',
  'spare_part', 'F360V2-SPARE-1', 'F360 v2 spare part', 10, 20, 5, false,
  'contract-test'
);

do $$
begin
  begin
    update commercial_registrations
    set issue_date = date '2026-01-02', expiry_date = date '2026-01-01'
    where id = '36444444-4444-4444-4444-444444444441';
    raise exception 'F360V2_ASSERT: invalid CR date order accepted';
  exception when check_violation then null;
  end;
  begin
    insert into industrial_licenses (factory_id, license_number)
    values ('36333333-3333-3333-3333-333333333333', 'F360V2-OTHER-LIC');
    raise exception 'F360V2_ASSERT: second license bound to one plant';
  exception when unique_violation then null;
  end;
  begin
    insert into industrial_licenses (factory_id, license_number)
    values ('36333333-3333-3333-3333-333333333334', 'F360V2-LIC');
    raise exception 'F360V2_ASSERT: duplicate license number accepted';
  exception when unique_violation then null;
  end;
  begin
    update commercial_registrations set unified_number = '7000000002'
    where id = '36444444-4444-4444-4444-444444444441';
    raise exception 'F360V2_ASSERT: external unified number was replaceable';
  exception when raise_exception then
    if sqlerrm like 'F360V2_ASSERT:%' then raise; end if;
  end;
  begin
    update industrial_licenses set plant_number = 'PLANT-LOCKED'
    where id = '36444444-4444-4444-4444-444444444442';
    update industrial_licenses set plant_number = 'PLANT-REPLACED'
    where id = '36444444-4444-4444-4444-444444444442';
    raise exception 'F360V2_ASSERT: external plant number was replaceable';
  exception when raise_exception then
    if sqlerrm like 'F360V2_ASSERT:%' then raise; end if;
  end;
end $$;

-- Permission compatibility: planner creates inspections, but no legacy role
-- receives the newly introduced PDF export permission by default.
set local role authenticated;
select set_config('request.jwt.claim.sub', '36111111-1111-1111-1111-111111111111', true);
do $$ begin
  if not has_permission('view_factory_360') then
    raise exception 'F360V2_ASSERT: planner lost Factory 360 view';
  end if;
  if not has_permission('create_inspection') then
    raise exception 'F360V2_ASSERT: planner lost inspection-create path';
  end if;
  if has_permission('export_factory') then
    raise exception 'F360V2_ASSERT: unapproved export permission was invented';
  end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '36222222-2222-2222-2222-222222222222', true);
do $$ begin
  if has_permission('view_factory_documents') then
    raise exception 'F360V2_ASSERT: factory representative gained document metadata access';
  end if;
end $$;
reset role;

-- Raw source snapshots are immutable even to the table owner.
insert into senaei_sync_runs (id, mode, status) values
  ('36555555-5555-5555-5555-555555555551', 'csv_import', 'running');
insert into senaei_raw_snapshots (
  id, sync_run_id, entity_type, external_id, payload, payload_sha256
) values (
  '36555555-5555-5555-5555-555555555552',
  '36555555-5555-5555-5555-555555555551', 'industrial_license', 'F360V2-LIC',
  '{"license_number":"F360V2-LIC"}'::jsonb,
  repeat('a', 64)
);
do $$ begin
  begin
    update senaei_raw_snapshots set external_id = 'changed'
    where id = '36555555-5555-5555-5555-555555555552';
    raise exception 'F360V2_ASSERT: raw snapshot update accepted';
  exception when raise_exception then
    if sqlerrm like 'F360V2_ASSERT:%' then raise; end if;
  end;
end $$;

do $$
begin
  if (select count(*) from permissions where permission_key in (
    'view_factory_360', 'view_factory_documents', 'download_factory_documents',
    'view_risk_details', 'export_factory', 'create_inspection'
  )) <> 6 then
    raise exception 'F360V2_ASSERT: six Factory 360 permissions were not seeded';
  end if;
  if not exists (
    select 1 from audit_events
    where object_type = 'commercial_registrations'
      and object_id = '36444444-4444-4444-4444-444444444441'
      and action = 'INSERT'
  ) then
    raise exception 'F360V2_ASSERT: normalized CR insert was not audited';
  end if;
  if exists (
    select 1 from industrial_licenses where nullif(btrim(license_number), '') is null
  ) then
    raise exception 'F360V2_ASSERT: blank Industrial License identifier exists';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.submission_versions'::regclass
      and tgname = 'trg_capture_inspection_factory_snapshot'
      and not tgisinternal
  ) then
    raise exception 'F360V2_ASSERT: submission-time Factory 360 snapshot trigger missing';
  end if;
  if to_regclass('public.external_source_connections') is null then
    raise exception 'F360V2_ASSERT: external source connection governance missing';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_source_connections'
      and column_name ~ '(password|secret|token|credential)'
  ) then
    raise exception 'F360V2_ASSERT: provider credential material column exists';
  end if;
  if not exists (
    select 1 from plant_production_line_items
    where item_type = 'spare_part' and source_item_id = 'F360V2-SPARE-1'
      and real_production = 10 and maximum_production = 20
  ) then
    raise exception 'F360V2_ASSERT: spare-part production-line contract missing';
  end if;
end $$;

select 'FACTORY360_V2_FOUNDATION_CONTRACT_PASS' as result;
rollback;
