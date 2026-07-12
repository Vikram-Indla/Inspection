-- ============================================================================
-- 0022 · Auth audit events (SCR-PUB-010 · ENG-12 · FND-003)
-- Password-reset requests/completions live in Supabase's `auth` schema, which
-- the app's table-write audit trigger (0004 audit_row_change) never sees, and
-- the request leg is pre-auth (no session → RLS blocks a direct client insert).
--
-- Option B: a SECURITY DEFINER RPC that appends to the append-only audit_events
-- table, mirroring the existing trigger's owner-privileged write. No new secret
-- in the app; anon may call it (the request leg has no session). The function
-- is the ONLY anon-reachable audit writer and is tightly constrained:
--   - action ∈ the two known auth events (no arbitrary audit spam vocabulary)
--   - email_hash must be a 64-char sha256 hex (raw email never leaves the client)
--   - 'completed' requires a session (auth.uid()) — only /reset can log it
-- Append-only invariant (0005) is untouched: this INSERTs, never updates/deletes.
--
-- KNOWN FOLLOW-UP: anon can still call the 'requested' leg repeatedly. The reset
-- endpoint itself is rate-limited by Supabase; a per-IP limit on this RPC is a
-- separate hardening item, not invented here.
-- ============================================================================

create or replace function log_auth_event(p_email_hash text, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- constrain the vocabulary: only the two defined auth audit events
  if p_action not in ('password_reset_requested', 'password_reset_completed') then
    raise exception 'unsupported auth audit action: %', p_action using errcode = '22023';
  end if;

  -- email_hash is a client-computed sha256 hex; reject anything else so the
  -- audit trail never carries raw addresses or arbitrary payloads
  if p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'email_hash must be a 64-char sha256 hex digest' using errcode = '22023';
  end if;

  -- the completion event proves a real recovery session existed
  if p_action = 'password_reset_completed' and auth.uid() is null then
    raise exception 'password_reset_completed requires an authenticated recovery session'
      using errcode = '42501';
  end if;

  insert into audit_events (actor, object_type, object_id, action, after_state, requirement_refs)
  values (
    auth.uid(),                                   -- null on the pre-auth request leg
    'auth_credential',
    null,
    p_action,
    jsonb_build_object('email_hash', p_email_hash),
    array['SCR-PUB-010']
  );
end $$;

comment on function log_auth_event(text, text) is
  'ENG-12/FND-003: appends a password-reset audit event (requested|completed). Email is sha256-hashed client-side; no raw PII. Append-only via audit_events.';

-- anon: needed for the pre-auth request leg; authenticated: the /reset completion leg
grant execute on function log_auth_event(text, text) to anon, authenticated;
