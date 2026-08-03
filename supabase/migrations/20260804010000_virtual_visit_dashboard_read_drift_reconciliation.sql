-- TASK-VIRTUAL-VISIT-E2E-JOURNEY-DA8EC4 — confirmed live drift reconciliation.
--
-- 20260802090000_shared_dashboard_four_roles.sql is accepted on main and
-- creates six read-only RLS policies (visits/inspections/reviews/
-- checklist_responses/audit_events/geo_events "_read_canonical_dashboard").
-- Its underlying helper functions (has_internal_role, is_assigned_inspector)
-- were confirmed LIVE and returning correct results on the allowlisted
-- non-production project (iiozvqntawxfwbgffzqu) via direct RPC calls, but a
-- direct `select` against `visits` as an assigned-but-cross-region Inspector
-- (is_assigned_inspector = true) still returned zero rows — proving the
-- POLICIES themselves never actually landed live, only their dependencies.
-- This is a known drift class in this project (source accepted, apply step
-- skipped) — see product-contract memory "Migration live reconciliation".
--
-- This migration changes NOTHING about scope: it is byte-for-byte the same
-- six policies as 20260802090000, made idempotent (drop-if-exists) so it is
-- safe to run whether or not the original file partially landed. It widens
-- no permission beyond what is already accepted on main — Inspector read
-- stays assignment-scoped (is_assigned_inspector), Admin/Planner/Supervisor
-- use the existing canonical internal-role grants. No mutation policy, no
-- elevated client, no secret-bearing table, no production project.
--
-- Discovered via: planner4@mim.gov.sa (region Madinah) schedules a virtual
-- visit and assigns inspector6@mim.gov.sa (region Riyadh). P1 (scheduling)
-- passed. P2 (inspector reads /field/<visitId> to confirm session readiness)
-- failed: the live `visits` table exposed zero rows to the assigned but
-- cross-region Inspector, even though is_assigned_inspector() itself is true.
-- The planner-and-inspector-scope policies added by 20260728010000 require
-- factory.region to equal the ACTING user's own profile.region for BOTH the
-- planner's write and the inspector's read — an intentional, unrelated
-- regional-scope boundary that this migration does not touch. This migration
-- only re-lands the already-accepted, region-free Inspector read seam that
-- migration 20260802090000 was supposed to add on top of that boundary.

drop policy if exists visits_read_canonical_dashboard on public.visits;
create policy visits_read_canonical_dashboard on public.visits for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('planner')
  or public.has_internal_role('supervisor')
  or public.is_assigned_inspector(id)
);

drop policy if exists inspections_read_canonical_dashboard on public.inspections;
create policy inspections_read_canonical_dashboard on public.inspections for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('planner')
  or public.has_internal_role('supervisor')
  or public.is_assigned_inspector(visit_id)
);

drop policy if exists reviews_read_canonical_dashboard on public.reviews;
create policy reviews_read_canonical_dashboard on public.reviews for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('supervisor')
  or exists (
    select 1 from public.inspections i
    where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
  )
);

drop policy if exists checklist_responses_read_canonical_dashboard on public.checklist_responses;
create policy checklist_responses_read_canonical_dashboard on public.checklist_responses for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('supervisor')
  or exists (
    select 1 from public.inspections i
    where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
  )
);

drop policy if exists audit_read_canonical_dashboard on public.audit_events;
create policy audit_read_canonical_dashboard on public.audit_events for select
using (public.has_internal_role('admin') or public.has_internal_role('supervisor'));

drop policy if exists geo_read_canonical_dashboard on public.geo_events;
create policy geo_read_canonical_dashboard on public.geo_events for select
using (
  public.has_internal_role('supervisor')
  or public.is_assigned_inspector(visit_id)
);

comment on policy visits_read_canonical_dashboard on public.visits is
  'Shared Dashboard read seam (re-landed after confirmed live drift, TASK-VIRTUAL-VISIT-E2E-JOURNEY-DA8EC4). Inspector remains assignment-scoped; Admin, Planner and Supervisor use canonical internal-role grants.';
