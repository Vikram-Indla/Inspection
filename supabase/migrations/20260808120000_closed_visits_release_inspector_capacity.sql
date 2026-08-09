-- Closed visits must release inspector scheduling capacity.
--
-- Defect (found by uat-s04-inspector4-journey, 2026-08-08): after the Aug 5
-- "approval closes the visit" ruling, an approved inspection sets the visit's
-- operational_state to 'closed', but private.supervision_inspector_is_available
-- still counts that visit against the inspector's window because it filters
-- only on planning_status in ('published','returned'). A closed visit blocked
-- inspector4 until his window lapsed even though no field work remained.
--
-- Fix: a closed visit no longer occupies its inspector's window. The same
-- predicate feeds list_available_supervision_inspectors, the
-- decide_single_visit_supervision guard, and the 0031 overlap trigger, so one
-- definition change corrects all three surfaces.

create or replace function private.supervision_inspector_is_available(
  p_inspector_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_exclude_visit_id uuid default null
) returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_inspector_id and ur.role_key = 'inspector'
  ) and not exists (
    select 1
    from public.assignments a
    join public.visits v on v.id = a.visit_id
    where a.inspector_id = p_inspector_id
      and v.planning_status in ('published','returned')
      and v.operational_state <> 'closed'
      and v.id is distinct from p_exclude_visit_id
      and v.window_start < p_window_end
      and v.window_end > p_window_start
  );
$$;

revoke all on function private.supervision_inspector_is_available(uuid,timestamptz,timestamptz,uuid) from public, anon, authenticated;
