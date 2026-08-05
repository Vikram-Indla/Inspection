-- PROGRAMME-BASELINE-20260805, canonical_rule_visibility / INSP-752 / INSP-753
--
-- "Regardless of persona, everybody can see everything. The only restriction
-- is that administration functionality is reachable by an administrator
-- alone." Product Owner (Vikram), 2026-08-05, recorded in
-- product-contract/governance/PROGRAMME-BASELINE-20260805.yaml.
--
-- First of two passes (operations reads first, per sequencing). This
-- migration touches SELECT policies only, on the six that match what
-- Sikander and Sujatha actually reported: geo_events.geo_read and its
-- siblings on journey_sessions, audit_events, visit_result_reports,
-- visit_result_samples, visit_result_seized_products.
--
-- Full audit (121 role-checking policies, 70 referencing zero real roles)
-- found dozens of read policies naming 'ops', 'auditor', 'reviewer',
-- 'leadership' — none of which exist in public.roles (admin, inspector,
-- planner, supervisor are the only four registered). The intent behind
-- those names — "operational staff can see this" — is correct; the names
-- are phantom. Under the visibility rule, the answer is the four real
-- roles, verbatim, as directed.
--
-- Every other condition in each policy (is_assigned_inspector(...),
-- inspector_id = auth.uid()) is preserved unchanged — only the phantom
-- role array is replaced. No insert/update/delete policy is touched: who
-- may change something stays a separation-of-duties question with the
-- Product Owner, unaffected by this migration.

alter policy geo_read on public.geo_events
  using (
    (select has_any_role(array['admin','inspector','planner','supervisor']))
    or is_assigned_inspector(visit_id)
  );

alter policy journeys_select on public.journey_sessions
  using (
    (inspector_id = (select auth.uid()))
    or (select has_any_role(array['admin','inspector','planner','supervisor']))
  );

alter policy audit_read on public.audit_events
  using (
    (select has_any_role(array['admin','inspector','planner','supervisor']))
  );

alter policy visit_result_reports_read on public.visit_result_reports
  using (
    exists (
      select 1 from inspections i
      where i.id = visit_result_reports.inspection_id
        and (is_assigned_inspector(i.visit_id)
             or (select has_any_role(array['admin','inspector','planner','supervisor'])))
    )
  );

alter policy visit_result_samples_read on public.visit_result_samples
  using (
    exists (
      select 1 from inspections i
      where i.id = visit_result_samples.inspection_id
        and (is_assigned_inspector(i.visit_id)
             or (select has_any_role(array['admin','inspector','planner','supervisor'])))
    )
  );

alter policy visit_result_seized_products_read on public.visit_result_seized_products
  using (
    exists (
      select 1 from inspections i
      where i.id = visit_result_seized_products.inspection_id
        and (is_assigned_inspector(i.visit_id)
             or (select has_any_role(array['admin','inspector','planner','supervisor'])))
    )
  );
