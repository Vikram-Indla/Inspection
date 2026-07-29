-- PLN-012 / REQ-002 / ACT-004
--
-- Fresh-schema convergence: user_roles_read was created with self and
-- authorized roster visibility, but the base SELECT privilege required for
-- authenticated role routing was omitted. Restore read only; role mutation
-- remains exclusively behind the governed admin RPCs.

revoke all
on table public.user_roles
from anon, authenticated;

grant select
on table public.user_roles
to authenticated;

-- Planning role routing immediately loads these RLS-protected business and
-- reference tables. Fresh schemas carried only structural privileges, so the
-- policies were unreachable and every canonical role failed at runtime.
revoke all
on table
  public.assignments,
  public.factories,
  public.package_versions,
  public.packages,
  public.planning_lookups,
  public.profiles,
  public.roles,
  public.visit_plans,
  public.visits
from anon, authenticated;

grant select
on table
  public.assignments,
  public.factories,
  public.package_versions,
  public.packages,
  public.planning_lookups,
  public.profiles,
  public.roles,
  public.visit_plans,
  public.visits
to authenticated;
