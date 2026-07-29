-- Read-only role inventory. This proves whether any active holder still has a
-- non-canonical role; it never updates, deactivates, deletes, or maps a role.
select
  ur.role_key,
  count(*)::integer as active_assignments
from public.user_roles ur
group by ur.role_key
order by ur.role_key;
