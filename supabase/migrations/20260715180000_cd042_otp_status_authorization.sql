-- CD-042 / SCR-VIR-710 · RBAC-014 — add per-caller authorization to vp_otp_status.
--
-- 0023 hardened vp_request_otp/vp_verify_otp with a caller-relationship check but
-- left vp_otp_status (0018) ungated. Because it is SECURITY DEFINER it also
-- bypasses the vp_rw RLS on virtual_participants, so any authenticated user who
-- knows a participant UUID could read that participant's OTP verification status,
-- attempt/resend counts, expiry and lock state — the same class of disclosure
-- 0023 closed for the sibling RPCs. This applies the identical authorization
-- predicate. The returned status shape is unchanged.

create or replace function vp_otp_status(p_participant uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; rec jsonb; v_verified timestamptz; found_id uuid; v_session_id uuid;
begin
  select id, session_id, verified_at, coalesce(verification_record, '{}'::jsonb)
    into found_id, v_session_id, v_verified, rec
    from virtual_participants where id = p_participant;
  if found_id is null then return jsonb_build_object('status', 'not_found'); end if;

  -- RBAC-014: same caller-authorization as vp_request_otp/vp_verify_otp (0023) —
  -- staff-with-session-visibility or the assigned inspector for this session's visit.
  if not (
    has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
    or exists (
      select 1 from virtual_sessions vs
      where vs.id = v_session_id and is_assigned_inspector(vs.visit_id)
    )
  ) then
    raise exception 'not authorized for this virtual session (RBAC-014)';
  end if;

  select settings into cfg from engine_settings where engine = 'otp';
  return jsonb_build_object(
    'status', 'ok',
    'verified', v_verified is not null,
    'attempts_used', coalesce((rec->>'attempts')::int, 0),
    'attempts_max', (cfg->>'attempts_per_code')::int,
    'resends_used', coalesce((rec->>'resends')::int, 0),
    'resends_max', (cfg->>'resend_max')::int,
    'expires_at', rec->>'expires_at',
    'locked', coalesce((rec->>'attempts')::int, 0) >= (cfg->>'attempts_per_code')::int,
    'has_active_code', (rec ? 'code_hash')
       and now() <= coalesce((rec->>'expires_at')::timestamptz, now() - interval '1 second'));
end $$;
