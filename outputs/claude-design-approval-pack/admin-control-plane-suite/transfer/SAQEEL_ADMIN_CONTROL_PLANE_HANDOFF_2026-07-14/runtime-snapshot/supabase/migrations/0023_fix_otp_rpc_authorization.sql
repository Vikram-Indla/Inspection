-- Migration 0023 — add per-caller authorization to the OTP RPCs (0009).
--
-- vp_request_otp/vp_verify_otp are SECURITY DEFINER and were granted to
-- `authenticated` with no check that the caller has any relationship to the
-- participant/session being acted on — any logged-in user could request or
-- attempt to verify an OTP code for a participant belonging to a virtual
-- session they have nothing to do with. SECURITY DEFINER means this bypassed
-- table RLS entirely, so the 0021 RLS patch on virtual_participants/
-- virtual_sessions did not close it.
--
-- Architecture note (confirmed against apps/web/src/app/virtual/[id]/Room.tsx):
-- factory representatives have no Supabase Auth account and never call these
-- RPCs directly. Room.tsx is staff-facing — the assigned inspector (or ops)
-- operating the session clicks "Send OTP"/"Verify" on behalf of the
-- representative sitting with them. So the correct authorization check is
-- "is the caller staff-with-session-visibility or the assigned inspector for
-- this participant's session's visit" — the same predicate already used for
-- vs_read/vp_rw in 0021, not a participant-owned token.

create or replace function vp_request_otp(p_participant uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare cfg jsonb; rec jsonb; code text; resends int; v_session_id uuid;
begin
  select session_id into v_session_id from virtual_participants where id = p_participant;
  if v_session_id is null then raise exception 'participant not found'; end if;
  if not (
    has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
    or exists (
      select 1 from virtual_sessions vs
      where vs.id = v_session_id and is_assigned_inspector(vs.visit_id)
    )
  ) then
    raise exception 'not authorized for this virtual session (RBAC-014)';
  end if;

  select settings into cfg from engine_settings where engine='otp';
  select coalesce(verification_record,'{}'::jsonb) into rec from virtual_participants where id = p_participant;
  resends := coalesce((rec->>'resends')::int, 0);
  if resends >= (cfg->>'resend_max')::int then
    return jsonb_build_object('status','exhausted','next','supervisor-approved manual verification (audited exception)');
  end if;
  if rec ? 'last_sent_at' and now() - (rec->>'last_sent_at')::timestamptz < make_interval(secs => (cfg->>'resend_cooldown_s')::int) then
    return jsonb_build_object('status','cooldown','retry_after_s',(cfg->>'resend_cooldown_s')::int);
  end if;
  code := lpad((floor(random()*1000000))::int::text, (cfg->>'digits')::int, '0');
  update virtual_participants set verification_record = jsonb_build_object(
    'code_hash', encode(digest(code,'sha256'),'hex'),
    'expires_at', (now() + make_interval(mins => (cfg->>'expiry_min')::int))::text,
    'attempts', 0, 'resends', resends + 1, 'last_sent_at', now()::text,
    'provider', 'DEV-CONSOLE (release: ' || (cfg->>'provider_primary') || ')')
  where id = p_participant;
  insert into audit_events(actor, object_type, object_id, action, after_state)
  values (auth.uid(),'virtual_participants',p_participant,'OTP_SENT', jsonb_build_object('resend_no',resends+1));
  -- DEV provider: return code for on-screen display. Release build removes this and dispatches Unifonic.
  return jsonb_build_object('status','sent','dev_code',code,'expires_min',(cfg->>'expiry_min')::int,'resends_left',(cfg->>'resend_max')::int - resends - 1);
end $$;

create or replace function vp_verify_otp(p_participant uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare cfg jsonb; rec jsonb; attempts int; v_session_id uuid;
begin
  select session_id into v_session_id from virtual_participants where id = p_participant;
  if v_session_id is null then raise exception 'participant not found'; end if;
  if not (
    has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
    or exists (
      select 1 from virtual_sessions vs
      where vs.id = v_session_id and is_assigned_inspector(vs.visit_id)
    )
  ) then
    raise exception 'not authorized for this virtual session (RBAC-014)';
  end if;

  select settings into cfg from engine_settings where engine='otp';
  select verification_record into rec from virtual_participants where id = p_participant;
  if rec is null or not (rec ? 'code_hash') then return jsonb_build_object('status','no_code'); end if;
  if now() > (rec->>'expires_at')::timestamptz then return jsonb_build_object('status','expired'); end if;
  attempts := coalesce((rec->>'attempts')::int,0);
  if attempts >= (cfg->>'attempts_per_code')::int then
    return jsonb_build_object('status','locked','next','resend or escalate');
  end if;
  if encode(digest(p_code,'sha256'),'hex') = rec->>'code_hash' then
    update virtual_participants set verified_at = now(),
      verification_record = rec || jsonb_build_object('verified', true, 'verified_at', now()::text)
      where id = p_participant;
    insert into audit_events(actor,object_type,object_id,action,after_state)
    values (auth.uid(),'virtual_participants',p_participant,'OTP_VERIFIED',jsonb_build_object('attempts',attempts+1));
    return jsonb_build_object('status','verified');
  else
    update virtual_participants set verification_record = rec || jsonb_build_object('attempts', attempts+1) where id = p_participant;
    insert into audit_events(actor,object_type,object_id,action,after_state)
    values (auth.uid(),'virtual_participants',p_participant,'OTP_FAILED',jsonb_build_object('attempt',attempts+1));
    return jsonb_build_object('status','wrong','attempts_left',(cfg->>'attempts_per_code')::int - attempts - 1);
  end if;
end $$;

-- grants unchanged (already `to authenticated` from 0009); authorization is
-- now enforced inside the function body instead of relying on table RLS.
