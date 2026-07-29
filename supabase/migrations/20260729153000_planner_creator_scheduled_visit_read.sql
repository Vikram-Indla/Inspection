-- Planner post-schedule detail: a planner may read only the scheduled visit
-- and safe planning metadata that their own plan created.  This is additive:
-- it neither changes role grants nor weakens Inspector/Supervisor paths.

create or replace function public.planning_creator_owns_visit(p_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.visits v
      join public.visit_plans p on p.id = v.visit_plan_id
      where v.id = p_visit_id
        and p.created_by = auth.uid()
    );
$$;

revoke all on function public.planning_creator_owns_visit(uuid) from public, anon;
grant execute on function public.planning_creator_owns_visit(uuid) to authenticated;

-- The original published-plan rule only admitted the creator while a plan had
-- no visits.  Retain the explicit planning-view capability and add a narrow
-- creator branch after scheduling.
create policy plans_creator_scheduled_read
  on public.visit_plans for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and created_by = (select auth.uid())
  );

create policy visits_creator_scheduled_read
  on public.visits for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and public.planning_creator_owns_visit(id)
  );

-- Detail-page metadata only.  No policy below grants writes, audit browsing,
-- inspection answers, attachments, or another planner's visit.
create policy assignments_creator_scheduled_read
  on public.assignments for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and public.planning_creator_owns_visit(visit_id)
  );

create policy visit_packages_creator_scheduled_read
  on public.visit_packages for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and public.planning_creator_owns_visit(visit_id)
  );

create policy visit_lifecycle_events_creator_scheduled_read
  on public.visit_lifecycle_events for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and public.planning_creator_owns_visit(visit_id)
  );

create policy visit_location_events_creator_scheduled_read
  on public.visit_location_events for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and public.planning_creator_owns_visit(visit_id)
  );
