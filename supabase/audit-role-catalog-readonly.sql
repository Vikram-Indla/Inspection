-- Read-only four-role catalog evidence. This file does not change database state.
select role_key, title, is_admin, is_assignable, is_internal, deprecated_at
from public.roles
order by role_key;
