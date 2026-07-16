-- Migration 0024 — allow the Level 2 Reviewer (and ops) to transition
-- inspections.status as part of a review decision.
--
-- inspections_update (0002) only allows the assigned inspector
-- (is_assigned_inspector(visit_id)). Two server actions running as the
-- REVIEWER write to inspections.status directly:
--   reviews/[id]/page.tsx      — submitted -> under_review (opening a submission)
--   reviews/[id]/actions.ts    — under_review -> approved/returned/rejected (decide())
-- Both writes were silently no-ops under RLS (Postgres/PostgREST does not
-- error on an UPDATE that matches 0 rows due to RLS, and neither call site
-- checked the result), so a reviewer's decision never actually unlocked the
-- inspector's workspace — the golden journey's P4 (correct-and-resubmit)
-- step found the inspection still showing "submitted/locked" after a real,
-- successfully-recorded RETURN decision.
--
-- The application layer already validates these transitions (decide()
-- requires a reason for return/reject, exact returned_sections for return,
-- and only ever writes approved/returned/rejected); this migration brings
-- the RLS policy in line with that already-validated behavior rather than
-- widening what values can be written.
drop policy if exists inspections_update on inspections;
create policy inspections_update on inspections for update using (
  is_assigned_inspector(visit_id)
  or has_any_role(array['reviewer','ops'])
);
