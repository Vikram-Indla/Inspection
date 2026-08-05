-- UAT-S08 / TASK-CHEMICAL-RELEASE-INCIDENT-UAT-8 finding: canonical Supervisor
-- (role_key 'supervisor', 20260728012000_four_canonical_roles_compatibility)
-- cannot read incident_reports. incident_reports_read
-- (20260720010000_incident_reports.sql) only lists legacy roles
-- ['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']
-- and was never extended when the canonical Supervisor role was introduced —
-- the same gap ACT-010 (20260729160000_canonical_supervisor_runtime_access.sql)
-- already fixed for inspections/visit_packages. A supervisor holding only the
-- canonical role therefore could not perform the incident supervisory-decision
-- step at all. Additive only: adds one OR arm, widens no write authority,
-- removes no existing predicate.

alter policy incident_reports_read on public.incident_reports
using (
  has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership'])
  or (select public.has_internal_role('supervisor'))
);
