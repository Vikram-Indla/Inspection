-- PO walkthrough defect (Inspector Capacity, /dashboard Operational View):
-- every inspector row showed "Unresolved identity", 100% of rows, deterministically.
--
-- RCA (Fixes 2, commit 7561a930): profiles_self predates the four-canonical-role
-- migration and only grants SELECT to self / security_admin / ops / planner
-- (0001_foundation.sql, wrapped for InitPlan cost in
-- 20260727010000_rls_initplan_wrap.sql). supervisor was introduced later
-- (20260728012000_four_canonical_roles_compatibility.sql) and is already the
-- canonical role granted dashboard-wide read access in
-- 20260802090000_shared_dashboard_four_roles.sql — profiles was simply never
-- added to that seam, so every supervisor session gets profiles:null on every
-- workload row it can otherwise see in full.
--
-- Purely additive: adds one more OR'd grant via has_internal_role('supervisor')
-- (the canonical-role checker already used by the four-roles dashboard seam).
-- No existing grant (self, security_admin, ops, planner) is narrowed or
-- removed, so no prior access is weakened.
alter policy profiles_self on public.profiles
  using (
    ((select auth.uid()) = user_id)
    or (select has_role('security_admin'::text))
    or (select has_role('ops'::text))
    or (select has_role('planner'::text))
    or (select public.has_internal_role('supervisor'::text))
  );

comment on policy profiles_self on public.profiles is
  'Self-read plus internal-admin/ops/planner/supervisor grants. supervisor added 2026-08-04 to close the Inspector Capacity identity-resolution gap (dashboard already grants supervisor read elsewhere, see 20260802090000_shared_dashboard_four_roles.sql).';
