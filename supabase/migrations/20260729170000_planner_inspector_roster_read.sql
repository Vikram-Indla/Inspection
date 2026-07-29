-- DM-005 · Planner Single Visit inspector roster.
--
-- Planning screens enumerate `user_roles.role_key = 'inspector'` and join the
-- matching profile name. Canonical Planner held planning.create/publish but
-- the converged roster policy admitted only self, Admin, and Supervisor, so
-- the inspector dropdown received an empty array. Preserve every established
-- roster reader and add the missing canonical Planner read seam. This is
-- SELECT-only: role grants, profiles, accounts, assignments, and audit history
-- remain unchanged.

alter policy user_roles_read on public.user_roles
using (
  user_id = (select auth.uid())
  or (
    select public.has_any_role(
      array['planner','ops','security_admin','reviewer','auditor','compliance_admin']
    )
  )
  or (select public.has_internal_role('admin'))
  or (select public.has_internal_role('planner'))
  or (select public.has_internal_role('supervisor'))
);
