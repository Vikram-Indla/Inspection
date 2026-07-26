-- TASK-PROFILE-BOOTSTRAP-20260726-001
-- Narrow Auth-to-profile bridge for the demo identity bootstrap.
--
-- This is intentionally NOT an auth.users trigger and NOT a self-service
-- profile endpoint. An existing security_admin must name a different,
-- already-created Auth identity. The RPC creates one profile, or accepts an
-- exact replay without writing. It never updates or deletes profile data.

create or replace function public.admin_bootstrap_profile(
  p_user uuid,
  p_full_name text,
  p_region text default null,
  p_org_scope text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_auth_email text;
  v_existing public.profiles%rowtype;
begin
  if v_actor is null or not public.has_role('security_admin') then
    raise insufficient_privilege
      using message = 'PROFILE-BOOTSTRAP-DENIED: only security_admin may bootstrap profiles';
  end if;

  if p_user is null or p_user = v_actor then
    raise check_violation
      using message = 'PROFILE-BOOTSTRAP-SELF: profile bootstrap cannot target the caller';
  end if;

  if nullif(btrim(p_full_name), '') is null then
    raise check_violation
      using message = 'PROFILE-BOOTSTRAP-NAME: a non-blank full name is required';
  end if;

  select u.email
    into v_auth_email
    from auth.users u
   where u.id = p_user;

  if not found then
    raise check_violation
      using message = 'PROFILE-BOOTSTRAP-UNKNOWN-AUTH-USER: target Auth identity does not exist';
  end if;

  select p.*
    into v_existing
    from public.profiles p
   where p.user_id = p_user;

  if found then
    if v_existing.full_name is not distinct from btrim(p_full_name)
       and v_existing.email is not distinct from v_auth_email
       and v_existing.region is not distinct from p_region
       and v_existing.org_scope is not distinct from p_org_scope
       and v_existing.account_status = 'active' then
      return p_user;
    end if;

    raise check_violation
      using message = 'PROFILE-BOOTSTRAP-MISMATCH: existing profile does not exactly match the requested bootstrap';
  end if;

  insert into public.profiles (
    user_id, full_name, email, region, org_scope, account_status
  ) values (
    p_user, btrim(p_full_name), v_auth_email, p_region, p_org_scope, 'active'
  );

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor,
    'profiles',
    p_user,
    'profile_bootstrap',
    null,
    jsonb_build_object(
      'user_id', p_user,
      'full_name', btrim(p_full_name),
      'email', v_auth_email,
      'region', p_region,
      'org_scope', p_org_scope,
      'account_status', 'active'
    ),
    array['MVP1-FND-001', 'RBAC-001']
  );

  return p_user;
exception
  when unique_violation then
    -- A concurrent creator won the insert race. Accept only the same exact
    -- result; otherwise retain fail-closed mismatch semantics.
    select p.*
      into v_existing
      from public.profiles p
     where p.user_id = p_user;

    if found
       and v_existing.full_name is not distinct from btrim(p_full_name)
       and v_existing.email is not distinct from v_auth_email
       and v_existing.region is not distinct from p_region
       and v_existing.org_scope is not distinct from p_org_scope
       and v_existing.account_status = 'active' then
      return p_user;
    end if;

    raise check_violation
      using message = 'PROFILE-BOOTSTRAP-MISMATCH: concurrent profile does not exactly match the requested bootstrap';
end $$;

revoke all on function public.admin_bootstrap_profile(uuid, text, text, text)
  from public, anon;

grant execute on function public.admin_bootstrap_profile(uuid, text, text, text)
  to authenticated;

comment on function public.admin_bootstrap_profile(uuid, text, text, text) is
  'Security-admin-only, create-only Auth-to-profile bootstrap. Email is derived from auth.users; exact replay is a no-op.';
