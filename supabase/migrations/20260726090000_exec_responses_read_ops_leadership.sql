-- Executive Overview (card `exec`) — let the dashboard's own personas read the
-- answers behind the inspections they already read.
--
-- FINDING. 0002_rbac_audit.sql grants inspections_read to
--   ['reviewer','auditor','ops','planner','leadership']
-- but responses_rw, in the same file, grants only
--   ['reviewer','auditor'].
-- So ops and leadership can read every inspection row nationally and none of
-- its checklist answers. Measured on 2026-07-26 as ops-01@mim-inspection.test:
-- inspections 288, violations 268, factories 1970, reviews 202 — identical to
-- service-role — while checklist_responses returned 0 against 632.
--
-- CONSEQUENCE. The approved-compliance rate is the headline of the executive
-- surface and is computed from checklist_responses, so it renders
-- "Not available" for the only personas the surface is built for. The page is
-- fail-closed and honest, and therefore permanently blank.
--
-- SCOPE OF THIS CHANGE. Read only, and only the two roles the dashboard route
-- already gates on (dashboardRoleKeys = ['ops','leadership'] in
-- app/(app)/dashboard/page.tsx). This is narrower than the parent policy:
-- `planner` is NOT added, because planners do not open this surface.
-- No write path is granted — responses_rw keeps sole authority over inserts and
-- updates, and its `with check` (assigned inspector only) is untouched.
--
-- This widens read exposure. It is recorded as such rather than folded into an
-- unrelated change, and it is reversible with a single drop policy.

create policy responses_read_oversight on checklist_responses
  for select
  using (has_any_role(array['ops','leadership']));

comment on policy responses_read_oversight on checklist_responses is
  'Executive Overview: ops and leadership already hold inspections_read for the parent row; without this they cannot read the answers that produce the approved-compliance rate. Read only — no write path is granted.';
