-- Migration 0015 (W1 / slice E3) — Journey state machine + pre-start + telemetry depth
-- Closes: M03-010 (pre-start confirmations persisted) · M04-009 (device timestamp)
--         M04-010/022/040 (altitude/speed/heading capture columns) · M04-018/046/055 (STM-OPS legs)
--         M04-036 (duplicate-session guard) · M04-039 (device arrival timestamp)
-- NOT applied here — orchestrator applies.

-- ---------- journey_sessions depth (FLD-JRN · M03-010 · M04-009/055) ----------
alter table journey_sessions
  add column if not exists prestart jsonb,                 -- {rep_present, location_confirmed, confirmed_at_device} (M03-010)
  add column if not exists device_started_at timestamptz,  -- device clock at journey start (M04-009)
  add column if not exists ended_at timestamptz;           -- tracking stopped at Proceed with Inspection (M04-055)

-- ---------- geo_events depth (FLD-GEO · M04-010/022/039/040) ------------------
alter table geo_events
  add column if not exists altitude_m numeric,             -- M04-010/040
  add column if not exists speed_mps numeric,              -- M04-022
  add column if not exists heading_deg numeric,            -- M04-022
  add column if not exists device_occurred_at timestamptz; -- device clock per event (M04-039)

-- ---------- M04-036 — prevent duplicate active journey sessions per visit -----
create unique index if not exists uq_journey_active_per_visit
  on journey_sessions (visit_id) where status = 'on_journey';

-- ---------- STM-OPS — guarded operational-state legs (M04-018/046/055) --------
-- visits UPDATE RLS stays planner/ops-only (0002 visits_update). The field flow
-- transitions operational_state ONLY through this definer function, which
-- enforces assignment (RBAC-009) and the legal legs:
--   new/prepared -> on_the_way -> arrived -> executing
create or replace function set_operational_state(p_visit uuid, p_next operational_state)
returns operational_state
language plpgsql
security definer
set search_path = public
as $$
declare cur operational_state;
begin
  if auth.uid() is null or not is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  select operational_state into cur from visits where id = p_visit for update;
  if cur is null then
    raise exception 'Visit not found';
  end if;
  if cur = p_next then
    return cur;                       -- idempotent replay (offline retry safe)
  end if;
  if not ((p_next = 'on_the_way' and cur in ('new','prepared'))
       or (p_next = 'arrived'    and cur = 'on_the_way')
       or (p_next = 'executing'  and cur = 'arrived')) then
    raise exception 'Illegal operational transition % -> % (STM-OPS)', cur, p_next;
  end if;
  update visits set operational_state = p_next where id = p_visit;  -- trg_audit on visits records the change
  return p_next;
end $$;

revoke all on function set_operational_state(uuid, operational_state) from public;
grant execute on function set_operational_state(uuid, operational_state) to authenticated;
