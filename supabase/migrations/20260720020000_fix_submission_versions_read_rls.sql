-- TASK-FACTORY-360-STAGING-RUNTIME-CLOSURE-016
-- Defect: SCR-WEB-400 (Factory 360) lists Planner and Operations as allowed
-- viewer roles, and public.inspections' own inspections_read RLS policy
-- already whitelists both. But the Factory 360 dossier's inspection-reports
-- query embeds submission_versions via an inner join
-- (submission_versions!inner(...)), and submission_versions' subs_read
-- policy omitted 'planner' and 'ops' -- so the inner join silently dropped
-- every report row for those two roles even though they could read the
-- parent inspections row and were shown a nonzero "Approved inspections"
-- portfolio count. Reviewer/auditor/leadership and the assigned inspector
-- already work correctly; this closes the gap for the two remaining
-- documented viewer roles. Additive grant widening only, matches the
-- existing inspections_read role list, no other policy or table touched.

drop policy if exists subs_read on public.submission_versions;
create policy subs_read on public.submission_versions for select
  using (
    has_any_role(array['reviewer', 'auditor', 'leadership', 'planner', 'ops'])
    or exists (
      select 1 from public.inspections i
      where i.id = submission_versions.inspection_id
        and is_assigned_inspector(i.visit_id)
    )
  );
