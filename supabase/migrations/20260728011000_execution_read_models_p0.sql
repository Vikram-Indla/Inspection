-- EXE-J read-model closure for /execution and its governed detail handoff.
-- Read-only: DEC-002/DEC-032 activation and Field mutation contracts are absent.

do $$
begin
  if to_regclass('public.visits') is null
     or to_regclass('public.factories') is null
     or to_regclass('public.assignments') is null
     or to_regclass('public.journey_sessions') is null
     or to_regclass('public.profiles') is null
     or to_regclass('public.package_versions') is null
     or to_regclass('public.packages') is null then
    raise exception using errcode = '55000',
      message = 'EXECUTION-READ-PREREQUISITE-MISSING';
  end if;
  if to_regprocedure('public.has_capability(text)') is null then
    raise exception using errcode = '55000',
      message = 'EXECUTION-READ-CAPABILITY-PREREQUISITE-MISSING';
  end if;
end
$$;

create function public.execution_read_visit_allowed(p_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and nullif(btrim(p.region), '') is not null
    )
    and exists (
      select 1
      from public.visits v
      join public.factories f on f.id = v.factory_id
      join public.profiles p on p.user_id = auth.uid()
      where v.id = p_visit_id
        and (p.region = 'National' or p.region = f.region)
        and (
          (
            public.has_capability('execution.view_assigned')
            and exists (
              select 1
              from public.assignments a
              where a.visit_id = v.id
                and a.inspector_id = auth.uid()
                and a.status <> 'returned'
            )
          )
          or public.has_capability('operations.view')
          or public.has_capability('review.view')
        )
    )
$$;

revoke all on function public.execution_read_visit_allowed(uuid)
  from public, anon, authenticated, service_role;

create function public.execution_workspace_read(p_limit integer default 1000)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count bigint;
  v_rows jsonb;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and nullif(btrim(p.region), '') is not null
  ) or not (
    public.has_capability('execution.view_assigned')
    or public.has_capability('operations.view')
    or public.has_capability('review.view')
  ) then
    raise exception using errcode = '42501',
      message = 'EXECUTION-READ-DENIED';
  end if;

  v_limit := least(greatest(coalesce(p_limit, 1000), 1), 1000);

  select count(*) into v_count
  from public.visits v
  where public.execution_read_visit_allowed(v.id);

  select coalesce(jsonb_agg(to_jsonb(q) order by q.execution_date nulls last,
                                             q.window_start, q.id), '[]'::jsonb)
    into v_rows
  from (
    select
      v.id,
      v.visit_reference,
      v.planning_status::text,
      v.operational_state::text,
      v.visit_type,
      v.execution_mode,
      v.execution_date,
      v.window_start,
      v.window_end,
      v.priority,
      jsonb_build_object(
        'id', f.id,
        'name', f.name,
        'factory_code', f.factory_code,
        'cr_number', f.cr_number,
        'region', f.region,
        'city', f.city,
        'risk_band', f.risk_band,
        'official_lat', f.official_lat,
        'official_lng', f.official_lng
      ) as factory,
      case when a.inspector_id is null then null else jsonb_build_object(
        'inspector_id', a.inspector_id,
        'status', a.status,
        'method', a.method,
        'full_name', ip.full_name
      ) end as assignment,
      case when pv.id is null then null else jsonb_build_object(
        'package_version_id', pv.id,
        'version_label', pv.version_label,
        'code', pkg.code,
        'title', pkg.title
      ) end as package,
      case when js.id is null then null else jsonb_build_object(
        'id', js.id, 'status', js.status, 'started_at', js.started_at,
        'ended_at', js.ended_at
      ) end as latest_journey
    from public.visits v
    join public.factories f on f.id = v.factory_id
    left join lateral (
      select aa.inspector_id, aa.status, aa.method
      from public.assignments aa
      where aa.visit_id = v.id
      order by (aa.status <> 'returned') desc, aa.created_at desc, aa.id
      limit 1
    ) a on true
    left join public.profiles ip on ip.user_id = a.inspector_id
    left join lateral (
      select j.id, j.status, j.started_at, j.ended_at
      from public.journey_sessions j
      where j.visit_id = v.id
      order by j.started_at desc, j.id desc
      limit 1
    ) js on true
    left join public.package_versions pv on pv.id = v.package_version_id
    left join public.packages pkg on pkg.id = pv.package_id
    where public.execution_read_visit_allowed(v.id)
    order by v.execution_date nulls last, v.window_start, v.id
    limit v_limit
  ) q;

  return jsonb_build_object(
    'status', 'ok',
    'rows', v_rows,
    'visible_count', v_count,
    'bounded', v_count > v_limit,
    'limit', v_limit
  );
end
$$;

create function public.execution_visit_detail_read(p_visit_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_visit_id is null or not public.execution_read_visit_allowed(p_visit_id) then
    return jsonb_build_object('status', 'not_found_or_denied');
  end if;

  select jsonb_build_object(
    'status', 'ok',
    'visit', to_jsonb(q)
  ) into v_result
  from (
    select
      v.id,
      v.visit_reference,
      v.planning_status::text as planning_status,
      v.operational_state::text as operational_state,
      v.visit_type,
      v.execution_mode,
      v.execution_date,
      v.window_start,
      v.window_end,
      v.priority,
      v.notes,
      v.planning_version,
      jsonb_build_object(
        'id', f.id, 'name', f.name, 'factory_code', f.factory_code,
        'cr_number', f.cr_number, 'region', f.region, 'city', f.city,
        'risk_band', f.risk_band, 'official_lat', f.official_lat,
        'official_lng', f.official_lng
      ) as factory,
      case when a.inspector_id is null then null else jsonb_build_object(
        'inspector_id', a.inspector_id, 'status', a.status,
        'method', a.method,
        'full_name', ip.full_name
      ) end as assignment,
      case when pv.id is null then null else jsonb_build_object(
        'package_version_id', pv.id, 'version_label', pv.version_label,
        'status', pv.status, 'code', pkg.code, 'title', pkg.title
      ) end as package,
      case when js.id is null then null else jsonb_build_object(
        'id', js.id, 'status', js.status, 'started_at', js.started_at,
        'ended_at', js.ended_at
      ) end as latest_journey
    from public.visits v
    join public.factories f on f.id = v.factory_id
    left join lateral (
      select aa.inspector_id, aa.status, aa.method
      from public.assignments aa
      where aa.visit_id = v.id
      order by (aa.status <> 'returned') desc, aa.created_at desc, aa.id
      limit 1
    ) a on true
    left join public.profiles ip on ip.user_id = a.inspector_id
    left join lateral (
      select j.id, j.status, j.started_at, j.ended_at
      from public.journey_sessions j
      where j.visit_id = v.id
      order by j.started_at desc, j.id desc
      limit 1
    ) js on true
    left join public.package_versions pv on pv.id = v.package_version_id
    left join public.packages pkg on pkg.id = pv.package_id
    where v.id = p_visit_id
  ) q;

  return coalesce(v_result, jsonb_build_object('status', 'not_found_or_denied'));
end
$$;

revoke all on function public.execution_workspace_read(integer)
  from public, anon, authenticated, service_role;
revoke all on function public.execution_visit_detail_read(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.execution_workspace_read(integer) to authenticated;
grant execute on function public.execution_visit_detail_read(uuid) to authenticated;

comment on function public.execution_workspace_read(integer) is
  'EXE-J /execution bounded read model; explicit capability + region/assignment scope.';
comment on function public.execution_visit_detail_read(uuid) is
  'EXE-J neutral detail read: ok or not_found_or_denied; no authorization oracle.';
