-- Follow-up to 20260805150000_planning_view_admits_admin.sql, same ruling,
-- same boundary (planning.view only). Discovered while verifying that
-- migration live: public.visit_plans' actual SELECT policy
-- (plans_read_explicit_scope) does not call has_planning_capability() at
-- all. It calls a different function, planning_closure_has_explicit_
-- capability(), which requires a literal row in role_permissions —
-- ur.role_key/rp.permission_key — with no class-default fallback of any
-- kind. has_planning_capability()'s own first branch
-- (public.has_permission(p_capability)) reads the same role_permissions
-- table through an equivalent join, so this one row also makes the page
-- gate pass through that branch, ahead of the class-default branch added
-- in the prior migration.
--
-- planner and supervisor already hold this exact grant
-- (role_key/permission_key = ('planner'|'supervisor', 'planning.view')) —
-- this adds the same row for admin, nothing else. Confirmed live before
-- writing this: 139 real rows exist in visit_plans; admin1 saw 0 through
-- RLS even after the prior migration, because plans_read_explicit_scope
-- never consulted it.

insert into public.role_permissions (role_key, permission_key)
values ('admin', 'planning.view')
on conflict do nothing;
