-- ACT-004 / REQ-005 / REQ-008
-- Clean installations created planning RLS policies but omitted table-level
-- SELECT on the role/configuration/read-model tables used by /launch and the
-- Single Visit workflow. The browser therefore failed before RLS could
-- evaluate the signed-in Planner.
--
-- This is intentionally read-only. Row visibility remains governed by the
-- existing policies on every table.
grant select on table
  public.user_roles,
  public.profiles,
  public.packages,
  public.package_versions,
  public.engine_settings,
  public.planning_lookups,
  public.factories,
  public.visit_plans,
  public.visits,
  public.assignments
to authenticated;
