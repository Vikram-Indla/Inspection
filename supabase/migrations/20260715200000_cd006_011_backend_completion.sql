-- CD-006..CD-011 backend completion for remaining MVP1-M09 partials.
-- Requirements: M09-001. Forward-only; preserves all existing records.

alter table regulations
  add column if not exists effective_from date,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivated_by uuid references profiles(user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'violation_codes_active_window'
  ) then
    alter table violation_codes add constraint violation_codes_active_window
      check (active_to is null or active_from is null or active_to >= active_from) not valid;
  end if;
end $$;

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

alter table regulation_attachments enable row level security;
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

-- CD-007/CD-010 — scoped usage readers for safe deactivate/change previews.
-- They return counts only, never operational rows, and remain limited to the
-- configuration-authoring roles that own these control planes.
create or replace function inspection_item_usage(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized for item usage (RBAC-001)';
  end if;

  select jsonb_build_object(
    'package_count', count(distinct pv.package_id),
    'version_count', count(distinct pv.id)
  )
  into v_result
  from package_versions pv
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
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not has_any_role(array['compliance_admin','form_admin']) then
    raise exception 'not authorized for violation usage (RBAC-001)';
  end if;

  select jsonb_build_object(
    'item_count', (
      select count(*) from inspection_items i
      where i.response_model #>> '{mapping,non_compliant,violation}' = p_code
    ),
    'runtime_count', (
      select count(*) from violations v
      join violation_codes vc on vc.id = v.violation_code_id
      where vc.code = p_code
    )
  ) into v_result;

  return v_result;
end $$;

revoke execute on function inspection_item_usage(text) from public;
revoke execute on function violation_code_usage(text) from public;
grant execute on function inspection_item_usage(text) to authenticated;
grant execute on function violation_code_usage(text) to authenticated;

-- Configuration authors need the audit trail for the exact object they are
-- editing, but must not receive broad audit-table access. This definer function
-- preserves that boundary and rejects arbitrary object types.
create or replace function admin_configuration_audit(p_object_type text, p_object_id uuid)
returns setof audit_events
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not has_any_role(array['compliance_admin','form_admin']) then
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
    select ae.* from audit_events ae
    where ae.object_type = p_object_type and ae.object_id = p_object_id
    order by ae.occurred_at desc;
end $$;

revoke execute on function admin_configuration_audit(text, uuid) from public;
grant execute on function admin_configuration_audit(text, uuid) to authenticated;
