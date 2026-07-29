-- Read-only role capability evidence. This file does not change database state.
select role_key, permission_key
from public.role_permissions
where permission_key like 'planning.%'
order by role_key, permission_key;
