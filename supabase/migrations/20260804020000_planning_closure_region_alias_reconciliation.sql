-- BAU-6267 — forward-only repository reconciliation for the already-live
-- Eastern / Eastern Province planning scope equivalence.
--
-- Do not edit 20260728010000_planning_closure_p0.sql: accepted migration
-- history is immutable. Replacing this function is idempotent and preserves
-- its SECURITY DEFINER, empty search_path, volatility and execute grants.
create or replace function public.planning_closure_factory_in_scope(p_factory_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.factories f on f.id=p_factory_id
    where p.user_id=auth.uid()
      and nullif(btrim(p.region),'') is not null
      and (
        p.region='National'
        or f.region=p.region
        or (p.region='Eastern Province' and f.region='Eastern')
        or (p.region='Eastern' and f.region='Eastern Province')
      )
  )
$$;

revoke all on function public.planning_closure_factory_in_scope(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.planning_closure_factory_in_scope(uuid)
  to authenticated;
