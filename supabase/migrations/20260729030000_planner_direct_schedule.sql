-- Product decision: a Planner schedules a validated visit directly.
-- There is no Planner -> Supervisor approval transition in the single-visit
-- journey. This is additive and preserves every existing account, grant and
-- audit record; it only converges the canonical Planner grant with the
-- guarded publisher, which already publishes atomically.

insert into public.role_permissions (role_key, permission_key)
select 'planner', 'planning.publish'
where exists (select 1 from public.roles where role_key = 'planner')
  and exists (select 1 from public.permissions where permission_key = 'planning.publish')
on conflict do nothing;
