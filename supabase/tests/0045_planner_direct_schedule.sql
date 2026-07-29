\set ON_ERROR_STOP on
-- Direct Planner scheduling preservation and replay probe.

begin;

create table if not exists public.roles (
  role_key text primary key,
  title text not null,
  is_admin boolean not null default false
);
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

insert into public.roles(role_key,title,is_admin)
values ('planner','Planner',false)
on conflict do nothing;
insert into public.permissions(permission_key,title,description)
values ('planning.publish','Schedule Visit','Direct Planner scheduling probe')
on conflict do nothing;

delete from public.role_permissions
where role_key='planner' and permission_key='planning.publish';

create temporary table planner_schedule_before on commit drop as
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_roles) as user_roles,
  (select count(*) from public.roles) as roles,
  (select count(*) from public.permissions) as permissions;

\ir ../migrations/20260729030000_planner_direct_schedule.sql

do $$
declare
  v_before planner_schedule_before%rowtype;
begin
  select * into v_before from planner_schedule_before;

  if not exists (
    select 1 from public.role_permissions
    where role_key='planner' and permission_key='planning.publish'
  ) then
    raise exception 'Planner direct-scheduling grant was not installed';
  end if;

  if (select count(*) from auth.users) <> v_before.auth_users
     or (select count(*) from public.profiles) <> v_before.profiles
     or (select count(*) from public.user_roles) <> v_before.user_roles
     or (select count(*) from public.roles) <> v_before.roles
     or (select count(*) from public.permissions) <> v_before.permissions then
    raise exception 'Planner direct-scheduling changed protected state';
  end if;
end
$$;

-- Replay is idempotent.
\ir ../migrations/20260729030000_planner_direct_schedule.sql

do $$
begin
  if (
    select count(*) from public.role_permissions
    where role_key='planner' and permission_key='planning.publish'
  ) <> 1 then
    raise exception 'Planner direct-scheduling replay duplicated its grant';
  end if;
end
$$;

rollback;
