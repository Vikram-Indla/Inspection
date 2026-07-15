-- CD-021 (SCR-WEB-110 /planning/bulk) — atomic bulk publish.
--
-- Resolves the HANDOFF_BLOCKED atomicity leg in outputs/cd-021.
-- Before: apps/web/src/app/planning/bulk/actions.ts performed 6 sequential
-- writes (plan, visits, assignments, visits->published, plan->published,
-- notifications) with NO transaction. A failure mid-way left rows the UI had
-- already reported as published — a violation of P03 "partial publish
-- prohibited". The comment claimed atomicity that did not exist.
--
-- This function wraps the whole write set in ONE plpgsql body, so any error
-- rolls the entire operation back (true all-or-nothing). It is SECURITY
-- INVOKER: it runs as the calling planner, so every insert/update is still
-- filtered by the existing RLS policies — NO privileged bypass (per
-- outputs/cd-021/WIRING_MAP_CD-021.csv "no client-side bypass" / "RLS all
-- tables; planner").
--
-- Validation (empty selection, unpublished package, invalid window, M02-012
-- duplicates, M01-029 inspector eligibility/double-booking) stays in the
-- server action, which owns the catalogued, human-readable blocker messages.
-- This function assumes the caller passed an already-validated set and only
-- guarantees the writes are atomic.
--
-- No schema/column/enum/RLS/transition changes. Canonical transitions
-- (draft -> published) are unchanged; this only makes them atomic.

create or replace function publish_bulk_plan(
  p_factory_ids        uuid[],
  p_package_version_id uuid,
  p_window_start       timestamptz,
  p_window_end         timestamptz,
  p_visit_type         text,
  p_notes              text,
  p_manual             jsonb,   -- { "<factory_id>": "<inspector_id>" } manual picks (M01-029)
  p_auto_pool          uuid[]   -- ordered inspector pool for round-robin of the rest (ENG-05)
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plan_id   uuid;
  v_fid       uuid;
  v_visit_id  uuid;
  v_inspector uuid;
  v_method    assignment_method;
  v_rr        int := 0;               -- round-robin cursor over p_auto_pool
  v_pool_len  int := coalesce(array_length(p_auto_pool, 1), 0);
begin
  if p_factory_ids is null or array_length(p_factory_ids, 1) is null then
    raise exception 'publish_bulk_plan: empty factory set' using errcode = 'P0001';
  end if;

  -- plan (bulk method, draft first so the same canonical transition applies)
  insert into visit_plans (method, status, created_by, criteria)
  values ('bulk', 'draft', auth.uid(),
          jsonb_build_object('selected', array_length(p_factory_ids, 1)))
  returning id into v_plan_id;

  -- one visit + one assignment per factory
  foreach v_fid in array p_factory_ids loop
    insert into visits (
      visit_plan_id, factory_id, visit_type, execution_mode,
      planning_status, window_start, window_end, package_version_id, notes
    ) values (
      v_plan_id, v_fid, p_visit_type, 'physical',
      'draft', p_window_start, p_window_end, p_package_version_id, p_notes
    ) returning id into v_visit_id;

    -- manual pick honored; otherwise round-robin over the auto pool (ENG-05)
    if p_manual ? v_fid::text then
      v_inspector := (p_manual ->> v_fid::text)::uuid;
      v_method    := 'manual';
    elsif v_pool_len > 0 then
      v_inspector := p_auto_pool[(v_rr % v_pool_len) + 1];
      v_rr        := v_rr + 1;
      v_method    := 'automatic';
    else
      raise exception 'publish_bulk_plan: no inspector available for factory %', v_fid
        using errcode = 'P0001';
    end if;

    insert into assignments (visit_id, inspector_id, method)
    values (v_visit_id, v_inspector, v_method);
  end loop;

  -- canonical transition draft -> published (atomic with the inserts above)
  update visits      set planning_status = 'published' where visit_plan_id = v_plan_id;
  update visit_plans set status = 'published', published_at = now() where id = v_plan_id;

  -- assignment notifications (same semantics as before; now inside the txn)
  insert into notifications (event_key, recipient, payload, channel)
  select 'assignment', a.inspector_id,
         jsonb_build_object('visit_id', a.visit_id), 'push'
  from assignments a
  join visits v on v.id = a.visit_id
  where v.visit_plan_id = v_plan_id;

  return v_plan_id;
end;
$$;

comment on function publish_bulk_plan is
  'CD-021: atomic bulk-plan publish (SECURITY INVOKER, RLS-enforced). Replaces the '
  'non-transactional 6-write sequence in planning/bulk/actions.ts. All-or-nothing per P03.';

grant execute on function publish_bulk_plan to authenticated;
