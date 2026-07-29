-- Read-only factory visibility evidence. This file does not change database state.
select factory_code, name, source, is_temporary
from public.factories
order by created_at nulls last, factory_code;
