-- CD-041..043 / M05-015..020 — verification may advance a virtual session
-- only when the actual factory-representative verification record proves it.
--
-- This replaces the client-flow-only `markSessionVerified` update with one
-- security-invoker, RLS-scoped transaction: participant proof, all required
-- representatives, forward transition and timeline event are committed
-- together. It deliberately does not add any video-provider capability.

create or replace function vs_mark_session_verified(
  p_session uuid,
  p_participant uuid
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_state virtual_state;
begin
  select state
    into v_state
    from virtual_sessions
   where id = p_session
   for update;

  if not found then
    raise exception 'virtual session not found or outside write scope';
  end if;

  if v_state in ('verified', 'in_progress') then
    return false;
  end if;

  if v_state = 'closed' then
    raise exception 'closed virtual session is immutable';
  end if;

  if not exists (
    select 1
      from virtual_participants
     where id = p_participant
       and session_id = p_session
       and role = 'factory_rep'
       and verified_at is not null
  ) then
    raise exception 'factory representative OTP verification is required';
  end if;

  if exists (
    select 1
      from virtual_participants
     where session_id = p_session
       and role = 'factory_rep'
       and verified_at is null
  ) then
    raise exception 'every factory representative must be OTP verified';
  end if;

  update virtual_sessions
     set state = 'verified',
         timeline = coalesce(timeline, '[]'::jsonb)
                    || jsonb_build_array(jsonb_build_object(
                         'event', 'verified',
                         'at', now(),
                         'actor', auth.uid(),
                         'detail', jsonb_build_object('participant_id', p_participant)
                       ))
   where id = p_session;

  return true;
end;
$$;

grant execute on function vs_mark_session_verified(uuid, uuid) to authenticated;
