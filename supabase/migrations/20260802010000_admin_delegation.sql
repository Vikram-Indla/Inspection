-- ============================================================================
-- Migration 20260802010000 — Admin Delegation journey (SCR-ADM delegation)
-- Local/dev only per .claude/rules/documentation-storage.md — not applied to
-- production. Forward-only, additive.
--
-- POLICY BOUNDARY: this migration invents no new authority taxonomy. Delegable
-- "scope" reuses the existing governed public.roles.role_key catalogue — a
-- delegator may only delegate a role_key they themselves currently hold
-- (enforced in create_delegation). Reason and time window are operator-
-- supplied at call time; nothing here fabricates a business default value.
--
-- Writes are RPC-only: the table carries a read policy but no insert/update
-- policy, matching the compliance_configuration_requests convention (RLS
-- enabled + no write policy = implicit deny; create_delegation/
-- revoke_delegation are SECURITY DEFINER and are the only write path).
--
-- Oversight role: this project's live role catalogue was consolidated to
-- four roles (admin, inspector, planner, supervisor) by a prior migration
-- (four_role_package_configuration_authority) not present in this repo's
-- local migrations directory. Oversight below uses 'admin' — the governed
-- role that actually exists — not the 13-role-era compliance_admin/
-- security_admin this file originally shipped with.
-- ============================================================================

create table if not exists public.delegations (
  id uuid primary key default gen_random_uuid(),
  delegator_id uuid not null references public.profiles(user_id),
  delegate_id uuid not null references public.profiles(user_id),
  scope text not null references public.roles(role_key),
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','revoked')),
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(user_id),
  revoked_reason text,
  constraint delegations_not_self check (delegator_id <> delegate_id),
  constraint delegations_window check (ends_at > starts_at),
  constraint delegations_revocation_pairing check (
    (status = 'active' and revoked_at is null and revoked_by is null and revoked_reason is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by is not null and revoked_reason is not null)
  )
);

create index if not exists delegations_delegator_idx on public.delegations(delegator_id, status);
create index if not exists delegations_delegate_idx on public.delegations(delegate_id, status);

alter table public.delegations enable row level security;

-- Visible to the two parties and to security/compliance oversight. No write
-- policy is created — see header note; RPCs below are the only write path.
create policy delegations_read on public.delegations for select using (
  delegator_id = (select auth.uid()) or delegate_id = (select auth.uid())
  or (select has_any_role(array['admin']))
);

create trigger trg_audit_delegations after insert or update or delete on public.delegations
  for each row execute function public.audit_row_change();

create or replace function public.create_delegation(
  p_delegate uuid, p_scope text, p_reason text, p_starts_at timestamptz, p_ends_at timestamptz
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'DELEGATION_NOT_AUTHENTICATED'; end if;
  if p_delegate is null or p_delegate = auth.uid() then raise exception 'DELEGATION_SELF_NOT_ALLOWED'; end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'DELEGATION_REASON_REQUIRED'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then raise exception 'DELEGATION_WINDOW_INVALID'; end if;
  if p_scope is null or not exists (select 1 from public.user_roles where user_id = auth.uid() and role_key = p_scope) then
    raise exception 'DELEGATION_SCOPE_NOT_HELD';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_delegate) then
    raise exception 'DELEGATION_DELEGATE_NOT_FOUND';
  end if;
  insert into public.delegations (delegator_id, delegate_id, scope, reason, starts_at, ends_at, created_by)
  values (auth.uid(), p_delegate, p_scope, trim(p_reason), p_starts_at, p_ends_at, auth.uid())
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.create_delegation(uuid, text, text, timestamptz, timestamptz) to authenticated;

create or replace function public.revoke_delegation(p_delegation uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_row public.delegations;
begin
  if auth.uid() is null then raise exception 'DELEGATION_NOT_AUTHENTICATED'; end if;
  select * into v_row from public.delegations where id = p_delegation;
  if not found then raise exception 'DELEGATION_NOT_FOUND'; end if;
  if v_row.status <> 'active' then raise exception 'DELEGATION_NOT_ACTIVE'; end if;
  if v_row.delegator_id <> auth.uid() and not has_any_role(array['admin']) then
    raise exception 'DELEGATION_NOT_AUTHORIZED';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'DELEGATION_REASON_REQUIRED'; end if;
  update public.delegations
    set status = 'revoked', revoked_at = now(), revoked_by = auth.uid(), revoked_reason = trim(p_reason)
    where id = p_delegation;
end $$;
grant execute on function public.revoke_delegation(uuid, text) to authenticated;
