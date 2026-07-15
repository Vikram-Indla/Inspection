-- Compliance admin operates Factory 360 dossiers (SB11, M07-011/012) but the
-- visits SELECT policy (0001 inspector_own_visits) omitted the admin family,
-- so inspection history rendered empty for that persona. Inspectors stay
-- scoped to their own assignments (RBAC-009).
drop policy if exists inspector_own_visits on visits;
create policy inspector_own_visits on visits for select using (
  has_any_role(array['planner','ops','reviewer','auditor','leadership','compliance_admin'])
  or exists (select 1 from assignments a where a.visit_id = visits.id and a.inspector_id = auth.uid())
);
