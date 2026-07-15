-- FIX WAVE 2 · SLICE G4 — Operations / Planning / Visit-management depth.
--
-- M02-041 (expiry leg): expire_lapsed_visits() now emits a 'visit_expired'
-- notification per lapsed visit — one to the assigned inspector, one to the
-- plan creator (planner) — so an expiry is never a silent status flip. The
-- notifications are written INSIDE the same security-definer transition that
-- performs the canonical published->expired transition, so they are atomic with
-- the state change (no second app round-trip, no race, no missed row).
--
-- The publish/cancel/reschedule/return legs already notify from the server
-- actions (src/app/visits/[id]/actions.ts via src/lib/notify.ts). Expiry is the
-- only transition driven by the database (this RPC runs on every planning/field
-- page load), so its notification has to live here, not in application code.
--
-- Channel 'inapp' + delivery_state 'delivered': the in-app inbox row IS the
-- delivery (ENG-11 / notify.ts semantics), so it is honestly 'delivered' the
-- moment it lands — no push/SMS provider is claimed.

create or replace function expire_lapsed_visits() returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  expired_ids uuid[];
begin
  with lapsed as (
    update visits v
       set planning_status = 'expired'
     where v.planning_status = 'published'
       and v.window_end < now()
       and not exists (
         select 1 from inspections i
          where i.visit_id = v.id and i.status <> 'not_started')
       and (
         exists (select 1 from assignments a
                  where a.visit_id = v.id and a.inspector_id = auth.uid())
         or has_any_role(array['ops','planner']))
    returning v.id)
  select coalesce(array_agg(id), '{}'::uuid[]) into expired_ids from lapsed;

  if array_length(expired_ids, 1) is null then
    return 0;
  end if;

  -- M02-041 — notify the assigned inspector of each expired visit.
  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', a.inspector_id,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end),
         'inapp', 'delivered', now()
    from visits v
    join assignments a on a.visit_id = v.id
   where v.id = any(expired_ids)
     and a.inspector_id is not null;

  -- M02-041 — notify the planner (plan creator) of each expired visit.
  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', p.created_by,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end, 'planner', true),
         'inapp', 'delivered', now()
    from visits v
    join visit_plans p on p.id = v.visit_plan_id
   where v.id = any(expired_ids)
     and p.created_by is not null;

  return array_length(expired_ids, 1);
end;
$$;

revoke all on function expire_lapsed_visits() from public;
grant execute on function expire_lapsed_visits() to authenticated;
