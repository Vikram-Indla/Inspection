-- TASK-EXECUTION-MODULE-001 · Phase 3B — journey-start readiness guard
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §7/§10
--
-- set_operational_state is copied from 0015_w1_journey_state.sql with every
-- guard, leg and the idempotent-replay behavior preserved; the ONLY change is
-- the D-010 readiness precondition on the on_the_way leg: a journey may start
-- only after the visit is confirmed Ready for Execution
-- (visit_preparations.confirmed_ready_at IS NOT NULL). Readiness itself is
-- produced exclusively by confirm_visit_ready (20260721120000), which
-- re-validates assignment, execution.prepare, Execution Date, mode
-- eligibility, package resolution and form composition before stamping it.
--
-- The virtual execution lane is unaffected: virtual visits skip the
-- on_the_way/arrived pair (plan §7) and no virtual code path calls this RPC
-- for that leg (verified: the only caller is the physical Startup lane).
--
-- Stable error token (mapped to neutral copy in the field UI):
--   EXE-READY-REQUIRED   journey start attempted without a confirmed
--                        Ready-for-Execution preparation

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
  -- D-010 — the on_the_way leg additionally requires a confirmed preparation.
  -- Arrived/executing legs are unreachable without a prior on_the_way, so they
  -- inherit the guard transitively and need no re-check.
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
