-- ============================================================================
-- Migration 0018 — W4b: notification delivery + platform inbox, review
-- notification legs, virtual session state machine + timeline + OTP status.
--
-- Rows closed (with app code in the same slice):
--   ENG-11            notification rows carry delivery truth (delivered_at /
--                     not_configured — adapters never fake-sent).
--   MVP1-M06-004/006/008/024/026/041/045 — reviewer/inspector notification legs.
--   MVP1-M05-002/003/007/010/012/014/016 — session creation, timeline events,
--                     audit coverage, forward-only state guard, safe OTP status.
-- RLS: deny-by-default preserved; every new surface is policy- or guard-scoped.
-- ============================================================================

-- ---------- 1 · notifications: delivery + read tracking ----------------------
-- read_at     — recipient read receipt (bell inbox, platform-wide).
-- delivered_at — set only when a registered adapter actually delivered.
alter table notifications add column if not exists read_at timestamptz;
alter table notifications add column if not exists delivered_at timestamptz;

-- Bell polls "my unread rows" frequently — cover the exact predicate.
create index if not exists idx_notifications_recipient_created
  on notifications (recipient, created_at desc);

-- Authenticated actors may create notification rows (planner assignment pings,
-- reviewer decisions, virtual scheduling). Reading stays recipient-scoped
-- (notif_own, 0002); updating stays recipient/ops-scoped (0015).
drop policy if exists notif_insert_authed on notifications;
create policy notif_insert_authed on notifications
  for insert with check (auth.uid() is not null);

-- ---------- 2 · reviewer notified on every submission (M06-041/045) ----------
-- Submissions arrive from the server action AND from offline outbox replay, so
-- the notification leg lives in the database — no path can skip it.
-- v1 → every Level 2 reviewer; v>1 → the reviewer who returned it (fallback:
-- all reviewers when no prior reviewer exists).
create or replace function notify_on_submission() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ev text;
  prior_reviewer uuid;
  pl jsonb;
begin
  ev := case when new.version_number > 1 then 'resubmission' else 'submission_received' end;
  pl := jsonb_build_object('inspection_id', new.inspection_id,
                           'version', new.version_number,
                           'submitted_by', new.submitted_by);
  select r.reviewer_id into prior_reviewer
    from reviews r
   where r.inspection_id = new.inspection_id and r.reviewer_id is not null
   order by r.decided_at desc nulls first limit 1;
  if new.version_number > 1 and prior_reviewer is not null then
    insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
    values (ev, prior_reviewer, pl, 'inapp', 'delivered', now());
  else
    insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
    select ev, ur.user_id, pl, 'inapp', 'delivered', now()
      from user_roles ur where ur.role_key = 'reviewer';
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_submission on submission_versions;
create trigger trg_notify_submission
  after insert on submission_versions
  for each row execute function notify_on_submission();

-- ---------- 3 · virtual session state machine guard (M05 STM-VIR) ------------
-- Forward-only: scheduled → waiting → joined → verified → in_progress → closed.
-- Skipping forward is legal (rep may verify straight from scheduled); moving
-- backward or editing a closed session is rejected by the database.
create or replace function guard_virtual_transition() returns trigger
language plpgsql as $$
declare r_old int; r_new int;
begin
  if old.state = 'closed' then
    raise exception 'closed virtual sessions are immutable (STM-VIR · M05-007)';
  end if;
  if new.state = old.state then return new; end if;
  r_old := array_position(array['scheduled','waiting','joined','verified','in_progress','closed'], old.state::text);
  r_new := array_position(array['scheduled','waiting','joined','verified','in_progress','closed'], new.state::text);
  if r_new < r_old then
    raise exception 'virtual session state cannot move backward: % → % (STM-VIR)', old.state, new.state;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_virtual on virtual_sessions;
create trigger trg_guard_virtual
  before update on virtual_sessions
  for each row execute function guard_virtual_transition();

-- ---------- 4 · session timeline events (M05-003/012) ------------------------
-- SECURITY INVOKER on purpose: RLS vs_write (planner/ops/assigned inspector)
-- remains the authority over who may append to a session's timeline.
create or replace function vs_append_event(p_session uuid, p_event text, p_detail jsonb default '{}'::jsonb)
returns void language sql as $$
  update virtual_sessions
     set timeline = coalesce(timeline, '[]'::jsonb)
                 || jsonb_build_array(jsonb_build_object(
                      'event', p_event, 'at', now(), 'actor', auth.uid(), 'detail', p_detail))
   where id = p_session;
$$;
grant execute on function vs_append_event(uuid, text, jsonb) to authenticated;

-- ---------- 5 · safe OTP status (M05-014/016 attempts/resend display) ---------
-- Exposes counters WITHOUT the code hash (a 6-digit code hash is brute-forceable,
-- so verification_record itself must never reach the client).
create or replace function vp_otp_status(p_participant uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; rec jsonb; v_verified timestamptz; found_id uuid;
begin
  select settings into cfg from engine_settings where engine = 'otp';
  select id, verified_at, coalesce(verification_record, '{}'::jsonb)
    into found_id, v_verified, rec
    from virtual_participants where id = p_participant;
  if found_id is null then return jsonb_build_object('status', 'not_found'); end if;
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
grant execute on function vp_otp_status(uuid) to authenticated;

-- ---------- 6 · audit coverage for virtual tables (M05-007) -------------------
-- 0002's audit list excluded virtual_sessions/participants; every state change,
-- timeline append and join/verify write is now an immutable audit_events row.
drop trigger if exists trg_audit_virtual_sessions on virtual_sessions;
create trigger trg_audit_virtual_sessions
  after insert or update or delete on virtual_sessions
  for each row execute function audit_row_change();

drop trigger if exists trg_audit_virtual_participants on virtual_participants;
create trigger trg_audit_virtual_participants
  after insert or update or delete on virtual_participants
  for each row execute function audit_row_change();
