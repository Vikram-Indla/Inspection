-- Every planned visit now waits for a Supervisor decision before it can be
-- released to an Inspector. Keep this state in the existing planning state
-- domain so it is visible to search, audit and downstream lifecycle gates.
alter type public.planning_status add value if not exists 'pending_supervision' after 'validated';

-- A Planner may prepare and submit a plan. Only a Supervisor has the final
-- release capability. Remove the legacy business-staff default for publish so
-- a direct call to older publish RPCs cannot bypass supervision.
insert into public.permissions (permission_key, title, description) values
  ('planning.submit_for_supervision', 'Submit Plan for Supervision', 'Submit a complete visit plan for Supervisor assignment and release.')
on conflict (permission_key) do nothing;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'planning.submit_for_supervision'
from public.roles r
where r.role_key in ('planner', 'supervisor')
on conflict do nothing;

delete from public.role_permissions
where role_key = 'planner' and permission_key = 'planning.publish';

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
