-- TASK-FACTORY-360-COMPLETE-010 · Factory 360 v2 additive foundation
--
-- Forward-only and replay-safe. Existing factories IDs/columns remain the
-- compatibility plant identity. Only nonblank, unambiguous source identifiers
-- are backfilled; no CR, Industrial License or plant number is manufactured.

-- ---------- Fine-grained Factory 360 permissions ---------------------------
create table if not exists public.permissions (
  permission_key text primary key,
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(role_key) on delete cascade,
  permission_key text not null references public.permissions(permission_key) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

insert into public.permissions (permission_key, title, description) values
  ('view_factory_360', 'View Factory 360', 'Open the CR-centred Factory 360 read model.'),
  ('view_factory_documents', 'View Factory Documents', 'View Factory 360 document metadata.'),
  ('download_factory_documents', 'Download Factory Documents', 'Retrieve an authorized Factory 360 document object.'),
  ('view_risk_details', 'View Factory Risk Details', 'View stored Risk Engine factors and explanations.'),
  ('export_factory', 'Export Factory 360', 'Generate a selected-license Factory 360 export.'),
  ('create_inspection', 'Create Inspection from Factory 360', 'Open an authorized planning flow with selected-license context.')
on conflict (permission_key) do nothing;

-- Preserve current factories_read/risk visibility for all existing roles.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
from public.roles r
cross join (values ('view_factory_360'), ('view_risk_details')) p(permission_key)
on conflict do nothing;

-- Preserve the current Factory 360 document metadata role boundary.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
from public.roles r
join (values
  ('planner'), ('inspector'), ('reviewer'), ('ops'), ('auditor'),
  ('compliance_admin'), ('gis_admin')
) allowed(role_key) on allowed.role_key = r.role_key
cross join (values ('view_factory_documents')) p(permission_key)
on conflict do nothing;

-- Preserve roles already able to retrieve private inspection/visit evidence.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'download_factory_documents'
from public.roles r
join (values ('planner'), ('inspector'), ('reviewer'), ('ops'), ('auditor')) allowed(role_key)
  on allowed.role_key = r.role_key
on conflict do nothing;

-- Preserve existing planner and immediate-inspector inspection creation paths.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'create_inspection'
from public.roles r
join (values ('planner'), ('inspector')) allowed(role_key) on allowed.role_key = r.role_key
on conflict do nothing;

-- No role is seeded for export_factory: no prior Factory 360 export existed.
create or replace function public.has_permission(p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_key = ur.role_key
    where ur.user_id = auth.uid()
      and rp.permission_key = p_permission_key
  )
$$;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

-- ---------- Senaei synchronization and import custody ----------------------
create table if not exists public.external_source_connections (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  environment text not null,
  contract_version text,
  base_url_origin text check (base_url_origin is null or base_url_origin ~ '^https://[^/?#]+$'),
  auth_mode text check (auth_mode is null or auth_mode in ('api_key', 'bearer', 'none')),
  configuration_status text not null default 'not_configured' check (configuration_status in ('not_configured', 'configured', 'validated', 'disabled')),
  enabled boolean not null default false,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_key, environment)
);

create table if not exists public.senaei_sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.external_source_connections(id),
  mode text not null check (mode in ('api', 'csv_import')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'partial', 'failed', 'dependency_blocked', 'cancelled')),
  correlation_id uuid not null default gen_random_uuid(),
  contract_version text,
  requested_by uuid default auth.uid() references public.profiles(user_id),
  source_file_name text,
  source_file_sha256 text check (source_file_sha256 is null or source_file_sha256 ~ '^[0-9a-f]{64}$'),
  rows_received integer not null default 0 check (rows_received >= 0),
  rows_accepted integer not null default 0 check (rows_accepted >= 0),
  rows_rejected integer not null default 0 check (rows_rejected >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (rows_accepted + rows_rejected <= rows_received),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);
alter table public.senaei_sync_runs
  add column if not exists connection_id uuid references public.external_source_connections(id);
create unique index if not exists senaei_sync_runs_correlation_uq on public.senaei_sync_runs(correlation_id);

create table if not exists public.senaei_sync_calls (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.senaei_sync_runs(id),
  endpoint_key text not null,
  http_method text not null check (http_method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  request_id text,
  outcome text not null check (outcome in ('accepted', 'rejected', 'failed', 'dependency_blocked')),
  http_status integer check (http_status is null or http_status between 100 and 599),
  safe_error_code text,
  response_sha256 text check (response_sha256 is null or response_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null default now(),
  unique (sync_run_id, endpoint_key, request_id)
);

create table if not exists public.senaei_raw_snapshots (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.senaei_sync_runs(id),
  sync_call_id uuid references public.senaei_sync_calls(id),
  entity_type text not null,
  external_id text,
  payload jsonb not null check (jsonb_typeof(payload) in ('object', 'array')),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  captured_at timestamptz not null default now(),
  unique (sync_run_id, entity_type, payload_sha256)
);

create table if not exists public.factory_import_batches (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null unique references public.senaei_sync_runs(id),
  file_name text not null,
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  schema_version text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'validating', 'validated', 'imported', 'partial', 'rejected', 'failed')),
  uploaded_by uuid not null default auth.uid() references public.profiles(user_id),
  uploaded_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (file_sha256, schema_version)
);

create table if not exists public.factory_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.factory_import_batches(id),
  row_number integer not null check (row_number > 0),
  raw_values jsonb not null check (jsonb_typeof(raw_values) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'reconciled')),
  safe_error_codes text[] not null default '{}',
  raw_snapshot_id uuid references public.senaei_raw_snapshots(id),
  reconciled_at timestamptz,
  unique (batch_id, row_number)
);

-- ---------- CR -> Industrial License -> existing factory/plant ------------
create table if not exists public.commercial_registrations (
  id uuid primary key default gen_random_uuid(),
  cr_number text not null unique check (length(btrim(cr_number)) > 0),
  unified_number text unique check (unified_number is null or length(btrim(unified_number)) > 0),
  legal_name text,
  legal_name_en text,
  legal_name_ar text,
  status text,
  issue_date date,
  expiry_date date,
  owner_details text,
  source_system text,
  source_synced_at timestamptz,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.commercial_registrations
  add column if not exists issue_date date,
  add column if not exists expiry_date date;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.commercial_registrations'::regclass
      and conname = 'commercial_registrations_date_order_ck'
  ) then
    alter table public.commercial_registrations
      add constraint commercial_registrations_date_order_ck
      check (issue_date is null or expiry_date is null or expiry_date >= issue_date);
  end if;
end $$;

create table if not exists public.industrial_licenses (
  id uuid primary key default gen_random_uuid(),
  commercial_registration_id uuid references public.commercial_registrations(id),
  factory_id uuid not null unique references public.factories(id),
  license_number text not null unique check (length(btrim(license_number)) > 0),
  plant_number text unique,
  license_type text,
  status text,
  stage text,
  issue_date date,
  expiry_date date,
  holder_name text,
  investment_type text,
  investment_size numeric,
  source_system text,
  source_synced_at timestamptz,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (issue_date is null or expiry_date is null or expiry_date >= issue_date)
);
create index if not exists industrial_licenses_cr_idx on public.industrial_licenses(commercial_registration_id);

-- External business identities are write-once. A provider may fill a formerly
-- unavailable nullable identifier, but an established CR/license/plant value
-- and the license-to-factory binding cannot be silently replaced.
create or replace function public.guard_factory360_external_identifiers()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'commercial_registrations' then
    if old.cr_number is distinct from new.cr_number
       or (old.unified_number is not null and old.unified_number is distinct from new.unified_number) then
      raise exception 'IMMUTABLE_EXTERNAL_ID: Commercial Registration identifiers cannot be replaced';
    end if;
  elsif tg_table_name = 'industrial_licenses' then
    if old.license_number is distinct from new.license_number
       or old.factory_id is distinct from new.factory_id
       or (old.plant_number is not null and old.plant_number is distinct from new.plant_number) then
      raise exception 'IMMUTABLE_EXTERNAL_ID: Industrial License and plant identifiers cannot be replaced';
    end if;
  end if;
  return new;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.commercial_registrations'::regclass
      and tgname = 'trg_f360_guard_cr_external_ids' and not tgisinternal
  ) then
    create trigger trg_f360_guard_cr_external_ids
      before update on public.commercial_registrations
      for each row execute function public.guard_factory360_external_identifiers();
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.industrial_licenses'::regclass
      and tgname = 'trg_f360_guard_license_external_ids' and not tgisinternal
  ) then
    create trigger trg_f360_guard_license_external_ids
      before update on public.industrial_licenses
      for each row execute function public.guard_factory360_external_identifiers();
  end if;
end $$;

create table if not exists public.plant_addresses (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  industrial_license_id uuid not null references public.industrial_licenses(id),
  version_number integer not null default 1 check (version_number > 0),
  external_address_id text,
  address_type_code text,
  address_line_1 text,
  landmark text,
  district_en text,
  district_ar text,
  building_number text,
  additional_number text,
  postal_code text,
  unit_number text,
  street_name_en text,
  street_name_ar text,
  city_en text,
  city_ar text,
  region_en text,
  region_ar text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  source_system text,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  effective_at timestamptz not null default now(),
  superseded_at timestamptz,
  is_current boolean not null default true,
  unique (factory_id, version_number),
  check (superseded_at is null or superseded_at >= effective_at)
);
create unique index if not exists plant_addresses_one_current_uq on public.plant_addresses(factory_id) where is_current;

-- Typed, versioned source items. Existing factory_products/materials remain as
-- compatibility tables and are projected into v1 only when a real license maps.
create table if not exists public.plant_production_line_items (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  industrial_license_id uuid not null references public.industrial_licenses(id),
  item_type text not null,
  source_item_id text,
  external_product_id text,
  external_unit_id text,
  legacy_source_table text,
  legacy_source_id uuid,
  version_number integer not null default 1 check (version_number > 0),
  name_en text,
  name_ar text,
  hs_code text,
  activity_code text,
  quantity numeric,
  capacity numeric,
  real_production numeric,
  maximum_production numeric,
  price numeric,
  is_primary boolean,
  unit_code text,
  unit_name_en text,
  unit_name_ar text,
  hs_code_type text,
  activity_name_en text,
  activity_name_ar text,
  is_spare_part boolean,
  is_machine boolean,
  is_end_product boolean,
  is_raw_material boolean,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  source_system text,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  effective_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  check (name_en is not null or name_ar is not null),
  check (source_item_id is not null or legacy_source_id is not null),
  check (superseded_at is null or superseded_at >= effective_at)
);
alter table public.plant_production_line_items
  add column if not exists external_product_id text,
  add column if not exists external_unit_id text,
  add column if not exists real_production numeric,
  add column if not exists maximum_production numeric,
  add column if not exists price numeric,
  add column if not exists is_primary boolean,
  add column if not exists unit_name_en text,
  add column if not exists unit_name_ar text,
  add column if not exists hs_code_type text,
  add column if not exists activity_name_en text,
  add column if not exists activity_name_ar text,
  add column if not exists is_spare_part boolean,
  add column if not exists is_machine boolean,
  add column if not exists is_end_product boolean,
  add column if not exists is_raw_material boolean,
  add column if not exists source_created_at timestamptz,
  add column if not exists source_updated_at timestamptz;
alter table public.plant_production_line_items
  drop constraint if exists plant_production_line_items_item_type_check;
alter table public.plant_production_line_items
  add constraint plant_production_line_items_item_type_check
  check (item_type in ('production_line', 'product', 'machine', 'raw_material', 'spare_part'));
create unique index if not exists plant_line_source_version_uq
  on public.plant_production_line_items(industrial_license_id, item_type, source_item_id, version_number)
  where source_item_id is not null;
create unique index if not exists plant_line_legacy_version_uq
  on public.plant_production_line_items(legacy_source_table, legacy_source_id, version_number)
  where legacy_source_id is not null;
create index if not exists plant_line_factory_idx
  on public.plant_production_line_items(factory_id, item_type, effective_at desc);

-- Frozen at submission time. No historical snapshot is fabricated by this
-- migration; application submission wiring must insert the exact source facts.
create table if not exists public.inspection_factory_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_version_id uuid not null unique references public.submission_versions(id),
  factory_id uuid not null references public.factories(id),
  commercial_registration_id uuid references public.commercial_registrations(id),
  industrial_license_id uuid references public.industrial_licenses(id),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  captured_at timestamptz not null default now()
);

-- Capture the exact official hierarchy facts visible at submission time.
-- This is intentionally forward-only: historical submissions are not
-- reconstructed from today's source records.
create or replace function public.capture_inspection_factory_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
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
  left join public.commercial_registrations cr on cr.id = il.commercial_registration_id
  where i.id = new.inspection_id;

  if captured_factory_id is not null then
    insert into public.inspection_factory_snapshots (
      submission_version_id, factory_id, commercial_registration_id,
      industrial_license_id, snapshot, snapshot_sha256
    ) values (
      new.id, captured_factory_id, captured_cr_id, captured_license_id,
      captured, encode(digest(convert_to(captured::text, 'UTF8'), 'sha256'), 'hex')
    ) on conflict (submission_version_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.capture_inspection_factory_snapshot() from public, anon, authenticated;

drop trigger if exists trg_capture_inspection_factory_snapshot on public.submission_versions;
create trigger trg_capture_inspection_factory_snapshot
after insert on public.submission_versions
for each row execute function public.capture_inspection_factory_snapshot();

create table if not exists public.factory_government_records (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  industrial_license_id uuid references public.industrial_licenses(id),
  record_type text not null,
  external_record_id text not null,
  version_number integer not null default 1 check (version_number > 0),
  status text not null,
  title text,
  valid_from date,
  valid_to date,
  status_history jsonb not null default '[]'::jsonb check (jsonb_typeof(status_history) = 'array'),
  documents_metadata jsonb not null default '[]'::jsonb check (jsonb_typeof(documents_metadata) = 'array'),
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  source_system text not null,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  recorded_at timestamptz not null default now(),
  unique (source_system, record_type, external_record_id, version_number),
  check (valid_from is null or valid_to is null or valid_to >= valid_from)
);
create index if not exists factory_government_records_factory_idx
  on public.factory_government_records(factory_id, record_type, recorded_at desc);

create table if not exists public.factory_media_assets (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  industrial_license_id uuid references public.industrial_licenses(id),
  category text not null check (category in (
    'official_factory_image', 'factory_profile_image', 'inspection_evidence',
    'arrival_evidence', 'violation_evidence'
  )),
  evidence_id uuid references public.evidence(id),
  inspection_id uuid references public.inspections(id),
  violation_id uuid references public.violations(id),
  storage_path text,
  title text,
  mime_type text,
  source_system text not null,
  source_snapshot_id uuid references public.senaei_raw_snapshots(id),
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  check (storage_path is not null or evidence_id is not null),
  check (
    (category in ('official_factory_image', 'factory_profile_image') and evidence_id is null and inspection_id is null and violation_id is null)
    or (category = 'inspection_evidence' and evidence_id is not null and inspection_id is not null and violation_id is null)
    or (category = 'arrival_evidence' and evidence_id is not null and violation_id is null)
    or (category = 'violation_evidence' and evidence_id is not null and inspection_id is not null and violation_id is not null)
  )
);
create unique index if not exists factory_media_assets_evidence_uq
  on public.factory_media_assets(evidence_id) where evidence_id is not null;
create index if not exists factory_media_assets_factory_category_idx
  on public.factory_media_assets(factory_id, category, created_at desc);

create table if not exists public.senaei_reconciliation_records (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.senaei_sync_runs(id),
  raw_snapshot_id uuid references public.senaei_raw_snapshots(id),
  entity_type text not null,
  external_id text,
  outcome text not null check (outcome in ('created', 'matched', 'updated', 'unchanged', 'rejected', 'conflict', 'dependency_blocked')),
  commercial_registration_id uuid references public.commercial_registrations(id),
  industrial_license_id uuid references public.industrial_licenses(id),
  factory_id uuid references public.factories(id),
  safe_reason_codes text[] not null default '{}',
  reconciled_by uuid default auth.uid() references public.profiles(user_id),
  reconciled_at timestamptz not null default now(),
  check (outcome in ('rejected', 'conflict', 'dependency_blocked') or raw_snapshot_id is not null)
);
create index if not exists senaei_reconciliation_run_idx
  on public.senaei_reconciliation_records(sync_run_id, reconciled_at);

-- ---------- Existing document provenance/category extension ----------------
alter table public.factory_documents
  add column if not exists industrial_license_id uuid,
  add column if not exists business_category text,
  add column if not exists source_system text,
  add column if not exists external_document_id text,
  add column if not exists source_snapshot_id uuid,
  add column if not exists source_status text,
  add column if not exists provenance jsonb not null default '{}'::jsonb;

update public.factory_documents
set business_category = coalesce(business_category, doc_type),
    source_system = coalesce(source_system, 'inspection_platform')
where business_category is null or source_system is null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'factory_documents_industrial_license_fk') then
    alter table public.factory_documents add constraint factory_documents_industrial_license_fk
      foreign key (industrial_license_id) references public.industrial_licenses(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'factory_documents_source_snapshot_fk') then
    alter table public.factory_documents add constraint factory_documents_source_snapshot_fk
      foreign key (source_snapshot_id) references public.senaei_raw_snapshots(id);
  end if;
end $$;

-- Attach canonical audit before compatibility backfill so the provenance of
-- every normalized row created from the legacy tables is retained.
do $$
declare t text; trigger_name text;
begin
  foreach t in array array[
    'permissions', 'role_permissions', 'external_source_connections', 'senaei_sync_runs', 'senaei_sync_calls',
    'senaei_raw_snapshots', 'factory_import_batches', 'factory_import_rows',
    'commercial_registrations', 'industrial_licenses', 'plant_addresses',
    'plant_production_line_items', 'inspection_factory_snapshots',
    'factory_government_records', 'factory_media_assets',
    'senaei_reconciliation_records'
  ] loop
    trigger_name := 'trg_audit_' || t;
    if not exists (select 1 from pg_trigger where tgrelid = format('public.%I', t)::regclass and tgname = trigger_name and not tgisinternal) then
      execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()', trigger_name, t);
    end if;
  end loop;
end $$;

-- ---------- Honest compatibility backfill ---------------------------------
insert into public.commercial_registrations
  (cr_number, legal_name, legal_name_en, legal_name_ar, status, owner_details,
   source_system, source_synced_at)
select
  btrim(f.cr_number),
  case when count(distinct nullif(btrim(f.legal_name), '')) = 1 then max(nullif(btrim(f.legal_name), '')) end,
  null,
  null,
  case when count(distinct nullif(btrim(f.cr_status), '')) = 1 then max(nullif(btrim(f.cr_status), '')) end,
  case when count(distinct nullif(btrim(f.cr_owner_details), '')) = 1 then max(nullif(btrim(f.cr_owner_details), '')) end,
  case when count(distinct nullif(btrim(f.source), '')) = 1 then max(nullif(btrim(f.source), '')) end,
  max(f.source_synced_at)
from public.factories f
where nullif(btrim(f.cr_number), '') is not null
group by btrim(f.cr_number)
on conflict (cr_number) do nothing;

with candidates as (
  select f.*,
         count(*) over (partition by btrim(f.license_number)) as license_count
  from public.factories f
  where nullif(btrim(f.license_number), '') is not null
)
insert into public.industrial_licenses
  (commercial_registration_id, factory_id, license_number, status, stage,
   issue_date, expiry_date, holder_name, source_system, source_synced_at)
select cr.id, f.id, btrim(f.license_number), f.license_status, f.license_stage,
       f.license_issue_date, f.license_expiry_date, f.license_holder,
       f.source, f.source_synced_at
from candidates f
left join public.commercial_registrations cr
  on cr.cr_number = nullif(btrim(f.cr_number), '')
where f.license_count = 1
on conflict do nothing;

insert into public.plant_addresses
  (factory_id, industrial_license_id, version_number, city_en, region_en,
   latitude, longitude, source_system, effective_at)
select f.id, il.id, 1, f.city, f.region, f.official_lat, f.official_lng,
       f.source, coalesce(f.source_synced_at, f.created_at)
from public.factories f
join public.industrial_licenses il on il.factory_id = f.id
where not exists (
  select 1 from public.plant_addresses pa where pa.factory_id = f.id and pa.is_current
)
  and (f.city is not null or f.region is not null or f.official_lat is not null or f.official_lng is not null);

insert into public.plant_production_line_items
  (factory_id, industrial_license_id, item_type, legacy_source_table,
   legacy_source_id, version_number, name_en, hs_code, capacity, unit_code,
   attributes, source_system, effective_at)
select p.factory_id, il.id, 'product', 'factory_products', p.id, 1,
       p.name, p.hs_code, p.annual_capacity, p.unit,
       jsonb_build_object('is_primary', p.is_primary), 'inspection_platform_legacy', p.created_at
from public.factory_products p
join public.industrial_licenses il on il.factory_id = p.factory_id
on conflict do nothing;

insert into public.plant_production_line_items
  (factory_id, industrial_license_id, item_type, legacy_source_table,
   legacy_source_id, version_number, name_en, hs_code, attributes,
   source_system, effective_at)
select m.factory_id, il.id, 'raw_material', 'factory_materials', m.id, 1,
       m.name, m.hs_code, jsonb_build_object('material_source', m.source),
       'inspection_platform_legacy', m.created_at
from public.factory_materials m
join public.industrial_licenses il on il.factory_id = m.factory_id
on conflict do nothing;

update public.factory_documents d
set industrial_license_id = il.id
from public.industrial_licenses il
where il.factory_id = d.factory_id
  and d.industrial_license_id is null;

-- ---------- RLS, grants and append-only audit -------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'permissions', 'role_permissions', 'external_source_connections', 'senaei_sync_runs', 'senaei_sync_calls',
    'senaei_raw_snapshots', 'factory_import_batches', 'factory_import_rows',
    'commercial_registrations', 'industrial_licenses', 'plant_addresses',
    'plant_production_line_items', 'inspection_factory_snapshots',
    'factory_government_records', 'factory_media_assets',
    'senaei_reconciliation_records'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select on public.permissions, public.role_permissions,
  public.external_source_connections to authenticated;
grant insert, update on public.external_source_connections to authenticated;
grant select on public.commercial_registrations, public.industrial_licenses,
  public.plant_addresses, public.plant_production_line_items,
  public.inspection_factory_snapshots, public.factory_government_records,
  public.factory_media_assets to authenticated;
grant select, insert, update on public.senaei_sync_runs, public.senaei_sync_calls,
  public.factory_import_batches, public.factory_import_rows to authenticated;
grant select, insert on public.senaei_raw_snapshots,
  public.senaei_reconciliation_records to authenticated;
grant insert, update on public.commercial_registrations, public.industrial_licenses,
  public.plant_addresses, public.factory_government_records,
  public.factory_media_assets to authenticated;
grant insert on public.plant_production_line_items,
  public.inspection_factory_snapshots to authenticated;
grant insert, update, delete on public.role_permissions to authenticated;

drop policy if exists f360_permissions_read on public.permissions;
create policy f360_permissions_read on public.permissions for select to authenticated using (auth.uid() is not null);
drop policy if exists f360_role_permissions_read on public.role_permissions;
create policy f360_role_permissions_read on public.role_permissions for select to authenticated using (auth.uid() is not null);
drop policy if exists f360_role_permissions_admin on public.role_permissions;
create policy f360_role_permissions_admin on public.role_permissions for all to authenticated
  using (has_role('security_admin')) with check (has_role('security_admin'));

do $$
declare t text;
begin
  foreach t in array array[
    'external_source_connections', 'senaei_sync_runs', 'senaei_sync_calls', 'senaei_raw_snapshots',
    'factory_import_batches', 'factory_import_rows', 'senaei_reconciliation_records'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'f360_' || t || '_admin', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (has_any_role(array[''security_admin'',''workflow_admin'',''compliance_admin''])) with check (has_any_role(array[''security_admin'',''workflow_admin'',''compliance_admin'']))',
      'f360_' || t || '_admin', t
    );
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'commercial_registrations', 'industrial_licenses', 'plant_addresses',
    'plant_production_line_items', 'factory_government_records'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'f360_' || t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (has_permission(''view_factory_360''))', 'f360_' || t || '_read', t);
    execute format('drop policy if exists %I on public.%I', 'f360_' || t || '_admin', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (has_any_role(array[''security_admin'',''workflow_admin'',''compliance_admin''])) with check (has_any_role(array[''security_admin'',''workflow_admin'',''compliance_admin'']))',
      'f360_' || t || '_admin', t
    );
  end loop;
end $$;

drop policy if exists f360_plant_addresses_gis_admin on public.plant_addresses;
create policy f360_plant_addresses_gis_admin on public.plant_addresses for all to authenticated
  using (has_role('gis_admin')) with check (has_role('gis_admin'));

drop policy if exists f360_media_read on public.factory_media_assets;
create policy f360_media_read on public.factory_media_assets for select to authenticated
  using (
    (category in ('official_factory_image', 'factory_profile_image') and has_permission('view_factory_documents'))
    or (category not in ('official_factory_image', 'factory_profile_image') and exists (
      select 1 from public.evidence e
      left join public.inspections i on i.id = e.inspection_id
      where e.id = factory_media_assets.evidence_id
        and (
          has_any_role(array['reviewer','auditor','ops'])
          or (i.id is not null and is_assigned_inspector(i.visit_id))
          or (e.visit_id is not null and is_assigned_inspector(e.visit_id))
        )
    ))
  );
drop policy if exists f360_media_admin on public.factory_media_assets;
create policy f360_media_admin on public.factory_media_assets for all to authenticated
  using (has_any_role(array['security_admin','workflow_admin','compliance_admin']))
  with check (has_any_role(array['security_admin','workflow_admin','compliance_admin']));

drop policy if exists f360_inspection_snapshots_read on public.inspection_factory_snapshots;
create policy f360_inspection_snapshots_read on public.inspection_factory_snapshots for select to authenticated
  using (
    has_permission('view_factory_360') and exists (
      select 1
      from public.submission_versions sv
      join public.inspections i on i.id = sv.inspection_id
      where sv.id = inspection_factory_snapshots.submission_version_id
        and (has_any_role(array['reviewer','auditor','ops','planner','leadership']) or is_assigned_inspector(i.visit_id))
    )
  );
drop policy if exists f360_inspection_snapshots_insert on public.inspection_factory_snapshots;
create policy f360_inspection_snapshots_insert on public.inspection_factory_snapshots for insert to authenticated
  with check (
    exists (
      select 1
      from public.submission_versions sv
      join public.inspections i on i.id = sv.inspection_id
      where sv.id = inspection_factory_snapshots.submission_version_id
        and sv.submitted_by = auth.uid()
        and is_assigned_inspector(i.visit_id)
    )
  );

create or replace function public.block_factory360_immutable_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'IMMUTABLE: % rows are append-only — % rejected', tg_table_name, tg_op;
end $$;

do $$
declare t text; trigger_name text;
begin
  foreach t in array array[
    'senaei_raw_snapshots', 'plant_production_line_items',
    'inspection_factory_snapshots', 'factory_government_records'
  ] loop
    trigger_name := 'trg_f360_immutable_' || t;
    if not exists (select 1 from pg_trigger where tgrelid = format('public.%I', t)::regclass and tgname = trigger_name and not tgisinternal) then
      execute format('create trigger %I before update or delete on public.%I for each row execute function public.block_factory360_immutable_mutation()', trigger_name, t);
    end if;
  end loop;
end $$;
