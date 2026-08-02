-- TASK-DASHBOARD-SHARED-FOUR-ROLE-20260802
-- Complete the read-only RLS seams required by the shared Dashboard. Existing
-- Inspector assignment predicates remain authoritative; no mutation policy,
-- elevated client, secret-bearing table, or production data is changed.

create policy visits_read_canonical_dashboard on public.visits for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('planner')
  or public.has_internal_role('supervisor')
  or public.is_assigned_inspector(id)
);

create policy inspections_read_canonical_dashboard on public.inspections for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('planner')
  or public.has_internal_role('supervisor')
  or public.is_assigned_inspector(visit_id)
);

create policy reviews_read_canonical_dashboard on public.reviews for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('supervisor')
  or exists (
    select 1 from public.inspections i
    where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
  )
);

create policy checklist_responses_read_canonical_dashboard on public.checklist_responses for select
using (
  public.has_internal_role('admin')
  or public.has_internal_role('supervisor')
  or exists (
    select 1 from public.inspections i
    where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
  )
);

create policy audit_read_canonical_dashboard on public.audit_events for select
using (public.has_internal_role('admin') or public.has_internal_role('supervisor'));

create policy geo_read_canonical_dashboard on public.geo_events for select
using (
  public.has_internal_role('supervisor')
  or public.is_assigned_inspector(visit_id)
);

comment on policy visits_read_canonical_dashboard on public.visits is
  'Shared Dashboard read seam. Inspector remains assignment-scoped; Admin, Planner and Supervisor use canonical internal-role grants.';
