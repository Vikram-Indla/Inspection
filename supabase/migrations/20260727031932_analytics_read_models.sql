-- Analytics Phase 1 read model.
-- Proposed child traces: AN-REQ-001..028 / AN-AC-001..038.
-- Canonical evidence: dashboard KPI registry, DEC-042, existing table RLS.
-- No workflow writes, service-role reads, cache, view, or SECURITY DEFINER.

create or replace function public.analytics_metric_snapshot(
  p_period_from timestamptz,
  p_period_to timestamptz,
  p_region text default null,
  p_factory_id uuid default null,
  p_method text default null,
  p_status text default null,
  p_group_by text default 'none',
  p_visit_status text default null,
  p_review_status text default null
)
returns table (
  metric_key text,
  source_status text,
  value numeric,
  numerator bigint,
  denominator bigint,
  breakdown jsonb,
  refreshed_at timestamptz,
  unavailable_reason text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_region text;
  v_is_national boolean;
  v_can_read_compliance boolean;
  v_can_read_assignments boolean;
  v_can_read_geo boolean;
  v_can_read_reviews boolean;
  v_status_domain text;
  v_visit_status text;
  v_review_status text;
begin
  if v_uid is null then raise exception 'ANALYTICS_AUTH_REQUIRED' using errcode = '42501'; end if;
  if not public.has_any_role(array['leadership','ops','planner','reviewer','auditor']) then
    raise exception 'ANALYTICS_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if p_period_from is null or p_period_to is null or p_period_from > p_period_to then
    raise exception 'ANALYTICS_INVALID_PERIOD' using errcode = '22007';
  end if;
  if p_method is not null and p_method not in ('bulk','single','immediate') then
    raise exception 'ANALYTICS_INVALID_METHOD' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in (
    'draft','published','returned','cancelled','expired',
    'new','prepared','on_the_way','arrived','executing','submitted','under_review',
    'pending_review','approved','rejected'
  ) then
    raise exception 'ANALYTICS_INVALID_STATUS' using errcode = '22023';
  end if;
  if p_status in ('returned','under_review') then
    raise exception 'ANALYTICS_AMBIGUOUS_STATUS' using errcode = '22023';
  end if;
  if p_status is not null and (p_visit_status is not null or p_review_status is not null) then
    raise exception 'ANALYTICS_STATUS_CONFLICT' using errcode = '22023';
  end if;
  if p_visit_status is not null and p_visit_status not in ('draft','published','returned','cancelled','expired','new','prepared','on_the_way','arrived','executing','submitted','under_review') then
    raise exception 'ANALYTICS_INVALID_VISIT_STATUS' using errcode = '22023';
  end if;
  if p_review_status is not null and p_review_status not in ('pending_review','under_review','approved','returned','rejected') then
    raise exception 'ANALYTICS_INVALID_REVIEW_STATUS' using errcode = '22023';
  end if;
  if p_group_by not in ('none','decision','compliance_result') then
    raise exception 'ANALYTICS_INVALID_GROUP' using errcode = '22023';
  end if;

  select p.region into v_region from public.profiles p where p.user_id = v_uid;
  v_is_national := public.has_any_role(array['leadership','auditor']);
  v_can_read_compliance := public.has_any_role(array['leadership','ops','reviewer','auditor']);
  v_can_read_assignments := public.has_any_role(array['planner','ops','reviewer','auditor']);
  v_can_read_geo := public.has_any_role(array['ops','reviewer','auditor']);
  v_can_read_reviews := public.has_any_role(array['leadership','ops','reviewer','auditor']);
  v_status_domain := case
    when p_review_status is not null then 'review'
    when p_visit_status is not null then 'visit'
    when p_status in ('pending_review','under_review','approved','returned','rejected') then 'review'
    when p_status is null then null
    else 'visit'
  end;
  v_visit_status := coalesce(p_visit_status, case when v_status_domain = 'visit' then p_status end);
  v_review_status := coalesce(p_review_status, case when v_status_domain = 'review' then p_status end);
  if not v_is_national and v_region is null then
    raise exception 'ANALYTICS_REGION_SCOPE_UNCONFIGURED' using errcode = '42501';
  end if;
  if not v_is_national and p_region is not null and p_region <> v_region then
    raise exception 'ANALYTICS_REGION_SCOPE_DENIED' using errcode = '42501';
  end if;

  return query
  with
  scoped_visits as (
    select v.*, vp.method as planning_method
    from public.visits v
    join public.factories f on f.id = v.factory_id
    left join public.visit_plans vp on vp.id = v.visit_plan_id
    where v.window_start >= p_period_from and v.window_start <= p_period_to
      and (p_factory_id is null or v.factory_id = p_factory_id)
      and (coalesce(p_region, case when v_is_national then null else v_region end) is null
        or f.region = coalesce(p_region, v_region))
      and (p_method is null
        or (p_method = 'immediate' and (vp.method::text = 'immediate' or v.visit_plan_id is null))
        or (p_method <> 'immediate' and vp.method::text = p_method))
      and (v_visit_status is null or v.planning_status::text = v_visit_status or v.operational_state::text = v_visit_status)
  ),
  latest_review as (
    select distinct on (r.inspection_id)
      r.inspection_id, r.status::text as status, lower(coalesce(r.decision, '')) as decision, r.decided_at
    from public.reviews r
    order by r.inspection_id, r.decided_at desc nulls last, r.id desc
  ),
  selected_reviews as (
    select *
    from latest_review lr
    where v_review_status is null or lr.status = v_review_status
  ),
  approved_inspections as (
    select i.id, i.visit_id, sv.factory_id, lr.decided_at
    from public.inspections i
    join scoped_visits sv on sv.id = i.visit_id
    join selected_reviews lr on lr.inspection_id = i.id
    where lr.status = 'approved' or lr.decision in ('approve','approved')
  ),
  compliance as (
    select
      count(*) filter (where cr.is_complete and cr.response->>'value' = 'compliant')::bigint as compliant,
      count(*) filter (where cr.is_complete and cr.response->>'value' = 'non_compliant')::bigint as non_compliant
    from public.checklist_responses cr
    join approved_inspections ai on ai.id = cr.inspection_id
  ),
  decisions as (
    select
      count(*) filter (where lr.status = 'approved' or lr.decision in ('approve','approved'))::bigint as approved,
      count(*) filter (where lr.status = 'returned' or lr.decision in ('return','returned'))::bigint as returned,
      count(*) filter (where lr.status = 'rejected' or lr.decision in ('reject','rejected'))::bigint as rejected
    from selected_reviews lr
    join public.inspections i on i.id = lr.inspection_id
    join scoped_visits sv on sv.id = i.visit_id
  ),
  counts as (
    select
      count(*)::bigint as visits,
      count(*) filter (where planning_status::text = 'cancelled')::bigint as cancelled,
      count(*) filter (where operational_state::text in ('on_the_way','arrived','executing'))::bigint as active
    from scoped_visits
  ),
  assignment_count as (
    select count(*)::bigint as total from public.assignments a join scoped_visits sv on sv.id = a.visit_id
  ),
  override_count as (
    select count(*)::bigint as total
    from public.geo_events ge join scoped_visits sv on sv.id = ge.visit_id
    where ge.kind::text = 'override' or ge.geofence_result::text = 'override'
  ),
  recency as (
    select count(distinct factory_id)::bigint as factories,
      max(latest_approved_at) as latest_approved_at
    from (
      select factory_id, max(decided_at) as latest_approved_at
      from approved_inspections group by factory_id
    ) x
  ),
  configured(metric_key, source_status, value, numerator, denominator, breakdown, unavailable_reason) as (
    select 'approved_inspection_compliance'::text,
      case when v_status_domain = 'visit' then 'not_applicable'
        when v_can_read_compliance then 'ok' else 'unavailable' end::text,
      case when v_status_domain = 'visit' or not v_can_read_compliance or c.compliant + c.non_compliant = 0 then null
        else round(c.compliant::numeric * 100 / (c.compliant + c.non_compliant), 1) end,
      case when v_status_domain is distinct from 'visit' and v_can_read_compliance then c.compliant else null end,
      case when v_status_domain is distinct from 'visit' and v_can_read_compliance then c.compliant + c.non_compliant else null end,
      case when v_status_domain is distinct from 'visit' and v_can_read_compliance then jsonb_build_object('compliant', c.compliant, 'non_compliant', c.non_compliant) else null end,
      case when v_status_domain = 'visit' then 'status_domain_review_metric'
        when v_can_read_compliance then null else 'checklist_responses_role_scope' end::text
    from compliance c
    union all select 'latest_l2_decision_mix',
      case when v_status_domain = 'visit' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'visit' then null else (d.approved + d.returned + d.rejected)::numeric end,
      null::bigint, case when v_status_domain = 'visit' then null else d.approved + d.returned + d.rejected end,
      case when v_status_domain = 'visit' then null else jsonb_build_object('approved', d.approved, 'returned', d.returned, 'rejected', d.rejected) end,
      case when v_status_domain = 'visit' then 'status_domain_review_metric' else null end from decisions d
    union all select 'cancellation_rate',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' or c.visits = 0 then null else round(c.cancelled::numeric * 100 / c.visits, 1) end,
      case when v_status_domain = 'review' then null else c.cancelled end,
      case when v_status_domain = 'review' then null else c.visits end, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from counts c
    union all select 'active_executions',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else c.active::numeric end,
      case when v_status_domain = 'review' then null else c.active end, null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from counts c
    union all select 'scheduled_load_count',
      case when v_status_domain = 'review' then 'not_applicable'
        when v_can_read_assignments then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'review' and v_can_read_assignments then a.total::numeric else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_assignments then a.total else null end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric'
        when v_can_read_assignments then null else 'assignments_role_scope' end from assignment_count a
    union all select 'gps_override_count',
      case when v_status_domain = 'review' then 'not_applicable'
        when v_can_read_geo then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo then o.total::numeric else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo then o.total else null end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric'
        when v_can_read_geo then null else 'geo_events_role_scope' end from override_count o
    union all select 'compliance_result_distribution',
      case when v_status_domain = 'visit' then 'not_applicable'
        when v_can_read_compliance then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'visit' and v_can_read_compliance then (c.compliant + c.non_compliant)::numeric else null end,
      null::bigint, case when v_status_domain is distinct from 'visit' and v_can_read_compliance then c.compliant + c.non_compliant else null end,
      case when v_status_domain is distinct from 'visit' and v_can_read_compliance then jsonb_build_object('compliant', c.compliant, 'non_compliant', c.non_compliant) else null end,
      case when v_status_domain = 'visit' then 'status_domain_review_metric'
        when v_can_read_compliance then null else 'checklist_responses_role_scope' end from compliance c
    union all select 'factory_approved_outcome_recency',
      case when v_status_domain = 'visit' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'visit' then null else r.factories::numeric end,
      case when v_status_domain = 'visit' then null else r.factories end,
      null::bigint, case when v_status_domain = 'visit' then null else jsonb_build_object('latest_approved_at', r.latest_approved_at) end,
      case when v_status_domain = 'visit' then 'status_domain_review_metric' else null end from recency r
  )
  select c.metric_key,
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then 'unavailable' else c.source_status end,
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then null else c.value end,
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then null else c.numerator end,
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then null else c.denominator end,
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then null else c.breakdown end,
    statement_timestamp(),
    case when not v_can_read_reviews and c.metric_key in ('approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution','factory_approved_outcome_recency')
      then 'reviews_role_scope' else c.unavailable_reason end
  from configured c
  where p_group_by = 'none'
     or (p_group_by = 'decision' and c.metric_key = 'latest_l2_decision_mix')
     or (p_group_by = 'compliance_result' and c.metric_key = 'compliance_result_distribution')
  order by c.metric_key;
end;
$$;

revoke all on function public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text) from public, anon;
grant execute on function public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text) to authenticated;

comment on function public.analytics_metric_snapshot(timestamptz,timestamptz,text,uuid,text,text,text,text,text)
is 'AN-AC-004..018 proposed child traces. SECURITY INVOKER aggregate read; underlying RLS remains authoritative.';
