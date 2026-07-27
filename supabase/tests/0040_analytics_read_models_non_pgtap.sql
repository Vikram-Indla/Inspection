-- Non-pgTAP transactional equivalent of 0038_analytics_read_models.sql.
-- Exactly 31 assertions. Every fixture and helper is rolled back.
begin;

create or replace function pg_temp.assert_true(p_ok boolean,p_label text)
returns void language plpgsql set search_path='' as $$
begin
  if p_ok is distinct from true then
    raise exception 'ASSERTION_FAILED:%',p_label;
  end if;
end $$;

create or replace function pg_temp.assert_throws(
  p_sql text,p_expected_state text,p_expected_message text,p_label text
) returns void language plpgsql set search_path='' as $$
declare actual_state text; actual_message text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics actual_state=returned_sqlstate,actual_message=message_text;
    if actual_state=p_expected_state and actual_message=p_expected_message then return; end if;
    raise exception 'ASSERTION_FAILED:% expected %/% got %/%',
      p_label,p_expected_state,p_expected_message,actual_state,actual_message;
  end;
  raise exception 'ASSERTION_FAILED:% expected exception %/%',
    p_label,p_expected_state,p_expected_message;
end $$;

-- 01..15: catalog, grant, volatility, and source-security equivalence.
select pg_temp.assert_true(
  to_regprocedure('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)') is not null,
  '01 aggregate RPC exists');
select pg_temp.assert_true(
  not has_function_privilege('anon','public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)','EXECUTE'),
  '02 anonymous has no execute');
select pg_temp.assert_true(
  has_function_privilege('authenticated','public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)','EXECUTE'),
  '03 authenticated may invoke');
select pg_temp.assert_true(
  (select l.lanname='plpgsql' from pg_proc p join pg_language l on l.oid=p.prolang
   where p.oid='public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '04 function is plpgsql');
select pg_temp.assert_true(
  (select prorettype='record'::regtype from pg_proc
   where oid='public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '05 function returns bounded aggregate records');
select pg_temp.assert_true(
  (select not prosecdef from pg_proc
   where oid='public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '06 function is not SECURITY DEFINER');
select pg_temp.assert_true(
  (select provolatile='s' from pg_proc
   where oid='public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '07 aggregate RPC is stable');
select pg_temp.assert_true(
  (select proconfig::text like '%search_path=%' from pg_proc
   where oid='public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '08 function pins search_path');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    like '%ANALYTICS_INVALID_PERIOD%','09 rejects inverted period');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    like '%ANALYTICS_INVALID_METHOD%','10 rejects ungoverned methods');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    like '%ANALYTICS_INVALID_GROUP%','11 rejects raw grouping');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    like '%ANALYTICS_INVALID_STATUS%','12 rejects ungoverned statuses');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    not ilike '%service_role%','13 contains no service-role path');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    like '%ANALYTICS_REGION_SCOPE_DENIED%','14 reproduces region isolation');
select pg_temp.assert_true(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    not ilike '%array[''inspector''%','15 excludes pure-inspector access');

set local session_replication_role=replica;
insert into auth.users(id,email) values
('38000000-0000-0000-0000-000000000001','analytics-ops@test.invalid'),
('38000000-0000-0000-0000-000000000002','analytics-lead@test.invalid'),
('38000000-0000-0000-0000-000000000003','analytics-planner@test.invalid');
insert into public.profiles(user_id,full_name,email,region) values
('38000000-0000-0000-0000-000000000001','Analytics Ops','analytics-ops@test.invalid','PROBE-ANALYTICS-380'),
('38000000-0000-0000-0000-000000000002','Analytics Lead','analytics-lead@test.invalid',null),
('38000000-0000-0000-0000-000000000003','Analytics Planner','analytics-planner@test.invalid','PROBE-ANALYTICS-380');
insert into public.user_roles(user_id,role_key) values
('38000000-0000-0000-0000-000000000001','ops'),
('38000000-0000-0000-0000-000000000002','leadership'),
('38000000-0000-0000-0000-000000000003','planner');
insert into public.factories(id,factory_code,name,region) values
('38000000-0000-0000-0000-000000000010','AN-PROBE-380','Analytics Probe Factory','PROBE-ANALYTICS-380');
insert into public.visit_plans(id,method,status,created_by) values
('38000000-0000-0000-0000-000000000020','bulk','published','38000000-0000-0000-0000-000000000001');
insert into public.packages(id,code,title) values
('38000000-0000-0000-0000-000000000030','AN-PKG','Analytics package');
insert into public.package_versions(id,package_id,version_label,status,definition) values
('38000000-0000-0000-0000-000000000031','38000000-0000-0000-0000-000000000030','1','published','{}');
insert into public.inspection_items(id,code,title,response_model) values
('38000000-0000-0000-0000-000000000032','AN-I1','One','{}'),
('38000000-0000-0000-0000-000000000033','AN-I2','Two','{}'),
('38000000-0000-0000-0000-000000000034','AN-I3','Three','{}');
insert into public.visits(id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,window_start,window_end,package_version_id) values
('38000000-0000-0000-0000-000000000040','38000000-0000-0000-0000-000000000020','38000000-0000-0000-0000-000000000010','routine','physical','cancelled','new','2026-07-10','2026-07-11','38000000-0000-0000-0000-000000000031'),
('38000000-0000-0000-0000-000000000041',null,'38000000-0000-0000-0000-000000000010','immediate','physical','published','executing','2026-07-12','2026-07-13','38000000-0000-0000-0000-000000000031');
insert into public.assignments(id,visit_id,inspector_id,method) values
('38000000-0000-0000-0000-000000000050','38000000-0000-0000-0000-000000000041','38000000-0000-0000-0000-000000000001','manual');
insert into public.inspections(id,visit_id,status,package_version_id,submitted_at) values
('38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000040','submitted','38000000-0000-0000-0000-000000000031','2026-07-10'),
('38000000-0000-0000-0000-000000000061','38000000-0000-0000-0000-000000000041','submitted','38000000-0000-0000-0000-000000000031','2026-07-12');
insert into public.submission_versions(id,inspection_id,version_number,snapshot,submitted_by,submitted_at) values
('38000000-0000-0000-0000-000000000070','38000000-0000-0000-0000-000000000060',1,'{}','38000000-0000-0000-0000-000000000001','2026-07-10'),
('38000000-0000-0000-0000-000000000071','38000000-0000-0000-0000-000000000061',1,'{}','38000000-0000-0000-0000-000000000001','2026-07-12');
insert into public.reviews(id,inspection_id,submission_version_id,reviewer_id,status,decision,decided_at) values
('38000000-0000-0000-0000-000000000080','38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000070','38000000-0000-0000-0000-000000000001','returned','return','2026-07-11'),
('38000000-0000-0000-0000-000000000081','38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000070','38000000-0000-0000-0000-000000000001','approved','approve','2026-07-13'),
('38000000-0000-0000-0000-000000000082','38000000-0000-0000-0000-000000000061','38000000-0000-0000-0000-000000000071','38000000-0000-0000-0000-000000000001','returned','return','2026-07-14');
insert into public.checklist_responses(id,inspection_id,item_id,response,is_complete) values
('38000000-0000-0000-0000-000000000090','38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000032','{"value":"compliant"}',true),
('38000000-0000-0000-0000-000000000091','38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000033','{"value":"non_compliant"}',true),
('38000000-0000-0000-0000-000000000092','38000000-0000-0000-0000-000000000060','38000000-0000-0000-0000-000000000034','{"value":"na"}',true);
set local session_replication_role=origin;
set local role authenticated;
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000001',true);

-- 16..31: behavioral and data-truth equivalence.
select pg_temp.assert_throws(
  $$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31','Eastern')$$,
  '42501','ANALYTICS_REGION_SCOPE_DENIED','16 region denial is explicit');
select pg_temp.assert_true(
  (select value from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,'immediate')
   where metric_key='active_executions') is not distinct from 1::numeric,
  '17 planless immediate is included');
select pg_temp.assert_true(
  (select count(*) from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'decision'))=1,
  '18 decision grouping has one row');
select pg_temp.assert_true(
  (select metric_key from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'decision'))
    ='latest_l2_decision_mix','19 decision grouping output');
select pg_temp.assert_true(
  (select metric_key from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'compliance_result'))
    ='compliance_result_distribution','20 compliance grouping output');
select pg_temp.assert_true(
  (select row(numerator,denominator,value) is not distinct from row(1::bigint,2::bigint,50.0::numeric)
   from public.analytics_metric_snapshot('2026-07-01','2026-07-31')
   where metric_key='approved_inspection_compliance'),'21 compliance formula exact');
select pg_temp.assert_true(
  (select row(numerator,denominator,value) is not distinct from row(0::bigint,0::bigint,null::numeric)
   from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,'38000000-0000-0000-0000-000000000041')
   where metric_key='approved_inspection_compliance'),'22 zero denominator is N/A');
select pg_temp.assert_true(
  (select source_status from public.analytics_metric_snapshot(
    '2026-07-01','2026-07-31',null,null,null,null,'none',null,'returned')
   where metric_key='cancellation_rate')='not_applicable',
  '23 review status does not filter visit metrics');
select pg_temp.assert_true(
  (select row(source_status,denominator,value) is not distinct from row('ok'::text,0::bigint,null::numeric)
   from public.analytics_metric_snapshot(
    '2026-07-01','2026-07-31',null,null,null,null,'none','returned',null)
   where metric_key='cancellation_rate'),'24 visit returned remains visit-domain');
select pg_temp.assert_true(
  (select breakdown->>'returned' from public.analytics_metric_snapshot(
    '2026-07-01','2026-07-31',null,null,null,null,'none',null,'returned')
   where metric_key='latest_l2_decision_mix')='1','25 latest review precedes filter');
select pg_temp.assert_true(
  (select source_status from public.analytics_metric_snapshot(
    '2026-07-01','2026-07-31',null,null,null,'cancelled')
   where metric_key='latest_l2_decision_mix')='not_applicable',
  '26 visit status does not filter review metrics');
select pg_temp.assert_true(
  (select array_agg(metric_key) from public.analytics_metric_snapshot('2026-07-01','2026-07-31'))
  =(select array_agg(metric_key order by metric_key) from public.analytics_metric_snapshot('2026-07-01','2026-07-31')),
  '27 metric order deterministic');
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000002',true);
select pg_temp.assert_true(
  (select row(source_status,value) is not distinct from row('unavailable'::text,null::numeric)
   from public.analytics_metric_snapshot('2026-07-01','2026-07-31')
   where metric_key='scheduled_load_count'),'28 leadership assignment is not false zero');
select pg_temp.assert_throws(
  $$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,'returned')$$,
  '22023','ANALYTICS_AMBIGUOUS_STATUS','29 legacy returned fails closed');
select pg_temp.assert_throws(
  $$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,'under_review')$$,
  '22023','ANALYTICS_AMBIGUOUS_STATUS','30 legacy under_review fails closed');
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000003',true);
select pg_temp.assert_true(
  (select row(source_status,value) is not distinct from row('unavailable'::text,null::numeric)
   from public.analytics_metric_snapshot('2026-07-01','2026-07-31')
   where metric_key='latest_l2_decision_mix'),'31 planner review RLS is not false zero');

rollback;
