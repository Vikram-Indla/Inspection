\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729160000_canonical_supervisor_runtime_access.sql

do $$
begin
  if not has_table_privilege('authenticated','public.visit_packages','select')
     or not has_table_privilege('authenticated','public.inspections','select')
     or has_table_privilege('authenticated','public.visit_packages','delete')
     or has_table_privilege('authenticated','public.inspections','delete') then
    raise exception 'ACT010: authenticated read grants are incomplete or destructive';
  end if;
  if not (
    select c.relrowsecurity
    from pg_class c
    where c.oid='public.visit_packages'::regclass
  ) or not (
    select c.relrowsecurity
    from pg_class c
    where c.oid='public.inspections'::regclass
  ) then
    raise exception 'ACT010: repaired tables must remain RLS protected';
  end if;
end
$$;

set local session_replication_role=replica;
insert into auth.users(id,email) values
  ('73000000-0000-4000-8000-000000000001','act010-admin@example.invalid'),
  ('73000000-0000-4000-8000-000000000002','act010-supervisor@example.invalid'),
  ('73000000-0000-4000-8000-000000000003','act010-inspector@example.invalid');
insert into public.profiles(user_id,full_name,region,account_status) values
  ('73000000-0000-4000-8000-000000000001','ACT-010 Admin','Riyadh','active'),
  ('73000000-0000-4000-8000-000000000002','ACT-010 Supervisor','Riyadh','active'),
  ('73000000-0000-4000-8000-000000000003','ACT-010 Inspector','Riyadh','active');
insert into public.user_roles(user_id,role_key) values
  ('73000000-0000-4000-8000-000000000001','admin'),
  ('73000000-0000-4000-8000-000000000002','supervisor'),
  ('73000000-0000-4000-8000-000000000003','inspector');
insert into public.factories(id,factory_code,name,region) values
  ('73000000-0000-4000-8000-000000000010','ACT010-RLS','ACT-010 RLS Fixture','Riyadh');
insert into public.visit_plans(id,method,status,created_by) values
  ('73000000-0000-4000-8000-000000000020','single','published','73000000-0000-4000-8000-000000000002');
insert into public.packages(id,code,title) values
  ('73000000-0000-4000-8000-000000000030','ACT010-PKG','ACT-010 package');
insert into public.package_versions(id,package_id,version_label,status,definition) values
  ('73000000-0000-4000-8000-000000000031','73000000-0000-4000-8000-000000000030','1','published','{}');
insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end,package_version_id
) values (
  '73000000-0000-4000-8000-000000000040',
  '73000000-0000-4000-8000-000000000020',
  '73000000-0000-4000-8000-000000000010',
  'routine','physical','published','new',
  '2026-08-10','2026-08-11',
  '73000000-0000-4000-8000-000000000031'
);
insert into public.inspections(id,visit_id,status,package_version_id) values
  ('73000000-0000-4000-8000-000000000060',
   '73000000-0000-4000-8000-000000000040',
   'not_started',
   '73000000-0000-4000-8000-000000000031');
set local session_replication_role=origin;

set local role authenticated;
select set_config('request.jwt.claim.sub','73000000-0000-4000-8000-000000000002',true);
do $$
begin
  if (select count(*) from public.inspections
      where id='73000000-0000-4000-8000-000000000060') <> 1 then
    raise exception 'ACT010: canonical Supervisor cannot read governed inspection';
  end if;
end
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','73000000-0000-4000-8000-000000000001',true);
do $$
begin
  if (select count(*) from public.inspections
      where id='73000000-0000-4000-8000-000000000060') <> 0 then
    raise exception 'ACT010: canonical Admin gained operational inspection access';
  end if;
end
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','73000000-0000-4000-8000-000000000003',true);
do $$
begin
  if (select count(*) from public.inspections
      where id='73000000-0000-4000-8000-000000000060') <> 0 then
    raise exception 'ACT010: unrelated Inspector gained another assignment';
  end if;
end
$$;
reset role;

\ir ../migrations/20260729160000_canonical_supervisor_runtime_access.sql

rollback;
