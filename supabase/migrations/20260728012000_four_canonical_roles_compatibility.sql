-- SAQEEL four-role convergence, Phase 1 — compatibility first.
--
-- Canonical assignable roles: admin, planner, inspector, supervisor.
-- Legacy roles remain present only as historical compatibility aliases. This
-- migration deliberately does NOT delete role, user_role, audit, approval, or
-- notification records. It grants the mapped canonical role to existing
-- holders, preserves the original grant rows, and blocks future legacy grants.

-- Keep the catalogue additive: historical foreign keys continue to resolve.
alter table public.roles
  add column if not exists deprecated_at timestamptz,
  add column if not exists replaced_by text references public.roles(role_key);

insert into public.roles (role_key, title, is_admin) values
  ('admin', 'Admin', true),
  ('planner', 'Planner', false),
  ('inspector', 'Inspector', false),
  ('supervisor', 'Supervisor', false)
on conflict (role_key) do update
  set title = excluded.title,
      is_admin = excluded.is_admin;

-- This is the single durable mapping authority for legacy compatibility.
create table if not exists public.role_canonical_mappings (
  legacy_role_key text primary key references public.roles(role_key),
  canonical_role_key text not null references public.roles(role_key),
  deprecated_at timestamptz not null default now(),
  deprecated_reason text not null default 'Four-role canonical model',
  check (legacy_role_key <> canonical_role_key)
);

insert into public.role_canonical_mappings (legacy_role_key, canonical_role_key) values
  ('compliance_admin', 'admin'),
  ('form_admin', 'admin'),
  ('workflow_admin', 'admin'),
  ('risk_owner', 'admin'),
  ('gis_admin', 'admin'),
  ('security_admin', 'admin'),
  ('ops', 'supervisor'),
  ('reviewer', 'supervisor'),
  ('auditor', 'supervisor'),
  ('leadership', 'supervisor'),
  ('factory_rep', 'supervisor')
on conflict (legacy_role_key) do update
  set canonical_role_key = excluded.canonical_role_key,
      deprecated_at = excluded.deprecated_at,
      deprecated_reason = excluded.deprecated_reason;

update public.roles r
   set deprecated_at = m.deprecated_at,
       replaced_by = m.canonical_role_key
  from public.role_canonical_mappings m
 where r.role_key = m.legacy_role_key;

-- Existing people retain their original record for audit, and receive the
-- matching canonical role for all new authorization and route decisions.
insert into public.user_roles (user_id, role_key, granted_by, granted_at)
select distinct on (ur.user_id, m.canonical_role_key)
       ur.user_id,
       m.canonical_role_key,
       ur.granted_by,
       ur.granted_at
  from public.user_roles ur
  join public.role_canonical_mappings m on m.legacy_role_key = ur.role_key
 order by ur.user_id, m.canonical_role_key, ur.granted_at asc
on conflict (user_id, role_key) do nothing;

-- Canonical roles inherit the complete existing capability/permission union.
-- This avoids a broad rewrite of legacy RLS policy text while preserving its
-- existing authority under the new canonical grants.
insert into public.role_permissions (role_key, permission_key)
select distinct m.canonical_role_key, rp.permission_key
  from public.role_canonical_mappings m
  join public.role_permissions rp on rp.role_key = m.legacy_role_key
on conflict do nothing;

insert into public.role_capabilities (role_key, capability_key)
select distinct m.canonical_role_key, rc.capability_key
  from public.role_canonical_mappings m
  join public.role_capabilities rc on rc.role_key = m.legacy_role_key
on conflict do nothing;

-- `has_role` is used throughout historical RLS and RPC policy text. A
-- canonical grant satisfies its old alias checks. Retained legacy rows are
-- deliberately NOT effective on their own: they are evidence only, and the
-- canonical grant above is the sole authorization source after this migration.
create or replace function public.has_role(r text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.user_roles ur
     where ur.user_id = auth.uid()
       and (
         (ur.role_key = r and not exists (
           select 1 from public.role_canonical_mappings m
            where m.legacy_role_key = ur.role_key
         ))
         or exists (
           select 1
             from public.role_canonical_mappings m
            where m.canonical_role_key = ur.role_key
              and m.legacy_role_key = r
         )
       )
  )
$$;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.has_role(text) to authenticated;

-- Legacy rows are historical evidence, not assignable roles. The trigger
-- protects direct inserts as well as the governed access-grant RPC.
create or replace function public.reject_deprecated_role_grant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.roles r
     where r.role_key = new.role_key
       and r.deprecated_at is not null
  ) then
    raise check_violation using message =
      'RBAC-ROLE-DEPRECATED: legacy roles are historical only; grant the canonical replacement';
  end if;
  return new;
end
$$;

drop trigger if exists trg_reject_deprecated_role_grant on public.user_roles;
create trigger trg_reject_deprecated_role_grant
before insert or update of role_key on public.user_roles
for each row execute function public.reject_deprecated_role_grant();

comment on table public.role_canonical_mappings is
  'Four-role convergence mapping. Legacy role rows remain as audit evidence but cannot receive new grants.';
comment on function public.has_role(text) is
  'Compatibility-aware role check for the canonical admin/planner/inspector/supervisor model; legacy grants are historical evidence only.';
