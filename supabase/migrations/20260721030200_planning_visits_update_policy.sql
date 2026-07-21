-- ============================================================================
-- SAQEEL Planning Module — Migration 3 of 3 (supplementary): capability-based
-- UPDATE policy on visits.
--
-- INTENT
--   Migration 20260721030000 added capability-based select/insert policies on
--   visits but no UPDATE policy; the only existing update boundary is the
--   legacy planner/ops policy (0002). Publish RPCs (SECURITY INVOKER) and
--   lifecycle server actions UPDATE visits directly, so pure business-staff
--   users (no legacy planner/ops rows) would be blocked. This adds the
--   missing permissive policy.
--
-- PRESERVATION GUARANTEES
--   - Additive only: one new permissive policy; nothing dropped or altered.
-- ============================================================================

create policy visits_update_capability on visits for update
  using (
    has_planning_capability('planning.manage')
    or has_planning_capability('planning.publish')
    or has_planning_capability('planning.cancel')
    or has_planning_capability('planning.reassign')
    or has_planning_capability('planning.reschedule')
    or has_planning_capability('planning.edit_draft')
  );
