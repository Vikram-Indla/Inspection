-- EXE-J read-model contract. Run in a disposable database with ON_ERROR_STOP.
begin;

do $$
begin
  if to_regprocedure('public.execution_workspace_read(integer)') is null
     or to_regprocedure('public.execution_visit_detail_read(uuid)') is null
     or to_regprocedure('public.execution_read_visit_allowed(uuid)') is null then
    raise exception 'EXE-READ-001 functions missing';
  end if;

  if exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name in (
        'execution_workspace_read',
        'execution_visit_detail_read',
        'execution_read_visit_allowed'
      )
      and grantee in ('PUBLIC', 'anon', 'service_role')
      and privilege_type = 'EXECUTE'
  ) then
    raise exception 'EXE-READ-002 forbidden execute grant';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.execution_workspace_read(integer)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.execution_visit_detail_read(uuid)',
    'EXECUTE'
  ) then
    raise exception 'EXE-READ-003 authenticated execute missing';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'execution_workspace_read',
        'execution_visit_detail_read',
        'execution_read_visit_allowed'
      )
      and (not p.prosecdef or coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%')
  ) then
    raise exception 'EXE-READ-004 unsafe function mode/search_path';
  end if;

  if position('''method'', a.method' in pg_get_functiondef(
       'public.execution_workspace_read(integer)'::regprocedure))=0
     or position('''code'', pkg.code' in pg_get_functiondef(
       'public.execution_workspace_read(integer)'::regprocedure))=0
     or position('order by j.started_at desc, j.id desc' in lower(
       pg_get_functiondef(
         'public.execution_workspace_read(integer)'::regprocedure)))=0
     or position('''ended_at'', js.ended_at' in pg_get_functiondef(
       'public.execution_workspace_read(integer)'::regprocedure))=0 then
    raise exception 'EXE-READ-004A workspace projection is not lossless/deterministic';
  end if;

  if position('''method'', a.method' in pg_get_functiondef(
       'public.execution_visit_detail_read(uuid)'::regprocedure))=0
     or position('''code'', pkg.code' in pg_get_functiondef(
       'public.execution_visit_detail_read(uuid)'::regprocedure))=0
     or position('order by j.started_at desc, j.id desc' in lower(
       pg_get_functiondef(
         'public.execution_visit_detail_read(uuid)'::regprocedure)))=0
     or position('''ended_at'', js.ended_at' in pg_get_functiondef(
       'public.execution_visit_detail_read(uuid)'::regprocedure))=0 then
    raise exception 'EXE-READ-004B detail projection is not lossless/deterministic';
  end if;
end
$$;

-- Anonymous and a synthetic no-role authenticated identity fail closed before
-- any target lookup. These checks do not require product fixtures.
set local role anon;
do $$
begin
  begin
    perform public.execution_workspace_read(10);
    raise exception 'EXE-READ-005 anonymous call unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  'ffffffff-ffff-4fff-8fff-ffffffffffff', true);
do $$
declare
  v_detail jsonb;
begin
  begin
    perform public.execution_workspace_read(10);
    raise exception 'EXE-READ-006 no-role call unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  v_detail := public.execution_visit_detail_read(
    'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid
  );
  if v_detail <> '{"status":"not_found_or_denied"}'::jsonb then
    raise exception 'EXE-READ-007 detail did not return neutral denial: %', v_detail;
  end if;
end
$$;
reset role;

rollback;
