-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Complete the four-role review read boundary without reviving retired roles.
--
-- Supervisor already receives review.view.  The review workspace also reads
-- nested inspection facts, so grant that capability SELECT only.  Do not alter
-- legacy FOR ALL policies: adding Supervisor to their USING predicates would
-- accidentally permit deletes.  Inspector-only write checks remain unchanged.

alter policy responses_read on public.checklist_responses
  using (
    public.has_capability('review.view')
    or (
      exists (
        select 1 from public.inspections i
        where i.id = checklist_responses.inspection_id
          and (
            public.is_assigned_inspector(i.visit_id)
            or public.has_any_role(array['reviewer','auditor'])
          )
      )
      or public.has_any_role(array['ops','leadership'])
      or exists (
        select 1 from public.inspections i
        where i.id = checklist_responses.inspection_id
          and i.status = 'approved'
          and public.inspects_same_factory(i.visit_id)
      )
    )
  );

drop policy if exists supervisor_review_evidence_read on public.evidence;
create policy supervisor_review_evidence_read on public.evidence
  for select to authenticated
  using (public.has_capability('review.view'));

drop policy if exists supervisor_review_findings_read on public.findings;
create policy supervisor_review_findings_read on public.findings
  for select to authenticated
  using (public.has_capability('review.view'));

drop policy if exists supervisor_review_action_forms_read on public.action_forms;
create policy supervisor_review_action_forms_read on public.action_forms
  for select to authenticated
  using (public.has_capability('review.view'));

alter policy review_comments_read on public.review_comments
  using (
    reviewer_id = (select auth.uid())
    or public.has_capability('review.view')
    or public.has_any_role(array['reviewer','ops','auditor','compliance_admin'])
    or exists (
      select 1
      from public.inspections i
      join public.assignments a on a.visit_id = i.visit_id
      where i.id = review_comments.inspection_id
        and a.inspector_id = (select auth.uid())
    )
  );

alter policy compliance_handoffs_read on public.compliance_inspection_handoffs
  using (
    public.has_capability('review.view')
    or public.has_any_role(array['reviewer','ops','auditor','compliance_admin'])
  );

create or replace function public.review_timeline(p_inspection_id uuid)
returns table(
  event_key text,
  occurred_at timestamptz,
  object_type text,
  object_id uuid,
  actor_id uuid,
  payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with allowed as (
    select exists (
      select 1 from public.inspections i
      left join public.assignments a on a.visit_id = i.visit_id
      where i.id = p_inspection_id
        and (
          a.inspector_id = (select auth.uid())
          or public.has_capability('review.view')
        )
    ) ok
  ), events(
    event_key, occurred_at, object_type, object_id, actor_id, payload
  ) as (
    select case when sv.version_number = 1 then 'submitted' else 'resubmitted' end,
      sv.submitted_at, 'submission_versions'::text,
      sv.id, sv.submitted_by,
      jsonb_build_object(
        'version_number', sv.version_number,
        'submission_version_id', sv.id
      )
    from public.submission_versions sv
    where sv.inspection_id = p_inspection_id
    union all
    select 'review_opened', ae.occurred_at,
      'reviews', r.id, r.reviewer_id,
      jsonb_build_object(
        'submission_version_id', r.submission_version_id,
        'status', r.status
      )
    from public.reviews r
    join public.audit_events ae
      on ae.object_type = 'reviews'
      and ae.object_id = r.id
      and ae.action = 'start_review'
    where r.inspection_id = p_inspection_id
    union all
    select
      case r.decision
        when 'approve' then 'approved'
        when 'return' then 'returned'
        else 'rejected'
      end,
      r.decided_at, 'reviews', r.id, r.reviewer_id,
      jsonb_build_object(
        'submission_version_id', r.submission_version_id,
        'decision', r.decision,
        'reason', r.decision_reason,
        'returned_sections', r.returned_sections
      )
    from public.reviews r
    where r.inspection_id = p_inspection_id and r.decided_at is not null
    union all
    select 'reviewer_comment', c.created_at, 'review_comments', c.id,
      c.reviewer_id,
      jsonb_build_object(
        'review_id', c.review_id,
        'submission_version_id', c.submission_version_id,
        'decision', c.decision,
        'comment', c.comment
      )
    from public.review_comments c
    where c.inspection_id = p_inspection_id
    union all
    select 'compliance_handoff', h.created_at,
      'compliance_inspection_handoffs', h.id, h.handed_off_by,
      jsonb_build_object(
        'review_id', h.review_id,
        'submission_version_id', h.submission_version_id,
        'status', h.status,
        'correlation_id', h.correlation_id
      )
    from public.compliance_inspection_handoffs h
    where h.inspection_id = p_inspection_id
  )
  select e.* from events e, allowed
  where allowed.ok
  order by e.occurred_at, e.object_id
$$;

revoke all on function public.review_timeline(uuid) from public, anon;
grant execute on function public.review_timeline(uuid) to authenticated;
