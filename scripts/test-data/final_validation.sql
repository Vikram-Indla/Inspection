\set ON_ERROR_STOP on
\pset pager off

select 'auth_users' entity,count(*) from auth.users where email like '%@local.saqeel.test'
union all select 'profiles',count(*) from public.profiles where email like '%@local.saqeel.test'
union all select 'user_roles',count(*) from public.user_roles ur join public.profiles p on p.user_id=ur.user_id where p.email like '%@local.saqeel.test'
union all select 'factories',count(*) from public.factories where source='demo_seed:local-test-data-v1'
union all select 'licences',count(*) from public.industrial_licenses where source_system='demo_seed:local-test-data-v1'
union all select 'packages',count(*) from public.packages where code like 'TST-PKG-%'
union all select 'package_versions',count(*) from public.package_versions where package_id::text like '72000000-%'
union all select 'plans',count(*) from public.visit_plans where plan_reference like 'QA-PLAN-%'
union all select 'visits',count(*) from public.visits where visit_reference like 'QA-VISIT-%'
union all select 'assignments',count(*) from public.assignments where id::text like '76000000-%'
union all select 'inspections',count(*) from public.inspections where id::text like '77000000-%'
union all select 'responses',count(*) from public.checklist_responses where inspection_id::text like '77000000-%'
union all select 'findings',count(*) from public.findings where inspection_id::text like '77000000-%'
union all select 'evidence',count(*) from public.evidence where inspection_id::text like '77000000-%'
union all select 'submission_versions',count(*) from public.submission_versions where idempotency_key like 'local-test-data-v1-%'
union all select 'reviews',count(*) from public.reviews r join public.submission_versions s on s.id=r.submission_version_id where s.idempotency_key like 'local-test-data-v1-%'
order by entity;

select r.role_key role,count(*) from public.profiles p join public.user_roles ur on ur.user_id=p.user_id join public.roles r on r.role_key=ur.role_key where p.email like '%@local.saqeel.test' group by r.role_key order by r.role_key;
select i.inspection_no inspection,i.status inspection_status,v.visit_reference visit,v.operational_state from public.inspections i join public.visits v on v.id=i.visit_id where i.id::text like '77000000-%' order by i.inspection_no;
select s.idempotency_key,s.version_number,r.decision,r.status review_status from public.submission_versions s join public.reviews r on r.submission_version_id=s.id where s.idempotency_key like 'local-test-data-v1-%' order by s.idempotency_key;
select count(*) filter(where planner_lat between 16 and 33 and planner_lng between 34 and 56) valid_saudi_coordinates,count(*) total from public.visits where visit_reference like 'QA-VISIT-%';
select (select count(*) from public.assignments a left join public.visits v on v.id=a.visit_id where a.id::text like '76000000-%' and v.id is null)+(select count(*) from public.inspections i left join public.visits v on v.id=i.visit_id where i.id::text like '77000000-%' and v.id is null)+(select count(*) from public.submission_versions s left join public.inspections i on i.id=s.inspection_id where s.idempotency_key like 'local-test-data-v1-%' and i.id is null)+(select count(*) from public.reviews r left join public.submission_versions s on s.id=r.submission_version_id where r.submission_version_id in (select id from public.submission_versions where idempotency_key like 'local-test-data-v1-%') and s.id is null) as fk_orphans;
select count(*) filter(where encrypted_password=crypt('Password',encrypted_password)) password_matches,count(*) total from auth.users where email like '%@local.saqeel.test';
select count(*) filter(where raw_app_meta_data->>'role'=regexp_replace(split_part(email,'@',1),'[0-9]+$','')) app_role_matches,count(*) total from auth.users where email like '%@local.saqeel.test';
