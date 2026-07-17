-- TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001
-- Backend contracts for device capture, Factory 360 source detail, and
-- reproducible DEC-001 risk history. Forward-only; no workflow state mutation.

-- M04-012 / M04-017 / M04-024: the journey retains the device fingerprint and
-- the latest provider-derived route estimate. device_info is intentionally a
-- bounded application snapshot, not an unrestricted browser fingerprint.
alter table journey_sessions
  add column if not exists device_info jsonb,
  add column if not exists route_provider text,
  add column if not exists eta_updated_at timestamptz;

alter table journey_sessions drop constraint if exists journey_device_info_shape;
alter table journey_sessions add constraint journey_device_info_shape check (
  device_info is null or (
    jsonb_typeof(device_info) = 'object'
    and device_info ?& array['device_id','os_version','app_version']
    and jsonb_typeof(device_info->'device_id') = 'string'
    and jsonb_typeof(device_info->'os_version') = 'string'
    and jsonb_typeof(device_info->'app_version') = 'string'
  )
);

-- M07-003/004: source-owned industrial-license and CR attributes. Null means
-- the upstream source did not provide the fact; the UI must render unavailable.
alter table factories
  add column if not exists license_status text,
  add column if not exists license_stage text,
  add column if not exists license_issue_date date,
  add column if not exists license_expiry_date date,
  add column if not exists license_holder text,
  add column if not exists legal_name text,
  add column if not exists cr_status text,
  add column if not exists cr_owner_details text,
  add column if not exists risk_drivers jsonb,
  add column if not exists risk_calculated_at timestamptz;

alter table factories drop constraint if exists factory_license_date_order;
alter table factories add constraint factory_license_date_order check (
  license_issue_date is null or license_expiry_date is null
  or license_expiry_date >= license_issue_date
);

-- M07-019: section visibility is enforced at the data boundary as well as the
-- route. Leadership receives the aggregated profile but not document/contact
-- registries; evidence and penalties retain their own stricter policies.
drop policy if exists fdocs_read on factory_documents;
create policy fdocs_read on factory_documents for select to authenticated using (
  has_any_role(array['planner','inspector','reviewer','ops','auditor','compliance_admin','gis_admin'])
);
drop policy if exists freps_read on factory_representatives;
create policy freps_read on factory_representatives for select to authenticated using (
  has_any_role(array['planner','inspector','reviewer','ops','auditor','compliance_admin'])
);

-- Reconcile the legacy shortened key with the sponsor-accepted DEC-001 name;
-- values and weights are unchanged.
update engine_settings set settings = jsonb_set(
  settings, '{factors}',
  (select jsonb_agg(case
     when coalesce(value->>'key', value->>'name') = 'outcome_recency_severity'
       then (value - 'key' - 'name') || jsonb_build_object('key', 'last_outcome_recency_severity')
     else value end)
   from jsonb_array_elements(settings->'factors'))
)
where engine = 'risk'
  and exists (select 1 from jsonb_array_elements(settings->'factors') f where f->>'key' = 'outcome_recency_severity');

-- M07-014/015: append-only score history. Inputs are normalized upstream to
-- 0..100 and frozen with the exact model version/weights used for the score.
create table if not exists factory_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  score numeric(5,2) not null check (score between 0 and 100),
  band text not null check (band in ('low','medium','high')),
  model_version text not null,
  drivers jsonb not null,
  calculated_by uuid references profiles(user_id),
  calculated_at timestamptz not null default now()
);
create index if not exists factory_risk_snapshots_factory_calculated_idx
  on factory_risk_snapshots (factory_id, calculated_at desc);
create index if not exists geo_events_visit_occurred_idx
  on geo_events (visit_id, occurred_at desc);

-- M07-012/017: penalty issuance is a historical record, distinct from the
-- configurable penalty mapping. Notices are append-only and may retain a
-- private document path for a separately-authorized retrieval surface.
create table if not exists penalty_notices (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  inspection_id uuid references inspections(id),
  violation_id uuid references violations(id),
  notice_number text not null unique,
  status text not null check (status in ('issued','served','settled','withdrawn')),
  issued_at timestamptz not null,
  issued_by uuid references profiles(user_id),
  document_path text,
  created_at timestamptz not null default now()
);
create index if not exists penalty_notices_factory_issued_idx
  on penalty_notices (factory_id, issued_at desc);
create index if not exists penalty_notices_inspection_idx
  on penalty_notices (inspection_id) where inspection_id is not null;

alter table penalty_notices enable row level security;
drop policy if exists penalty_notices_read on penalty_notices;
create policy penalty_notices_read on penalty_notices for select to authenticated using (
  has_any_role(array['reviewer','ops','auditor','compliance_admin','leadership'])
);
drop policy if exists penalty_notices_insert on penalty_notices;
create policy penalty_notices_insert on penalty_notices for insert to authenticated with check (
  has_any_role(array['compliance_admin','ops']) and issued_by = auth.uid()
);
revoke all on table penalty_notices from anon, authenticated;
grant select, insert on table penalty_notices to authenticated;

-- ENG-07 / M04-045: private evidence custody. The first path segment is the
-- inspection UUID or (for pre-inspection arrival/cancellation) Visit UUID.
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do update set public = false;

create or replace function can_write_evidence_object(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare anchor uuid;
begin
  begin anchor := split_part(p_name, '/', 1)::uuid;
  exception when invalid_text_representation then return false;
  end;
  return exists (select 1 from inspections i where i.id = anchor and is_assigned_inspector(i.visit_id))
      or is_assigned_inspector(anchor);
end $$;
revoke all on function can_write_evidence_object(text) from public, anon;
grant execute on function can_write_evidence_object(text) to authenticated;

create or replace function can_read_evidence_object(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare anchor uuid;
begin
  begin anchor := split_part(p_name, '/', 1)::uuid;
  exception when invalid_text_representation then return false;
  end;
  return exists (select 1 from inspections i where i.id = anchor and
    (is_assigned_inspector(i.visit_id) or has_any_role(array['reviewer','ops','auditor'])))
    or exists (select 1 from visits v where v.id = anchor and
      (is_assigned_inspector(v.id) or has_any_role(array['planner','reviewer','ops','auditor'])));
end $$;
revoke all on function can_read_evidence_object(text) from public, anon;
grant execute on function can_read_evidence_object(text) to authenticated;

drop policy if exists evidence_objects_read on storage.objects;
create policy evidence_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and can_read_evidence_object(name));
drop policy if exists evidence_objects_insert on storage.objects;
create policy evidence_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and can_write_evidence_object(name));
drop policy if exists evidence_objects_update on storage.objects;
create policy evidence_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'evidence' and can_write_evidence_object(name))
  with check (bucket_id = 'evidence' and can_write_evidence_object(name));

alter table factory_risk_snapshots enable row level security;
drop policy if exists factory_risk_snapshots_read on factory_risk_snapshots;
create policy factory_risk_snapshots_read on factory_risk_snapshots
  for select to authenticated using (auth.uid() is not null);

revoke all on table factory_risk_snapshots from anon, authenticated;
grant select on table factory_risk_snapshots to authenticated;

-- Existing current scores become an explicitly-labelled baseline observation;
-- no historical driver values or calculation time are fabricated.
insert into factory_risk_snapshots
  (factory_id, score, band, model_version, drivers, calculated_at)
select f.id, f.risk_score, f.risk_band, coalesce(f.risk_version, 'legacy-unversioned'),
       jsonb_build_object('_availability', 'legacy_score_without_driver_snapshot'),
       coalesce(f.risk_calculated_at, f.source_synced_at, f.created_at)
from factories f
where f.risk_score is not null
  and f.risk_band in ('low','medium','high')
  and not exists (
    select 1 from factory_risk_snapshots s where s.factory_id = f.id
  );

-- DEC-001 calculation boundary. Callers supply the five normalized 0..100
-- source values; Postgres supplies weights/bands, calculation, persistence,
-- actor, model version and immutable history atomically.
create or replace function recalculate_factory_risk(
  p_factory uuid,
  p_driver_values jsonb
) returns factory_risk_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
  factor jsonb;
  factor_key text;
  factor_value numeric;
  factor_weight numeric;
  weight_total numeric := 0;
  score_value numeric := 0;
  low_max numeric;
  medium_max numeric;
  band_value text;
  snapshot factory_risk_snapshots;
  driver_snapshot jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or not has_any_role(array['risk_owner','compliance_admin']) then
    raise exception 'Risk recalculation is not permitted (RBAC-004)';
  end if;
  if jsonb_typeof(p_driver_values) <> 'object' then
    raise exception 'Driver values must be a JSON object';
  end if;

  select settings, version_label into cfg
  from engine_settings where engine = 'risk';
  if cfg.settings is null or jsonb_typeof(cfg.settings->'factors') <> 'array' then
    raise exception 'Risk engine configuration is unavailable';
  end if;

  for factor in select value from jsonb_array_elements(cfg.settings->'factors') loop
    factor_key := coalesce(factor->>'key', factor->>'name');
    if factor_key is null or not (p_driver_values ? factor_key) then
      raise exception 'Missing normalized risk driver: %', coalesce(factor_key, 'unknown');
    end if;
    begin
      factor_value := (p_driver_values->>factor_key)::numeric;
    exception when others then
      raise exception 'Risk driver % must be numeric', factor_key;
    end;
    if factor_value < 0 or factor_value > 100 then
      raise exception 'Risk driver % must be between 0 and 100', factor_key;
    end if;
    factor_weight := (factor->>'weight')::numeric;
    if factor_weight < 0 or factor_weight > 1 then
      raise exception 'Risk weight for % must be between 0 and 1', factor_key;
    end if;
    weight_total := weight_total + factor_weight;
    score_value := score_value + factor_value * factor_weight;
    driver_snapshot := driver_snapshot || jsonb_build_object(
      factor_key,
      jsonb_build_object('value', factor_value, 'weight', factor_weight,
                         'contribution', round(factor_value * factor_weight, 2))
    );
  end loop;

  if abs(weight_total - 1) > 0.001 then
    raise exception 'Risk model weights must sum to 1.00';
  end if;

  score_value := round(score_value, 2);
  low_max := (cfg.settings#>>'{bands,low,1}')::numeric;
  medium_max := (cfg.settings#>>'{bands,medium,1}')::numeric;
  band_value := case when score_value <= low_max then 'low'
                     when score_value <= medium_max then 'medium'
                     else 'high' end;

  insert into factory_risk_snapshots
    (factory_id, score, band, model_version, drivers, calculated_by)
  values
    (p_factory, score_value, band_value, cfg.version_label, driver_snapshot, auth.uid())
  returning * into snapshot;

  update factories set
    risk_score = score_value,
    risk_band = band_value,
    risk_version = cfg.version_label,
    risk_drivers = driver_snapshot,
    risk_calculated_at = snapshot.calculated_at
  where id = p_factory;
  if not found then raise exception 'Factory not found'; end if;

  return snapshot;
end $$;
revoke all on function recalculate_factory_risk(uuid, jsonb) from public, anon;
grant execute on function recalculate_factory_risk(uuid, jsonb) to authenticated;

-- ENG-12: Factory risk/source changes and immutable risk snapshots are visible
-- in the existing audit browser. Do not create duplicate triggers on replay.
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_factories' and not tgisinternal) then
    create trigger trg_audit_factories after insert or update or delete on factories
      for each row execute function audit_row_change();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_factory_risk_snapshots' and not tgisinternal) then
    create trigger trg_audit_factory_risk_snapshots after insert on factory_risk_snapshots
      for each row execute function audit_row_change();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_penalty_notices' and not tgisinternal) then
    create trigger trg_audit_penalty_notices after insert on penalty_notices
      for each row execute function audit_row_change();
  end if;
end $$;
