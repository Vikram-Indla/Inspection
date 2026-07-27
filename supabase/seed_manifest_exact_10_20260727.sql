-- PREPARED ONLY. Do not execute without Product Owner approval.
-- Source: approved Drive Seeder guide, clean factory codes only.
-- Grain: exactly 10 domain records = 1 bulk visit plan + 9 visits.
-- Runtime parameters (psql -v):
--   approved_planner_user_id=<approved test planner profile UUID>
--   approved_package_version_id=<explicit published+active+locked package UUID>
-- Deterministic read-only prerequisite selection (review the returned UUIDs,
-- then pass them explicitly through the two runtime parameters above):
--   select p.user_id::text as approved_planner_user_id
--   from public.profiles p
--   join public.user_roles ur on ur.user_id=p.user_id
--   where ur.role_key='planner' and p.email like '%@mim.gov.sa'
--   order by p.user_id limit 1;
--   select pv.id::text as approved_package_version_id
--   from public.package_versions pv
--   where pv.status='locked' and pv.published_at is not null
--     and pv.deactivation_reason is null
--     and coalesce(jsonb_array_length(coalesce(
--       pv.definition->'sections','[]'::jsonb
--     )),0)>0
--   order by pv.id limit 1;
-- PostgreSQL has no min(uuid); do not replace these ordered selections with
-- an untyped aggregate or infer either input inside the write transaction.
\set ON_ERROR_STOP on

begin;

select set_config('saqeel.seed_planner_user_id',:'approved_planner_user_id',true);
select set_config('saqeel.seed_package_version_id',:'approved_package_version_id',true);
select set_config('request.jwt.claim.sub',:'approved_planner_user_id',true);

create temporary table seed_exact_10_manifest (
  ordinal integer primary key,
  record_type text not null check (record_type in ('visit_plan','visit')),
  record_id uuid not null unique,
  factory_code text,
  window_start timestamptz,
  window_end timestamptz,
  synthetic_marker text not null unique
) on commit drop;

insert into seed_exact_10_manifest(
  ordinal,record_type,record_id,factory_code,window_start,window_end,synthetic_marker
) values
  (1,'visit_plan','7a100000-0000-4000-8000-000000000001',null,null,null,'SAQEEL-EXACT10-PLAN'),
  (2,'visit','7a100000-0000-4000-8000-000000000002','F-4402','2026-08-10 06:00+00','2026-08-10 10:00+00','SAQEEL-EXACT10-V01'),
  (3,'visit','7a100000-0000-4000-8000-000000000003','F-5502','2026-08-10 10:30+00','2026-08-10 14:30+00','SAQEEL-EXACT10-V02'),
  (4,'visit','7a100000-0000-4000-8000-000000000004','F-6601','2026-08-11 06:00+00','2026-08-11 10:00+00','SAQEEL-EXACT10-V03'),
  (5,'visit','7a100000-0000-4000-8000-000000000005','F-6602','2026-08-11 10:30+00','2026-08-11 14:30+00','SAQEEL-EXACT10-V04'),
  (6,'visit','7a100000-0000-4000-8000-000000000006','F-1104','2026-08-12 06:00+00','2026-08-12 10:00+00','SAQEEL-EXACT10-V05'),
  (7,'visit','7a100000-0000-4000-8000-000000000007','F-1105','2026-08-12 10:30+00','2026-08-12 14:30+00','SAQEEL-EXACT10-V06'),
  (8,'visit','7a100000-0000-4000-8000-000000000008','F-2202','2026-08-13 06:00+00','2026-08-13 10:00+00','SAQEEL-EXACT10-V07'),
  (9,'visit','7a100000-0000-4000-8000-000000000009','F-2203','2026-08-13 10:30+00','2026-08-13 14:30+00','SAQEEL-EXACT10-V08'),
  (10,'visit','7a100000-0000-4000-8000-000000000010','F-3304','2026-08-14 06:00+00','2026-08-14 10:00+00','SAQEEL-EXACT10-V09');

do $$
begin
  if (select count(*) from seed_exact_10_manifest) <> 10
     or (select count(*) from seed_exact_10_manifest where record_type='visit_plan') <> 1
     or (select count(*) from seed_exact_10_manifest where record_type='visit') <> 9
  then raise exception 'SEED_MANIFEST_CARDINALITY_INVALID'; end if;
  if (select count(*) from public.factories f
      join seed_exact_10_manifest m on m.factory_code=f.factory_code
      where m.record_type='visit') <> 9
  then raise exception 'SEED_APPROVED_FACTORY_SET_INCOMPLETE'; end if;
  if not exists(
    select 1 from public.profiles p
    join public.user_roles ur on ur.user_id=p.user_id and ur.role_key='planner'
    where p.user_id=current_setting('saqeel.seed_planner_user_id')::uuid
      and p.email like '%@mim.gov.sa'
  ) then raise exception 'SEED_APPROVED_TEST_PLANNER_INVALID'; end if;
  if not exists(
    select 1 from public.package_versions pv
    where pv.id=current_setting('saqeel.seed_package_version_id')::uuid
      and pv.status='locked' and pv.published_at is not null
      and pv.deactivation_reason is null
      and coalesce(jsonb_array_length(coalesce(pv.definition->'sections','[]'::jsonb)),0)>0
  ) then raise exception 'SEED_PACKAGE_NOT_PUBLISHED_ACTIVE_LOCKED'; end if;
  if not exists(
    select 1 from public.planning_lookups
    where kind='visit_type' and key='periodic' and is_active
  ) then raise exception 'SEED_VISIT_TYPE_NOT_GOVERNED'; end if;
end $$;

-- Idempotency is exact-payload, not ID-only. Any collision with a different
-- plan or visit fails before writes rather than overwriting business data.
do $$
begin
  if exists(
    select 1 from public.visit_plans vp
    where vp.id='7a100000-0000-4000-8000-000000000001'
      and (
        vp.method is distinct from 'bulk'
        or vp.status is distinct from 'published'
        or vp.created_by is distinct from current_setting('saqeel.seed_planner_user_id')::uuid
        or vp.criteria->>'seed_batch' is distinct from 'SAQEEL-EXACT10-20260727'
      )
  ) then raise exception 'SEED_PLAN_IDEMPOTENCY_CONFLICT'; end if;
  if exists(
    select 1
    from public.visits v
    join seed_exact_10_manifest m on m.record_id=v.id and m.record_type='visit'
    join public.factories f on f.factory_code=m.factory_code
    where v.visit_plan_id is distinct from '7a100000-0000-4000-8000-000000000001'
       or v.factory_id is distinct from f.id
       or v.visit_type is distinct from 'periodic'
       or v.execution_mode is distinct from 'physical'
       or v.planning_status is distinct from 'published'
       or v.operational_state is distinct from 'new'
       or v.window_start is distinct from m.window_start
       or v.window_end is distinct from m.window_end
       or v.package_version_id is distinct from current_setting('saqeel.seed_package_version_id')::uuid
       or v.notes is distinct from m.synthetic_marker
  ) then raise exception 'SEED_VISIT_IDEMPOTENCY_CONFLICT'; end if;
end $$;

-- Before count: must be either zero for first application or ten for an exact
-- replay. Any partial prior application is blocked.
select count(*) as seed_records_before
from (
  select id from public.visit_plans where id='7a100000-0000-4000-8000-000000000001'
  union all
  select v.id from public.visits v
  join seed_exact_10_manifest m on m.record_id=v.id and m.record_type='visit'
) existing;

do $$
declare existing_count integer;
begin
  select count(*) into existing_count from (
    select id from public.visit_plans where id='7a100000-0000-4000-8000-000000000001'
    union all
    select v.id from public.visits v
    join seed_exact_10_manifest m on m.record_id=v.id and m.record_type='visit'
  ) x;
  if existing_count not in (0,10) then
    raise exception 'SEED_PARTIAL_PRIOR_APPLICATION:%',existing_count;
  end if;
end $$;

insert into public.visit_plans(id,method,criteria,status,created_by,published_at)
select record_id,'bulk',jsonb_build_object(
  'seed_batch','SAQEEL-EXACT10-20260727',
  'classification','non_production_test',
  'source','approved_drive_seeders'
),'published',:'approved_planner_user_id'::uuid,'2026-07-27 00:00+00'
from seed_exact_10_manifest where record_type='visit_plan'
on conflict (id) do nothing;

insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end,package_version_id,notes,created_by
)
select m.record_id,'7a100000-0000-4000-8000-000000000001',f.id,
  'periodic','physical','published','new',m.window_start,m.window_end,
  :'approved_package_version_id'::uuid,m.synthetic_marker,
  :'approved_planner_user_id'::uuid
from seed_exact_10_manifest m
join public.factories f on f.factory_code=m.factory_code
where m.record_type='visit'
on conflict (id) do nothing;

-- After count must be exactly ten domain records. Audit rows generated by
-- canonical triggers are system evidence and are not additional seed records.
select count(*) as seed_records_after
from (
  select id from public.visit_plans where id='7a100000-0000-4000-8000-000000000001'
  union all
  select v.id from public.visits v
  join seed_exact_10_manifest m on m.record_id=v.id and m.record_type='visit'
) seeded
having count(*)=10;

do $$
declare seeded_count integer;
begin
  select count(*) into seeded_count from (
    select id from public.visit_plans where id='7a100000-0000-4000-8000-000000000001'
    union all
    select v.id from public.visits v
    join seed_exact_10_manifest m on m.record_id=v.id and m.record_type='visit'
  ) x;
  if seeded_count<>10 then raise exception 'SEED_AFTER_COUNT_INVALID:%',seeded_count; end if;
end $$;

commit;

-- Rollback identifiers and order (execute only under separate PO approval):
-- delete visits first, then the plan; triggers preserve deletion audit.
-- delete from public.visits where id in (
--   '7a100000-0000-4000-8000-000000000002','7a100000-0000-4000-8000-000000000003',
--   '7a100000-0000-4000-8000-000000000004','7a100000-0000-4000-8000-000000000005',
--   '7a100000-0000-4000-8000-000000000006','7a100000-0000-4000-8000-000000000007',
--   '7a100000-0000-4000-8000-000000000008','7a100000-0000-4000-8000-000000000009',
--   '7a100000-0000-4000-8000-000000000010'
-- );
-- delete from public.visit_plans where id='7a100000-0000-4000-8000-000000000001';
