-- TASK-5 / UAT-S05 — Supervisor Review, Return, and Approval Journey.
--
-- Root cause: public.inspections_read already grants a Level 2 Reviewer
-- (has_capability('review.view'), held by the supervisor role) read access to
-- an inspection under review or already decided. But public.visits has no
-- matching SELECT policy for that same capability — visits_read_explicit_scope
-- only covers planning-capability holders in scope and the assigned inspector.
-- The result: every nested `inspections -> visits -> factories` read
-- (/reviews queue rows and the /reviews/:id workspace) silently returns a
-- null visits relation for a supervisor/admin reviewer, so the factory name,
-- code, visit type/mode and priority the reviewer needs to identify what
-- they are approving are unavailable — even though the reviewer is fully
-- authorized to decide the review. This is a read-scope gap, not an
-- intentional restriction: a reviewer who can already read the inspection,
-- its checklist answers, evidence and violations was never meant to be
-- blinded to which visit/factory produced them.
--
-- Fix: add a permissive SELECT policy on visits granting read access under
-- the same capability that already gates the inspection and review read
-- paths (review.view, operations.view), scoped through the inspections FK so
-- it only ever exposes a visit that has at least one inspection the reviewer
-- is already allowed to read. No existing policy is narrowed, no write path
-- changes, and RLS remains enabled — this is additive, read-only, and mirrors
-- public.inspections_read's own capability check verbatim.
create policy visits_read_review_scope on public.visits
  for select
  to authenticated
  using (
    exists (
      select 1 from public.inspections i
      where i.visit_id = visits.id
        and (public.has_capability('review.view') or public.has_capability('operations.view'))
    )
  );
