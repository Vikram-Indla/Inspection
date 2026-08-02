-- TASK-ADMIN-DEVELOPMENT-CLOSURE-20260802
-- Canonical Admin convergence for the governed risk and delegation journeys.
-- Additive/local migration only. No production application is performed here.

-- Admin needs the internal directory for Users & Roles and exact-email
-- delegation lookup. Other canonical roles retain their existing profile scope.
drop policy if exists profiles_read_canonical_admin on public.profiles;
create policy profiles_read_canonical_admin on public.profiles for select
  to authenticated
  using (public.has_internal_role('admin'));

-- The four-role consolidation made Admin the configuration owner. Preserve the
-- legacy specialist roles during transition, while making canonical Admin a
-- real database authority rather than a UI-only alias.
drop policy if exists engine_write_canonical_admin on public.engine_settings;
create policy engine_write_canonical_admin on public.engine_settings for update
  to authenticated
  using (public.has_internal_role('admin'))
  with check (public.has_internal_role('admin'));

do $$
declare
  t text;
begin
  foreach t in array array[
    'risk_variables', 'risk_models', 'risk_simulations',
    'risk_runs', 'risk_exceptions', 'risk_overrides'
  ] loop
    execute format('drop policy if exists %I_canonical_admin_insert on public.%I', t, t);
    execute format('drop policy if exists %I_canonical_admin_update on public.%I', t, t);
    execute format(
      'create policy %I_canonical_admin_insert on public.%I for insert to authenticated with check (public.has_internal_role(''admin''))',
      t, t
    );
    execute format(
      'create policy %I_canonical_admin_update on public.%I for update to authenticated using (public.has_internal_role(''admin'')) with check (public.has_internal_role(''admin''))',
      t, t
    );

    -- These tables were introduced after the original audit-trigger sweep.
    -- Recreate by deterministic name so this migration is idempotent locally.
    execute format('drop trigger if exists trg_audit_%s on public.%I', t, t);
    execute format(
      'create trigger trg_audit_%s after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      t, t
    );
  end loop;
end
$$;

-- Resolve the delegate inside the guarded database boundary. This avoids a
-- disconnected preflight lookup whose result depended on caller profile RLS.
create or replace function public.create_delegation_by_email(
  p_delegate_email text,
  p_scope text,
  p_reason text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delegate uuid;
begin
  if auth.uid() is null then raise exception 'DELEGATION_NOT_AUTHENTICATED'; end if;
  if p_delegate_email is null or length(trim(p_delegate_email)) = 0 then
    raise exception 'DELEGATION_DELEGATE_NOT_FOUND';
  end if;

  select p.user_id into v_delegate
  from public.profiles p
  where lower(p.email) = lower(trim(p_delegate_email))
  limit 1;

  if v_delegate is null then raise exception 'DELEGATION_DELEGATE_NOT_FOUND'; end if;
  return public.create_delegation(v_delegate, p_scope, p_reason, p_starts_at, p_ends_at);
end
$$;

revoke all on function public.create_delegation_by_email(text, text, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.create_delegation_by_email(text, text, text, timestamptz, timestamptz) to authenticated;

-- Canonical transition boundary. The maker cannot approve their own model;
-- published payloads become the live engine setting atomically in this RPC.
create or replace function public.risk_model_transition(
  p_model_id uuid,
  p_to_status text,
  p_expected_row_version integer,
  p_reason text default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.risk_models%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not (
    public.has_internal_role('admin')
    or public.has_any_role(array['risk_owner','compliance_admin','security_admin'])
  ) then
    raise exception 'not authorized to transition risk models' using errcode = '42501';
  end if;

  select * into v from public.risk_models where id = p_model_id for update;
  if not found then raise exception 'risk model not found' using errcode = '22023'; end if;
  if v.row_version is distinct from p_expected_row_version then
    raise exception 'stale risk model version — reload and retry' using errcode = '40001';
  end if;
  if not (
    (v.status = 'draft' and p_to_status = 'review')
    or (v.status = 'review' and p_to_status in ('approved','draft'))
    or (v.status = 'approved' and p_to_status in ('published','draft'))
    or (v.status = 'published' and p_to_status = 'retired')
  ) then
    raise exception 'illegal risk model transition % -> %', v.status, p_to_status using errcode = '22023';
  end if;

  if p_to_status = 'approved' then
    if v.created_by = v_uid then
      raise exception 'maker-checker: creator cannot approve own model' using errcode = '42501';
    end if;
    update public.risk_models set status = 'approved', approved_by = v_uid where id = p_model_id;
  elsif p_to_status = 'published' then
    if v.approved_by is null then
      raise exception 'approval required before publish' using errcode = '42501';
    end if;
    update public.engine_settings
      set settings = v.payload,
          version_label = v.version_label,
          updated_at = now()
      where engine = 'risk';
    if not found then
      raise exception 'live risk engine setting not configured' using errcode = '55000';
    end if;
    update public.risk_models set status = 'published', effective_from = now() where id = p_model_id;
  elsif p_to_status = 'retired' then
    if p_reason is null or length(trim(p_reason)) = 0 then
      raise exception 'retirement reason required' using errcode = '22023';
    end if;
    update public.risk_models set status = 'retired', retire_reason = trim(p_reason) where id = p_model_id;
  else
    update public.risk_models set status = p_to_status where id = p_model_id;
  end if;

  return p_to_status;
end
$$;

revoke all on function public.risk_model_transition(uuid, text, integer, text) from public, anon;
grant execute on function public.risk_model_transition(uuid, text, integer, text) to authenticated;
