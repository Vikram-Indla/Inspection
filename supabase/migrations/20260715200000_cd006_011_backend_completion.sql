-- CD-006..CD-011 backend completion for remaining MVP1-M09 partials.
-- Requirements: M09-001. Forward-only; preserves all existing records.

alter table regulations
  add column if not exists effective_from date,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivated_by uuid references profiles(user_id);

alter table inspection_items
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivated_by uuid references profiles(user_id),
  add column if not exists deactivation_reason text,
  add column if not exists configuration_version integer not null default 1;

alter table package_versions
  add column if not exists effective_from date,
  add column if not exists effective_to date,
  add column if not exists supersedes_id uuid references package_versions(id);

update package_versions
set effective_from = coalesce(effective_from, published_at::date, current_date)
where status in ('published','locked') and effective_from is null;

-- Derive inclusive historical windows and predecessor lineage without changing
-- any governed definition. Only the latest governed version remains open.
with ordered as (
  select id,
    lead(effective_from) over (
      partition by package_id order by effective_from, published_at nulls first, id
    ) as next_effective_from,
    lag(id) over (
      partition by package_id order by effective_from, published_at nulls first, id
    ) as previous_id
  from public.package_versions
  where status in ('published','locked')
)
update public.package_versions pv
set effective_to = case
      when ordered.next_effective_from is null then null
      when ordered.next_effective_from > pv.effective_from then ordered.next_effective_from - 1
      else pv.effective_from
    end,
    supersedes_id = coalesce(pv.supersedes_id, ordered.previous_id)
from ordered where ordered.id = pv.id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'package_version_effective_window') then
    alter table package_versions add constraint package_version_effective_window
      check (effective_to is null or effective_from is null or effective_to >= effective_from) not valid;
  end if;
end $$;

create unique index if not exists package_version_one_open_governed
  on public.package_versions(package_id)
  where status in ('published','locked') and effective_to is null;

create or replace function public.publish_package_version(
  p_version_id uuid,
  p_definition jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new public.package_versions%rowtype;
  v_old public.package_versions%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized to publish package versions';
  end if;
  select * into v_new from public.package_versions where id = p_version_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'package draft not found'; end if;
  if v_new.created_by is null or v_new.created_by = auth.uid() then
    raise exception 'maker-checker requires a distinct approver';
  end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;

  select * into v_old from public.package_versions
    where package_id = v_new.package_id
      and status in ('published','locked')
      and effective_to is null
    order by effective_from desc nulls last, published_at desc nulls last
    limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow the active package version';
    end if;
    update public.package_versions set effective_to = v_new.effective_from - 1 where id = v_old.id;
    update public.package_versions set supersedes_id = v_old.id where id = v_new.id;
  end if;

  update public.package_versions
    set definition = p_definition, status = 'published', approved_by = auth.uid(), published_at = now()
    where id = v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_package_version(uuid, jsonb) from public, anon;
grant execute on function public.publish_package_version(uuid, jsonb) to authenticated;

-- Preserve legacy governed package definitions exactly as published. Their item
-- semantics are frozen in a companion append-only table; future publishes also
-- embed the same snapshot in the new version definition before publication.
create table if not exists public.package_version_item_snapshots (
  package_version_id uuid not null references public.package_versions(id) on delete restrict,
  item_code text not null,
  snapshot jsonb not null,
  frozen_at timestamptz not null default now(),
  primary key (package_version_id, item_code)
);

insert into public.package_version_item_snapshots (package_version_id, item_code, snapshot)
select pv.id, ii.code,
    jsonb_build_object(
      'id', ii.id, 'code', ii.code, 'title', ii.title,
      'response_model', ii.response_model, 'evidence_rule', ii.evidence_rule,
      'score_weight', ii.score_weight, 'score_excluded_on', ii.score_excluded_on,
      'guidance_en', ii.guidance_en, 'guidance_ar', ii.guidance_ar,
      'configuration_version', ii.configuration_version,
      'regulation_clauses', case when rc.id is null then null else jsonb_build_object(
        'clause_ref', rc.clause_ref, 'legal_source', rc.legal_source
      ) end
    )
  from public.package_versions pv
  cross join lateral jsonb_array_elements(coalesce(pv.definition->'sections', '[]'::jsonb)) section
  cross join lateral jsonb_array_elements_text(coalesce(section->'items', '[]'::jsonb)) as item_code(code)
  join public.inspection_items ii on ii.code = item_code.code
  left join public.regulation_clauses rc on rc.id = ii.clause_id
  where pv.status in ('published', 'locked', 'deactivated')
on conflict (package_version_id, item_code) do nothing;

alter table public.package_version_item_snapshots enable row level security;
revoke all on table public.package_version_item_snapshots from anon;
grant select on table public.package_version_item_snapshots to authenticated;
drop policy if exists package_version_item_snapshots_read on public.package_version_item_snapshots;
create policy package_version_item_snapshots_read on public.package_version_item_snapshots for select
  using (auth.uid() is not null);

create or replace function public.guard_package_version_item_snapshot()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE: package version item snapshots cannot be changed';
end $$;
drop trigger if exists trg_guard_package_version_item_snapshot on public.package_version_item_snapshots;
create trigger trg_guard_package_version_item_snapshot
  before update or delete on public.package_version_item_snapshots
  for each row execute function public.guard_package_version_item_snapshot();

create or replace function public.inspection_item_versions_are_frozen(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array['compliance_admin','form_admin']) and not exists (
    select 1 from public.package_versions pv
    where pv.status in ('published','locked','deactivated')
      and exists (
        select 1
        from jsonb_array_elements(coalesce(pv.definition->'sections', '[]'::jsonb)) section,
             jsonb_array_elements_text(coalesce(section->'items', '[]'::jsonb)) as item_code(code)
        where item_code.code = p_code
      )
      and not (coalesce(pv.definition->'item_snapshot', '{}'::jsonb) ? p_code)
      and not exists (
        select 1 from public.package_version_item_snapshots s
        where s.package_version_id = pv.id and s.item_code = p_code
      )
  )
$$;
revoke all on function public.inspection_item_versions_are_frozen(text) from public, anon;
grant execute on function public.inspection_item_versions_are_frozen(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'violation_codes_active_window'
  ) then
    alter table violation_codes add constraint violation_codes_active_window
      check (active_to is null or active_from is null or active_to >= active_from) not valid;
  end if;
end $$;

-- CD-011 governed penalty mapping versions. Existing one-to-one rows become
-- legacy published versions; future successor drafts may coexist until an
-- atomic maker-checker publication deactivates the prior active version.
alter table penalty_mappings
  add column if not exists status config_status not null default 'draft',
  add column if not exists effective_from date,
  add column if not exists effective_to date,
  add column if not exists created_by uuid references profiles(user_id),
  add column if not exists approved_by uuid references profiles(user_id),
  add column if not exists published_at timestamptz,
  add column if not exists supersedes_id uuid references penalty_mappings(id);

update penalty_mappings pm
set status = 'published',
    effective_from = coalesce(pm.effective_from, vc.active_from),
    published_at = coalesce(pm.published_at, now())
from violation_codes vc
where vc.id = pm.violation_code_id and pm.created_by is null and pm.status = 'draft';

alter table penalty_mappings drop constraint if exists penalty_mappings_violation_code_id_key;
create unique index if not exists penalty_mapping_version_unique
  on penalty_mappings(violation_code_id, mapping_version);
create unique index if not exists penalty_mapping_one_active
  on penalty_mappings(violation_code_id)
  where status in ('published','locked');
create unique index if not exists penalty_mapping_one_draft
  on penalty_mappings(violation_code_id)
  where status = 'draft';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'penalty_mapping_effective_window') then
    alter table penalty_mappings add constraint penalty_mapping_effective_window
      check (effective_to is null or effective_from is null or effective_to >= effective_from) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'penalty_mapping_maker_checker') then
    alter table penalty_mappings add constraint penalty_mapping_maker_checker
      check (approved_by is null or created_by is null or approved_by <> created_by);
  end if;
end $$;

create or replace function public.guard_governed_penalty_mapping()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.status in ('published','locked','deactivated') then
    raise exception 'IMMUTABLE: governed penalty mapping cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status in ('published','locked') then
    if new.status = 'deactivated'
       and new.effective_to is not null
       and new.penalty_ref is not distinct from old.penalty_ref
       and new.penalty_range is not distinct from old.penalty_range
       and new.repeat_rule is not distinct from old.repeat_rule
       and new.legal_basis is not distinct from old.legal_basis
       and new.mapping_version is not distinct from old.mapping_version
       and new.violation_code_id is not distinct from old.violation_code_id then
      return new;
    end if;
    raise exception 'IMMUTABLE: published penalty mapping requires a governed successor';
  end if;
  if tg_op = 'UPDATE' and old.status = 'deactivated' and new is distinct from old then
    raise exception 'IMMUTABLE: deactivated penalty mapping cannot be modified';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_guard_governed_penalty_mapping on penalty_mappings;
create trigger trg_guard_governed_penalty_mapping
  before update or delete on penalty_mappings
  for each row execute function public.guard_governed_penalty_mapping();

create or replace function public.publish_penalty_mapping(p_mapping_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new public.penalty_mappings%rowtype;
  v_old public.penalty_mappings%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized to publish penalty mappings';
  end if;
  select * into v_new from public.penalty_mappings where id = p_mapping_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'mapping draft not found'; end if;
  if v_new.created_by is null or v_new.created_by = auth.uid() then
    raise exception 'maker-checker requires a distinct approver';
  end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;

  select * into v_old from public.penalty_mappings
    where violation_code_id = v_new.violation_code_id and status in ('published','locked')
    for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow the active mapping';
    end if;
    update public.penalty_mappings
      set status = 'deactivated', effective_to = v_new.effective_from - 1
      where id = v_old.id;
    update public.penalty_mappings set supersedes_id = v_old.id where id = v_new.id;
  end if;

  update public.penalty_mappings
    set status = 'published', approved_by = auth.uid(), published_at = now()
    where id = v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_penalty_mapping(uuid) from public, anon;
grant execute on function public.publish_penalty_mapping(uuid) to authenticated;

create table if not exists regulation_attachments (
  id uuid primary key default gen_random_uuid(),
  regulation_id uuid not null references regulations(id) on delete restrict,
  file_name text not null,
  storage_path text not null,
  media_type text,
  sha256 text,
  uploaded_by uuid not null references profiles(user_id),
  created_at timestamptz not null default now(),
  unique (regulation_id, storage_path)
);

insert into storage.buckets (id, name, public)
values ('regulation-documents', 'regulation-documents', false)
on conflict (id) do update set public = false;

drop policy if exists regulation_documents_read on storage.objects;
create policy regulation_documents_read on storage.objects for select
  using (bucket_id = 'regulation-documents' and auth.uid() is not null);
drop policy if exists regulation_documents_write on storage.objects;
create policy regulation_documents_write on storage.objects for insert
  with check (
    bucket_id = 'regulation-documents'
    and public.has_any_role(array['compliance_admin','form_admin'])
  );
drop policy if exists regulation_documents_remove_draft on storage.objects;
create policy regulation_documents_remove_draft on storage.objects for delete
  using (
    bucket_id = 'regulation-documents'
    and public.has_any_role(array['compliance_admin','form_admin'])
  );

alter table regulation_attachments enable row level security;
revoke all on table regulation_attachments from anon;
grant select, insert, update, delete on table regulation_attachments to authenticated;
drop policy if exists regulation_attachments_read on regulation_attachments;
create policy regulation_attachments_read on regulation_attachments
  for select using (auth.uid() is not null);
drop policy if exists regulation_attachments_admin on regulation_attachments;
create policy regulation_attachments_admin on regulation_attachments
  for all using (has_any_role(array['compliance_admin','form_admin']))
  with check (
    has_any_role(array['compliance_admin','form_admin'])
    and uploaded_by = auth.uid()
  );

drop trigger if exists trg_audit_regulation_attachments on regulation_attachments;
create trigger trg_audit_regulation_attachments
  after insert or update or delete on regulation_attachments
  for each row execute function audit_row_change();

-- Clauses and attachment metadata are part of the governed regulation body.
-- They are editable only while the parent is a draft; publication/deactivation
-- must preserve what prior inspections and audit records referenced.
create or replace function guard_regulation_child_write() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_regulation_id uuid := coalesce(new.regulation_id, old.regulation_id);
  v_status config_status;
begin
  select status into v_status from regulations where id = v_regulation_id;
  if v_status is distinct from 'draft'::config_status then
    raise exception 'IMMUTABLE: regulation child content is editable only while its parent is draft';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_guard_regulation_clauses on regulation_clauses;
create trigger trg_guard_regulation_clauses
  before insert or update or delete on regulation_clauses
  for each row execute function guard_regulation_child_write();

drop trigger if exists trg_guard_regulation_attachments on regulation_attachments;
create trigger trg_guard_regulation_attachments
  before insert or update or delete on regulation_attachments
  for each row execute function guard_regulation_child_write();

-- Published content stays immutable. The only permitted change is the governed
-- published/locked -> deactivated transition; no prior inspection reference changes.
create or replace function guard_published_regulation() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and old.status in ('published', 'locked', 'deactivated') then
    raise exception 'IMMUTABLE: governed regulation % cannot be deleted', old.code;
  end if;
  if tg_op = 'UPDATE' and old.status in ('published', 'locked') then
    if new.status = 'deactivated'
       and new.code is not distinct from old.code
       and new.title is not distinct from old.title
       and new.issuing_authority is not distinct from old.issuing_authority
       and new.effective_from is not distinct from old.effective_from
       and new.created_by is not distinct from old.created_by
       and new.approved_by is not distinct from old.approved_by
       and new.published_at is not distinct from old.published_at
       and new.deactivated_at is not null
       and new.deactivated_by is not null then
      return new;
    end if;
    raise exception 'IMMUTABLE: published regulation % cannot be modified', old.code;
  end if;
  if tg_op = 'UPDATE' and old.status = 'deactivated' and new is distinct from old then
    raise exception 'IMMUTABLE: deactivated regulation % cannot be modified', old.code;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_guard_published_regulation on regulations;
create trigger trg_guard_published_regulation
  before update or delete on regulations
  for each row execute function guard_published_regulation();

-- A deactivated or not-yet-effective regulation cannot enter a future package
-- version. Previously published package versions and inspections remain frozen.
create or replace function public.guard_package_regulation_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_bad_code text;
begin
  if new.status not in ('published', 'locked') then
    return new;
  end if;

  select coalesce(ii.code, item_code.code) into v_bad_code
  from jsonb_array_elements(coalesce(new.definition->'sections', '[]'::jsonb)) section
  cross join lateral jsonb_array_elements_text(coalesce(section->'items', '[]'::jsonb)) as item_code(code)
  left join public.inspection_items ii on ii.code = item_code.code
  left join public.regulation_clauses rc on rc.id = ii.clause_id
  left join public.regulations r on r.id = rc.regulation_id
  where ii.id is null
     or r.id is null
     or r.status not in ('published', 'locked')
     or (r.effective_from is not null and r.effective_from > current_date)
  limit 1;

  if v_bad_code is not null then
    raise exception 'DEPENDENCY: item % is not anchored to an active effective regulation', v_bad_code;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_package_regulation_dependencies on package_versions;
create trigger trg_guard_package_regulation_dependencies
  before insert or update of status, definition on package_versions
  for each row execute function public.guard_package_regulation_dependencies();

-- CD-007/CD-010 — scoped usage readers for safe deactivate/change previews.
-- They return counts only, never operational rows, and remain limited to the
-- configuration-authoring roles that own these control planes.
create or replace function inspection_item_usage(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized for item usage (RBAC-001)';
  end if;

  select jsonb_build_object(
    'package_count', count(distinct pv.package_id),
    'version_count', count(distinct pv.id)
  )
  into v_result
  from public.package_versions pv
  cross join lateral jsonb_array_elements(coalesce(pv.definition->'sections', '[]'::jsonb)) as sections(section_json)
  cross join lateral jsonb_array_elements_text(coalesce(sections.section_json->'items', '[]'::jsonb)) as item_codes(item_code)
  where item_codes.item_code = p_code;

  return v_result;
end $$;

create or replace function violation_code_usage(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized for violation usage (RBAC-001)';
  end if;

  select jsonb_build_object(
    'item_count', (
      select count(*) from public.inspection_items i
      where i.response_model #>> '{mapping,non_compliant,violation}' = p_code
    ),
    'runtime_count', (
      select count(*) from public.violations v
      join public.violation_codes vc on vc.id = v.violation_code_id
      where vc.code = p_code
    )
  ) into v_result;

  return v_result;
end $$;

revoke execute on function public.inspection_item_usage(text) from public;
revoke execute on function public.violation_code_usage(text) from public;
revoke execute on function public.inspection_item_usage(text) from anon;
revoke execute on function public.violation_code_usage(text) from anon;
grant execute on function public.inspection_item_usage(text) to authenticated;
grant execute on function public.violation_code_usage(text) to authenticated;

-- Configuration authors need the audit trail for the exact object they are
-- editing, but must not receive broad audit-table access. This definer function
-- preserves that boundary and rejects arbitrary object types.
create or replace function admin_configuration_audit(p_object_type text, p_object_id uuid)
returns setof public.audit_events
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized for configuration audit (RBAC-001)';
  end if;
  if p_object_type <> all(array[
    'regulations', 'regulation_clauses', 'regulation_attachments',
    'inspection_items', 'packages', 'package_versions',
    'violation_codes', 'penalty_mappings'
  ]) then
    raise exception 'unsupported configuration audit object type';
  end if;

  return query
    select ae.* from public.audit_events ae
    where ae.object_type = p_object_type and ae.object_id = p_object_id
    order by ae.occurred_at desc;
end $$;

revoke execute on function public.admin_configuration_audit(text, uuid) from public;
revoke execute on function public.admin_configuration_audit(text, uuid) from anon;
grant execute on function public.admin_configuration_audit(text, uuid) to authenticated;
