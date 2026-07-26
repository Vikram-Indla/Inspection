-- CC-DEMO-ATOMIC-REVIEW-VIRTUAL-20260726-001
-- Transaction-wrapped contract proof. All fixtures and effects roll back.
begin;

-- The linked target already owns the canonical auth.uid() helper. Tests set
-- request.jwt.claim.sub below rather than replacing anything in the protected
-- auth schema.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Fixture construction is not the behavior under test. Disable triggers only
-- while constructing valid pre-transition rows, then restore them before every
-- RPC assertion.
set local session_replication_role = replica;
insert into auth.users(id,email) values
 ('34111111-1111-1111-1111-111111111111','atomic-planner@example.test'),
 ('34222222-2222-2222-2222-222222222222','atomic-inspector@example.test'),
 ('34333333-3333-3333-3333-333333333333','atomic-reviewer@example.test'),
 ('34444444-4444-4444-4444-444444444444','atomic-rep@example.test'),
 ('34555555-5555-5555-5555-555555555555','atomic-outsider@example.test');
insert into public.profiles(user_id,full_name,email) values
 ('34111111-1111-1111-1111-111111111111','Atomic Planner','atomic-planner@example.test'),
 ('34222222-2222-2222-2222-222222222222','Atomic Inspector','atomic-inspector@example.test'),
 ('34333333-3333-3333-3333-333333333333','Atomic Reviewer','atomic-reviewer@example.test'),
 ('34444444-4444-4444-4444-444444444444','ممثل المصنع التجريبي','atomic-rep@example.test'),
 ('34555555-5555-5555-5555-555555555555','Atomic Outsider','atomic-outsider@example.test');
insert into public.user_roles(user_id,role_key) values
 ('34111111-1111-1111-1111-111111111111','planner'),
 ('34222222-2222-2222-2222-222222222222','inspector'),
 ('34333333-3333-3333-3333-333333333333','reviewer'),
 ('34444444-4444-4444-4444-444444444444','factory_rep');
insert into public.factories(
 id,factory_code,name,source,official_lat,official_lng
) values (
 '34666666-6666-4666-8666-666666666666','ATOMIC-F1',
 'منشأة الاختبار الذري | Atomic Test Facility','contract-test',24.7,46.7
);
insert into public.packages(id,code,title,scope) values (
 '34777777-7777-4777-8777-777777777777','ATOMIC-PKG',
 'Atomic package | حزمة الاختبار','contract-test'
);
insert into public.package_versions(
 id,package_id,version_label,status,definition,published_at
) values (
 '34888888-8888-4888-8888-888888888888',
 '34777777-7777-4777-8777-777777777777','v1','published',
 '{"sections":[{"key":"s1","title":"Safety | السلامة","items":[]}]}'::jsonb,
 now()
);
insert into public.visit_plans(id,method,status,created_by,published_at) values
 ('34999999-9999-4999-8999-999999999999','single','published',
  '34111111-1111-1111-1111-111111111111',now());
insert into public.visits(
 id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
 operational_state,window_start,window_end,package_version_id
) values
 ('34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '34999999-9999-4999-8999-999999999999',
  '34666666-6666-4666-8666-666666666666','periodic','physical',
  'published','submitted',now()-interval '1 hour',now()+interval '1 hour',
  '34888888-8888-4888-8888-888888888888'),
 ('34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  '34999999-9999-4999-8999-999999999999',
  '34666666-6666-4666-8666-666666666666','complaint','physical',
  'published','submitted',now()-interval '1 hour',now()+interval '1 hour',
  '34888888-8888-4888-8888-888888888888'),
 ('34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  '34999999-9999-4999-8999-999999999999',
  '34666666-6666-4666-8666-666666666666','follow_up','virtual',
  'published','new',now(),now()+interval '2 days',
  '34888888-8888-4888-8888-888888888888');
insert into public.assignments(id,visit_id,inspector_id,method,status) values
 ('34bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '34222222-2222-2222-2222-222222222222','manual','ready'),
 ('34bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  '34222222-2222-2222-2222-222222222222','manual','ready'),
 ('34bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  '34222222-2222-2222-2222-222222222222','manual','assigned');
insert into public.inspections(
 id,visit_id,status,package_version_id,started_at,submitted_at
) values
 ('34cccccc-cccc-4ccc-8ccc-ccccccccccc1','34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'submitted','34888888-8888-4888-8888-888888888888',now()-interval '2 hours',now()),
 ('34cccccc-cccc-4ccc-8ccc-ccccccccccc2','34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'submitted','34888888-8888-4888-8888-888888888888',now()-interval '2 hours',now());
insert into public.submission_versions(
 id,inspection_id,version_number,snapshot,idempotency_key,submitted_by
) values
 ('34dddddd-dddd-4ddd-8ddd-ddddddddddd1','34cccccc-cccc-4ccc-8ccc-ccccccccccc1',
  1,'{"sections":{"s1":{}}}'::jsonb,'atomic-submit-1',
  '34222222-2222-2222-2222-222222222222'),
 ('34dddddd-dddd-4ddd-8ddd-ddddddddddd2','34cccccc-cccc-4ccc-8ccc-ccccccccccc2',
  1,'{"sections":{"s1":{}}}'::jsonb,'atomic-submit-2',
  '34222222-2222-2222-2222-222222222222');
set local session_replication_role = origin;

-- Review start + decision commit together.
set local role authenticated;
select set_config('request.jwt.claim.sub','34333333-3333-3333-3333-333333333333',true);
select public.start_review(
 '34cccccc-cccc-4ccc-8ccc-ccccccccccc1',
 '34dddddd-dddd-4ddd-8ddd-ddddddddddd1'
);
select public.decide_review(
 (select id from public.reviews
   where submission_version_id='34dddddd-dddd-4ddd-8ddd-ddddddddddd1'),
 'approve',null,null
);
do $$
begin
  if not exists (
    select 1 from public.inspections
     where id='34cccccc-cccc-4ccc-8ccc-ccccccccccc1' and status='approved'
  ) or not exists (
    select 1 from public.reviews
     where submission_version_id='34dddddd-dddd-4ddd-8ddd-ddddddddddd1'
       and status='approved' and decision='approve' and decided_at is not null
  ) then raise exception 'ATOMIC_ASSERT: approve did not transition both rows'; end if;
end $$;

-- Invalid returned scope rolls back without deciding either row.
select public.start_review(
 '34cccccc-cccc-4ccc-8ccc-ccccccccccc2',
 '34dddddd-dddd-4ddd-8ddd-ddddddddddd2'
);
do $$
begin
  begin
    perform public.decide_review(
      (select id from public.reviews
        where submission_version_id='34dddddd-dddd-4ddd-8ddd-ddddddddddd2'),
      'return','Reason supplied','["not-a-section"]'::jsonb
    );
    raise exception 'ATOMIC_ASSERT: invalid return scope accepted';
  exception when check_violation then null;
  end;
  if not exists (
    select 1 from public.inspections
     where id='34cccccc-cccc-4ccc-8ccc-ccccccccccc2'
       and status='under_review'
  ) then raise exception 'ATOMIC_ASSERT: failed decision partially transitioned inspection'; end if;
end $$;
reset role;

-- Atomic scheduling links the authenticated representative and both notices.
set local role authenticated;
select set_config('request.jwt.claim.sub','34111111-1111-1111-1111-111111111111',true);
select public.schedule_virtual_session(
 '34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
 now()+interval '1 day',
 '34444444-4444-4444-4444-444444444444',
 'ممثل المصنع التجريبي | Demo Factory Representative'
);
do $$
begin
  if (select count(*) from public.virtual_participants vp
       join public.virtual_sessions vs on vs.id=vp.session_id
      where vs.visit_id='34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3') <> 2
  then raise exception 'ATOMIC_ASSERT: participant pair missing'; end if;
  if not exists (
    select 1 from public.virtual_participants vp
    join public.virtual_sessions vs on vs.id=vp.session_id
     where vs.visit_id='34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
       and vp.user_id='34444444-4444-4444-4444-444444444444'
       and vp.role='factory_rep'
  ) then raise exception 'ATOMIC_ASSERT: representative ownership missing'; end if;
end $$;
reset role;

-- Own-session RLS: representative sees one; unrelated authenticated user none.
set local role authenticated;
select set_config('request.jwt.claim.sub','34444444-4444-4444-4444-444444444444',true);
do $$
begin
  if (select count(*) from public.virtual_sessions
       where visit_id='34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3') <> 1
  then raise exception 'ATOMIC_ASSERT: owner cannot read own session'; end if;
end $$;
select set_config('request.jwt.claim.sub','34555555-5555-5555-5555-555555555555',true);
do $$
begin
  if (select count(*) from public.virtual_sessions
       where visit_id='34aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3') <> 0
  then raise exception 'ATOMIC_ASSERT: unrelated user read representative session'; end if;
end $$;
reset role;

rollback;
