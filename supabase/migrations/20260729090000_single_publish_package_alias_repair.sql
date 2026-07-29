-- ACT-004 / REQ-005 / REQ-008
-- In the package validation subquery, the unqualified alias `package_id` was
-- shadowed by package_versions.package_id. The predicate therefore compared a
-- package-version UUID with its parent package UUID and rejected every valid
-- selected checklist. Strictly rewrite only the two known alias expressions.
do $migration$
declare
  v_oid oid;
  v_definition text;
  v_repaired text;
begin
  select p.oid into v_oid
  from pg_proc p
  where p.pronamespace='public'::regnamespace
    and p.proname='publish_single_visit_atomic'
    and pg_get_function_identity_arguments(p.oid)=
      'p_factory_id uuid, p_package_version_ids uuid[], p_inspector_id uuid, p_visit_type text, p_execution_mode execution_mode, p_window_start timestamp with time zone, p_window_end timestamp with time zone, p_license_number text, p_location_confirmed boolean, p_planner_lat numeric, p_planner_lng numeric, p_notes text, p_target jsonb, p_source_channel text, p_resume_plan_id uuid';
  if v_oid is null then
    raise exception 'single publish alias repair target is missing';
  end if;

  v_definition:=pg_get_functiondef(v_oid);
  if position('as selected(package_version_id)' in v_definition)>0
     and position('where pv.id = selected.package_version_id' in v_definition)>0
     and position('where pv.id = package_id' in v_definition)=0 then
    -- Replay after the forward repair is intentionally a no-op.
    v_repaired:=v_definition;
  elsif length(v_definition)-length(replace(
       v_definition,
       'select count(distinct package_id) from unnest(v_package_ids) package_id',
       ''
     )) <> length(
       'select count(distinct package_id) from unnest(v_package_ids) package_id'
     )
     or length(v_definition)-length(replace(
       v_definition,
       'select 1 from unnest(v_package_ids) package_id',
       ''
     )) <> length('select 1 from unnest(v_package_ids) package_id')
     or length(v_definition)-length(replace(
       v_definition,
       'where pv.id = package_id',
       ''
     )) <> length('where pv.id = package_id') then
    raise exception 'single publish alias repair target changed';
  else
    v_repaired:=replace(
      v_definition,
      'select count(distinct package_id) from unnest(v_package_ids) package_id',
      'select count(distinct selected.package_version_id)
       from unnest(v_package_ids) as selected(package_version_id)'
    );
    v_repaired:=replace(
      v_repaired,
      'select 1 from unnest(v_package_ids) package_id',
      'select 1 from unnest(v_package_ids) as selected(package_version_id)'
    );
    v_repaired:=replace(
      v_repaired,
      'where pv.id = package_id',
      'where pv.id = selected.package_version_id'
    );
    execute v_repaired;
  end if;
end
$migration$;

revoke all on function public.publish_single_visit_atomic(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid
) from public,anon,service_role;
grant execute on function public.publish_single_visit_atomic(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid
) to authenticated;
