-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Analytics Phase 1 read model — metric expansion.
-- Replaces public.analytics_metric_snapshot with the identical signature,
-- security model, role list, region-scope rules and status-domain rules as
-- 20260727031932_analytics_read_models.sql. The eight metrics defined there are
-- reproduced with unchanged semantics; eighteen further governed aggregates are
-- added, all computed from tables that already carry records.
--
-- Conventions preserved verbatim:
--   * every row returns (metric_key, source_status, value, numerator,
--     denominator, breakdown, refreshed_at, unavailable_reason);
--   * a zero denominator yields a null value, never a fabricated 0;
--   * a role-gated source yields source_status 'unavailable' plus an
--     unavailable_reason, never a number;
--   * a metric whose data path flows through scoped_visits is a visit-domain
--     metric and yields 'not_applicable' when a review status is selected;
--   * a metric whose data path flows through selected_reviews is a review-domain
--     metric and yields 'not_applicable' when a visit status is selected;
--   * notification_delivery_rate and ai_suggestion_adoption_rate consume neither
--     status-filtered CTE — they are platform-scope aggregates carrying their own
--     period filter and their own RLS — so no status domain applies to them.
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
  v_can_read_evidence boolean;
  v_can_read_notifications boolean;
  v_status_domain text;
  v_visit_status text;
  v_review_status text;
  -- Metrics whose source is the review record itself. Unchanged for the four
  -- original keys; the three added review-domain rates join the same source.
  v_review_metrics text[] := array[
    'approved_inspection_compliance','latest_l2_decision_mix','compliance_result_distribution',
    'factory_approved_outcome_recency','review_return_rate','review_rejection_rate','review_turnaround_hours'
  ];
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
  -- Mirrors evidence RLS (evidence_visit_rw / evidence_rw): leadership holds no
  -- evidence read grant, so the count is declared unavailable rather than shown
  -- as a suppressed zero.
  v_can_read_evidence := public.has_any_role(array['planner','ops','reviewer','auditor']);
  -- Mirrors notifications RLS (notif_own): only ops reads beyond own recipient row.
  v_can_read_notifications := public.has_any_role(array['ops']);
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
  -- Added sources. Every one of them is scoped by the same scoped_visits CTE the
  -- original metrics use, so region, factory, method and visit-status filters and
  -- the underlying RLS apply identically.
  visit_stats as (
    select
      count(*)::bigint as visits,
      count(*) filter (where planning_status::text = 'published')::bigint as published,
      count(*) filter (where planning_status::text = 'expired')::bigint as expired,
      count(*) filter (where planning_status::text = 'draft')::bigint as draft,
      count(*) filter (where planning_method::text = 'immediate' or visit_plan_id is null)::bigint as immediate,
      count(distinct factory_id)::bigint as factories_visited
    from scoped_visits
  ),
  review_turnaround as (
    select
      count(*) filter (where lr.decided_at is not null and i.submitted_at is not null)::bigint as decided_reviews,
      avg(extract(epoch from (lr.decided_at - i.submitted_at)) / 3600.0)
        filter (where lr.decided_at is not null and i.submitted_at is not null) as avg_hours
    from selected_reviews lr
    join public.inspections i on i.id = lr.inspection_id
    join scoped_visits sv on sv.id = i.visit_id
  ),
  submission_count as (
    select count(*)::bigint as total
    from public.submission_versions s
    join public.inspections i on i.id = s.inspection_id
    join scoped_visits sv on sv.id = i.visit_id
  ),
  inspector_coverage_count as (
    select count(distinct a.inspector_id)::bigint as total
    from public.assignments a join scoped_visits sv on sv.id = a.visit_id
    where a.inspector_id is not null
  ),
  violation_count as (
    select
      count(*) filter (where vi.invalidated_at is null)::bigint as issued,
      count(*) filter (where vi.invalidated_at is not null)::bigint as invalidated
    from public.violations vi
    join public.inspections i on i.id = vi.inspection_id
    join scoped_visits sv on sv.id = i.visit_id
  ),
  penalty_count as (
    select
      count(*) filter (where ip.status = 'issued')::bigint as issued,
      count(*) filter (where ip.status <> 'issued')::bigint as other
    from public.inspection_penalties ip
    join public.inspections i on i.id = ip.inspection_id
    join scoped_visits sv on sv.id = i.visit_id
  ),
  evidence_count as (
    select count(*)::bigint as captured
    from public.evidence e
    left join public.inspections i on i.id = e.inspection_id
    join scoped_visits sv on sv.id = coalesce(e.visit_id, i.visit_id)
    where e.deleted_at is null
  ),
  geofence_arrivals as (
    select
      count(*) filter (where ge.geofence_result::text = 'inside')::bigint as inside,
      count(*) filter (where ge.geofence_result::text = 'outside')::bigint as outside,
      count(*) filter (where ge.geofence_result::text = 'uncertain')::bigint as uncertain
    from public.geo_events ge
    join scoped_visits sv on sv.id = ge.visit_id
    where ge.kind::text in ('arrival','checkin')
  ),
  factory_risk as (
    select
      count(distinct f.id) filter (where f.risk_band in ('high','critical'))::bigint as high,
      count(distinct f.id) filter (where f.risk_band is not null)::bigint as banded,
      count(distinct f.id) filter (where f.risk_band is null)::bigint as unbanded
    from public.factories f
    join scoped_visits sv on sv.factory_id = f.id
  ),
  notification_stats as (
    select
      count(*) filter (where n.delivery_state in ('delivered','read'))::bigint as delivered,
      count(*) filter (where n.delivery_state in ('delivered','read','queued','failed'))::bigint as attempted,
      count(*) filter (where n.delivery_state = 'queued')::bigint as queued,
      count(*) filter (where n.delivery_state = 'failed')::bigint as failed,
      count(*) filter (where n.delivery_state = 'not_configured')::bigint as not_configured
    from public.notifications n
    where n.created_at >= p_period_from and n.created_at <= p_period_to
  ),
  ai_stats as (
    select
      count(*) filter (where s.disposition in ('accepted','applied'))::bigint as adopted,
      count(*) filter (where s.disposition in ('accepted','applied','rejected'))::bigint as disposed,
      count(*) filter (where s.disposition = 'rejected')::bigint as rejected,
      count(*) filter (where s.disposition is null or s.disposition = 'proposed')::bigint as proposed
    from public.ai_suggestions s
    where s.created_at >= p_period_from and s.created_at <= p_period_to
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

    -- Visit-domain additions.
    union all select 'visit_volume',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else vs.visits::numeric end,
      case when v_status_domain = 'review' then null else vs.visits end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'published_visit_count',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else vs.published::numeric end,
      case when v_status_domain = 'review' then null else vs.published end,
      case when v_status_domain = 'review' then null else vs.visits end, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'expired_visit_rate',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' or vs.visits = 0 then null else round(vs.expired::numeric * 100 / vs.visits, 1) end,
      case when v_status_domain = 'review' then null else vs.expired end,
      case when v_status_domain = 'review' then null else vs.visits end, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'draft_backlog_count',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else vs.draft::numeric end,
      case when v_status_domain = 'review' then null else vs.draft end,
      case when v_status_domain = 'review' then null else vs.visits end, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'immediate_visit_share',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' or vs.visits = 0 then null else round(vs.immediate::numeric * 100 / vs.visits, 1) end,
      case when v_status_domain = 'review' then null else vs.immediate end,
      case when v_status_domain = 'review' then null else vs.visits end, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'factory_coverage',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else vs.factories_visited::numeric end,
      case when v_status_domain = 'review' then null else vs.factories_visited end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from visit_stats vs
    union all select 'high_risk_factory_share',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' or fr.banded = 0 then null else round(fr.high::numeric * 100 / fr.banded, 1) end,
      case when v_status_domain = 'review' then null else fr.high end,
      case when v_status_domain = 'review' then null else fr.banded end,
      case when v_status_domain = 'review' then null else jsonb_build_object('high', fr.high, 'banded', fr.banded, 'unbanded', fr.unbanded) end,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from factory_risk fr
    union all select 'submission_throughput',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else s.total::numeric end,
      case when v_status_domain = 'review' then null else s.total end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from submission_count s
    union all select 'violation_issue_count',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else vc.issued::numeric end,
      case when v_status_domain = 'review' then null else vc.issued end,
      null::bigint,
      case when v_status_domain = 'review' then null else jsonb_build_object('issued', vc.issued, 'invalidated', vc.invalidated) end,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from violation_count vc
    union all select 'penalty_issue_count',
      case when v_status_domain = 'review' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'review' then null else pc.issued::numeric end,
      case when v_status_domain = 'review' then null else pc.issued end,
      null::bigint,
      case when v_status_domain = 'review' then null else jsonb_build_object('issued', pc.issued, 'other_status', pc.other) end,
      case when v_status_domain = 'review' then 'status_domain_visit_metric' else null end from penalty_count pc
    union all select 'evidence_capture_count',
      case when v_status_domain = 'review' then 'not_applicable'
        when v_can_read_evidence then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'review' and v_can_read_evidence then ec.captured::numeric else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_evidence then ec.captured else null end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric'
        when v_can_read_evidence then null else 'evidence_role_scope' end from evidence_count ec
    union all select 'inspector_coverage',
      case when v_status_domain = 'review' then 'not_applicable'
        when v_can_read_assignments then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'review' and v_can_read_assignments then ic.total::numeric else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_assignments then ic.total else null end,
      null::bigint, null::jsonb,
      case when v_status_domain = 'review' then 'status_domain_visit_metric'
        when v_can_read_assignments then null else 'assignments_role_scope' end from inspector_coverage_count ic
    union all select 'geofence_arrival_compliance',
      case when v_status_domain = 'review' then 'not_applicable'
        when v_can_read_geo then 'ok' else 'unavailable' end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo and ga.inside + ga.outside > 0
        then round(ga.inside::numeric * 100 / (ga.inside + ga.outside), 1) else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo then ga.inside else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo then ga.inside + ga.outside else null end,
      case when v_status_domain is distinct from 'review' and v_can_read_geo
        then jsonb_build_object('inside', ga.inside, 'outside', ga.outside, 'uncertain', ga.uncertain) else null end,
      case when v_status_domain = 'review' then 'status_domain_visit_metric'
        when v_can_read_geo then null else 'geo_events_role_scope' end from geofence_arrivals ga

    -- Review-domain additions.
    union all select 'review_return_rate',
      case when v_status_domain = 'visit' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'visit' or d.approved + d.returned + d.rejected = 0 then null
        else round(d.returned::numeric * 100 / (d.approved + d.returned + d.rejected), 1) end,
      case when v_status_domain = 'visit' then null else d.returned end,
      case when v_status_domain = 'visit' then null else d.approved + d.returned + d.rejected end, null::jsonb,
      case when v_status_domain = 'visit' then 'status_domain_review_metric' else null end from decisions d
    union all select 'review_rejection_rate',
      case when v_status_domain = 'visit' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'visit' or d.approved + d.returned + d.rejected = 0 then null
        else round(d.rejected::numeric * 100 / (d.approved + d.returned + d.rejected), 1) end,
      case when v_status_domain = 'visit' then null else d.rejected end,
      case when v_status_domain = 'visit' then null else d.approved + d.returned + d.rejected end, null::jsonb,
      case when v_status_domain = 'visit' then 'status_domain_review_metric' else null end from decisions d
    union all select 'review_turnaround_hours',
      case when v_status_domain = 'visit' then 'not_applicable' else 'ok' end,
      case when v_status_domain = 'visit' or rt.decided_reviews = 0 then null else round(rt.avg_hours, 1) end,
      null::bigint,
      case when v_status_domain = 'visit' then null else rt.decided_reviews end,
      case when v_status_domain = 'visit' then null else jsonb_build_object('decided_reviews', rt.decided_reviews) end,
      case when v_status_domain = 'visit' then 'status_domain_review_metric' else null end from review_turnaround rt

    -- Platform-scope additions. Neither status domain applies: these sources are
    -- period-filtered and RLS-filtered in their own right and never join a
    -- status-filtered CTE.
    union all select 'notification_delivery_rate',
      case when v_can_read_notifications then 'ok' else 'unavailable' end,
      case when v_can_read_notifications and n.attempted > 0 then round(n.delivered::numeric * 100 / n.attempted, 1) else null end,
      case when v_can_read_notifications then n.delivered else null end,
      case when v_can_read_notifications then n.attempted else null end,
      case when v_can_read_notifications then jsonb_build_object('delivered', n.delivered, 'queued', n.queued, 'failed', n.failed, 'not_configured', n.not_configured) else null end,
      case when v_can_read_notifications then null else 'notifications_role_scope' end from notification_stats n
    union all select 'ai_suggestion_adoption_rate', 'ok',
      case when a.disposed = 0 then null else round(a.adopted::numeric * 100 / a.disposed, 1) end,
      a.adopted, a.disposed,
      jsonb_build_object('adopted', a.adopted, 'rejected', a.rejected, 'awaiting_disposition', a.proposed),
      null::text from ai_stats a
  )
  select c.metric_key,
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
      then 'unavailable' else c.source_status end,
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
      then null else c.value end,
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
      then null else c.numerator end,
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
      then null else c.denominator end,
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
      then null else c.breakdown end,
    statement_timestamp(),
    case when not v_can_read_reviews and c.metric_key = any(v_review_metrics)
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
is 'AN-AC-004..018 proposed child traces. SECURITY INVOKER aggregate read; underlying RLS remains authoritative. Twenty-six governed metric rows.';
