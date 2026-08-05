-- TASK-2-PLANNER-SCHEDULING-PUBLICATION (UAT-S02) — reconcile the
-- "Eastern" / "Eastern Province" regional-name divergence between
-- public.factories.region (curated dataset: Riyadh/Makkah/Eastern/Madinah/
-- Qassim/...) and public.profiles.region (governed roleN@mim.gov.sa UAT
-- identity seed: Riyadh/Eastern Province/Makkah/Madinah/Qassim). The exact
-- string comparison in planning_closure_factory_in_scope silently hid every
-- Eastern-region visit from Eastern-region planners, supervisors and
-- inspectors (RLS denied the read; the Supervisor queue rendered "No visit
-- is awaiting supervision" for a real pending request).
--
-- Additive-only alias: every previously-granted match still matches
-- byte-for-byte; this widens the comparison for exactly one known synonym
-- pair. No scope narrows and no other region is touched.
--
-- Reinstatement: the two region taxonomies should be unified at the source
-- (either rename the curated factories.region value or the identity-seed
-- region label) so this alias becomes redundant. See the Jira story filed
-- alongside this task's evidence.
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
