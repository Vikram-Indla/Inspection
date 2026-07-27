-- Non-pgTAP read-only coverage probe for
-- saqeel-demo-coverage-100plus-20260727.
\set ON_ERROR_STOP on

begin transaction read only;

create temporary table probe_visits on commit drop as
select v.*,f.factory_code,f.region,f.city,f.activity_class,f.risk_band
from public.visits v join public.factories f on f.id=v.factory_id
where v.notes like 'DEMO:saqeel-demo-coverage-100plus-20260727:%';

create temporary table probe_personas on commit drop as
select
  (select a.inspector_id from public.assignments a join probe_visits v on v.id=a.visit_id limit 1) own_inspector,
  (select ur.user_id from public.user_roles ur
    where ur.role_key='inspector'
      and ur.user_id<>(select a.inspector_id from public.assignments a join probe_visits v on v.id=a.visit_id limit 1)
    order by ur.user_id limit 1) other_inspector;
grant select on probe_visits,probe_personas to authenticated;

do $$
declare n integer;
begin
  select count(*) into n from probe_visits;
  if n<>92 then raise exception 'COVERAGE_VISITS:%',n; end if;
  select count(*) into n from public.assignments a join probe_visits v on v.id=a.visit_id;
  if n<>92 then raise exception 'COVERAGE_ASSIGNMENTS:%',n; end if;
  select count(*) into n from public.inspections i join probe_visits v on v.id=i.visit_id;
  if n<>68 then raise exception 'COVERAGE_INSPECTIONS:%',n; end if;
  select count(*) into n from public.submission_versions
   where idempotency_key like 'saqeel-demo-coverage-100plus-20260727:submit:%';
  if n<>68 then raise exception 'COVERAGE_SUBMISSIONS:%',n; end if;
  select count(*) into n from public.reviews r join public.inspections i on i.id=r.inspection_id
   join probe_visits v on v.id=i.visit_id;
  if n<>68 then raise exception 'COVERAGE_REVIEWS:%',n; end if;
  select count(*) into n from public.checklist_responses cr join public.inspections i on i.id=cr.inspection_id
   join probe_visits v on v.id=i.visit_id where cr.is_complete;
  if n<>340 then raise exception 'COVERAGE_RESPONSES:%',n; end if;
end $$;

-- Persona/RLS proof uses the authenticated database role, not the owner role.
set local role authenticated;
select set_config('request.jwt.claim.sub',(select own_inspector::text from probe_personas),true);
do $$
declare n integer;
begin
  select count(*) into n from public.visits
    where id in(select id from probe_visits);
  if n<>92 then raise exception 'RLS_ASSIGNED_INSPECTOR_VISITS:%',n; end if;
end $$;
select set_config('request.jwt.claim.sub',(select other_inspector::text from probe_personas),true);
do $$
declare n integer;
begin
  if (select other_inspector from probe_personas) is null then
    raise exception 'RLS_SECOND_INSPECTOR_REQUIRED';
  end if;
  select count(*) into n from public.visits
    where id in(select id from probe_visits);
  if n<>0 then raise exception 'RLS_CROSS_INSPECTOR_LEAK:%',n; end if;
end $$;
reset role;

-- Five-city explorer: each city has ten approved inspections, fifty eligible
-- answers and both compliant/non-compliant outcomes.
with approved as (
  select i.id,f.factory_code,f.region,f.city,f.activity_class
  from public.inspections i join probe_visits f on f.id=i.visit_id
  join lateral (
    select r.status,r.decision from public.reviews r where r.inspection_id=i.id
    order by r.decided_at desc nulls first limit 1
  ) r on true
  where r.status='approved' or r.decision='approve'
), city as (
  select a.city,count(distinct a.id) inspections,count(*) filter(where cr.response->>'value' in ('compliant','non_compliant')) eligible,
    count(*) filter(where cr.response->>'value'='compliant') compliant,
    count(*) filter(where cr.response->>'value'='non_compliant') noncompliant
  from approved a join public.checklist_responses cr on cr.inspection_id=a.id
  group by a.city
)
select * from city order by city;

do $$
declare n integer;
begin
  with approved as (
    select i.id,v.city from public.inspections i join probe_visits v on v.id=i.visit_id
    join public.reviews r on r.inspection_id=i.id
    where r.status='approved'
  ), city as (
    select a.city,count(distinct a.id) inspections,
      count(*) filter(where cr.response->>'value' in('compliant','non_compliant')) eligible,
      count(*) filter(where cr.response->>'value'='compliant') c,
      count(*) filter(where cr.response->>'value'='non_compliant') nc
    from approved a join public.checklist_responses cr on cr.inspection_id=a.id group by a.city
  )
  select count(*) into n from city where inspections=10 and eligible=50 and c>0 and nc>0;
  if n<>5 then raise exception 'COVERAGE_CITY_LENSES:%',n; end if;
end $$;

-- Widget assertions.
select 'approved_reviews' widget,count(*) value from public.reviews r
 join public.inspections i on i.id=r.inspection_id join probe_visits v on v.id=i.visit_id where r.status='approved'
union all select 'returned_reviews',count(*) from public.reviews r join public.inspections i on i.id=r.inspection_id join probe_visits v on v.id=i.visit_id where r.status='returned'
union all select 'rejected_reviews',count(*) from public.reviews r join public.inspections i on i.id=r.inspection_id join probe_visits v on v.id=i.visit_id where r.status='rejected'
union all select 'pending_reviews',count(*) from public.reviews r join public.inspections i on i.id=r.inspection_id join probe_visits v on v.id=i.visit_id where r.status='under_review'
union all select 'risk_bands',count(distinct risk_band) from probe_visits where risk_band in('high','medium','low')
union all select 'regions',count(distinct region) from probe_visits
union all select 'sectors',count(distinct activity_class) from probe_visits
union all select 'authorities',count(distinct reg.issuing_authority) from public.checklist_responses cr
 join public.inspections i on i.id=cr.inspection_id join probe_visits v on v.id=i.visit_id
 join public.inspection_items it on it.id=cr.item_id join public.regulation_clauses rc on rc.id=it.clause_id
 join public.regulations reg on reg.id=rc.regulation_id
union all select 'violations',count(*) from public.violations x join public.inspections i on i.id=x.inspection_id join probe_visits v on v.id=i.visit_id
union all select 'actions',count(*) from public.action_forms x join public.inspections i on i.id=x.inspection_id join probe_visits v on v.id=i.visit_id
union all select 'evidence',count(*) from public.evidence x join public.inspections i on i.id=x.inspection_id join probe_visits v on v.id=i.visit_id
union all select 'geo',count(*) from public.geo_events x join probe_visits v on v.id=x.visit_id
union all select 'virtual',count(*) from public.virtual_sessions x join probe_visits v on v.id=x.visit_id
union all select 'audit',count(*) from public.audit_events x where x.object_id in(
 select id from probe_visits union select i.id from public.inspections i join probe_visits v on v.id=i.visit_id
);

do $$
declare n integer;
begin
  select count(*) into n from public.reviews r join public.inspections i on i.id=r.inspection_id
    join probe_visits v on v.id=i.visit_id where r.status='approved';
  if n<>50 then raise exception 'WIDGET_APPROVED_REVIEWS:%',n; end if;
  select count(*) into n from public.reviews r join public.inspections i on i.id=r.inspection_id
    join probe_visits v on v.id=i.visit_id where r.status='returned';
  if n<>6 then raise exception 'WIDGET_RETURNED_REVIEWS:%',n; end if;
  select count(*) into n from public.reviews r join public.inspections i on i.id=r.inspection_id
    join probe_visits v on v.id=i.visit_id where r.status='rejected';
  if n<>5 then raise exception 'WIDGET_REJECTED_REVIEWS:%',n; end if;
  select count(*) into n from public.reviews r join public.inspections i on i.id=r.inspection_id
    join probe_visits v on v.id=i.visit_id where r.status='under_review';
  if n<>7 then raise exception 'WIDGET_PENDING_REVIEWS:%',n; end if;
  select count(distinct risk_band) into n from probe_visits where risk_band in('high','medium','low');
  if n<>3 then raise exception 'WIDGET_RISK_BANDS:%',n; end if;
  select count(distinct region) into n from probe_visits;
  if n<3 then raise exception 'WIDGET_REGIONS:%',n; end if;
  select count(distinct activity_class) into n from probe_visits;
  if n<>5 then raise exception 'WIDGET_SECTORS:%',n; end if;
  select count(*) into n from probe_visits
    where window_start>='2026-07-27 00:00+00' and window_start<'2026-07-28 00:00+00';
  if n<>12 then raise exception 'WIDGET_TODAY_VISITS:%',n; end if;
  select count(*) into n from public.evidence x join public.inspections i on i.id=x.inspection_id
    join probe_visits v on v.id=i.visit_id;
  if n<>50 then raise exception 'WIDGET_EVIDENCE:%',n; end if;
  select count(*) into n from public.violations x join public.inspections i on i.id=x.inspection_id
    join probe_visits v on v.id=i.visit_id;
  if n<>30 then raise exception 'WIDGET_VIOLATIONS:%',n; end if;
  select count(*) into n from public.action_forms x join public.inspections i on i.id=x.inspection_id
    join probe_visits v on v.id=i.visit_id;
  if n<>30 then raise exception 'WIDGET_ACTIONS:%',n; end if;
  select count(*) into n from public.geo_events x join probe_visits v on v.id=x.visit_id;
  if n<>24 then raise exception 'WIDGET_GEO:%',n; end if;
  select count(*) into n from public.virtual_sessions x join probe_visits v on v.id=x.visit_id;
  if n<>8 then raise exception 'WIDGET_VIRTUAL:%',n; end if;
  select count(*) into n from public.audit_events x where x.object_id in(
    select id from probe_visits
    union select i.id from public.inspections i join probe_visits v on v.id=i.visit_id
    union select r.id from public.reviews r join public.inspections i on i.id=r.inspection_id join probe_visits v on v.id=i.visit_id
  );
  if n<136 then raise exception 'WIDGET_AUDIT:%',n; end if;
end $$;

-- Governed intentional blanks: these are assertions about absent authority,
-- not seed failures.
select 'annual_inspection_target' widget,'NOT_CONFIGURED' status,
 'Missing effective inspection_cycle_policy target/year/eligibility/exclusions' reason
union all select 'enforcement_action_trend','NOT_CONFIGURED','No governed official violation issue-date field'
union all select 'executive_ai_brief','OPEN_EXTERNAL','No configured evidence-linked AI provider output'
union all select 'senaei_provider_output','OPEN_EXTERNAL','Provider contract/configuration unavailable';

-- Rollback preview IDs. This is read-only and reports immutable residuals.
select 'mutable_visit' kind,id from probe_visits
union all select 'mutable_assignment',a.id from public.assignments a join probe_visits v on v.id=a.visit_id
union all select 'immutable_submission',s.id from public.submission_versions s
 where s.idempotency_key like 'saqeel-demo-coverage-100plus-20260727:submit:%'
union all select 'immutable_review',r.id from public.reviews r join public.inspections i on i.id=r.inspection_id
 join probe_visits v on v.id=i.visit_id
order by kind,id;

rollback;
