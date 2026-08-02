-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- The direct Scheduling flow admits the canonical Planner role while some
-- preserved test profiles have no region required by the generic capability
-- helper.  Keep this row-level exception strictly Planner + plan creator.

drop policy if exists plans_creator_scheduled_read on public.visit_plans

drop policy if exists visits_creator_scheduled_read on public.visits

drop policy if exists assignments_creator_scheduled_read on public.assignments

drop policy if exists visit_packages_creator_scheduled_read on public.visit_packages

drop policy if exists visit_lifecycle_events_creator_scheduled_read on public.visit_lifecycle_events

drop policy if exists visit_location_events_creator_scheduled_read on public.visit_location_events

create policy plans_creator_scheduled_read
  on public.visit_plans for select to authenticated
  using (public.has_role('planner') and created_by = (select auth.uid()))

create policy visits_creator_scheduled_read
  on public.visits for select to authenticated
  using (public.has_role('planner') and public.planning_creator_owns_visit(id))

create policy assignments_creator_scheduled_read
  on public.assignments for select to authenticated
  using (public.has_role('planner') and public.planning_creator_owns_visit(visit_id))

create policy visit_packages_creator_scheduled_read
  on public.visit_packages for select to authenticated
  using (public.has_role('planner') and public.planning_creator_owns_visit(visit_id))

create policy visit_lifecycle_events_creator_scheduled_read
  on public.visit_lifecycle_events for select to authenticated
  using (public.has_role('planner') and public.planning_creator_owns_visit(visit_id))

create policy visit_location_events_creator_scheduled_read
  on public.visit_location_events for select to authenticated
  using (public.has_role('planner') and public.planning_creator_owns_visit(visit_id))
