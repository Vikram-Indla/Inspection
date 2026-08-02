-- ACT-004 / REQ-005 / REQ-008
-- Planning closure commands are capability-gated. Planning's canonical grants
-- are the planning.* rows in role_permissions (role_capabilities is the
-- execution-engine catalogue and deliberately has no Planning rows).
create or replace function public.planning_closure_has_explicit_capability(
  p_capability text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.user_id=auth.uid()
        and nullif(btrim(p.region),'') is not null
    )
    and exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_key=ur.role_key
      where ur.user_id=auth.uid()
        and rp.permission_key=p_capability
    )
$$;

revoke all on function public.planning_closure_has_explicit_capability(text)
  from public,anon,authenticated,service_role;
grant execute on function public.planning_closure_has_explicit_capability(text)
  to authenticated;
