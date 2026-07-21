-- TASK-G11-REMEDIATION-PERFORMANCE-001 · Tier C / K-011
-- Additive, RLS-preserving global search consolidation. The function is
-- SECURITY INVOKER (the default) and therefore returns exactly the rows the
-- caller could read through the prior twelve PostgREST queries.

create extension if not exists pg_trgm;

-- Tier-A inventory reconciliation: this was the one mandated hot column not
-- present in either prior line's additive migration.
create index concurrently if not exists visits_operational_state_idx
  on public.visits (operational_state);

create index concurrently if not exists commercial_registrations_cr_number_trgm_idx
  on public.commercial_registrations using gin (cr_number gin_trgm_ops);
create index concurrently if not exists commercial_registrations_unified_number_trgm_idx
  on public.commercial_registrations using gin (unified_number gin_trgm_ops);
create index concurrently if not exists commercial_registrations_legal_name_en_trgm_idx
  on public.commercial_registrations using gin (legal_name_en gin_trgm_ops);
create index concurrently if not exists commercial_registrations_legal_name_ar_trgm_idx
  on public.commercial_registrations using gin (legal_name_ar gin_trgm_ops);
create index concurrently if not exists industrial_licenses_license_number_trgm_idx
  on public.industrial_licenses using gin (license_number gin_trgm_ops);
create index concurrently if not exists industrial_licenses_plant_number_trgm_idx
  on public.industrial_licenses using gin (plant_number gin_trgm_ops);
create index concurrently if not exists factories_name_trgm_idx
  on public.factories using gin (name gin_trgm_ops);
create index concurrently if not exists factories_factory_code_trgm_idx
  on public.factories using gin (factory_code gin_trgm_ops);
create index concurrently if not exists factories_cr_number_trgm_idx
  on public.factories using gin (cr_number gin_trgm_ops);
create index concurrently if not exists factories_license_number_trgm_idx
  on public.factories using gin (license_number gin_trgm_ops);
create index concurrently if not exists visits_visit_type_trgm_idx
  on public.visits using gin (visit_type gin_trgm_ops);
create index concurrently if not exists inspections_inspection_no_trgm_idx
  on public.inspections using gin (inspection_no gin_trgm_ops);

create or replace function public.shell_global_search(p_query text, p_limit integer default 12)
returns table(id uuid, result_type text, label text, detail text, href text)
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select '%' || left(btrim(p_query), 80) || '%' as pattern,
           greatest(1, least(coalesce(p_limit, 12), 25)) as row_limit
  ), candidates as (
    select cr.id, 'commercial_registration'::text as result_type,
           coalesce(cr.legal_name_en, cr.legal_name_ar, cr.legal_name, cr.cr_number) as label,
           concat_ws(' · ', cr.cr_number, cr.unified_number, cr.status) as detail,
           '/factories/cr/' || cr.id::text as href, 1 as priority
      from public.commercial_registrations cr, bounds b
     where cr.cr_number ilike b.pattern or cr.unified_number ilike b.pattern
        or cr.legal_name_en ilike b.pattern or cr.legal_name_ar ilike b.pattern
    union all
    select il.id, case when il.plant_number is null then 'industrial_license' else 'plant' end,
           il.license_number,
           concat_ws(' · ', il.plant_number, il.license_type, il.status),
           case when il.commercial_registration_id is not null
             then '/factories/cr/' || il.commercial_registration_id::text || '?license=' || il.id::text
             else '/factories/' || il.factory_id::text end,
           2
      from public.industrial_licenses il, bounds b
     where il.license_number ilike b.pattern or il.plant_number ilike b.pattern
    union all
    select f.id, 'factory', f.name,
           concat_ws(' · ', f.factory_code, f.region, f.city),
           '/factories/' || f.id::text, 3
      from public.factories f, bounds b
     where f.name ilike b.pattern or f.factory_code ilike b.pattern
        or f.cr_number ilike b.pattern or f.license_number ilike b.pattern
    union all
    select v.id, 'visit', coalesce(f.name, left(v.id::text, 8)),
           concat_ws(' · ', f.factory_code, v.visit_type, v.planning_status),
           '/visits/' || v.id::text, 4
      from public.visits v left join public.factories f on f.id = v.factory_id, bounds b
     where v.visit_type ilike b.pattern
    union all
    select i.id, 'inspection', coalesce(i.inspection_no, left(i.id::text, 8)),
           concat_ws(' · ', f.name, f.factory_code, i.status),
           '/field/inspection/' || i.id::text, 5
      from public.inspections i
      join public.visits v on v.id = i.visit_id
      left join public.factories f on f.id = v.factory_id, bounds b
     where i.inspection_no ilike b.pattern
  )
  select c.id, c.result_type, c.label, c.detail, c.href
    from candidates c, bounds b
   order by c.priority, c.label, c.id
   limit (select row_limit from bounds);
$$;

revoke all on function public.shell_global_search(text, integer) from public;
grant execute on function public.shell_global_search(text, integer) to authenticated;

-- K-003 — RLS-invoker grouped headline aggregation. Detail rows used by the
-- governed drill-down panels remain separate, but scalar cards and the
-- violation-by-regulation chart no longer require browser/server-JS grouping.
create or replace function public.dashboard_grouped_metrics(
  p_from timestamptz,
  p_to timestamptz,
  p_previous_from timestamptz,
  p_region text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped_visits as (
    select v.* from public.visits v
    join public.factories f on f.id = v.factory_id
    where v.window_start between p_from and p_to
      and (nullif(p_region, '') is null or f.region = p_region)
  ), scoped_inspections as (
    select i.* from public.inspections i
    join public.visits v on v.id = i.visit_id
    join public.factories f on f.id = v.factory_id
    where i.submitted_at between p_from and p_to
      and (nullif(p_region, '') is null or f.region = p_region)
  ), previous_inspections as (
    select i.id from public.inspections i
    join public.visits v on v.id = i.visit_id
    join public.factories f on f.id = v.factory_id
    where i.submitted_at >= p_previous_from and i.submitted_at < p_from
      and (nullif(p_region, '') is null or f.region = p_region)
  ), answers as (
    select cr.response->>'value' as value
      from public.checklist_responses cr
     where cr.inspection_id in (select id from scoped_inspections)
       and cr.is_complete
  ), violation_groups as (
    select coalesce(r.title, 'Unlinked regulation') as label, count(*)::integer as value
      from public.violations v
      join public.violation_codes vc on vc.id = v.violation_code_id
      left join public.regulation_clauses rc on rc.id = vc.clause_id
      left join public.regulations r on r.id = rc.regulation_id
     where v.inspection_id in (select id from scoped_inspections)
     group by coalesce(r.title, 'Unlinked regulation')
  )
  select jsonb_build_object(
    'completed_inspections', (select count(*) from scoped_inspections),
    'compliant', (select count(*) from answers where value = 'compliant'),
    'non_compliant', (select count(*) from answers where value = 'non_compliant'),
    'violations', (select count(*) from public.violations where inspection_id in (select id from scoped_inspections)),
    'previous_violations', (select count(*) from public.violations where inspection_id in (select id from previous_inspections)),
    'violation_by_regulation', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value) order by value desc, label) from violation_groups), '[]'::jsonb),
    'planned_visits', (select count(*) from scoped_visits where planning_status = 'published'),
    'completed_visits', (select count(*) from scoped_visits where operational_state = 'submitted'),
    'cancelled_visits', (select count(*) from scoped_visits where planning_status = 'cancelled'),
    'active_field', (
      select count(*) from public.inspections i
      join public.visits v on v.id = i.visit_id
      join public.factories f on f.id = v.factory_id
      where i.status = 'in_progress' and v.window_start between p_from and p_to
        and (nullif(p_region, '') is null or f.region = p_region)
    )
  );
$$;

revoke all on function public.dashboard_grouped_metrics(timestamptz, timestamptz, timestamptz, text) from public;
grant execute on function public.dashboard_grouped_metrics(timestamptz, timestamptz, timestamptz, text) to authenticated;
