-- Read-only current-state evidence. This file does not change database state.
select role_key, count(*)::int as assigned_accounts
from public.user_roles
group by role_key
order by role_key;

select
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.factories) as factories,
  (select count(*) from public.visit_plans) as visit_plans,
  (select count(*) from public.visits) as visits,
  (select count(*) from public.inspections) as inspections;
