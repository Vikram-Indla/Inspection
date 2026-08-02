-- Explicitly non-production synthetic inspector directory.
-- This is additive: existing users, role grants, journeys and audit history are
-- untouched.  Only rows whose provenance is NONPRODUCTION_SYNTHETIC are
-- eligible for the Planning manual/automatic assignment roster.

create table if not exists public.nonproduction_inspector_roster (
  user_id uuid primary key references auth.users(id) on delete restrict,
  persona_key text not null unique,
  region text not null,
  account_status text not null check (account_status in ('active', 'inactive')),
  daily_capacity integer not null check (daily_capacity > 0),
  provenance text not null check (provenance = 'NONPRODUCTION_SYNTHETIC'),
  seed_batch_id text not null,
  created_at timestamptz not null default now()
);

alter table public.nonproduction_inspector_roster enable row level security;

drop policy if exists nonproduction_inspector_roster_planner_read on public.nonproduction_inspector_roster;
create policy nonproduction_inspector_roster_planner_read
  on public.nonproduction_inspector_roster
  for select
  using (public.has_internal_role('planner') or public.has_internal_role('admin'));

-- Keep scheduling eligibility aligned to the visible roster: active Inspector
-- role, active profile, active synthetic roster row and the existing window
-- capacity fact.  Same-region remains a transparent ranking factor, never an
-- invented hard exclusion.
create or replace function public.recommend_planning_inspectors(
  p_factory_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_region text;
  v_result jsonb;
begin
  if auth.uid() is null or not (
    public.has_capability('planning.create.single')
    or public.has_capability('planning.create.bulk')
    or public.has_capability('planning.create.immediate')
  ) then
    raise exception using errcode='42501',message='PLANNING-RECOMMENDATION-DENIED';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end <= p_window_start then
    raise exception using errcode='22023',message='PLANNING-RECOMMENDATION-WINDOW';
  end if;
  select f.region into v_region from public.factories f where f.id=p_factory_id;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-RECOMMENDATION-FACTORY';
  end if;

  select public.rank_planning_inspector_facts(coalesce(jsonb_agg(row_data),'[]'::jsonb))
    into v_result
  from (
    select jsonb_build_object(
      'inspector_id',p.user_id,
      'same_region', p.region = v_region,
      'region_factor_available', v_region is not null and p.region is not null,
      'has_availability',(capacity.fact->>'has_availability')::boolean,
      'capacity_factor_available',(capacity.fact->>'available')::boolean,
      'daily_capacity', roster.daily_capacity,
      'provenance', roster.provenance,
      'factors',jsonb_build_array(
        jsonb_build_object('key','active_inspector_role','role_result',true,'account_status_result',true,'result',true),
        jsonb_build_object('key','same_region','available',v_region is not null and p.region is not null,'result',p.region = v_region),
        jsonb_build_object('key','window_capacity','available',(capacity.fact->>'available')::boolean,'result',(capacity.fact->>'has_availability')::boolean,'reason',capacity.fact->>'reason')
      )
    ) row_data
    from public.profiles p
    join public.nonproduction_inspector_roster roster on roster.user_id=p.user_id
    cross join lateral (
      select public.planning_inspector_capacity_fact(p.user_id,p_window_start::date,p_window_end::date) as fact
    ) capacity
    where exists (select 1 from public.user_roles ur where ur.user_id=p.user_id and ur.role_key='inspector')
      and p.account_status='active'
      and roster.account_status='active'
      and roster.provenance='NONPRODUCTION_SYNTHETIC'
  ) ranked;
  return v_result;
end
$$;
revoke all on function public.recommend_planning_inspectors(uuid,timestamptz,timestamptz) from public,anon,service_role;
grant execute on function public.recommend_planning_inspectors(uuid,timestamptz,timestamptz) to authenticated;
