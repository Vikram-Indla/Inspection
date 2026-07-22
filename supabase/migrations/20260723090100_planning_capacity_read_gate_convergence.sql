-- M11 convergence follow-up / PLN-CON-003 + D-009 · capacity-read gate
-- convergence for capability-gated publishers
--
-- CONTEXT
--   20260723090000_planning_publish_capability_convergence.sql converged the
--   publish RPCs (capability gate + D-009 capacity hook). The D-009 hook
--   calls public.inspector_window_capacity, whose own caller gate admits
--   only planner/ops roles or the inspector themself. A capability-gated
--   publisher (Reviewer persona holding planning.publish, no planner role)
--   therefore passed the publish RPC gate but the transaction died inside
--   the capacity read with insufficient_privilege (verified M11:
--   'Window capacity is visible to Planning, Operations, or the inspector
--   themself', SQLSTATE 42501, rolled-back publish).
--
-- THIS MIGRATION re-defines inspector_window_capacity byte-identical to
--   20260721121000 with ONE change: the caller gate also admits
--   has_planning_capability('planning.publish'). Read surface is unchanged
--   for every other persona; the function stays security definer with
--   search_path pinned.
--
-- Authored by the M11 regression session; NOT applied — repo owner applies.

create or replace function public.inspector_window_capacity(p_inspector uuid, p_window_start date, p_window_end date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_end date;
  v_truncated boolean := false;
  v_days jsonb;
  v_has boolean;
begin
  -- Caller must be Planning, Operations, the inspector themself, or a
  -- planning.publish capability holder (the publish RPCs re-check window
  -- capacity in-transaction for D-009; capability-gated publishers such as
  -- the Reviewer persona hold no planner/ops role).
  if auth.uid() is null
     or (auth.uid() <> p_inspector
         and not public.has_any_role(array['planner', 'ops'])
         and not public.has_planning_capability('planning.publish')) then
    raise insufficient_privilege
      using message = 'Window capacity is visible to Planning, Operations, or the inspector themself';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end < p_window_start then
    raise check_violation
      using message = 'EXE-CAPACITY-WINDOW-INVALID: the capacity window is invalid';
  end if;

  v_cap := private.execution_daily_cap();
  v_end := p_window_end;
  if p_window_end > p_window_start + 61 then
    v_end := p_window_start + 61;   -- 62-day scan cap (D-009)
    v_truncated := true;
  end if;

  select coalesce(jsonb_agg(day_row order by day_row ->> 'date'), '[]'::jsonb)
    into v_days
    from (
      select jsonb_build_object(
               'date', d,
               'used', u,
               'remaining', greatest(v_cap - u, 0)
             ) as day_row
        from (
          select g.d::date as d,
                 private.execution_daily_used(p_inspector, g.d::date) as u
            from generate_series(p_window_start::timestamptz, v_end::timestamptz, interval '1 day') as g(d)
        ) counted
    ) days;

  v_has := exists (
    select 1 from jsonb_array_elements(v_days) as e(day)
    where (e.day ->> 'remaining')::integer > 0
  );

  return jsonb_build_object(
    'cap', v_cap,
    'days', v_days,
    'has_availability', v_has,
    'truncated', v_truncated
  );
end $$;

revoke all on function public.inspector_window_capacity(uuid, date, date) from public, anon;
grant execute on function public.inspector_window_capacity(uuid, date, date) to authenticated;
