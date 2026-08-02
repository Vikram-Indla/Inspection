-- RECONSTRUCTION NOTICE — this is NOT the literal applied SQL.
-- schema_migrations.statements for version 20260719220000 held only the
-- placeholder text "-- applied and verified via Management API" (applied via
-- the Supabase Management API rather than the CLI migration runner, so the
-- original statement text was never captured). This file is reconstructed
-- from live schema introspection (information_schema, pg_catalog, pg_policies)
-- against project iiozvqntawxfwbgffzqu on 2026-08-02, cross-referenced with
-- the functions that consume these objects (create_compliance_lookup_value,
-- deactivate_compliance_lookup_value, guard_compliance_lookup_value). It is
-- believed to be functionally equivalent to what was applied, but exact
-- formatting, comments, and statement order are best-effort, not verbatim.
-- Added 2026-08-02 during migration reconciliation.

-- ============================================================================
-- Compliance Lookup Management
-- Governed lookup catalogue for compliance configuration (violation/penalty
-- component types, and similar admin-governed enumerations). Types are
-- fixed by admins; values are versioned and soft-deactivated, never deleted.
-- ============================================================================

create table if not exists public.compliance_lookup_types (
  lookup_type_key text primary key,
  label_en text not null,
  label_ar text,
  requires_effective_dates boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.compliance_lookup_values (
  id uuid primary key default gen_random_uuid(),
  lookup_type_key text not null references public.compliance_lookup_types(lookup_type_key) on delete restrict,
  code text not null,
  label_en text not null,
  label_ar text,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  display_order integer not null default 0,
  version_number integer not null default 1,
  supersedes_id uuid references public.compliance_lookup_values(id) on delete restrict,
  deactivation_reason text,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  deactivated_by uuid references public.profiles(user_id),
  deactivated_at timestamptz,
  constraint compliance_lookup_values_code_check check (btrim(code) <> ''),
  constraint compliance_lookup_values_label_en_check check (btrim(label_en) <> ''),
  constraint compliance_lookup_values_version_number_check check (version_number > 0),
  constraint compliance_lookup_values_check check (
    effective_to is null or effective_from is null or effective_to >= effective_from
  ),
  constraint compliance_lookup_values_check1 check (
    active or (nullif(btrim(deactivation_reason), '') is not null and deactivated_at is not null)
  ),
  constraint compliance_lookup_values_lookup_type_key_code_version_numbe_key
    unique (lookup_type_key, code, version_number)
);

create index if not exists ix_compliance_lookup_values_type
  on public.compliance_lookup_values (lookup_type_key, display_order, code);

create unique index if not exists uq_compliance_lookup_active_code
  on public.compliance_lookup_values (lookup_type_key, code) where active;

alter table public.compliance_lookup_types enable row level security;
alter table public.compliance_lookup_values enable row level security;

create policy compliance_lookup_types_read on public.compliance_lookup_types
  for select to authenticated
  using (( select auth.uid() ) is not null and active);

create policy compliance_lookup_values_read on public.compliance_lookup_values
  for select to authenticated
  using (( select auth.uid() ) is not null);

-- Immutability guard: values are versioned, never mutated except the
-- controlled deactivation transition; hard deletes are always rejected.
create or replace function public.guard_compliance_lookup_value()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if tg_op = 'DELETE' then
    raise exception 'LOOKUP_REFERENCED_DELETE_PROTECTED';
  end if;
  if old.active and not new.active
     and new.lookup_type_key is not distinct from old.lookup_type_key
     and new.code is not distinct from old.code
     and new.label_en is not distinct from old.label_en
     and new.label_ar is not distinct from old.label_ar
     and new.effective_from is not distinct from old.effective_from
     and new.display_order is not distinct from old.display_order
     and new.version_number is not distinct from old.version_number
     and new.supersedes_id is not distinct from old.supersedes_id
     and new.effective_to is not null and nullif(btrim(new.deactivation_reason), '') is not null
     and new.deactivated_at is not null and new.deactivated_by is not null then
    return new;
  end if;
  raise exception 'LOOKUP_IMMUTABLE_VERSION';
end
$function$;

create trigger trg_compliance_lookup_value_guard
  before delete or update on public.compliance_lookup_values
  for each row execute function public.guard_compliance_lookup_value();

create trigger trg_audit_compliance_lookup_values
  after insert or delete or update on public.compliance_lookup_values
  for each row execute function public.audit_row_change();

-- Admin-governed write path (compliance_admin / workflow_admin / security_admin
-- only — these role_key values predate the four-role reset and are stale as
-- of 2026-08-02; see the role-mismatch inventory in this reconciliation task).
create or replace function public.create_compliance_lookup_value(
  p_type text,
  p_code text,
  p_label_en text,
  p_label_ar text default null,
  p_effective_from date default null,
  p_display_order integer default 0,
  p_supersedes uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare v_id uuid; v_requires boolean;
begin
  if not public.has_any_role(array['compliance_admin','workflow_admin','security_admin']) then
    raise exception 'LOOKUP_NOT_AUTHORIZED';
  end if;
  if nullif(btrim(p_code),'') is null or nullif(btrim(p_label_en),'') is null then
    raise exception 'LOOKUP_REQUIRED_FIELDS';
  end if;
  select requires_effective_dates into v_requires
    from public.compliance_lookup_types where lookup_type_key = p_type and active;
  if not found then raise exception 'LOOKUP_TYPE_NOT_FOUND'; end if;
  if v_requires and p_effective_from is null then raise exception 'LOOKUP_EFFECTIVE_DATE_REQUIRED'; end if;
  insert into public.compliance_lookup_values(
    lookup_type_key, code, label_en, label_ar, effective_from, display_order, supersedes_id, created_by
  ) values (
    p_type, btrim(p_code), btrim(p_label_en), nullif(btrim(p_label_ar),''),
    p_effective_from, coalesce(p_display_order,0), p_supersedes, auth.uid()
  ) returning id into v_id;
  return v_id;
end
$function$;

create or replace function public.deactivate_compliance_lookup_value(
  p_id uuid,
  p_reason text,
  p_effective_to date
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.has_any_role(array['compliance_admin','workflow_admin','security_admin']) then
    raise exception 'LOOKUP_NOT_AUTHORIZED';
  end if;
  if nullif(btrim(p_reason),'') is null or p_effective_to is null then
    raise exception 'LOOKUP_DEACTIVATION_REASON_REQUIRED';
  end if;
  update public.compliance_lookup_values
    set active = false, effective_to = p_effective_to, deactivation_reason = btrim(p_reason),
        deactivated_by = auth.uid(), deactivated_at = now()
    where id = p_id and active;
  if not found then raise exception 'LOOKUP_NOT_FOUND'; end if;
end
$function$;
