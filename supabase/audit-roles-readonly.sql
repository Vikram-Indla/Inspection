-- Read-only canonical role evidence. This file does not change database state.
select role_key, count(*)::int as assigned_accounts
from public.user_roles
group by role_key
order by role_key;
