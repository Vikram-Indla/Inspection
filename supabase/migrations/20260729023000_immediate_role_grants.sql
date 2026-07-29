-- Canonical four-role policy: Planner or Supervisor may submit an urgent
-- request; only a Supervisor may release it through the supervision queue.
insert into public.role_permissions(role_key, permission_key)
select r.role_key, 'planning.create.immediate'
from public.roles r
where r.role_key in ('planner','supervisor')
on conflict do nothing;
