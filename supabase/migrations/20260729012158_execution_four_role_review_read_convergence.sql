-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Complete the four-role review-read convergence.
--
-- The prior Supervisor read repair correctly added a read-only capability, but
-- retained historic legacy-role fallbacks in a few policies. The live role
-- catalogue is now Admin, Planner, Supervisor and Inspector only; remove
-- those fallbacks without changing the assigned-Inspector path or adding any
-- write authority for Supervisor.

alter policy responses_read on public.checklist_responses
  using (
    public.has_capability('review.view')
    or exists (
      select 1
      from public.inspections i
      where i.id = checklist_responses.inspection_id
        and (
          public.is_assigned_inspector(i.visit_id)
          or (
            i.status = 'approved'
            and public.inspects_same_factory(i.visit_id)
          )
        )
    )
  );

alter policy review_comments_read on public.review_comments
  using (
    reviewer_id = (select auth.uid())
    or public.has_capability('review.view')
    or exists (
      select 1
      from public.inspections i
      join public.assignments a on a.visit_id = i.visit_id
      where i.id = review_comments.inspection_id
        and a.inspector_id = (select auth.uid())
    )
  );

alter policy compliance_handoffs_read on public.compliance_inspection_handoffs
  using (public.has_capability('review.view'));
