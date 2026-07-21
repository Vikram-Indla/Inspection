-- TASK-EXECUTION-MODULE-001 · Phase 2B — governed role/capability grants
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §5/§27
--
-- Access changes (role grants, fine-grained capability overrides) become a
-- governed, audited flow instead of seed-only data. This migration is
-- strictly additive:
--   * user_capability_grants is a NEW table layered ON TOP of role defaults —
--     grant-only overrides; no revoke-override (negative grant) semantics in
--     Release 1 (decision D-006).
--   * has_capability keeps its signature/grants; the effective capability set
--     becomes (user_roles → role_capabilities) UNION (direct grants).
--   * roles/user_roles/capabilities/role_capabilities are never altered,
--     rewritten or dropped; legacy roles stay untouched as compatibility
--     aliases (decision D-003).
--   * Every write goes through one of four security-definer RPCs. Both grant
--     tables keep NO direct write policies — RLS remains the authority and
--     menu visibility is never authorization.
--   * Every RPC carries the self-escalation guard (no caller may target their
--     own user) and role revoke additionally carries the sole-security_admin
--     guard. Every actual change appends an audit_events row with
--     requirement_refs ['EXE-ACCESS'] (object_id stays null: the grant key is
--     a (user_id, key) pair, not a uuid — the pair travels in before/after
--     state, matching the Phase 2A precedent in D-004). user_roles row writes
--     are additionally covered by the pre-existing trg_audit_user_roles row
--     trigger (0002_rbac_audit.sql, hardened for id-less tables by
--     0004/20260716210000).

-- ---------- 1 · user_capability_grants: direct grant-only overrides ---------
create table if not exists public.user_capability_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  capability_key text not null references public.capabilities(capability_key),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, capability_key)
);

alter table public.user_capability_grants enable row level security;
revoke all on table public.user_capability_grants from anon, authenticated;
grant select on table public.user_capability_grants to authenticated;

-- Read-only to the app: users read their own grants; security_admin reads all
-- (it operates the governed grant/revoke panel). NO insert/update/delete
-- policies for app roles — writes exist only through the guarded RPCs below.
drop policy if exists user_capability_grants_read_own on public.user_capability_grants;
create policy user_capability_grants_read_own on public.user_capability_grants
  for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists user_capability_grants_read_admin on public.user_capability_grants;
create policy user_capability_grants_read_admin on public.user_capability_grants
  for select to authenticated
  using (public.has_role('security_admin'));

-- ---------- 2 · has_capability: role defaults UNION direct grants -----------
-- Same signature and grants as the Phase 1 definition; the effective set now
-- includes direct per-user capability grants.
create or replace function public.has_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.role_capabilities rc
        on rc.role_key = ur.role_key
     where ur.user_id = auth.uid()
       and rc.capability_key = p_capability
  )
  or exists (
    select 1
      from public.user_capability_grants g
     where g.user_id = auth.uid()
       and g.capability_key = p_capability
  )
$$;
revoke all on function public.has_capability(text) from public, anon;
grant execute on function public.has_capability(text) to authenticated;

-- ---------- 3 · Governed grant/revoke RPCs ----------------------------------
-- Shared contract of all four:
--   * caller must hold security_admin (insufficient_privilege otherwise);
--   * the target may never be the caller themself (self-escalation guard,
--     check_violation with stable token EXE-ACCESS-SELF);
--   * idempotent — granting an existing grant or revoking an absent one is a
--     no-op success (and writes no audit row, because nothing changed);
--   * every actual change appends audit_events (requirement_refs
--     ['EXE-ACCESS']).
-- Error tokens are stable so the UI can map them to neutral codes:
--   EXE-ACCESS-DENIED               insufficient_privilege — not security_admin
--   EXE-ACCESS-SELF                 check_violation — self-targeting refused
--   EXE-ACCESS-UNKNOWN-USER         check_violation — target has no profile
--   EXE-ACCESS-UNKNOWN-ROLE         check_violation — role_key not in roles
--   EXE-ACCESS-UNKNOWN-CAPABILITY   check_violation — key not in capabilities
--   EXE-ACCESS-LAST-SECURITY-ADMIN  check_violation — sole security_admin guard

create or replace function public.admin_grant_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.has_role('security_admin') then
    raise insufficient_privilege
      using message = 'EXE-ACCESS-DENIED: only security_admin may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation
      using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user) then
    raise check_violation
      using message = 'EXE-ACCESS-UNKNOWN-USER: the target user does not exist';
  end if;
  if not exists (select 1 from public.roles r where r.role_key = p_role) then
    raise check_violation
      using message = 'EXE-ACCESS-UNKNOWN-ROLE: the role does not exist';
  end if;
  if exists (
    select 1 from public.user_roles ur
     where ur.user_id = p_user and ur.role_key = p_role
  ) then
    return; -- idempotent: the grant already exists — no-op success
  end if;

  insert into public.user_roles (user_id, role_key, granted_by)
  values (p_user, p_role, v_actor);

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'user_roles', null, 'role_grant', null,
    jsonb_build_object('user_id', p_user, 'role_key', p_role, 'granted_by', v_actor),
    array['EXE-ACCESS']
  );
end $$;
revoke all on function public.admin_grant_role(uuid, text) from public, anon;
grant execute on function public.admin_grant_role(uuid, text) to authenticated;

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
  if v_actor is null or not public.has_role('security_admin') then
    raise insufficient_privilege
      using message = 'EXE-ACCESS-DENIED: only security_admin may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation
      using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;

  select * into v_existing
    from public.user_roles ur
   where ur.user_id = p_user and ur.role_key = p_role;
  if not found then
    return; -- idempotent: nothing to revoke — no-op success
  end if;

  -- Sole-security_admin guard: the platform must never be left without an
  -- active grant authority. Revoking security_admin is refused while the
  -- target is the only remaining holder.
  if p_role = 'security_admin' then
    select count(distinct ur.user_id) into v_admin_holders
      from public.user_roles ur
     where ur.role_key = 'security_admin';
    if v_admin_holders <= 1 then
      raise check_violation
        using message = 'EXE-ACCESS-LAST-SECURITY-ADMIN: the sole remaining security_admin cannot be revoked';
    end if;
  end if;

  delete from public.user_roles ur
   where ur.user_id = p_user and ur.role_key = p_role;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'user_roles', null, 'role_revoke',
    jsonb_build_object(
      'user_id', v_existing.user_id,
      'role_key', v_existing.role_key,
      'granted_by', v_existing.granted_by,
      'granted_at', v_existing.granted_at
    ),
    null,
    array['EXE-ACCESS']
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
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.has_role('security_admin') then
    raise insufficient_privilege
      using message = 'EXE-ACCESS-DENIED: only security_admin may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation
      using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user) then
    raise check_violation
      using message = 'EXE-ACCESS-UNKNOWN-USER: the target user does not exist';
  end if;
  if not exists (
    select 1 from public.capabilities c where c.capability_key = p_capability
  ) then
    raise check_violation
      using message = 'EXE-ACCESS-UNKNOWN-CAPABILITY: the capability does not exist in the catalogue';
  end if;
  if exists (
    select 1 from public.user_capability_grants g
     where g.user_id = p_user and g.capability_key = p_capability
  ) then
    return; -- idempotent: the grant already exists — no-op success
  end if;

  insert into public.user_capability_grants (user_id, capability_key, granted_by)
  values (p_user, p_capability, v_actor);

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'user_capability_grants', null, 'capability_grant', null,
    jsonb_build_object('user_id', p_user, 'capability_key', p_capability, 'granted_by', v_actor),
    array['EXE-ACCESS']
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
  if v_actor is null or not public.has_role('security_admin') then
    raise insufficient_privilege
      using message = 'EXE-ACCESS-DENIED: only security_admin may grant or revoke access';
  end if;
  if p_user is null or p_user = v_actor then
    raise check_violation
      using message = 'EXE-ACCESS-SELF: access changes cannot target your own user';
  end if;

  select * into v_existing
    from public.user_capability_grants g
   where g.user_id = p_user and g.capability_key = p_capability;
  if not found then
    return; -- idempotent: nothing to revoke — no-op success
  end if;

  delete from public.user_capability_grants g
   where g.user_id = p_user and g.capability_key = p_capability;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'user_capability_grants', null, 'capability_revoke',
    jsonb_build_object(
      'user_id', v_existing.user_id,
      'capability_key', v_existing.capability_key,
      'granted_by', v_existing.granted_by,
      'granted_at', v_existing.granted_at
    ),
    null,
    array['EXE-ACCESS']
  );
end $$;
revoke all on function public.admin_revoke_capability(uuid, text) from public, anon;
grant execute on function public.admin_revoke_capability(uuid, text) to authenticated;
