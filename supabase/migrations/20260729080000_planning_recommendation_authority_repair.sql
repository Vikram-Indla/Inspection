-- ACT-004 / REQ-011
-- Inspector recommendation is a Planning operation. Resolve its authority from
-- Planning's canonical permission seam instead of execution role_capabilities.
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
    public.planning_closure_has_explicit_capability('planning.create.single')
    or public.planning_closure_has_explicit_capability('planning.create.bulk')
    or public.planning_closure_has_explicit_capability('planning.create.immediate')
  ) then
    raise exception using errcode='42501',message='PLANNING-RECOMMENDATION-DENIED';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end<=p_window_start then
    raise exception using errcode='22023',message='PLANNING-RECOMMENDATION-WINDOW';
  end if;
  select f.region into v_region from public.factories f where f.id=p_factory_id;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-RECOMMENDATION-FACTORY';
  end if;
  select public.rank_planning_inspector_facts(
    coalesce(jsonb_agg(row_data),'[]'::jsonb)
  ) into v_result
  from (
    select jsonb_build_object(
      'inspector_id',p.user_id,
      'same_region',case when v_region is null or p.region is null then false
                         else p.region=v_region end,
      'region_factor_available',v_region is not null and p.region is not null,
      'has_availability',(capacity.fact->>'has_availability')::boolean,
      'capacity_factor_available',(capacity.fact->>'available')::boolean,
      'factors',jsonb_build_array(
        jsonb_build_object(
          'key','active_inspector_role',
          'role_result',true,
          'account_status_result',p.account_status='active',
          'result',true
        ),
        jsonb_build_object('key','same_region','available',
          v_region is not null and p.region is not null,
          'result',case when v_region is null or p.region is null
                        then null else p.region=v_region end),
        jsonb_build_object(
          'key','window_capacity',
          'available',(capacity.fact->>'available')::boolean,
          'result',(capacity.fact->>'has_availability')::boolean,
          'reason',capacity.fact->>'reason'
        )
      )
    ) row_data
    from public.profiles p
    cross join lateral (
      select public.planning_inspector_capacity_fact(
        p.user_id,p_window_start::date,p_window_end::date
      ) as fact
    ) capacity
    where exists (
      select 1 from public.user_roles ur
      where ur.user_id=p.user_id and ur.role_key='inspector'
    )
      and p.account_status='active'
  ) ranked;
  return v_result;
end
$$;

revoke all on function public.recommend_planning_inspectors(
  uuid,timestamptz,timestamptz
) from public,anon,service_role;
grant execute on function public.recommend_planning_inspectors(
  uuid,timestamptz,timestamptz
) to authenticated;
