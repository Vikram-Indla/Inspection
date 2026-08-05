-- PROGRAMME-BASELINE-20260805, canonical_rule_visibility, applied narrowly
-- to Planning per an explicit follow-up ruling (2026-08-05): "an
-- administrator can see Planning" — asked directly, answered yes. Product
-- Owner's basis: "Admin is a persona who is part of MIM" and "sometimes a
-- planner can be a supervisor and an admin as well."
--
-- planning_access_class() already resolves 'admin' into its own class
-- correctly — that stays. The gap was that has_planning_capability() never
-- granted the admin class planning.view, so the class existed but could see
-- nothing. Live-verified before writing this: planning_access_class()
-- returns 'admin' for an admin1-shaped session, and has_planning_capability
-- ('planning.view') returned false for that class.
--
-- Boundary, held exactly as directed: planning.view only. Not
-- planning.publish, planning.manage, planning.cancel, planning.reassign or
-- planning.reschedule — none of those follow from "can see" and none are
-- granted here. The admin class's existing explicit capabilities
-- (configure_workflow, configure_lookups, configure_expiry) are unchanged;
-- planning.view is added alongside them, nothing removed.
--
-- The business_staff branch (planner/supervisor: view, create, edit_draft,
-- manage, cancel, reassign, reschedule, export) is untouched. The
-- high-impact explicit-grant-only list (manual_factory, correct_location,
-- override_assignment, publish, submit_for_supervision, create.immediate,
-- admin.access.manage) is untouched — admin remains refused all of those,
-- exactly as the ruling requires.

create or replace function public.has_planning_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
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
      'planning.configure_expiry',
      'planning.view'
    )
    else false
  end
$$;
