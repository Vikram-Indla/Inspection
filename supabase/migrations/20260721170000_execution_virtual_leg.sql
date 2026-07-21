-- TASK-EXECUTION-MODULE-001 · Phase 7 — virtual prepared → executing leg
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §23/§29
--
-- set_operational_state is copied from 20260721130000_execution_journey_readiness_guard.sql
-- with every guard, leg, the D-010 readiness precondition and the
-- idempotent-replay behavior preserved; the ONLY change is the VIRTUAL
-- execution leg: prepared → executing is legal ONLY when the visit's
-- execution_mode is 'virtual' AND a confirmed Ready preparation exists
-- (visit_preparations.confirmed_ready_at IS NOT NULL). Virtual visits skip
-- the on_the_way/arrived journey pair (plan §23: no travel GPS, no geofence),
-- so before this migration a confirmed-ready virtual visit had NO governed
-- way to reach executing — every mode now enters Execution through this one
-- shared transition authority (§29).
--
-- The physical legs are unchanged: prepared → executing remains illegal for
-- physical visits (they must travel on_the_way → arrived → executing), and
-- the on_the_way leg keeps its D-010 EXE-READY-REQUIRED precondition.
--
-- Stable error tokens (mapped to neutral copy in the app layers):
--   EXE-READY-REQUIRED   journey start attempted without a confirmed
--                        Ready-for-Execution preparation (unchanged, D-010)
--   STM-OPS              illegal operational transition (a virtual begin
--                        without confirmed readiness lands here: without a
--                        preparation the visit is still 'new', never
--                        'prepared')

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
       or (p_next = 'executing'  and cur = 'arrived')
       or (p_next = 'executing'  and cur = 'prepared'
           and exists (select 1 from visits v
                        where v.id = p_visit
                          and v.execution_mode = 'virtual')
           and exists (select 1 from visit_preparations vp
                        where vp.visit_id = p_visit
                          and vp.confirmed_ready_at is not null))) then
    raise exception 'Illegal operational transition % -> % (STM-OPS)', cur, p_next;
  end if;
  -- D-010 — the on_the_way leg additionally requires a confirmed preparation.
  -- Arrived/executing legs are unreachable without a prior on_the_way, so they
  -- inherit the guard transitively and need no re-check. The virtual
  -- prepared → executing leg carries its own confirmed-preparation condition
  -- inline above (plan §23 — readiness is mandatory before a remote session
  -- begins, exactly as it is before a physical journey starts).
  if p_next = 'on_the_way' and not exists (
    select 1 from visit_preparations vp
     where vp.visit_id = p_visit
       and vp.confirmed_ready_at is not null
  ) then
    raise exception 'EXE-READY-REQUIRED: confirm the visit ready for execution before starting the journey';
  end if;
  update visits set operational_state = p_next where id = p_visit;  -- trg_audit on visits records the change
  return p_next;
end $$;

revoke all on function set_operational_state(uuid, operational_state) from public;
grant execute on function set_operational_state(uuid, operational_state) to authenticated;
