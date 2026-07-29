\set ON_ERROR_STOP on
-- PLN-012 / REQ-002 / ACT-004
-- Transactional four-role compatibility and preservation probe.

begin;

create temporary table canonical_roles_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.audit_events) as audit_events,
  (select count(*) from public.roles) as roles,
  (select count(*) from public.permissions) as permissions,
  (select count(*) from public.capabilities) as capabilities;

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000012001','pln012-probe-admin@example.invalid'),
  ('00000000-0000-4000-8000-000000012002','pln012-probe-planner@example.invalid'),
  ('00000000-0000-4000-8000-000000012003','pln012-probe-inspector@example.invalid'),
  ('00000000-0000-4000-8000-000000012004','pln012-probe-supervisor@example.invalid'),
  ('00000000-0000-4000-8000-000000012005','pln012-probe-target@example.invalid');

insert into public.profiles(user_id,full_name) values
  ('00000000-0000-4000-8000-000000012001','PLN-012 Admin'),
  ('00000000-0000-4000-8000-000000012002','PLN-012 Planner'),
  ('00000000-0000-4000-8000-000000012003','PLN-012 Inspector'),
  ('00000000-0000-4000-8000-000000012004','PLN-012 Supervisor'),
  ('00000000-0000-4000-8000-000000012005','PLN-012 Target');

insert into public.user_roles(user_id,role_key) values
  ('00000000-0000-4000-8000-000000012001','admin'),
  ('00000000-0000-4000-8000-000000012002','planner'),
  ('00000000-0000-4000-8000-000000012003','inspector'),
  ('00000000-0000-4000-8000-000000012004','supervisor');

do $$
declare
  v_role text;
  v_user uuid;
begin
  if (
    select count(*)
    from public.roles
    where role_key in ('admin','planner','inspector','supervisor')
      and is_assignable
      and is_internal
      and deprecated_at is null
  ) <> 4 then
    raise exception 'PLN-012: canonical role catalogue is incomplete';
  end if;

  if exists (
    select 1
    from public.roles
    where role_key not in ('admin','planner','inspector','supervisor')
      and is_assignable
  ) then
    raise exception 'PLN-012: a legacy role remains assignable';
  end if;

  if (
    select count(*)
    from public.role_canonical_mappings
    where migration_status = 'manual_reclassification_required'
  ) <> 10 or not exists (
    select 1
    from public.role_canonical_mappings
    where legacy_role_key = 'factory_rep'
      and proposed_canonical_role_key is null
      and migration_status = 'external_participant'
  ) then
    raise exception 'PLN-012: compatibility mapping ledger is incomplete';
  end if;

  foreach v_role in array array['admin','planner','inspector','supervisor'] loop
    if not exists (
      select 1 from public.role_permissions
      where role_key = v_role and permission_key = 'platform.read'
    ) or not exists (
      select 1 from public.role_capabilities
      where role_key = v_role and capability_key = 'platform.read'
    ) then
      raise exception 'PLN-012: platform.read missing for %', v_role;
    end if;
  end loop;

  if not exists (
    select 1 from public.role_permissions
    where role_key = 'planner' and permission_key = 'planning.export'
  ) or exists (
    select 1 from public.role_capabilities
    where role_key = 'planner' and capability_key like 'review.%'
  ) then
    raise exception 'PLN-012: Planner boundary is incorrect';
  end if;

  if not exists (
    select 1 from public.role_capabilities
    where role_key = 'inspector' and capability_key = 'execution.submit'
  ) or exists (
    select 1 from public.role_permissions
    where role_key = 'inspector' and permission_key in (
      'planning.view','planning.export','planning.publish'
    )
  ) then
    raise exception 'PLN-012: Inspector boundary is incorrect';
  end if;

  if not exists (
    select 1 from public.role_capabilities
    where role_key = 'supervisor' and capability_key = 'review.approve'
  ) or exists (
    select 1 from public.role_permissions
    where role_key = 'supervisor'
      and permission_key in (
        'planning.approve','planning.return','planning.reject'
      )
  ) then
    raise exception 'PLN-012: Supervisor review/planning boundary is incorrect';
  end if;

  if not exists (
    select 1 from public.role_permissions
    where role_key = 'admin' and permission_key = 'admin.access.manage'
  ) or exists (
    select 1 from public.role_permissions
    where role_key = 'admin'
      and permission_key in ('planning.publish','planning.export')
  ) then
    raise exception 'PLN-012: Admin configuration boundary is incorrect';
  end if;

  for v_role,v_user in
    select * from (values
      ('admin','00000000-0000-4000-8000-000000012001'::uuid),
      ('planner','00000000-0000-4000-8000-000000012002'::uuid),
      ('inspector','00000000-0000-4000-8000-000000012003'::uuid),
      ('supervisor','00000000-0000-4000-8000-000000012004'::uuid)
    ) as expected(role_key,user_id)
  loop
    perform set_config('request.jwt.claim.sub',v_user::text,true);
    if not public.has_internal_role(v_role) then
      raise exception 'PLN-012: exact canonical role check failed for %',v_role;
    end if;
    if exists (
      select 1
      from unnest(array['admin','planner','inspector','supervisor']) other(role_key)
      where other.role_key <> v_role
        and public.has_internal_role(other.role_key)
    ) then
      raise exception 'PLN-012: canonical role check widened %',v_role;
    end if;
  end loop;

  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000012001',
    true
  );
  begin
    perform public.admin_grant_role(
      '00000000-0000-4000-8000-000000012005',
      'reviewer'
    );
    raise exception 'PLN-012: deprecated role grant unexpectedly succeeded';
  exception
    when check_violation then
      if sqlerrm not like 'EXE-ACCESS-DEPRECATED-ROLE:%' then
        raise;
      end if;
  end;

  if exists (
    select 1
    from public.user_roles
    where user_id = '00000000-0000-4000-8000-000000012005'
  ) then
    raise exception 'PLN-012: rejected legacy assignment left a role row';
  end if;
end
$$;

rollback;

-- Rollback must restore every protected count exactly.
do $$
begin
  -- This statement intentionally runs after rollback. The temporary manifest
  -- is gone, so use the known fixture ids to prove no probe residue remains.
  if exists (
    select 1 from auth.users
    where id between
      '00000000-0000-4000-8000-000000012001'::uuid
      and '00000000-0000-4000-8000-000000012005'::uuid
  ) or exists (
    select 1 from public.profiles
    where user_id between
      '00000000-0000-4000-8000-000000012001'::uuid
      and '00000000-0000-4000-8000-000000012005'::uuid
  ) or exists (
    select 1 from public.user_roles
    where user_id between
      '00000000-0000-4000-8000-000000012001'::uuid
      and '00000000-0000-4000-8000-000000012005'::uuid
  ) then
    raise exception 'PLN-012: transactional fixture residue remains';
  end if;
end
$$;
