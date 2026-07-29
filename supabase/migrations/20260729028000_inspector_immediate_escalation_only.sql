-- Inspectors may raise an urgent escalation from existing work, but they never
-- create an Immediate visit directly. Creation stays with Planner/Supervisor;
-- Supervisor still owns approval, final assignment and release.

create or replace function public.has_planning_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.has_permission(p_capability) then true
    when p_capability in (
      'planning.manual_factory',
      'planning.correct_location',
      'planning.override_assignment',
      'planning.publish',
      'planning.submit_for_supervision',
      'planning.create.immediate',
      'admin.access.manage'
    ) then false
    when public.planning_access_class() = 'business_staff' then p_capability in (
      'planning.view',
      'planning.create',
      'planning.create.single',
      'planning.create.bulk',
      'planning.edit_draft',
      'planning.manage',
      'planning.cancel',
      'planning.reassign',
      'planning.reschedule',
      'planning.export'
    )
    when public.planning_access_class() = 'admin' then p_capability in (
      'planning.configure_workflow',
      'planning.configure_lookups',
      'planning.configure_expiry'
    )
    else false
  end
$$;
