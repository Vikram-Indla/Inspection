-- SAQEEL four-internal-role capability matrix, phase 1.
--
-- Canonical internal roles: admin, planner, inspector, supervisor.
-- This migration is intentionally non-destructive: legacy grants and audit
-- evidence remain untouched. It does not auto-convert holders, redefine
-- has_role()/has_any_role(), or grant a Supervisor any auditor, leadership,
-- factory-representative or security-administrator authority.

alter table public.roles
  add column if not exists is_assignable boolean not null default true,
  add column if not exists is_internal boolean not null default true,
  add column if not exists deprecated_at timestamptz;

insert into public.roles (role_key, title, is_admin, is_assignable, is_internal, deprecated_at)
values
  ('admin', 'Admin', true, true, true, null),
  ('planner', 'Planner', false, true, true, null),
  ('inspector', 'Inspector', false, true, true, null),
  ('supervisor', 'Supervisor', false, true, true, null)
on conflict (role_key) do update
  set title = excluded.title,
      is_admin = excluded.is_admin,
      is_assignable = true,
      is_internal = true,
      deprecated_at = null;

-- Mapping is evidence for a later, user-by-user reclassification. It is never
-- consulted by authorization in this phase. In particular, factory_rep is an
-- external participant, not an internal Supervisor successor.
create table if not exists public.role_canonical_mappings (
  legacy_role_key text primary key references public.roles(role_key),
  proposed_canonical_role_key text references public.roles(role_key),
  migration_status text not null check (migration_status in ('manual_reclassification_required', 'external_participant')),
  deprecated_reason text not null,
  recorded_at timestamptz not null default now()
);

insert into public.role_canonical_mappings
  (legacy_role_key, proposed_canonical_role_key, migration_status, deprecated_reason)
values
  ('compliance_admin', 'admin', 'manual_reclassification_required', 'Specialist admin role retained pending individual reclassification.'),
  ('form_admin', 'admin', 'manual_reclassification_required', 'Specialist admin role retained pending individual reclassification.'),
  ('workflow_admin', 'admin', 'manual_reclassification_required', 'Specialist admin role retained pending individual reclassification.'),
  ('risk_owner', 'admin', 'manual_reclassification_required', 'Specialist admin role retained pending individual reclassification.'),
  ('gis_admin', 'admin', 'manual_reclassification_required', 'Specialist admin role retained pending individual reclassification.'),
  ('security_admin', 'admin', 'manual_reclassification_required', 'Security role retained pending access-RPC and separation-of-duties convergence.'),
  ('ops', 'supervisor', 'manual_reclassification_required', 'Operations role retained pending individual reclassification.'),
  ('reviewer', 'supervisor', 'manual_reclassification_required', 'Level 2 reviewer retained pending individual reclassification.'),
  ('auditor', 'supervisor', 'manual_reclassification_required', 'Oversight role requires an explicit separation-of-duties decision before conversion.'),
  ('leadership', 'supervisor', 'manual_reclassification_required', 'Leadership role requires an explicit dashboard-scope decision before conversion.'),
  ('factory_rep', null, 'external_participant', 'External virtual-session participant; not an internal SAQEEL role.')
on conflict (legacy_role_key) do update
  set proposed_canonical_role_key = excluded.proposed_canonical_role_key,
      migration_status = excluded.migration_status,
      deprecated_reason = excluded.deprecated_reason;

update public.roles r
set is_assignable = r.role_key in ('admin', 'planner', 'inspector', 'supervisor'),
    is_internal = r.role_key <> 'factory_rep',
    deprecated_at = case
      when r.role_key in ('admin', 'planner', 'inspector', 'supervisor') then null
      else coalesce(r.deprecated_at, now())
    end;

create index if not exists roles_assignable_idx on public.roles (is_assignable, role_key);

comment on table public.role_canonical_mappings is
  'Non-authorizing migration ledger. Legacy roles are preserved; reclassification requires an audited, per-user command.';

-- New routes and services may use this exact canonical-role check. Legacy role
-- aliases deliberately do not satisfy it; existing RLS remains unchanged until
-- its policy family is migrated and tested.
create or replace function public.has_internal_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.role_key = ur.role_key
    where ur.user_id = auth.uid()
      and ur.role_key = p_role
      and r.is_internal
      and r.deprecated_at is null
  )
$$;
revoke all on function public.has_internal_role(text) from public, anon;
grant execute on function public.has_internal_role(text) to authenticated;

-- Capability matrix. `platform.read` declares the policy of broad business
-- data visibility; it does not grant read access to auth, credentials, or
-- secret-bearing provider configuration. RLS conversion is a separate tested
-- phase because existing business tables use many legacy policies.
insert into public.permissions (permission_key, title, description) values
  ('platform.read', 'Read Platform Business Data', 'Read governed SAQEEL business data. Excludes authentication, credentials and secret-bearing provider configuration.'),
  ('planning.approve', 'Approve Planner Work', 'Supervisor-only future planning approval capability; no planning approval lifecycle is enabled by this migration.'),
  ('planning.return', 'Return Planner Work', 'Supervisor-only future planning return capability; no planning approval lifecycle is enabled by this migration.'),
  ('planning.reject', 'Reject Planner Work', 'Supervisor-only future planning rejection capability; no planning approval lifecycle is enabled by this migration.')
on conflict (permission_key) do nothing;

insert into public.capabilities (capability_key, description) values
  ('platform.read', 'Read governed SAQEEL business data. Excludes credentials, secrets and authentication internals.')
on conflict (capability_key) do nothing;

-- Everyone internally can read business data. The read grant is intentionally
-- separate from existing table policies so no secret/auth surface is widened.
insert into public.role_permissions (role_key, permission_key)
select role_key, 'platform.read'
from public.roles
where role_key in ('admin', 'planner', 'inspector', 'supervisor')
on conflict do nothing;

insert into public.role_capabilities (role_key, capability_key)
select role_key, 'platform.read'
from public.roles
where role_key in ('admin', 'planner', 'inspector', 'supervisor')
on conflict do nothing;

-- Admin config only. It is deliberately not granted Planning, execution,
-- review-decision or operational-assignment capabilities.
insert into public.role_permissions (role_key, permission_key)
select 'admin', permission_key
from public.permissions
where permission_key in (
  'planning.configure_workflow', 'planning.configure_lookups',
  'planning.configure_expiry', 'admin.access.manage'
)
on conflict do nothing;

insert into public.role_capabilities (role_key, capability_key)
select 'admin', capability_key
from public.capabilities
where capability_key in (
  'admin.execution_workflow', 'admin.execution_lookups',
  'admin.mode_eligibility', 'admin.evidence_policy', 'admin.offline_policy'
)
on conflict do nothing;

-- Planner owns visit operations, but not review approval/rejection or admin
-- configuration. High-impact manual/location/assignment overrides stay
-- explicit and are not default-granted.
insert into public.role_permissions (role_key, permission_key)
select 'planner', permission_key
from public.permissions
where permission_key in (
  'planning.view', 'planning.create', 'planning.create.single',
  'planning.create.bulk', 'planning.edit_draft', 'planning.publish',
  'planning.manage', 'planning.cancel', 'planning.reassign',
  'planning.reschedule', 'planning.export'
)
on conflict do nothing;

-- Supervisor inherits the Planner operational set plus L2 inspection review
-- and inspector-management operations. Planning approve/return/reject remain
-- catalogue-only until the Product Owner approves a planning approval state.
insert into public.role_permissions (role_key, permission_key)
select 'supervisor', permission_key
from public.permissions
where permission_key in (
  'planning.view', 'planning.create', 'planning.create.single',
  'planning.create.bulk', 'planning.edit_draft', 'planning.publish',
  'planning.manage', 'planning.cancel', 'planning.reassign',
  'planning.reschedule', 'planning.export',
  'planning.approve', 'planning.return', 'planning.reject'
)
on conflict do nothing;

insert into public.role_capabilities (role_key, capability_key) values
  ('inspector', 'execution.view_assigned'),
  ('inspector', 'execution.prepare'),
  ('inspector', 'execution.start_journey'),
  ('inspector', 'execution.arrive'),
  ('inspector', 'execution.execute'),
  ('inspector', 'execution.submit'),
  ('inspector', 'execution.return_assignment'),
  ('inspector', 'execution.cancel_prestart'),
  ('inspector', 'execution.request_active_cancel'),
  ('supervisor', 'review.view'),
  ('supervisor', 'review.decide'),
  ('supervisor', 'review.return_scope'),
  ('supervisor', 'review.approve'),
  ('supervisor', 'review.reject'),
  ('supervisor', 'operations.view'),
  ('supervisor', 'operations.resolve_exception'),
  ('supervisor', 'operations.approve_active_cancel')
on conflict do nothing;

-- Prevent future legacy assignments at the only governed user-role grant path.
-- Existing legacy grants can still be revoked and remain readable as history.
create or replace function public.admin_grant_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not (public.has_internal_role('admin') or public.has_role('security_admin')) then
    raise insufficient_privilege using message = 'EXE-ACCESS-DENIED: only an authorized administrator may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user) then
    raise check_violation using message = 'EXE-ACCESS-UNKNOWN-USER: the target user does not exist';
  end if;
  if not exists (select 1 from public.roles r where r.role_key = p_role) then
    raise check_violation using message = 'EXE-ACCESS-UNKNOWN-ROLE: the role does not exist';
  end if;
  if not exists (select 1 from public.roles r where r.role_key = p_role and r.is_assignable and r.is_internal) then
    raise check_violation using message = 'EXE-ACCESS-DEPRECATED-ROLE: choose admin, planner, inspector or supervisor';
  end if;
  if exists (select 1 from public.user_roles ur where ur.user_id = p_user and ur.role_key = p_role) then
    return;
  end if;
  insert into public.user_roles (user_id, role_key, granted_by) values (p_user, p_role, v_actor);
  insert into public.audit_events (actor, object_type, object_id, action, before_state, after_state, requirement_refs)
  values (
    v_actor, 'user_roles', null, 'role_grant', null,
    jsonb_build_object('user_id', p_user, 'role_key', p_role, 'granted_by', v_actor),
    array['EXE-ACCESS', 'CANONICAL-ROLE-001']
  );
end $$;
revoke all on function public.admin_grant_role(uuid, text) from public, anon;
grant execute on function public.admin_grant_role(uuid, text) to authenticated;

-- Keep the companion governed access commands aligned with the canonical
-- administrator. Legacy security_admin remains a temporary compatibility
-- authority; its removal is a separate, audited data migration.
create or replace function public.admin_revoke_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.user_roles%rowtype;
  v_admin_holders integer;
begin
  if v_actor is null or not (public.has_internal_role('admin') or public.has_role('security_admin')) then
    raise insufficient_privilege using message = 'EXE-ACCESS-DENIED: only an authorized administrator may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  select * into v_existing from public.user_roles ur where ur.user_id = p_user and ur.role_key = p_role;
  if not found then return; end if;
  if p_role = 'security_admin' then
    select count(distinct ur.user_id) into v_admin_holders from public.user_roles ur where ur.role_key = 'security_admin';
    if v_admin_holders <= 1 then
      raise check_violation using message = 'EXE-ACCESS-LAST-SECURITY-ADMIN: the sole remaining security_admin cannot be revoked';
    end if;
  end if;
  delete from public.user_roles ur where ur.user_id = p_user and ur.role_key = p_role;
  insert into public.audit_events (actor, object_type, object_id, action, before_state, after_state, requirement_refs)
  values (
    v_actor, 'user_roles', null, 'role_revoke',
    jsonb_build_object('user_id', v_existing.user_id, 'role_key', v_existing.role_key, 'granted_by', v_existing.granted_by, 'granted_at', v_existing.granted_at),
    null, array['EXE-ACCESS', 'CANONICAL-ROLE-001']
  );
end $$;
revoke all on function public.admin_revoke_role(uuid, text) from public, anon;
grant execute on function public.admin_revoke_role(uuid, text) to authenticated;

create or replace function public.admin_grant_capability(p_user uuid, p_capability text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null or not (public.has_internal_role('admin') or public.has_role('security_admin')) then
    raise insufficient_privilege using message = 'EXE-ACCESS-DENIED: only an authorized administrator may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user) then
    raise check_violation using message = 'EXE-ACCESS-UNKNOWN-USER: the target user does not exist';
  end if;
  if not exists (select 1 from public.capabilities c where c.capability_key = p_capability) then
    raise check_violation using message = 'EXE-ACCESS-UNKNOWN-CAPABILITY: the capability does not exist in the catalogue';
  end if;
  if exists (select 1 from public.user_capability_grants g where g.user_id = p_user and g.capability_key = p_capability) then return; end if;
  insert into public.user_capability_grants (user_id, capability_key, granted_by) values (p_user, p_capability, v_actor);
  insert into public.audit_events (actor, object_type, object_id, action, before_state, after_state, requirement_refs)
  values (
    v_actor, 'user_capability_grants', null, 'capability_grant', null,
    jsonb_build_object('user_id', p_user, 'capability_key', p_capability, 'granted_by', v_actor),
    array['EXE-ACCESS', 'CANONICAL-ROLE-001']
  );
end $$;
revoke all on function public.admin_grant_capability(uuid, text) from public, anon;
grant execute on function public.admin_grant_capability(uuid, text) to authenticated;

create or replace function public.admin_revoke_capability(p_user uuid, p_capability text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.user_capability_grants%rowtype;
begin
  if v_actor is null or not (public.has_internal_role('admin') or public.has_role('security_admin')) then
    raise insufficient_privilege using message = 'EXE-ACCESS-DENIED: only an authorized administrator may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  select * into v_existing from public.user_capability_grants g where g.user_id = p_user and g.capability_key = p_capability;
  if not found then return; end if;
  delete from public.user_capability_grants g where g.user_id = p_user and g.capability_key = p_capability;
  insert into public.audit_events (actor, object_type, object_id, action, before_state, after_state, requirement_refs)
  values (
    v_actor, 'user_capability_grants', null, 'capability_revoke',
    jsonb_build_object('user_id', v_existing.user_id, 'capability_key', v_existing.capability_key, 'granted_by', v_existing.granted_by, 'granted_at', v_existing.granted_at),
    null, array['EXE-ACCESS', 'CANONICAL-ROLE-001']
  );
end $$;
revoke all on function public.admin_revoke_capability(uuid, text) from public, anon;
grant execute on function public.admin_revoke_capability(uuid, text) to authenticated;
