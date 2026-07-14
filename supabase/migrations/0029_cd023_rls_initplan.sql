-- CD-023 performance-advisor remediation — evaluate stable auth predicates once
-- per statement instead of once per candidate row.

create or replace function private.is_owned_inspector_immediate(p_visit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.visits v
     where v.id = p_visit
       and v.visit_plan_id is null
       and v.created_by = (select auth.uid())
       and v.immediate_creator_role = 'inspector'
  )
$$;

revoke all on function private.is_owned_inspector_immediate(uuid) from public;
grant execute on function private.is_owned_inspector_immediate(uuid) to authenticated;

drop policy if exists factories_insert_immediate_inspector on public.factories;
create policy factories_insert_immediate_inspector on public.factories
  for insert with check (
    (select public.has_role('inspector'))
    and is_temporary
    and source = 'immediate_manual'
    and official_lat is null
    and official_lng is null
  );
drop policy if exists visits_insert_immediate_inspector on public.visits;
create policy visits_insert_immediate_inspector on public.visits
  for insert with check (
    (select public.has_role('inspector'))
    and visit_plan_id is null
    and created_by = (select auth.uid())
    and immediate_creator_role = 'inspector'
    and creation_request_id is not null
    and planning_status = 'published'
    and operational_state = 'new'
    and execution_mode = 'physical'
    and window_start = window_end
    and planner_lat is not null and planner_lat between -90 and 90
    and planner_lng is not null and planner_lng between -180 and 180
    and visit_location_source in ('official','manual')
    and nullif(btrim(immediate_reason), '') is not null
    and exists (
      select 1 from public.package_versions pv
       where pv.id = package_version_id and pv.status in ('published','locked')
    )
  );

drop policy if exists assignments_insert_immediate_inspector on public.assignments;
create policy assignments_insert_immediate_inspector on public.assignments
  for insert with check (
    (select public.has_role('inspector'))
    and inspector_id = (select auth.uid())
    and private.is_owned_inspector_immediate(visit_id)
  );
