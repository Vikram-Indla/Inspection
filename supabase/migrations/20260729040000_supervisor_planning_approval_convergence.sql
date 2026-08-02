-- REQ-002 / ACT-004
-- Planning approval remains catalogue-only. The approved four-role matrix
-- blocks Supervisor approval of Planner work until a Planning approval
-- lifecycle and separation-of-duties contract are approved.
--
-- Preserve the permission catalogue, every account/role assignment, all
-- history, and the approved L2 inspection-review capabilities. Catalogue rows
-- may exist for a future lifecycle; the capability predicate denies their use
-- until that lifecycle is governed.

create or replace function public.has_planning_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when p_capability in (
      'planning.approve',
      'planning.return',
      'planning.reject'
    ) then false
    when public.has_permission(p_capability) then true
    when p_capability in (
      'planning.manual_factory',
      'planning.correct_location',
      'planning.override_assignment',
      'admin.access.manage'
    ) then false
    when public.planning_access_class() = 'business_staff' then p_capability in (
      'planning.view',
      'planning.create',
      'planning.create.single',
      'planning.create.bulk',
      'planning.edit_draft',
      'planning.publish',
      'planning.manage',
      'planning.cancel',
      'planning.reassign',
      'planning.reschedule',
      'planning.export'
    )
    when public.planning_access_class() = 'inspector' then
      p_capability = 'planning.create.immediate'
    when public.planning_access_class() = 'admin' then p_capability in (
      'planning.configure_workflow',
      'planning.configure_lookups',
      'planning.configure_expiry'
    )
    else false
  end
$$;

revoke all on function public.has_planning_capability(text) from public, anon;
grant execute on function public.has_planning_capability(text) to authenticated;
