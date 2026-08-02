\set ON_ERROR_STOP on
-- REQ-002/005 four-role executable matrix sequence 0052.
begin;

\ir ../migrations/20260729040000_supervisor_planning_approval_convergence.sql
\ir ../migrations/20260729050000_authenticated_role_resolution_grant.sql

insert into auth.users(id,email) values
  ('72000000-0000-4000-8000-000000000001','req002-admin@example.invalid'),
  ('72000000-0000-4000-8000-000000000002','req002-planner@example.invalid'),
  ('72000000-0000-4000-8000-000000000003','req002-supervisor@example.invalid'),
  ('72000000-0000-4000-8000-000000000004','req002-inspector@example.invalid');
insert into public.profiles(user_id,full_name,region,account_status) values
  ('72000000-0000-4000-8000-000000000001','REQ-002 Admin','Riyadh','active'),
  ('72000000-0000-4000-8000-000000000002','REQ-002 Planner','Riyadh','active'),
  ('72000000-0000-4000-8000-000000000003','REQ-002 Supervisor','Riyadh','active'),
  ('72000000-0000-4000-8000-000000000004','REQ-002 Inspector','Riyadh','active');
insert into public.user_roles(user_id,role_key) values
  ('72000000-0000-4000-8000-000000000001','admin'),
  ('72000000-0000-4000-8000-000000000002','planner'),
  ('72000000-0000-4000-8000-000000000003','supervisor'),
  ('72000000-0000-4000-8000-000000000004','inspector');

create or replace function pg_temp.assert_role(
  p_user uuid,
  p_allowed_planning text[],
  p_denied_planning text[],
  p_allowed_execution text[],
  p_denied_execution text[]
) returns void
language plpgsql
as $$
declare
  v_key text;
begin
  perform set_config('request.jwt.claim.sub',p_user::text,true);
  foreach v_key in array p_allowed_planning loop
    if not public.has_planning_capability(v_key) then
      raise exception 'REQ002_MATRIX: % must allow planning %',p_user,v_key;
    end if;
  end loop;
  foreach v_key in array p_denied_planning loop
    if public.has_planning_capability(v_key) then
      raise exception 'REQ002_MATRIX: % must deny planning %',p_user,v_key;
    end if;
  end loop;
  foreach v_key in array p_allowed_execution loop
    if not public.has_capability(v_key) then
      raise exception 'REQ002_MATRIX: % must allow execution %',p_user,v_key;
    end if;
  end loop;
  foreach v_key in array p_denied_execution loop
    if public.has_capability(v_key) then
      raise exception 'REQ002_MATRIX: % must deny execution %',p_user,v_key;
    end if;
  end loop;
end
$$;

select pg_temp.assert_role(
  '72000000-0000-4000-8000-000000000001',
  array['planning.configure_workflow'],
  array['planning.view','planning.create.single','planning.create.immediate'],
  array['admin.execution_workflow'],
  array['execution.start_journey','review.approve']
);
select pg_temp.assert_role(
  '72000000-0000-4000-8000-000000000002',
  array['planning.view','planning.create.single','planning.create.bulk','planning.create.immediate'],
  array['planning.manual_factory','planning.approve'],
  array[]::text[],
  array['execution.start_journey','review.approve']
);
select pg_temp.assert_role(
  '72000000-0000-4000-8000-000000000003',
  array['planning.view','planning.create.single','planning.create.bulk'],
  array['planning.create.immediate','planning.approve','planning.return','planning.reject'],
  array['review.approve','review.reject','review.return_scope'],
  array['execution.start_journey']
);
select pg_temp.assert_role(
  '72000000-0000-4000-8000-000000000004',
  array['planning.create.immediate'],
  array['planning.view','planning.create.single','planning.create.bulk','planning.manual_factory','planning.approve'],
  array['execution.start_journey','execution.arrive','execution.submit'],
  array['review.approve','admin.execution_workflow']
);

do $$
begin
  if not has_table_privilege('authenticated','public.user_roles','select')
     or has_table_privilege('authenticated','public.user_roles','insert')
     or has_table_privilege('authenticated','public.user_roles','update')
     or has_table_privilege('authenticated','public.user_roles','delete') then
    raise exception 'REQ002_MATRIX: role resolution must be read-only';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.create_immediate_visit(uuid,text,uuid,text,text,text,text,text,text,numeric,numeric,text,text,uuid,text,text,text,timestamptz,timestamptz,uuid,boolean)',
    'execute'
  ) then
    raise exception 'REQ005_MATRIX: authenticated Immediate RPC is unavailable';
  end if;
end
$$;

rollback;
