\set ON_ERROR_STOP on

-- TASK-G11-REMEDIATION-SAQ-JM-BREAKPOINTS-001
-- SAQ-JM-VIS-SLICE-001
-- JM-VIS-AC-001 / JM-VIS-AC-002 / JM-VIS-AC-003 / JM-VIS-AC-012
--
-- Minimal transaction-wrapped proof of the actual later migrations that repair
-- Bulk Visit supervision cardinality and aggregate status. This fixture creates
-- only the prerequisite contract surface, applies the repository migrations by
-- relative path, asserts the outcomes, and rolls every row/schema object back.

begin;

create type public.planning_status as enum (
  'draft',
  'validated',
  'pending_supervision',
  'published',
  'returned',
  'cancelled',
  'expired'
);

create table public.visit_plans (
  id uuid primary key,
  status public.planning_status not null,
  published_at timestamptz
);

create table public.planning_supervision_requests (
  id uuid primary key,
  visit_plan_id uuid not null unique references public.visit_plans(id),
  visit_id uuid not null unique,
  status text not null check (status in ('pending', 'approved', 'returned', 'rejected'))
);

\ir ../migrations/20260729025000_bulk_supervision_request_cardinality.sql
\ir ../migrations/20260729027000_bulk_supervision_plan_status.sql

do $$
declare
  v_plan uuid := '00000000-0000-4000-8000-000000000001';
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'planning_supervision_requests'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) = 'UNIQUE (visit_plan_id)'
  ) then
    raise exception 'JM-VIS-AC-001: visit_plan_id is still unique';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'planning_supervision_requests'
      and indexname = 'planning_supervision_requests_visit_id_uq'
      and indexdef ilike 'create unique index%'
  ) then
    raise exception 'JM-VIS-AC-001: unique visit request invariant is absent';
  end if;

  insert into public.visit_plans(id, status) values (v_plan, 'pending_supervision');
  insert into public.planning_supervision_requests(id, visit_plan_id, visit_id, status)
  values
    ('10000000-0000-4000-8000-000000000001', v_plan, '20000000-0000-4000-8000-000000000001', 'pending'),
    ('10000000-0000-4000-8000-000000000002', v_plan, '20000000-0000-4000-8000-000000000002', 'pending');

  update public.planning_supervision_requests
  set status = 'approved'
  where id = '10000000-0000-4000-8000-000000000001';

  if (select status from public.visit_plans where id = v_plan) <> 'pending_supervision' then
    raise exception 'JM-VIS-AC-003: one approved child finalized a pending plan';
  end if;

  update public.planning_supervision_requests
  set status = 'rejected'
  where id = '10000000-0000-4000-8000-000000000002';

  if (select status from public.visit_plans where id = v_plan) <> 'published' then
    raise exception 'JM-VIS-AC-003: approved plus rejected did not resolve deterministically';
  end if;
end
$$;

do $$
declare
  v_returned uuid := '00000000-0000-4000-8000-000000000002';
  v_cancelled uuid := '00000000-0000-4000-8000-000000000003';
begin
  insert into public.visit_plans(id, status)
  values
    (v_returned, 'pending_supervision'),
    (v_cancelled, 'pending_supervision');

  insert into public.planning_supervision_requests(id, visit_plan_id, visit_id, status)
  values
    ('10000000-0000-4000-8000-000000000003', v_returned, '20000000-0000-4000-8000-000000000003', 'pending'),
    ('10000000-0000-4000-8000-000000000004', v_returned, '20000000-0000-4000-8000-000000000004', 'pending'),
    ('10000000-0000-4000-8000-000000000005', v_cancelled, '20000000-0000-4000-8000-000000000005', 'pending'),
    ('10000000-0000-4000-8000-000000000006', v_cancelled, '20000000-0000-4000-8000-000000000006', 'pending');

  update public.planning_supervision_requests
  set status = 'returned'
  where id = '10000000-0000-4000-8000-000000000003';
  update public.planning_supervision_requests
  set status = 'rejected'
  where id = '10000000-0000-4000-8000-000000000004';

  if (select status from public.visit_plans where id = v_returned) <> 'returned' then
    raise exception 'JM-VIS-AC-003: returned plus rejected aggregate is incorrect';
  end if;

  update public.planning_supervision_requests
  set status = 'rejected'
  where visit_plan_id = v_cancelled;

  if (select status from public.visit_plans where id = v_cancelled) <> 'cancelled' then
    raise exception 'JM-VIS-AC-003: all-rejected aggregate is incorrect';
  end if;
end
$$;

do $$
declare
  v_atomic_plan uuid := '00000000-0000-4000-8000-000000000004';
begin
  begin
    insert into public.visit_plans(id, status)
    values (v_atomic_plan, 'pending_supervision');
    insert into public.planning_supervision_requests(id, visit_plan_id, visit_id, status)
    values
      ('10000000-0000-4000-8000-000000000007', v_atomic_plan, '20000000-0000-4000-8000-000000000007', 'pending'),
      ('10000000-0000-4000-8000-000000000008', v_atomic_plan, '20000000-0000-4000-8000-000000000007', 'pending');
    raise exception 'JM-VIS-AC-002: injected duplicate did not fail';
  exception
    when unique_violation then
      null;
  end;

  if exists (select 1 from public.visit_plans where id = v_atomic_plan)
     or exists (
       select 1 from public.planning_supervision_requests
       where visit_plan_id = v_atomic_plan
     ) then
    raise exception 'JM-VIS-AC-002: failed accepted subset left partial state';
  end if;
end
$$;

rollback;
