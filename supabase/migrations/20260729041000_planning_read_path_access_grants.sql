-- PLN-005 / PLN-006 Planning read path.
--
-- visit_packages was created with capability- and assignment-scoped RLS
-- policies in 20260721030100_planning_canonical_structures.sql, but the table
-- privileges required to reach those policies were omitted. Restore only the
-- operations covered by those policies. DELETE remains unavailable so package
-- links cannot be removed outside a governed forward workflow.

revoke all
on table public.visit_packages
from anon, authenticated;

grant select, insert, update
on table public.visit_packages
to authenticated;

-- The Planning visit list embeds inspection started_at. The consolidated
-- inspections_read policy explicitly permits Planner reads, but the table
-- privilege needed to reach it was also omitted. Restore SELECT only; direct
-- inspection mutation remains outside this Planning repair.
revoke all
on table public.inspections
from anon, authenticated;

grant select
on table public.inspections
to authenticated;
