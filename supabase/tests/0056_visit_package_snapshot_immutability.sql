\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729120000_visit_package_snapshot_immutability.sql

do $$
declare
  v_actor uuid := '74000000-0000-4000-8000-000000000001';
  v_factory uuid := '74000000-0000-4000-8000-000000000002';
  v_package uuid := '74000000-0000-4000-8000-000000000003';
  v_version uuid := '74000000-0000-4000-8000-000000000004';
  v_plan uuid := '74000000-0000-4000-8000-000000000005';
  v_visit uuid := '74000000-0000-4000-8000-000000000006';
  v_link uuid;
  v_update_denied boolean := false;
  v_delete_denied boolean := false;
begin
  insert into auth.users(id,email)
  values(v_actor,'req010-planner@example.invalid');
  insert into public.profiles(user_id,full_name,region,account_status)
  values(v_actor,'REQ-010 Planner','Riyadh','active');
  insert into public.factories(id,factory_code,name,source,is_temporary)
  values(v_factory,'F-REQ010','REQ-010 Factory','senaei',false);
  insert into public.packages(id,code,title)
  values(v_package,'PKG-REQ010','REQ-010 Package');
  insert into public.package_versions(
    id,package_id,version_label,status,effective_from,definition,created_by
  ) values (
    v_version,v_package,'REQ010-V1','draft',current_date-1,'{}',v_actor
  );
  insert into public.visit_plans(id,method,status,created_by)
  values(v_plan,'single','published',v_actor);
  insert into public.visits(
    id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
    operational_state,window_start,window_end
  ) values (
    v_visit,v_plan,v_factory,'periodic','physical','published','new',
    '2030-06-01 08:00:00+00','2030-06-01 18:00:00+00'
  );
  insert into public.visit_packages(
    visit_id,package_version_id,snapshot,added_by
  ) values (
    v_visit,v_version,
    jsonb_build_object('package_version_id',v_version,'version_label','REQ010-V1'),
    v_actor
  ) returning id into v_link;

  begin
    update public.visit_packages
    set snapshot='{"tampered":true}'::jsonb
    where id=v_link;
  exception
    when sqlstate '55000' then v_update_denied:=true;
  end;
  begin
    delete from public.visit_packages where id=v_link;
  exception
    when sqlstate '55000' then v_delete_denied:=true;
  end;
  if not v_update_denied or not v_delete_denied then
    raise exception 'REQ010_ASSERT: package snapshot mutation was not denied';
  end if;
  if not exists (
    select 1 from public.visit_packages
    where id=v_link
      and snapshot->>'version_label'='REQ010-V1'
      and snapshot->>'tampered' is null
  ) then
    raise exception 'REQ010_ASSERT: immutable snapshot was not preserved';
  end if;
end
$$;

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p
  where p.pronamespace='public'::regnamespace
    and p.proname='publish_single_visit_atomic';
  if position('v_package_ids uuid[]' in v_definition)=0
     or position('cardinality(v_package_ids) > 20' in v_definition)=0
     or position('foreach v_package_id in array v_package_ids' in v_definition)=0
     or position('insert into public.visit_packages' in v_definition)=0
     or position('snapshot' in v_definition)=0 then
    raise exception 'REQ010_ASSERT: zero-many atomic package publisher is incomplete';
  end if;
  if has_table_privilege('authenticated','public.visit_packages','update')
     or has_table_privilege('authenticated','public.visit_packages','delete') then
    raise exception 'REQ010_ASSERT: authenticated snapshot mutation privilege remains';
  end if;
end
$$;

\ir ../migrations/20260729120000_visit_package_snapshot_immutability.sql

rollback;
