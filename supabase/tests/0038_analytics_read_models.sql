begin;
select plan(31);

select has_function('public', 'analytics_metric_snapshot',
  array['timestamp with time zone','timestamp with time zone','text','uuid','text','text','text','text','text'],
  'AN-AC-032 aggregate RPC exists');
select function_privs_are('public', 'analytics_metric_snapshot',
  array['timestamp with time zone','timestamp with time zone','text','uuid','text','text','text','text','text'],
  'anon', array[]::text[], 'anonymous has no execute');
select function_privs_are('public', 'analytics_metric_snapshot',
  array['timestamp with time zone','timestamp with time zone','text','uuid','text','text','text','text','text'],
  'authenticated', array['EXECUTE'], 'authenticated may invoke');
select function_lang_is('public', 'analytics_metric_snapshot',
  array['timestamp with time zone','timestamp with time zone','text','uuid','text','text','text','text','text'],
  'plpgsql', 'function is plpgsql');
select function_returns('public', 'analytics_metric_snapshot',
  array['timestamp with time zone','timestamp with time zone','text','uuid','text','text','text','text','text'],
  'record', 'function returns bounded aggregate records');

select isnt(prosecdef, true, 'AN-AC-014 function is not SECURITY DEFINER')
from pg_proc where oid = 'public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure;
select is(provolatile, 's', 'aggregate RPC is stable')
from pg_proc where oid = 'public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure;
select like(proconfig::text, '%search_path=%', 'function pins search_path')
from pg_proc where oid = 'public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure;

select like(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%ANALYTICS_INVALID_PERIOD%', 'AN-AC-011 rejects inverted period');
select like(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%ANALYTICS_INVALID_METHOD%', 'AN-AC-011 rejects ungoverned methods');
select like(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%ANALYTICS_INVALID_GROUP%', 'AN-AC-011 rejects raw grouping');
select like(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%ANALYTICS_INVALID_STATUS%', 'AN-AC-011 rejects ungoverned statuses');
select ok(
  pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure)
    not ilike '%service_role%',
  'AN-AC-014 contains no service-role path');
select like(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%ANALYTICS_REGION_SCOPE_DENIED%', 'AN-AC-016 reproduces region isolation');
select unlike(pg_get_functiondef('public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)'::regprocedure),
  '%array[''inspector''%', 'AN-AC-003 excludes pure-inspector access');

set local session_replication_role = replica;
insert into auth.users(id,email) values
('38000000-0000-0000-0000-000000000001','analytics-ops@test.invalid'),
('38000000-0000-0000-0000-000000000002','analytics-lead@test.invalid'),
('38000000-0000-0000-0000-000000000003','analytics-planner@test.invalid');
insert into public.profiles(user_id,full_name,email,region) values
('38000000-0000-0000-0000-000000000001','Analytics Ops','analytics-ops@test.invalid','Riyadh'),
('38000000-0000-0000-0000-000000000002','Analytics Lead','analytics-lead@test.invalid',null),
('38000000-0000-0000-0000-000000000003','Analytics Planner','analytics-planner@test.invalid','Riyadh');
insert into public.user_roles(user_id,role_key) values
('38000000-0000-0000-0000-000000000001','ops'),
('38000000-0000-0000-0000-000000000002','leadership'),
('38000000-0000-0000-0000-000000000003','planner');
insert into public.factories(id,factory_code,name,region) values
('38000000-0000-0000-0000-000000000010','AN-RUH','Analytics Riyadh','Riyadh');
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
set local session_replication_role = origin;
set local role authenticated;
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000001',true);

select throws_ok($$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31','Eastern')$$,
  '42501','ANALYTICS_REGION_SCOPE_DENIED','region denial is explicit');
select is((select value from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,'immediate') where metric_key='active_executions'),1::numeric,'planless immediate is included');
select is((select count(*) from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'decision')),1::bigint,'decision grouping has a distinct one-row shape');
select is((select metric_key from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'decision')),'latest_l2_decision_mix','decision grouping returns decision output');
select is((select metric_key from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'compliance_result')),'compliance_result_distribution','compliance grouping returns compliance output');
select results_eq(
  $$select numerator,denominator,value from public.analytics_metric_snapshot('2026-07-01','2026-07-31') where metric_key='approved_inspection_compliance'$$,
  $$values(1::bigint,2::bigint,50.0::numeric)$$,'formula numerator denominator and exclusions are exact');
select results_eq(
  $$select numerator,denominator,value from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,'38000000-0000-0000-0000-000000000041') where metric_key='approved_inspection_compliance'$$,
  $$values(0::bigint,0::bigint,null::numeric)$$,'zero denominator is N/A');
select is((select source_status from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'none',null,'returned') where metric_key='cancellation_rate'),'not_applicable','review status does not filter visit metrics');
select results_eq(
  $$select source_status,denominator,value from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'none','returned',null) where metric_key='cancellation_rate'$$,
  $$values('ok'::text,0::bigint,null::numeric)$$,'visit returned remains visit-domain and is distinct from review returned');
select is((select breakdown->>'returned' from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,null,'none',null,'returned') where metric_key='latest_l2_decision_mix'),'1','latest review is selected before returned filter');
select is((select source_status from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,'cancelled') where metric_key='latest_l2_decision_mix'),'not_applicable','visit status does not filter review metrics');
select is((select array_agg(metric_key) from public.analytics_metric_snapshot('2026-07-01','2026-07-31')),(select array_agg(metric_key order by metric_key) from public.analytics_metric_snapshot('2026-07-01','2026-07-31')),'metric order is deterministic');
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000002',true);
select results_eq(
  $$select source_status,value from public.analytics_metric_snapshot('2026-07-01','2026-07-31') where metric_key='scheduled_load_count'$$,
  $$values('unavailable'::text,null::numeric)$$,'leadership assignment RLS is not a silent zero');
select throws_ok($$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,'returned')$$,
  '22023','ANALYTICS_AMBIGUOUS_STATUS','ambiguous legacy returned fails closed');
select throws_ok($$select * from public.analytics_metric_snapshot('2026-07-01','2026-07-31',null,null,null,'under_review')$$,
  '22023','ANALYTICS_AMBIGUOUS_STATUS','ambiguous legacy under_review fails closed');
select set_config('request.jwt.claim.sub','38000000-0000-0000-0000-000000000003',true);
select results_eq(
  $$select source_status,value from public.analytics_metric_snapshot('2026-07-01','2026-07-31') where metric_key='latest_l2_decision_mix'$$,
  $$values('unavailable'::text,null::numeric)$$,'planner review RLS is not a false zero');

select * from finish();
rollback;
