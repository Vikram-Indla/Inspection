-- MVP1-M09 authoritative completion (source workbook rows M09-001..030).
-- Forward-only and backward-compatible: existing governed records remain valid;
-- new versions gain explicit lineage, templates, package-specific item rules and
-- complete frozen execution dependencies.

-- Regulation lineage and mandatory deactivation evidence (M09-001/010/014).
alter table public.regulations
  add column if not exists version_label text not null default 'v1',
  add column if not exists supersedes_id uuid references public.regulations(id) on delete restrict,
  add column if not exists effective_to date,
  add column if not exists deactivation_reason text;
alter table public.package_versions add column if not exists deactivation_reason text;

alter table public.regulations drop constraint if exists regulations_code_key;
create unique index if not exists regulations_code_version_unique
  on public.regulations(code, version_label);
create unique index if not exists regulations_one_open_governed
  on public.regulations(code)
  where status in ('published','locked') and effective_to is null;

create or replace function public.publish_regulation(p_regulation_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_new public.regulations%rowtype; v_old public.regulations%rowtype; v_invalid integer;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then raise exception 'not authorized'; end if;
  select * into v_new from public.regulations where id=p_regulation_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'regulation draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;
  select count(*) into v_invalid from public.regulation_clauses c
    where c.regulation_id=v_new.id and not exists(select 1 from public.inspection_items i where i.clause_id=c.id);
  if not exists(select 1 from public.regulation_clauses where regulation_id=v_new.id) or v_invalid > 0 then
    raise exception 'every regulation clause must map to an inspection item';
  end if;
  select * into v_old from public.regulations
    where code=v_new.code and status in ('published','locked') and effective_to is null limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then raise exception 'successor effective date must follow active version'; end if;
    update public.regulations set status='deactivated', effective_to=v_new.effective_from-1,
      deactivated_at=now(), deactivated_by=auth.uid(), deactivation_reason='Superseded by governed successor'
      where id=v_old.id;
    update public.regulations set supersedes_id=v_old.id where id=v_new.id;
  end if;
  update public.regulations set status='published', approved_by=auth.uid(), published_at=now() where id=v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_regulation(uuid) from public, anon;
grant execute on function public.publish_regulation(uuid) to authenticated;

create or replace function public.guard_published_regulation() returns trigger language plpgsql as $$
begin
  if tg_op='DELETE' and old.status in ('published','locked','deactivated') then raise exception 'IMMUTABLE: governed regulation cannot be deleted'; end if;
  if tg_op='UPDATE' and old.status in ('published','locked') then
    if new.status='deactivated' and new.deactivated_at is not null and new.deactivated_by is not null
       and coalesce(btrim(new.deactivation_reason),'')<>''
       and new.code is not distinct from old.code and new.title is not distinct from old.title
       and new.issuing_authority is not distinct from old.issuing_authority
       and new.effective_from is not distinct from old.effective_from
       and new.version_label is not distinct from old.version_label then return new; end if;
    raise exception 'IMMUTABLE: published regulation requires a governed successor';
  end if;
  if tg_op='UPDATE' and old.status='deactivated' and new is distinct from old then raise exception 'IMMUTABLE: deactivated regulation cannot be modified'; end if;
  return coalesce(new,old);
end $$;

-- Immutable item catalogue history; package snapshots remain the execution truth
-- while this archive makes every catalogue configuration version queryable.
create table if not exists public.inspection_item_versions (
  item_id uuid not null references public.inspection_items(id) on delete restrict,
  configuration_version integer not null,
  snapshot jsonb not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(user_id),
  primary key (item_id, configuration_version)
);

insert into public.inspection_item_versions(item_id, configuration_version, snapshot)
select id, configuration_version, to_jsonb(i)
from public.inspection_items i
on conflict do nothing;

create or replace function public.archive_inspection_item_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new is distinct from old then
    insert into public.inspection_item_versions(item_id, configuration_version, snapshot, recorded_by)
    values (old.id, old.configuration_version, to_jsonb(old), auth.uid())
    on conflict do nothing;
    insert into public.inspection_item_versions(item_id, configuration_version, snapshot, recorded_by)
    values (new.id, new.configuration_version, to_jsonb(new), auth.uid())
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_archive_inspection_item_version on public.inspection_items;
create trigger trg_archive_inspection_item_version
  before update on public.inspection_items
  for each row execute function public.archive_inspection_item_version();

-- Versioned Template Builder registry (M09-006/008/009/027/029).
create table if not exists public.configuration_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  template_type text not null check (template_type in ('form','report','action_form','penalty')),
  version_label text not null,
  title_en text not null,
  title_ar text not null,
  status public.config_status not null default 'draft',
  schema jsonb not null,
  effective_from date,
  effective_to date,
  created_by uuid not null references public.profiles(user_id),
  approved_by uuid references public.profiles(user_id),
  published_at timestamptz,
  supersedes_id uuid references public.configuration_templates(id) on delete restrict,
  deactivation_reason text,
  created_at timestamptz not null default now(),
  constraint configuration_templates_key_version_unique unique(template_key, version_label),
  constraint configuration_templates_maker_checker check (approved_by is null or approved_by <> created_by),
  constraint configuration_templates_window check (effective_to is null or effective_from is null or effective_to >= effective_from)
);
create unique index if not exists configuration_templates_one_open_governed
  on public.configuration_templates(template_key)
  where status in ('published','locked') and effective_to is null;

alter table public.configuration_templates enable row level security;
alter table public.inspection_item_versions enable row level security;
revoke all on public.configuration_templates, public.inspection_item_versions from anon;
grant select on public.configuration_templates, public.inspection_item_versions to authenticated;
grant insert, update, delete on public.configuration_templates to authenticated;

drop policy if exists configuration_templates_read on public.configuration_templates;
create policy configuration_templates_read on public.configuration_templates for select
  using (auth.uid() is not null);
drop policy if exists configuration_templates_write on public.configuration_templates;
create policy configuration_templates_write on public.configuration_templates for all
  using (public.has_any_role(array['compliance_admin','form_admin']))
  with check (public.has_any_role(array['compliance_admin','form_admin']));
drop policy if exists inspection_item_versions_read on public.inspection_item_versions;
create policy inspection_item_versions_read on public.inspection_item_versions for select
  using (public.has_any_role(array['compliance_admin','form_admin']));

create or replace function public.guard_governed_configuration_template()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.status <> 'draft' then
    raise exception 'IMMUTABLE: governed template cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status in ('published','locked') then
    if new.status = 'deactivated'
       and new.effective_to is not null
       and coalesce(btrim(new.deactivation_reason),'')<>''
       and new.schema is not distinct from old.schema
       and new.template_key is not distinct from old.template_key
       and new.version_label is not distinct from old.version_label
       and new.title_en is not distinct from old.title_en
       and new.title_ar is not distinct from old.title_ar then
      return new;
    end if;
    raise exception 'IMMUTABLE: published template requires a successor version';
  end if;
  if tg_op = 'UPDATE' and old.status = 'deactivated' and new is distinct from old then
    raise exception 'IMMUTABLE: deactivated template cannot be modified';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_guard_governed_configuration_template on public.configuration_templates;
create trigger trg_guard_governed_configuration_template before update or delete on public.configuration_templates
  for each row execute function public.guard_governed_configuration_template();

create or replace function public.publish_configuration_template(p_template_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_new public.configuration_templates%rowtype; v_old public.configuration_templates%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then raise exception 'not authorized'; end if;
  select * into v_new from public.configuration_templates where id = p_template_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'template draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;
  if v_new.schema is null or jsonb_typeof(v_new.schema) <> 'object' then raise exception 'template schema must be an object'; end if;
  select * into v_old from public.configuration_templates
    where template_key = v_new.template_key and status in ('published','locked') and effective_to is null
    limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow active version';
    end if;
    update public.configuration_templates set status='deactivated', effective_to=v_new.effective_from-1,
      deactivation_reason='Superseded by governed successor' where id=v_old.id;
    update public.configuration_templates set supersedes_id=v_old.id where id=v_new.id;
  end if;
  update public.configuration_templates set status='published', approved_by=auth.uid(), published_at=now() where id=v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_configuration_template(uuid) from public, anon;
grant execute on function public.publish_configuration_template(uuid) to authenticated;

-- Violation catalogue lifecycle/versioning and the authoritative corrective
-- action/grace/applicability fields (M09-003/010/011/014/026).
alter table public.violation_codes
  add column if not exists status public.config_status not null default 'published',
  add column if not exists configuration_version integer not null default 1,
  add column if not exists corrective_action text,
  add column if not exists grace_period_days integer,
  add column if not exists category text,
  add column if not exists applicability text,
  add column if not exists created_by uuid references public.profiles(user_id),
  add column if not exists approved_by uuid references public.profiles(user_id),
  add column if not exists published_at timestamptz,
  add column if not exists supersedes_id uuid references public.violation_codes(id) on delete restrict,
  add column if not exists deactivation_reason text;
alter table public.violation_codes drop constraint if exists violation_codes_code_key;
create unique index if not exists violation_codes_code_version_unique
  on public.violation_codes(code, configuration_version);
create unique index if not exists violation_codes_one_open_governed
  on public.violation_codes(code)
  where status in ('published','locked') and active_to is null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='violation_codes_grace_nonnegative') then
    alter table public.violation_codes add constraint violation_codes_grace_nonnegative
      check (grace_period_days is null or grace_period_days >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname='violation_codes_maker_checker') then
    alter table public.violation_codes add constraint violation_codes_maker_checker
      check (approved_by is null or created_by is null or approved_by <> created_by);
  end if;
end $$;
update public.violation_codes set published_at=coalesce(published_at, now()) where status='published' and published_at is null;

create or replace function public.publish_violation_code(p_violation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_new public.violation_codes%rowtype; v_old public.violation_codes%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then raise exception 'not authorized'; end if;
  select * into v_new from public.violation_codes where id=p_violation_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'violation draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.active_from is null then raise exception 'active_from is required'; end if;
  if v_new.corrective_action is null or btrim(v_new.corrective_action)='' then raise exception 'corrective_action is required'; end if;
  select * into v_old from public.violation_codes
    where code=v_new.code and status in ('published','locked') and active_to is null limit 1 for update;
  if found then
    if v_old.active_from is not null and v_new.active_from <= v_old.active_from then raise exception 'successor effective date must follow active version'; end if;
    update public.violation_codes set status='deactivated', active_to=v_new.active_from-1,
      deactivation_reason='Superseded by governed successor' where id=v_old.id;
    update public.violation_codes set supersedes_id=v_old.id where id=v_new.id;
  end if;
  update public.violation_codes set status='published', approved_by=auth.uid(), published_at=now() where id=v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_violation_code(uuid) from public, anon;
grant execute on function public.publish_violation_code(uuid) to authenticated;

create or replace function public.guard_governed_violation_code()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' and old.status <> 'draft' then raise exception 'IMMUTABLE: governed violation cannot be deleted'; end if;
  if tg_op='UPDATE' and old.status in ('published','locked') then
    if new.status='deactivated' and new.active_to is not null and coalesce(btrim(new.deactivation_reason),'')<>''
       and new.code is not distinct from old.code and new.configuration_version is not distinct from old.configuration_version
       and new.title is not distinct from old.title and new.level is not distinct from old.level
       and new.corrective_action is not distinct from old.corrective_action and new.grace_period_days is not distinct from old.grace_period_days
       and new.category is not distinct from old.category and new.applicability is not distinct from old.applicability then return new; end if;
    raise exception 'IMMUTABLE: published violation requires a governed successor';
  end if;
  if tg_op='UPDATE' and old.status='deactivated' and new is distinct from old then raise exception 'IMMUTABLE: deactivated violation cannot be modified'; end if;
  return coalesce(new,old);
end $$;
drop trigger if exists trg_guard_governed_violation_code on public.violation_codes;
create trigger trg_guard_governed_violation_code before update or delete on public.violation_codes
  for each row execute function public.guard_governed_violation_code();

-- Complete penalty definition without inventing policy values (M09-004/008).
alter table public.penalty_mappings
  add column if not exists penalty_type text,
  add column if not exists amount numeric,
  add column if not exists grace_period_days integer,
  add column if not exists due_period_days integer,
  add column if not exists template_version_id uuid references public.configuration_templates(id) on delete restrict,
  add column if not exists deactivation_reason text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='penalty_mappings_amount_nonnegative') then
    alter table public.penalty_mappings add constraint penalty_mappings_amount_nonnegative check (amount is null or amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname='penalty_mappings_periods_nonnegative') then
    alter table public.penalty_mappings add constraint penalty_mappings_periods_nonnegative
      check ((grace_period_days is null or grace_period_days >= 0) and (due_period_days is null or due_period_days >= 0));
  end if;
end $$;

create or replace function public.guard_governed_penalty_mapping()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' and old.status <> 'draft' then raise exception 'IMMUTABLE: governed penalty mapping cannot be deleted'; end if;
  if tg_op='UPDATE' and old.status in ('published','locked') then
    if new.status='deactivated' and new.effective_to is not null and coalesce(btrim(new.deactivation_reason),'')<>''
       and new.violation_code_id is not distinct from old.violation_code_id
       and new.penalty_ref is not distinct from old.penalty_ref and new.penalty_type is not distinct from old.penalty_type
       and new.amount is not distinct from old.amount and new.grace_period_days is not distinct from old.grace_period_days
       and new.due_period_days is not distinct from old.due_period_days and new.template_version_id is not distinct from old.template_version_id
       and new.penalty_range is not distinct from old.penalty_range and new.repeat_rule is not distinct from old.repeat_rule
       and new.legal_basis is not distinct from old.legal_basis and new.mapping_version is not distinct from old.mapping_version then return new; end if;
    raise exception 'IMMUTABLE: published penalty mapping requires a governed successor';
  end if;
  if tg_op='UPDATE' and old.status='deactivated' and new is distinct from old then raise exception 'IMMUTABLE: deactivated penalty mapping cannot be modified'; end if;
  return coalesce(new,old);
end $$;

create or replace function public.publish_penalty_mapping(p_mapping_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_new public.penalty_mappings%rowtype; v_old public.penalty_mappings%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then raise exception 'not authorized'; end if;
  select * into v_new from public.penalty_mappings where id=p_mapping_id for update;
  if not found or v_new.status<>'draft' then raise exception 'mapping draft not found'; end if;
  if v_new.created_by=auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;
  select * into v_old from public.penalty_mappings where violation_code_id=v_new.violation_code_id
    and status in ('published','locked') limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from<=v_old.effective_from then raise exception 'successor effective date must follow the active mapping'; end if;
    update public.penalty_mappings set status='deactivated', effective_to=v_new.effective_from-1,
      deactivation_reason='Superseded by governed successor' where id=v_old.id;
    update public.penalty_mappings set supersedes_id=v_old.id where id=v_new.id;
  end if;
  update public.penalty_mappings set status='published', approved_by=auth.uid(), published_at=now() where id=v_new.id;
  return v_new.id;
end $$;

-- New package publications must carry the authoritative relationship-level
-- rules. Legacy governed versions are untouched and continue through snapshots.
create or replace function public.validate_m09_package_definition()
returns trigger language plpgsql set search_path = '' as $$
declare s jsonb; item_code text; rule jsonb;
begin
  if new.status not in ('published','locked') or old.status is not distinct from new.status then return new; end if;
  if jsonb_typeof(new.definition->'sections') <> 'array' then raise exception 'PACKAGE: sections array is required'; end if;
  for s in select value from jsonb_array_elements(new.definition->'sections') loop
    if coalesce(btrim(s->>'title_en'),'')='' or coalesce(btrim(s->>'title_ar'),'')='' then
      raise exception 'PACKAGE: every section requires title_en and title_ar (M09-016)';
    end if;
    for item_code in select value #>> '{}' from jsonb_array_elements(coalesce(s->'items','[]'::jsonb)) loop
      rule := new.definition->'item_rules'->item_code;
      if rule is null or rule->>'requirement' not in ('required','optional','conditional') then
        raise exception 'PACKAGE: item % requires a relationship rule (M09-018)', item_code;
      end if;
      if rule->>'requirement'='conditional' and coalesce(rule#>>'{conditional,visible_when}','')='' then
        raise exception 'PACKAGE: conditional item % requires visible_when (M09-021)', item_code;
      end if;
    end loop;
  end loop;
  return new;
end $$;
drop trigger if exists trg_validate_m09_package_definition on public.package_versions;
create trigger trg_validate_m09_package_definition before update of status on public.package_versions
  for each row execute function public.validate_m09_package_definition();

create or replace function public.guard_package_deactivation_reason()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status in ('published','locked') and new.status='deactivated' then
    if coalesce(btrim(new.deactivation_reason),'')='' or new.effective_to is null then
      raise exception 'PACKAGE: deactivation reason and effective_to are required';
    end if;
  end if;
  if old.status='deactivated' and new is distinct from old then raise exception 'IMMUTABLE: deactivated package version cannot be modified'; end if;
  return new;
end $$;
drop trigger if exists trg_guard_package_deactivation_reason on public.package_versions;
create trigger trg_guard_package_deactivation_reason before update on public.package_versions
  for each row execute function public.guard_package_deactivation_reason();

-- Audit every newly introduced governed object and keep item-version history immutable.
drop trigger if exists trg_audit_configuration_templates on public.configuration_templates;
create trigger trg_audit_configuration_templates after insert or update or delete on public.configuration_templates
  for each row execute function public.audit_row_change();
create or replace function public.guard_inspection_item_version()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'IMMUTABLE: item version history cannot be changed'; end $$;
drop trigger if exists trg_guard_inspection_item_version on public.inspection_item_versions;
create trigger trg_guard_inspection_item_version before update or delete on public.inspection_item_versions
  for each row execute function public.guard_inspection_item_version();

-- Companion dependency snapshots freeze violation/penalty/template semantics for
-- package versions published before embedded full snapshots existed (M09-008/030).
create table if not exists public.package_version_dependency_snapshots (
  package_version_id uuid not null references public.package_versions(id) on delete restrict,
  dependency_type text not null check (dependency_type in ('violation','template')),
  dependency_key text not null,
  snapshot jsonb not null,
  frozen_at timestamptz not null default now(),
  primary key(package_version_id, dependency_type, dependency_key)
);

with package_items as (
  select pv.id package_version_id, item_code.code,
    coalesce(pv.definition->'item_snapshot'->item_code.code, pis.snapshot, to_jsonb(ii)) snapshot
  from public.package_versions pv
  cross join lateral jsonb_array_elements(coalesce(pv.definition->'sections','[]'::jsonb)) section
  cross join lateral jsonb_array_elements_text(coalesce(section->'items','[]'::jsonb)) item_code(code)
  left join public.package_version_item_snapshots pis on pis.package_version_id=pv.id and pis.item_code=item_code.code
  left join public.inspection_items ii on ii.code=item_code.code
  where pv.status in ('published','locked','deactivated')
), violation_refs as (
  select distinct pi.package_version_id, mapping.value->>'violation' violation_code
  from package_items pi
  cross join lateral jsonb_each(coalesce(pi.snapshot#>'{response_model,mapping}','{}'::jsonb)) mapping
  where coalesce(mapping.value->>'violation','')<>''
)
insert into public.package_version_dependency_snapshots(package_version_id, dependency_type, dependency_key, snapshot)
select vr.package_version_id, 'violation', vc.code,
  to_jsonb(vc) || jsonb_build_object('penalty_mappings', case when pm.id is null then null else to_jsonb(pm) end)
from violation_refs vr
join public.violation_codes vc on vc.code=vr.violation_code and vc.status in ('published','locked')
left join lateral (
  select p.* from public.penalty_mappings p
  where p.violation_code_id=vc.id and p.status in ('published','locked')
  order by p.published_at desc nulls last limit 1
) pm on true
on conflict do nothing;

alter table public.package_version_dependency_snapshots enable row level security;
revoke all on public.package_version_dependency_snapshots from anon;
grant select on public.package_version_dependency_snapshots to authenticated;
drop policy if exists package_version_dependency_snapshots_read on public.package_version_dependency_snapshots;
create policy package_version_dependency_snapshots_read on public.package_version_dependency_snapshots for select using (auth.uid() is not null);
create or replace function public.guard_package_version_dependency_snapshot()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'IMMUTABLE: package dependency snapshots cannot be changed'; end $$;
drop trigger if exists trg_guard_package_version_dependency_snapshot on public.package_version_dependency_snapshots;
create trigger trg_guard_package_version_dependency_snapshot before update or delete on public.package_version_dependency_snapshots
  for each row execute function public.guard_package_version_dependency_snapshot();

-- Runtime penalty notices are informational during inspection and can become
-- issued only after the inspection approval transition (M09-004).
create table if not exists public.inspection_penalties (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete restrict,
  violation_id uuid not null unique references public.violations(id) on delete restrict,
  penalty_mapping_id uuid not null references public.penalty_mappings(id) on delete restrict,
  mapping_snapshot jsonb not null,
  status text not null default 'informational' check (status in ('informational','issued')),
  issued_at timestamptz,
  issued_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  constraint inspection_penalties_issue_evidence check (
    (status='informational' and issued_at is null and issued_by is null)
    or (status='issued' and issued_at is not null and issued_by is not null)
  )
);
alter table public.inspection_penalties enable row level security;
revoke all on public.inspection_penalties from anon;
grant select on public.inspection_penalties to authenticated;
drop policy if exists inspection_penalties_read on public.inspection_penalties;
create policy inspection_penalties_read on public.inspection_penalties for select using (auth.uid() is not null);

create or replace function public.materialize_informational_penalty()
returns trigger language plpgsql security definer set search_path='' as $$
declare pm public.penalty_mappings%rowtype;
begin
  select * into pm from public.penalty_mappings
    where violation_code_id=new.violation_code_id and mapping_version=new.mapping_version
      and status in ('published','locked')
    order by published_at desc nulls last limit 1;
  if not found then raise exception 'PENALTY: no governed mapping for violation mapping version'; end if;
  insert into public.inspection_penalties(inspection_id, violation_id, penalty_mapping_id, mapping_snapshot)
  values(new.inspection_id, new.id, pm.id, to_jsonb(pm));
  return new;
end $$;
drop trigger if exists trg_materialize_informational_penalty on public.violations;
create trigger trg_materialize_informational_penalty after insert on public.violations
  for each row execute function public.materialize_informational_penalty();

create or replace function public.issue_penalties_after_approval()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    update public.inspection_penalties set status='issued', issued_at=now(), issued_by=auth.uid()
    where inspection_id=new.id and status='informational';
  elsif old.status='approved' and new.status is distinct from 'approved' then
    raise exception 'PENALTY: issued penalties require the approved inspection state';
  end if;
  return new;
end $$;
drop trigger if exists trg_issue_penalties_after_approval on public.inspections;
create trigger trg_issue_penalties_after_approval after update of status on public.inspections
  for each row execute function public.issue_penalties_after_approval();

create or replace function public.guard_inspection_penalty()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'IMMUTABLE: penalty notice cannot be deleted'; end if;
  if old.status='informational' and new.status='issued'
     and new.inspection_id is not distinct from old.inspection_id
     and new.violation_id is not distinct from old.violation_id
     and new.penalty_mapping_id is not distinct from old.penalty_mapping_id
     and new.mapping_snapshot is not distinct from old.mapping_snapshot then return new; end if;
  raise exception 'IMMUTABLE: penalty notice changes only through inspection approval';
end $$;
drop trigger if exists trg_guard_inspection_penalty on public.inspection_penalties;
create trigger trg_guard_inspection_penalty before update or delete on public.inspection_penalties
  for each row execute function public.guard_inspection_penalty();
drop trigger if exists trg_audit_inspection_penalties on public.inspection_penalties;
create trigger trg_audit_inspection_penalties after insert or update or delete on public.inspection_penalties
  for each row execute function public.audit_row_change();
