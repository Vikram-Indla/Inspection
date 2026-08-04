\set ON_ERROR_STOP on
begin;
\ir ../migrations/20260804030000_insp_721_regional_assignments_reassignment_roster.sql
\ir ../migrations/20260804055256_insp_721_assignments_rls_recursion_repair.sql
\ir ../migrations/20260804055652_insp_721_assignment_scope_policy_execute_grant.sql

do $$
declare
  v_proc regprocedure := 'private.assignment_read_in_governed_scope(uuid)'::regprocedure;
  v_security_definer boolean;
  v_config text[];
begin
  if not has_function_privilege('authenticated',v_proc,'execute')
     or has_function_privilege('anon',v_proc,'execute')
     or has_function_privilege('service_role',v_proc,'execute') then
    raise exception 'INSP-721 helper EXECUTE privilege contract failed';
  end if;
  select p.prosecdef,p.proconfig into v_security_definer,v_config
    from pg_catalog.pg_proc p where p.oid=v_proc;
  if not v_security_definer
     or not ('search_path=""'=any(coalesce(v_config,'{}'::text[])))
     or position('auth.uid()' in pg_get_functiondef(v_proc))=0 then
    raise exception 'INSP-721 helper security contract failed';
  end if;
end
$$;

set local session_replication_role=replica;
insert into auth.users(id,email) values
 ('72100000-0000-4000-8000-000000000001','insp721.supervisor@mim.gov.sa'),
 ('72100000-0000-4000-8000-000000000002','insp721.national@mim.gov.sa'),
 ('72100000-0000-4000-8000-000000000003','insp721.admin@mim.gov.sa'),
 ('72100000-0000-4000-8000-000000000004','insp721.inspector@mim.gov.sa');
insert into public.profiles(user_id,full_name,email,region,account_status) values
 ('72100000-0000-4000-8000-000000000001','INSP-721 Regional Supervisor','insp721.supervisor@mim.gov.sa','Riyadh','active'),
 ('72100000-0000-4000-8000-000000000002','INSP-721 National Supervisor','insp721.national@mim.gov.sa','National','active'),
 ('72100000-0000-4000-8000-000000000003','INSP-721 Admin','insp721.admin@mim.gov.sa','Riyadh','active'),
 ('72100000-0000-4000-8000-000000000004','INSP-721 Inspector','insp721.inspector@mim.gov.sa','Riyadh','active');
insert into public.user_roles(user_id,role_key) values
 ('72100000-0000-4000-8000-000000000001','supervisor'),
 ('72100000-0000-4000-8000-000000000002','supervisor'),
 ('72100000-0000-4000-8000-000000000003','admin'),
 ('72100000-0000-4000-8000-000000000004','inspector');
insert into public.factories(id,factory_code,name,region) values
 ('72100000-0000-4000-8000-000000000010','INSP721-RUH','INSP-721 Riyadh','Riyadh'),
 ('72100000-0000-4000-8000-000000000011','INSP721-JED','INSP-721 Jeddah','Makkah');
insert into public.visit_plans(id,method,status,created_by) values
 ('72100000-0000-4000-8000-000000000020','single','published','72100000-0000-4000-8000-000000000001'),
 ('72100000-0000-4000-8000-000000000021','single','published','72100000-0000-4000-8000-000000000002');
insert into public.visits(id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,window_start,window_end) values
 ('72100000-0000-4000-8000-000000000030','72100000-0000-4000-8000-000000000020','72100000-0000-4000-8000-000000000010','routine','physical','published','new','2026-09-10','2026-09-11'),
 ('72100000-0000-4000-8000-000000000031','72100000-0000-4000-8000-000000000021','72100000-0000-4000-8000-000000000011','routine','physical','published','new','2026-09-12','2026-09-13');
insert into public.assignments(id,visit_id,inspector_id,method) values
 ('72100000-0000-4000-8000-000000000040','72100000-0000-4000-8000-000000000030','72100000-0000-4000-8000-000000000004','manual'),
 ('72100000-0000-4000-8000-000000000041','72100000-0000-4000-8000-000000000031','72100000-0000-4000-8000-000000000004','manual');
set local session_replication_role=origin;

set local role authenticated;
select set_config('request.jwt.claim.sub','72100000-0000-4000-8000-000000000001',true);
do $$ begin
 if (select count(*) from public.assignments where id in
   ('72100000-0000-4000-8000-000000000040','72100000-0000-4000-8000-000000000041'))<>1 then
   raise exception 'INSP-721 regional Supervisor scope failed'; end if;
 if (select count(*) from public.list_available_reassignment_inspectors(
   array['72100000-0000-4000-8000-000000000030'::uuid]))<>1 then
   raise exception 'INSP-721 same-region roster failed'; end if;
 begin
   perform * from public.list_available_reassignment_inspectors(
     array['72100000-0000-4000-8000-000000000031'::uuid]);
   raise exception 'INSP-721 cross-region roster unexpectedly allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','72100000-0000-4000-8000-000000000002',true);
do $$ begin if (select count(*) from public.assignments where id in
 ('72100000-0000-4000-8000-000000000040','72100000-0000-4000-8000-000000000041'))<>2 then
 raise exception 'INSP-721 National access changed'; end if; end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','72100000-0000-4000-8000-000000000003',true);
do $$ begin if (select count(*) from public.assignments where id in
 ('72100000-0000-4000-8000-000000000040','72100000-0000-4000-8000-000000000041'))<>2 then
 raise exception 'INSP-721 Admin access changed'; end if; end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','72100000-0000-4000-8000-000000000004',true);
do $$ begin if (select count(*) from public.assignments where id in
 ('72100000-0000-4000-8000-000000000040','72100000-0000-4000-8000-000000000041'))<>2 then
 raise exception 'INSP-721 assigned Inspector access changed'; end if; end $$;
reset role;

\ir ../migrations/20260804030000_insp_721_regional_assignments_reassignment_roster.sql
\ir ../migrations/20260804055256_insp_721_assignments_rls_recursion_repair.sql
\ir ../migrations/20260804055652_insp_721_assignment_scope_policy_execute_grant.sql
rollback;
