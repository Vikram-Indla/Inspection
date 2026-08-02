\set ON_ERROR_STOP on
\pset pager off

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select count(*) as inspector1_own_assignments from public.assignments where inspector_id='a4000000-0000-4000-8000-000000000001';
select count(*) as inspector1_cross_assignments from public.assignments where inspector_id='a4000000-0000-4000-8000-000000000002';
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select array_agg(role_key order by role_key) as multi_role_grants from public.user_roles where user_id='a5000000-0000-4000-8000-000000000001';
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select count(*) as no_workspace_role_grants from public.user_roles where user_id='a6000000-0000-4000-8000-000000000001';
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claim.role','authenticated',true);
select count(*) as supervisor4_cohort4_reviews from public.reviews where inspection_id='77000000-0000-4000-8000-000000000004';
select count(*) as supervisor4_capability_wide_reviews from public.reviews where inspection_id='77000000-0000-4000-8000-000000000005';
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select count(*) as planner1_own_region_visits from public.visits where id='75000000-0000-4000-8000-000000000001';
select count(*) as planner1_cross_region_visits from public.visits where id='75000000-0000-4000-8000-000000000002';
rollback;
