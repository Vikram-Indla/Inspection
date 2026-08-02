\set ON_ERROR_STOP on
-- REQ-002 / ACT-004
-- Transactional preservation probe. No fixture or role change persists.

begin;

-- The currently running local stack predates the four-role tables. Build the
-- exact minimal prior state transactionally when those tables are absent.
-- On a fully migrated stack these statements are no-ops.
create table if not exists public.permissions (
  permission_key text primary key,
  title text not null,
  description text
);
create table if not exists public.role_permissions (
  role_key text not null,
  permission_key text not null,
  primary key (role_key, permission_key)
);
create table if not exists public.role_capabilities (
  role_key text not null,
  capability_key text not null,
  primary key (role_key, capability_key)
);

insert into public.permissions(permission_key,title,description) values
  ('planning.approve','Approve Planner Work','Catalogue-only test fixture'),
  ('planning.return','Return Planner Work','Catalogue-only test fixture'),
  ('planning.reject','Reject Planner Work','Catalogue-only test fixture')
on conflict do nothing;
insert into public.role_permissions(role_key,permission_key) values
  ('supervisor','planning.approve'),
  ('supervisor','planning.return'),
  ('supervisor','planning.reject')
on conflict do nothing;
insert into public.role_capabilities(role_key,capability_key) values
  ('supervisor','review.approve'),
  ('supervisor','review.reject'),
  ('supervisor','review.return_scope')
on conflict do nothing;

create temporary table role_convergence_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.permissions) as permissions,
  (select count(*) from public.role_capabilities) as role_capabilities;

\ir ../migrations/20260729040000_supervisor_planning_approval_convergence.sql

do $$
declare
  v_before role_convergence_before%rowtype;
begin
  select * into v_before from role_convergence_before;

  if exists (
    select 1
    from unnest(array[
      'planning.approve',
      'planning.return',
      'planning.reject'
    ]) capability
    where position(
      'whenp_capabilityin(''planning.approve'',''planning.return'',''planning.reject'')thenfalse'
      in regexp_replace(
        pg_get_functiondef('public.has_planning_capability(text)'::regprocedure),
        '[[:space:]]','','g'
      )
    ) = 0
  ) then
    raise exception 'ACT-004: Planning approval capabilities are not fail-closed';
  end if;

  if (
    select count(*) from public.permissions
    where permission_key in (
      'planning.approve',
      'planning.return',
      'planning.reject'
    )
  ) <> 3 then
    raise exception 'ACT-004: Planning permission catalogue was not preserved';
  end if;

  if (
    select count(*) from public.role_permissions
    where role_key = 'supervisor'
      and permission_key in (
        'planning.approve',
        'planning.return',
        'planning.reject'
      )
  ) <> 3 then
    raise exception 'ACT-004: Supervisor catalogue assignments were not preserved';
  end if;

  if (
    select count(*) from public.role_capabilities
    where role_key = 'supervisor'
      and capability_key in (
        'review.approve',
        'review.reject',
        'review.return_scope'
      )
  ) <> 3 then
    raise exception 'ACT-004: approved L2 review capabilities were not preserved';
  end if;

  if (select count(*) from auth.users) <> v_before.auth_users
     or (select count(*) from public.profiles) <> v_before.profiles
     or (select count(*) from public.user_roles) <> v_before.user_roles
     or (select count(*) from public.permissions) <> v_before.permissions
     or (select count(*) from public.role_capabilities) <> v_before.role_capabilities then
    raise exception 'ACT-004: convergence changed protected accounts or catalogues';
  end if;
end
$$;

-- Replay must be idempotent.
\ir ../migrations/20260729040000_supervisor_planning_approval_convergence.sql

rollback;
