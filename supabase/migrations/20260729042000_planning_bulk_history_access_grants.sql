-- PLN-007 supporting Bulk Planning route read path.
--
-- The Bulk criteria-history query reads violations to derive prior recorded
-- clause/risk facts. violations_read already limits SELECT to authenticated
-- sessions, but the base table grant required to reach that policy was
-- omitted. Restore read only; mutation remains outside this Planning repair.

revoke all
on table public.violations
from anon, authenticated;

grant select
on table public.violations
to authenticated;

-- The same history projection embeds reviews. The reviews_read RLS policy
-- remains the authority for which review rows a session may see.
revoke all
on table public.reviews
from anon, authenticated;

grant select
on table public.reviews
to authenticated;
