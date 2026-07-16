-- TASK-G11-G12-RELEASE-001 · MVP1-SEC-001..006 · RBAC-001..014
-- Contract/negative probe for 20260716120000_seco_config_versions_roles_rls.sql.
--
-- Asserts, deterministically and read-only (no writes, no rollback needed):
--   1. RLS is ENABLED on public.config_versions and public.roles.
--   2. config_versions retains its admin-scoped write policies + authenticated
--      read (the previously-inert 0002 policies are now active).
--   3. roles exposes an authenticated read policy and ZERO write policy, so
--      PostgREST writes are denied by default.
--
-- A regression (RLS silently disabled, or a write policy appearing on roles)
-- raises and fails the run.

begin;

do $rls_probe$
declare
  v_cfg_rls   boolean;
  v_roles_rls boolean;
  v_cfg_read  int;
  v_cfg_write int;
  v_roles_read  int;
  v_roles_write int;
begin
  -- 1. RLS enabled
  select relrowsecurity into v_cfg_rls
    from pg_class where oid = 'public.config_versions'::regclass;
  select relrowsecurity into v_roles_rls
    from pg_class where oid = 'public.roles'::regclass;

  if v_cfg_rls is not true then
    raise exception 'SECO probe FAIL: RLS not enabled on public.config_versions';
  end if;
  if v_roles_rls is not true then
    raise exception 'SECO probe FAIL: RLS not enabled on public.roles';
  end if;

  -- 2. config_versions policy shape
  select count(*) into v_cfg_read
    from pg_policies
   where schemaname = 'public' and tablename = 'config_versions' and cmd = 'SELECT';
  select count(*) into v_cfg_write
    from pg_policies
   where schemaname = 'public' and tablename = 'config_versions' and cmd in ('INSERT','UPDATE');

  if v_cfg_read < 1 then
    raise exception 'SECO probe FAIL: config_versions has no SELECT policy';
  end if;
  if v_cfg_write < 2 then
    raise exception 'SECO probe FAIL: config_versions missing INSERT/UPDATE (admin-write) policy';
  end if;

  -- 3. roles: authenticated read, no write policy at all
  select count(*) into v_roles_read
    from pg_policies
   where schemaname = 'public' and tablename = 'roles' and cmd = 'SELECT';
  select count(*) into v_roles_write
    from pg_policies
   where schemaname = 'public' and tablename = 'roles' and cmd in ('INSERT','UPDATE','DELETE','ALL');

  if v_roles_read <> 1 then
    raise exception 'SECO probe FAIL: roles expected exactly 1 SELECT policy, found %', v_roles_read;
  end if;
  if v_roles_write <> 0 then
    raise exception 'SECO probe FAIL: roles must have no write policy, found %', v_roles_write;
  end if;

  raise notice 'SECO probe PASS: config_versions + roles RLS hardened';
end
$rls_probe$;

rollback;
