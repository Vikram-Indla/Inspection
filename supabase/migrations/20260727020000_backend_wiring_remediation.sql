-- SAQEEL cross-cutting backend wiring remediation.
-- DEC-032; STM-REV-001..003; DEF-WF-006; M02-006/008;
-- CR-449..CR-478 / WA-AC-0449..WA-AC-0478;
-- MVP2-REQ-0032..0033.
--
-- Forward-only. No policy value, SLA duration, risk weight or retention value
-- is supplied here. Every public mutation is authenticated, role-guarded,
-- row-locked, atomic with its audit event, and fails closed.

-- ---------------------------------------------------------------------------
-- 1. DEC-032: remove search_path dependence from the submission snapshot hash.
-- ---------------------------------------------------------------------------
create or replace function public.capture_inspection_factory_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  captured jsonb;
  captured_factory_id uuid;
  captured_cr_id uuid;
  captured_license_id uuid;
begin
  select
    v.factory_id,
    il.commercial_registration_id,
    il.id,
    jsonb_build_object(
      'factory_code', f.factory_code,
      'factory_name', f.name,
      'cr_number', cr.cr_number,
      'unified_number', cr.unified_number,
      'industrial_license_number', il.license_number,
      'plant_number', il.plant_number,
      'license_status', il.status,
      'region', f.region,
      'city', f.city,
      'official_lat', f.official_lat,
      'official_lng', f.official_lng,
      'source_system', coalesce(il.source_system, f.source),
      'source_synced_at', coalesce(il.source_synced_at, f.source_synced_at),
      'inspection_observation', coalesce(
        new.snapshot -> 'factory_information',
        new.snapshot -> 'factory_observation',
        new.snapshot -> 'inspection_observation',
        '{}'::jsonb
      )
    )
  into captured_factory_id, captured_cr_id, captured_license_id, captured
  from public.inspections i
  join public.visits v on v.id = i.visit_id
  join public.factories f on f.id = v.factory_id
  left join public.industrial_licenses il on il.factory_id = f.id
  left join public.commercial_registrations cr
    on cr.id = il.commercial_registration_id
  where i.id = new.inspection_id;

  if captured_factory_id is not null then
    insert into public.inspection_factory_snapshots (
      submission_version_id, factory_id, commercial_registration_id,
      industrial_license_id, snapshot, snapshot_sha256
    ) values (
      new.id, captured_factory_id, captured_cr_id, captured_license_id,
      captured,
      encode(extensions.digest(convert_to(captured::text, 'UTF8'), 'sha256'), 'hex')
    )
    on conflict (submission_version_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.capture_inspection_factory_snapshot()
  from public, anon, authenticated;

-- Approval must still target the latest frozen submission while the review and
-- inspection locks are held. This complements, rather than replaces, the
-- absolute submission_versions update/delete guard.
create or replace function public.review_latest_submission_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.decision = 'approve' and (
    new.submission_version_id is distinct from old.submission_version_id
    or new.inspection_id is distinct from old.inspection_id
    or not exists (
      select 1
      from public.submission_versions sv
      where sv.id = new.submission_version_id
        and sv.inspection_id = new.inspection_id
        and sv.version_number = (
          select max(latest.version_number)
          from public.submission_versions latest
          where latest.inspection_id = new.inspection_id
        )
    )
  ) then
    raise check_violation using message = 'REVIEW-DECIDE-LATEST-SUBMISSION';
  end if;
  return new;
end $$;
drop trigger if exists trg_review_latest_submission_guard on public.reviews;
create trigger trg_review_latest_submission_guard
before update on public.reviews
for each row execute function public.review_latest_submission_guard();
revoke all on function public.review_latest_submission_guard()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Planning: one all-or-nothing operation for published/unstarted visits.
-- ---------------------------------------------------------------------------
create or replace function public.publish_bulk_plan_atomic(
  p_factory_ids uuid[],
  p_package_version_ids uuid[],
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_visit_type text,
  p_priority text,
  p_notes text,
  p_manual jsonb,
  p_auto_pool uuid[]
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan uuid;
  v_actor uuid := auth.uid();
  v_package_ids uuid[];
  v_package uuid;
begin
  select array_agg(distinct id order by id) into v_package_ids
  from unnest(coalesce(p_package_version_ids, '{}'::uuid[])) id;
  if coalesce(array_length(v_package_ids, 1), 0)
     <> coalesce(array_length(p_package_version_ids, 1), 0)
     or coalesce(array_length(v_package_ids, 1), 0) > 20 then
    raise invalid_parameter_value using message = 'PLANNING-PUBLISH-PACKAGES';
  end if;
  if exists (
    select 1 from unnest(coalesce(v_package_ids, '{}'::uuid[])) package_id
    where not exists (
      select 1 from public.package_versions pv
      where pv.id = package_id
        and pv.status in ('published','locked')
        and (pv.effective_from is null or pv.effective_from <= current_date)
        and (pv.effective_to is null or pv.effective_to >= current_date)
    )
  ) then
    raise invalid_parameter_value using message = 'PLANNING-PUBLISH-PACKAGE';
  end if;
  if p_priority is not null and not exists (
    select 1 from public.planning_lookups
    where kind = 'priority' and key = p_priority and is_active
  ) then
    raise invalid_parameter_value using message = 'PLANNING-PUBLISH-PRIORITY';
  end if;

  -- The existing guarded publisher executes in this same transaction. Any
  -- package-link, snapshot, priority or audit failure below rolls back its
  -- plan, visits, assignments, transitions and notifications as well.
  v_plan := public.publish_bulk_plan(
    p_factory_ids,
    case when coalesce(array_length(v_package_ids, 1), 0) > 0
      then v_package_ids[1] else null end,
    p_window_start,
    p_window_end,
    p_visit_type,
    p_notes,
    p_manual,
    p_auto_pool
  );

  if p_priority is not null then
    update public.visits set priority = p_priority
    where visit_plan_id = v_plan;
  end if;
  foreach v_package in array coalesce(v_package_ids, '{}'::uuid[]) loop
    insert into public.visit_packages(
      visit_id, package_version_id, snapshot, added_by
    )
    select
      visit.id,
      pv.id,
      jsonb_build_object(
        'package_version_id', pv.id,
        'code', package.code,
        'title', package.title,
        'version_label', pv.version_label,
        'status', pv.status,
        'captured_at', now()
      ),
      v_actor
    from public.visits visit
    join public.package_versions pv on pv.id = v_package
    join public.packages package on package.id = pv.package_id
    where visit.visit_plan_id = v_plan;
  end loop;
  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'visit_plans', v_plan, 'BULK_PLAN_PUBLISHED_ATOMIC',
    jsonb_build_object(
      'package_version_ids', to_jsonb(coalesce(v_package_ids, '{}'::uuid[])),
      'priority', p_priority
    ),
    array['M01-002','M01-005','M01-029','M02-006','M02-008','PLN-CON-003','PLN-CON-007']
  );
  return v_plan;
end $$;
revoke all on function public.publish_bulk_plan_atomic(
  uuid[], uuid[], timestamptz, timestamptz, text, text, text, jsonb, uuid[]
) from public, anon;
grant execute on function public.publish_bulk_plan_atomic(
  uuid[], uuid[], timestamptz, timestamptz, text, text, text, jsonb, uuid[]
) to authenticated;

create table if not exists public.planning_bulk_mutation_receipts (
  idempotency_key text primary key,
  actor uuid not null references public.profiles(user_id),
  correlation_id uuid not null,
  request_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.planning_bulk_mutation_receipts enable row level security;
revoke all on public.planning_bulk_mutation_receipts from public, anon;
grant select on public.planning_bulk_mutation_receipts to authenticated;
drop policy if exists planning_bulk_receipts_own
  on public.planning_bulk_mutation_receipts;
create policy planning_bulk_receipts_own
on public.planning_bulk_mutation_receipts for select to authenticated
using (actor = (select auth.uid()));

create or replace function public.bulk_update_published_visits(
  p_visit_ids uuid[],
  p_priority text default null,
  p_package_version_id uuid default null,
  p_set_package boolean default false,
  p_reason text default null,
  p_idempotency_key text default null,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_ids uuid[];
  v_hash text;
  v_result jsonb;
  v_count integer;
begin
  if v_actor is null
     or not (
       public.has_role('planner')
       or public.has_planning_capability('planning.publish')
     ) then
    raise insufficient_privilege using message = 'PLANNING-BULK-DENIED';
  end if;
  if p_visit_ids is null or coalesce(array_length(p_visit_ids, 1), 0) = 0
     or array_length(p_visit_ids, 1) > 500 then
    raise invalid_parameter_value using message = 'PLANNING-BULK-TARGETS';
  end if;
  select array_agg(distinct id order by id) into v_ids
  from unnest(p_visit_ids) id;
  if array_length(v_ids, 1) <> array_length(p_visit_ids, 1) then
    raise invalid_parameter_value using message = 'PLANNING-BULK-DUPLICATES';
  end if;
  if p_priority is null and not p_set_package then
    raise invalid_parameter_value using message = 'PLANNING-BULK-NO-CHANGE';
  end if;
  if p_priority is not null and not exists (
    select 1 from public.planning_lookups
    where kind = 'priority' and key = p_priority and is_active
  ) then
    raise invalid_parameter_value using message = 'PLANNING-BULK-PRIORITY';
  end if;
  if p_set_package and p_package_version_id is not null and not exists (
    select 1 from public.package_versions
    where id = p_package_version_id and status in ('published', 'locked')
  ) then
    raise invalid_parameter_value using message = 'PLANNING-BULK-PACKAGE';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise invalid_parameter_value using message = 'PLANNING-BULK-REASON';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then
    raise invalid_parameter_value using message = 'PLANNING-BULK-IDEMPOTENCY';
  end if;

  v_hash := encode(extensions.digest(
    convert_to(
      jsonb_build_object(
        'visit_ids', to_jsonb(v_ids),
        'priority', p_priority,
        'package_version_id', p_package_version_id,
        'set_package', p_set_package,
        'reason', btrim(p_reason)
      )::text,
      'UTF8'
    ),
    'sha256'
  ), 'hex');

  select result into v_result
  from public.planning_bulk_mutation_receipts
  where idempotency_key = p_idempotency_key
    and actor = v_actor
    and request_hash = v_hash;
  if found then return v_result; end if;
  if exists (
    select 1 from public.planning_bulk_mutation_receipts
    where idempotency_key = p_idempotency_key
  ) then
    raise unique_violation using message = 'PLANNING-BULK-IDEMPOTENCY-CONFLICT';
  end if;

  perform 1 from public.visits
  where id = any(v_ids)
  order by id for update;
  get diagnostics v_count = row_count;
  if v_count <> array_length(v_ids, 1) or exists (
    select 1 from public.visits v
    where v.id = any(v_ids)
      and (
        v.planning_status <> 'published'
        or exists (
          select 1 from public.inspections i
          where i.visit_id = v.id
            and i.status <> 'not_started'
        )
      )
  ) then
    raise check_violation using message = 'PLANNING-BULK-INELIGIBLE';
  end if;

  update public.visits
  set priority = coalesce(p_priority, priority),
      package_version_id = case
        when p_set_package then p_package_version_id
        else package_version_id
      end
  where id = any(v_ids);

  insert into public.audit_events(
    actor, object_type, action, after_state, requirement_refs
  ) values (
    v_actor, 'visits', 'bulk_update_published_visits',
    jsonb_build_object(
      'visit_ids', to_jsonb(v_ids),
      'priority', p_priority,
      'package_version_id', p_package_version_id,
      'set_package', p_set_package,
      'reason', btrim(p_reason),
      'correlation_id', p_correlation_id,
      'idempotency_key', p_idempotency_key
    ),
    array['M02-006','M02-008']
  );
  v_result := jsonb_build_object(
    'updated_count', v_count,
    'visit_ids', to_jsonb(v_ids),
    'correlation_id', p_correlation_id
  );
  insert into public.planning_bulk_mutation_receipts(
    idempotency_key, actor, correlation_id, request_hash, result
  ) values (
    p_idempotency_key, v_actor, p_correlation_id, v_hash, v_result
  );
  return v_result;
end $$;
revoke all on function public.bulk_update_published_visits(
  uuid[], text, uuid, boolean, text, text, uuid
) from public, anon;
grant execute on function public.bulk_update_published_visits(
  uuid[], text, uuid, boolean, text, text, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. M6 compliance library: canonical operational heads and lifecycle.
-- ---------------------------------------------------------------------------
alter table public.compliance_entity_heads
  add column if not exists operational_status text not null default 'active'
    check (operational_status in ('scheduled','active','deactivated')),
  add column if not exists release_date date,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivation_reason text,
  add column if not exists lifecycle_correlation_id uuid;

create index if not exists compliance_heads_operational_idx
  on public.compliance_entity_heads(entity_kind, operational_status, release_date);

create or replace function public.ccr_set_head_operational_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_release date;
begin
  select coalesce(
    nullif(v.value_snapshot->>'release_date', '')::date,
    nullif(v.value_snapshot->>'effective_from', '')::date
  )
  into v_release
  from public.compliance_entity_versions v
  where v.id = new.current_version_id;
  new.release_date := v_release;
  if tg_op = 'INSERT' or new.current_version_id is distinct from old.current_version_id then
    new.operational_status := case
      when v_release is not null and v_release > current_date then 'scheduled'
      else 'active'
    end;
    new.deactivated_at := null;
    new.deactivation_reason := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_ccr_set_head_operational_state
  on public.compliance_entity_heads;
create trigger trg_ccr_set_head_operational_state
before insert or update of current_version_id
on public.compliance_entity_heads
for each row execute function public.ccr_set_head_operational_state();
revoke all on function public.ccr_set_head_operational_state()
  from public, anon, authenticated;

-- Existing heads predate the operational columns. Reconcile them from their
-- immutable current version without altering any version or historical record.
update public.compliance_entity_heads h
set release_date = coalesce(
      nullif(v.value_snapshot->>'release_date', '')::date,
      nullif(v.value_snapshot->>'effective_from', '')::date
    ),
    operational_status = case
      when coalesce(
        nullif(v.value_snapshot->>'release_date', '')::date,
        nullif(v.value_snapshot->>'effective_from', '')::date
      ) > current_date
        then 'scheduled'
      else 'active'
    end
from public.compliance_entity_versions v
where v.id = h.current_version_id
  and h.deactivated_at is null;

-- Permit only lifecycle fields to change on the legacy current regulation row.
-- Content remains immutable and must still use a governed successor.
create or replace function public.guard_published_regulation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.status in ('published','locked','deactivated') then
    raise exception 'IMMUTABLE: governed regulation % cannot be deleted', old.code;
  end if;
  if tg_op = 'UPDATE' and old.status in ('published','locked','deactivated') then
    if new.id is not distinct from old.id
       and new.code is not distinct from old.code
       and new.title is not distinct from old.title
       and new.issuing_authority is not distinct from old.issuing_authority
       and new.created_at is not distinct from old.created_at
       and new.version_label is not distinct from old.version_label
       and new.supersedes_id is not distinct from old.supersedes_id
       and new.effective_from is not distinct from old.effective_from
       and new.created_by is not distinct from old.created_by
       and new.approved_by is not distinct from old.approved_by
       and new.published_at is not distinct from old.published_at
       and (
         (old.status in ('published','locked')
           and new.status = 'deactivated'
           and nullif(btrim(new.deactivation_reason), '') is not null
           and new.deactivated_at is not null
           and new.deactivated_by is not null)
         or
         (old.status = 'deactivated'
           and new.status = 'published'
           and new.deactivation_reason is null
           and new.effective_to is null
           and new.deactivated_at is null
           and new.deactivated_by is null)
       ) then
      return new;
    end if;
    raise exception 'IMMUTABLE: published regulation % requires a governed successor', old.code;
  end if;
  return new;
end $$;

create or replace function public.set_regulation_operational_state(
  p_entity_id uuid,
  p_activate boolean,
  p_reason text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_head public.compliance_entity_heads%rowtype;
  v_version public.compliance_entity_versions%rowtype;
  v_legacy public.regulations%rowtype;
  v_status text;
  v_child record;
  v_legacy_id uuid;
  v_cascaded_items integer := 0;
  v_cascaded_violations integer := 0;
  v_cascaded_penalties integer := 0;
begin
  if v_actor is null
     or not public.has_any_role(array['compliance_admin','form_admin']) then
    raise insufficient_privilege using message = 'REGULATION-LIFECYCLE-DENIED';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise invalid_parameter_value using message = 'REGULATION-LIFECYCLE-REASON';
  end if;
  select * into v_head
  from public.compliance_entity_heads
  where entity_kind = 'regulation' and entity_id = p_entity_id
  for update;
  if not found then
    -- Legacy-only rows remain first-class during cutover. Do not fabricate a
    -- CCR publication/version for them; apply the same guarded lifecycle to the
    -- existing governed row and expose it through the compatibility union.
    select * into v_legacy from public.regulations
    where id = p_entity_id for update;
    if not found then
      raise no_data_found using message = 'REGULATION-LIFECYCLE-NOT-FOUND';
    end if;
    v_status := case
      when not p_activate then 'deactivated'
      when v_legacy.effective_from is not null
        and v_legacy.effective_from > current_date then 'scheduled'
      else 'active'
    end;
    if (not p_activate and v_legacy.status = 'deactivated')
       or (
         p_activate and v_legacy.status in ('published','locked')
         and (
           (v_status = 'scheduled' and v_legacy.effective_from > current_date)
           or (v_status = 'active'
             and (v_legacy.effective_from is null
               or v_legacy.effective_from <= current_date))
         )
       ) then
      return jsonb_build_object(
        'entity_id', p_entity_id,
        'operational_status', v_status,
        'correlation_id', null,
        'idempotent', true,
        'cascaded', jsonb_build_object(
          'inspection_items', 0, 'violations', 0, 'penalties', 0
        ),
        'children_reactivated', false
      );
    end if;
    if p_activate then
      update public.regulations
      set status = 'published',
          effective_to = null,
          deactivation_reason = null,
          deactivated_at = null,
          deactivated_by = null
      where id = p_entity_id;
    else
      update public.inspection_items item
      set active = false,
          deactivated_at = now(),
          deactivated_by = v_actor,
          deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason)
      where item.clause_id in (
        select id from public.regulation_clauses
        where regulation_id = p_entity_id
      )
        and item.active;
      get diagnostics v_cascaded_items = row_count;

      update public.penalty_mappings penalty
      set status = 'deactivated',
          effective_to = current_date,
          deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason)
      where penalty.violation_code_id in (
        select violation.id
        from public.violation_codes violation
        join public.regulation_clauses clause
          on clause.id = violation.clause_id
        where clause.regulation_id = p_entity_id
      )
        and penalty.status in ('published','locked');
      get diagnostics v_cascaded_penalties = row_count;

      update public.violation_codes violation
      set status = 'deactivated',
          active_to = current_date,
          deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason)
      where violation.clause_id in (
        select id from public.regulation_clauses
        where regulation_id = p_entity_id
      )
        and violation.status in ('published','locked');
      get diagnostics v_cascaded_violations = row_count;

      update public.regulations
      set status = 'deactivated',
          effective_to = current_date,
          deactivation_reason = btrim(p_reason),
          deactivated_at = now(),
          deactivated_by = v_actor
      where id = p_entity_id;
    end if;
    insert into public.audit_events(
      actor, object_type, object_id, action, before_state, after_state,
      requirement_refs
    ) values (
      v_actor, 'regulations', p_entity_id,
      case when p_activate
        then 'REGULATION_ACTIVATED'
        else 'REGULATION_DEACTIVATED'
      end,
      to_jsonb(v_legacy),
      jsonb_build_object(
        'operational_status', v_status,
        'reason', btrim(p_reason),
        'correlation_id', p_correlation_id,
        'legacy_compatibility', true,
        'children_reactivated', false,
        'cascaded', jsonb_build_object(
          'inspection_items', v_cascaded_items,
          'violations', v_cascaded_violations,
          'penalties', v_cascaded_penalties
        )
      ),
      array['CR-449','CR-459','CR-460','CR-462','CR-463','WA-AC-0449','WA-AC-0459','WA-AC-0460','WA-AC-0462','WA-AC-0463']
    );
    return jsonb_build_object(
      'entity_id', p_entity_id,
      'operational_status', v_status,
      'correlation_id', p_correlation_id,
      'idempotent', false,
      'cascaded', jsonb_build_object(
        'inspection_items', v_cascaded_items,
        'violations', v_cascaded_violations,
        'penalties', v_cascaded_penalties
      ),
      'children_reactivated', false
    );
  end if;
  select * into v_version
  from public.compliance_entity_versions
  where id = v_head.current_version_id;

  if p_activate then
    v_status := case
      when v_head.release_date is not null and v_head.release_date > current_date
        then 'scheduled'
      else 'active'
    end;
    if v_head.operational_status = v_status then
      return jsonb_build_object(
        'entity_id', p_entity_id,
        'operational_status', v_status,
        'correlation_id', v_head.lifecycle_correlation_id,
        'idempotent', true,
        'cascaded', jsonb_build_object(
          'inspection_items', 0, 'violations', 0, 'penalties', 0
        ),
        'children_reactivated', false
      );
    end if;
    update public.compliance_entity_heads
    set operational_status = v_status,
        deactivated_at = null,
        deactivation_reason = null,
        lifecycle_correlation_id = p_correlation_id
    where entity_kind = 'regulation' and entity_id = p_entity_id;
    -- Deliberately do not reactivate any child.
  else
    v_status := 'deactivated';
    if v_head.operational_status = 'deactivated' then
      return jsonb_build_object(
        'entity_id', p_entity_id,
        'operational_status', 'deactivated',
        'correlation_id', v_head.lifecycle_correlation_id,
        'idempotent', true,
        'cascaded', jsonb_build_object(
          'inspection_items', 0, 'violations', 0, 'penalties', 0
        ),
        'children_reactivated', false
      );
    end if;
    update public.compliance_entity_heads
    set operational_status = 'deactivated',
        deactivated_at = now(),
        deactivation_reason = btrim(p_reason),
        lifecycle_correlation_id = p_correlation_id
    where entity_kind = 'regulation' and entity_id = p_entity_id;

    -- Follow immutable dependency_versions from the current regulation version
    -- through item -> violation -> penalty heads. Only current operational heads
    -- change; compliance_entity_versions and execution history never change.
    for v_child in
      with recursive descendants(entity_kind, entity_id, current_version_id) as (
        select h.entity_kind, h.entity_id, h.current_version_id
        from public.compliance_entity_heads h
        join public.compliance_entity_versions cv on cv.id = h.current_version_id
        where exists (
          select 1
          from jsonb_array_elements(cv.dependency_versions) dep
          where dep->>'version_id' = v_head.current_version_id::text
        )
        union
        select h.entity_kind, h.entity_id, h.current_version_id
        from public.compliance_entity_heads h
        join public.compliance_entity_versions cv on cv.id = h.current_version_id
        join descendants d on exists (
          select 1
          from jsonb_array_elements(cv.dependency_versions) dep
          where dep->>'version_id' = d.current_version_id::text
        )
      )
      select * from descendants order by entity_kind, entity_id
    loop
      perform 1 from public.compliance_entity_heads
      where entity_kind = v_child.entity_kind
        and entity_id = v_child.entity_id
      for update;
      update public.compliance_entity_heads
      set operational_status = 'deactivated',
          deactivated_at = now(),
          deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason),
          lifecycle_correlation_id = p_correlation_id
      where entity_kind = v_child.entity_kind
        and entity_id = v_child.entity_id;
      if v_child.entity_kind = 'inspection_item' then
        v_cascaded_items := v_cascaded_items + 1;
      elsif v_child.entity_kind = 'violation' then
        v_cascaded_violations := v_cascaded_violations + 1;
      elsif v_child.entity_kind = 'penalty' then
        v_cascaded_penalties := v_cascaded_penalties + 1;
      end if;
      insert into public.audit_events(
        actor, object_type, object_id, action, before_state, after_state,
        requirement_refs
      ) values (
        v_actor, 'compliance_entity_heads', v_child.entity_id,
        upper(v_child.entity_kind) || '_CASCADE_DEACTIVATED',
        jsonb_build_object('current_version_id', v_child.current_version_id),
        jsonb_build_object(
          'operational_status', 'deactivated',
          'parent_regulation_id', p_entity_id,
          'reason', btrim(p_reason),
          'correlation_id', p_correlation_id
        ),
        array['CR-459','CR-460','CR-462','CR-463','WA-AC-0459','WA-AC-0460','WA-AC-0462','WA-AC-0463']
      );
    end loop;
  end if;

  -- Keep the existing library route truthful during the canonical-view cutover.
  v_legacy_id := coalesce(v_head.target_legacy_id, v_version.target_legacy_id);
  if v_legacy_id is not null then
    update public.regulations
    set status = case when p_activate then 'published' else 'deactivated' end,
        effective_to = case when p_activate then null else current_date end,
        deactivation_reason = case when p_activate then null else btrim(p_reason) end,
        deactivated_at = case when p_activate then null else now() end,
        deactivated_by = case when p_activate then null else v_actor end
    where id = v_legacy_id;
  end if;

  if not p_activate then
    update public.inspection_items i
    set active = false
    where i.id in (
      select coalesce(h.target_legacy_id, v.target_legacy_id)
      from public.compliance_entity_heads h
      join public.compliance_entity_versions v on v.id = h.current_version_id
      where h.entity_kind = 'inspection_item'
        and h.operational_status = 'deactivated'
        and h.lifecycle_correlation_id = p_correlation_id
    );
    update public.violation_codes vc
    set status = 'deactivated',
        active_to = current_date,
        deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason)
    where vc.id in (
      select coalesce(h.target_legacy_id, v.target_legacy_id)
      from public.compliance_entity_heads h
      join public.compliance_entity_versions v on v.id = h.current_version_id
      where h.entity_kind = 'violation'
        and h.operational_status = 'deactivated'
        and h.lifecycle_correlation_id = p_correlation_id
    )
      and vc.status in ('published','locked');
    update public.penalty_mappings pm
    set status = 'deactivated',
        effective_to = current_date,
        deactivation_reason = 'Parent regulation deactivated: ' || btrim(p_reason)
    where pm.id in (
      select coalesce(h.target_legacy_id, v.target_legacy_id)
      from public.compliance_entity_heads h
      join public.compliance_entity_versions v on v.id = h.current_version_id
      where h.entity_kind = 'penalty'
        and h.operational_status = 'deactivated'
        and h.lifecycle_correlation_id = p_correlation_id
    )
      and pm.status in ('published','locked');
  end if;

  insert into public.audit_events(
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor, 'compliance_entity_heads', p_entity_id,
    case when p_activate then 'REGULATION_ACTIVATED' else 'REGULATION_DEACTIVATED' end,
    jsonb_build_object('operational_status', v_head.operational_status),
    jsonb_build_object(
      'operational_status', v_status,
      'reason', btrim(p_reason),
      'correlation_id', p_correlation_id,
      'children_reactivated', false
    ),
    array['CR-449','CR-459','CR-460','CR-462','CR-463','WA-AC-0449','WA-AC-0459','WA-AC-0460','WA-AC-0462','WA-AC-0463']
  );
  return jsonb_build_object(
    'entity_id', p_entity_id,
    'operational_status', v_status,
    'correlation_id', p_correlation_id,
    'idempotent', false,
    'cascaded', jsonb_build_object(
      'inspection_items', v_cascaded_items,
      'violations', v_cascaded_violations,
      'penalties', v_cascaded_penalties
    ),
    'children_reactivated', false
  );
end $$;

create or replace function public.activate_regulation(
  p_entity_id uuid,
  p_reason text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.set_regulation_operational_state(
    p_entity_id, true, p_reason, p_correlation_id
  )
$$;
create or replace function public.deactivate_regulation(
  p_entity_id uuid,
  p_reason text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.set_regulation_operational_state(
    p_entity_id, false, p_reason, p_correlation_id
  )
$$;
revoke all on function public.set_regulation_operational_state(
  uuid, boolean, text, uuid
) from public, anon, authenticated;
revoke all on function public.activate_regulation(uuid, text, uuid)
  from public, anon;
revoke all on function public.deactivate_regulation(uuid, text, uuid)
  from public, anon;
grant execute on function public.activate_regulation(uuid, text, uuid)
  to authenticated;
grant execute on function public.deactivate_regulation(uuid, text, uuid)
  to authenticated;

drop view if exists public.compliance_regulation_library;
create view public.compliance_regulation_library
with (security_invoker = true) as
with canonical as (
  select
    h.entity_id,
    h.target_legacy_id,
    h.current_version_id,
    v.version_number,
    v.value_snapshot,
    coalesce(v.value_snapshot->>'code', legacy.code) as code,
    coalesce(v.value_snapshot->>'title', legacy.title) as title,
    coalesce(
      v.value_snapshot->>'issuing_authority', legacy.issuing_authority
    ) as issuing_authority,
    coalesce(
      v.value_snapshot->>'version_label',
      legacy.version_label,
      v.version_number::text
    ) as version_label,
    coalesce(legacy.created_at, v.published_at) as created_at,
    case
      when v.value_snapshot->>'created_by'
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (v.value_snapshot->>'created_by')::uuid
      else legacy.created_by
    end as created_by,
    case
      when v.value_snapshot->>'approved_by'
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (v.value_snapshot->>'approved_by')::uuid
      else legacy.approved_by
    end as approved_by,
    case
      when h.operational_status = 'scheduled'
        and h.release_date is not null
        and h.release_date <= current_date
        then 'active'
      else h.operational_status
    end as operational_status,
    h.release_date,
    h.deactivated_at,
    h.deactivation_reason,
    v.published_at,
    v.request_id,
    v.request_revision,
    v.correlation_id,
    case
      when legacy.id is not null then (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', clause.id,
            'clause_ref', clause.clause_ref,
            'title', clause.title,
            'applicability', clause.applicability,
            'legal_source', clause.legal_source,
            'inspection_items', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', item.id, 'code', item.code, 'title', item.title
              ) order by item.code)
              from public.inspection_items item
              where item.clause_id = clause.id
            ), '[]'::jsonb)
          ) order by clause.clause_ref
        ), '[]'::jsonb)
        from public.regulation_clauses clause
        where clause.regulation_id = legacy.id
      )
      when jsonb_typeof(v.value_snapshot->'clauses') = 'array'
        then v.value_snapshot->'clauses'
      else null
    end as clauses,
    case
      when legacy.id is not null then 'verified'
      when jsonb_typeof(v.value_snapshot->'clauses') = 'array' then 'verified'
      else 'verified_unknown'
    end as clauses_status,
    case
      when legacy.id is not null then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', attachment.id,
          'file_name', attachment.file_name,
          'storage_path', attachment.storage_path,
          'media_type', attachment.media_type,
          'sha256', attachment.sha256,
          'created_at', attachment.created_at
        ) order by attachment.created_at), '[]'::jsonb)
        from public.regulation_attachments attachment
        where attachment.regulation_id = legacy.id
      )
      when jsonb_typeof(v.value_snapshot->'attachments') = 'array'
        then v.value_snapshot->'attachments'
      else null
    end as attachments,
    case
      when legacy.id is not null then 'verified'
      when jsonb_typeof(v.value_snapshot->'attachments') = 'array'
        then 'verified'
      else 'verified_unknown'
    end as attachments_status
  from public.compliance_entity_heads h
  join public.compliance_entity_versions v on v.id = h.current_version_id
  left join public.regulations legacy
    on legacy.id = coalesce(h.target_legacy_id, v.target_legacy_id)
  where h.entity_kind = 'regulation'
)
select * from canonical
union all
select
  legacy.id as entity_id,
  legacy.id as target_legacy_id,
  null::uuid as current_version_id,
  1 as version_number,
  jsonb_build_object(
    'code', legacy.code,
    'title', legacy.title,
    'issuing_authority', legacy.issuing_authority,
    'version_label', legacy.version_label,
    'effective_from', legacy.effective_from
  ) as value_snapshot,
  legacy.code,
  legacy.title,
  legacy.issuing_authority,
  legacy.version_label,
  legacy.created_at,
  legacy.created_by,
  legacy.approved_by,
  case
    when legacy.status in ('published','locked') and (
      legacy.effective_from is null or legacy.effective_from <= current_date
    ) then 'active'
    when legacy.status in ('published','locked') then 'scheduled'
    else legacy.status::text
  end as operational_status,
  legacy.effective_from as release_date,
  legacy.deactivated_at,
  legacy.deactivation_reason,
  legacy.published_at,
  null::uuid as request_id,
  null::integer as request_revision,
  null::uuid as correlation_id,
  (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', clause.id,
      'clause_ref', clause.clause_ref,
      'title', clause.title,
      'applicability', clause.applicability,
      'legal_source', clause.legal_source,
      'inspection_items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', item.id, 'code', item.code, 'title', item.title
        ) order by item.code)
        from public.inspection_items item
        where item.clause_id = clause.id
      ), '[]'::jsonb)
    ) order by clause.clause_ref), '[]'::jsonb)
    from public.regulation_clauses clause
    where clause.regulation_id = legacy.id
  ) as clauses,
  'verified'::text as clauses_status,
  (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', attachment.id,
      'file_name', attachment.file_name,
      'storage_path', attachment.storage_path,
      'media_type', attachment.media_type,
      'sha256', attachment.sha256,
      'created_at', attachment.created_at
    ) order by attachment.created_at), '[]'::jsonb)
    from public.regulation_attachments attachment
    where attachment.regulation_id = legacy.id
  ) as attachments,
  'verified'::text as attachments_status
from public.regulations legacy
where not exists (
  select 1 from canonical
  where canonical.target_legacy_id = legacy.id
);
grant select on public.compliance_regulation_library to authenticated;

create or replace function public.compliance_regulation_audit(p_entity_id uuid)
returns setof public.audit_events
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select
      h.entity_id,
      coalesce(h.target_legacy_id, v.target_legacy_id) as target_legacy_id,
      h.lifecycle_correlation_id
    from public.compliance_entity_heads h
    join public.compliance_entity_versions v on v.id = h.current_version_id
    where h.entity_kind = 'regulation' and h.entity_id = p_entity_id
  )
  select event.*
  from public.audit_events event
  left join target on true
  where public.has_any_role(array[
    'compliance_admin','form_admin','reviewer','auditor','ops','leadership'
  ])
    and (
      event.object_id = p_entity_id
      or event.object_id = target.target_legacy_id
      or event.after_state->>'correlation_id' = target.lifecycle_correlation_id::text
      or event.before_state->>'correlation_id' = target.lifecycle_correlation_id::text
    )
  order by event.occurred_at desc, event.id desc
$$;
revoke all on function public.compliance_regulation_audit(uuid)
  from public, anon;
grant execute on function public.compliance_regulation_audit(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Workflow task and SLA mutations: canonical guarded RPC + atomic audit.
-- ---------------------------------------------------------------------------
create or replace function public.mutate_workflow_task(
  p_task uuid,
  p_status text default null,
  p_assignee uuid default null,
  p_set_assignee boolean default false,
  p_active boolean default null,
  p_reason text default null,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_old public.workflow_task_assignments%rowtype;
  v_new public.workflow_task_assignments%rowtype;
begin
  if v_actor is null
     or not public.has_any_role(array['ops','planner','leadership','workflow_admin']) then
    raise insufficient_privilege using message = 'WORKFLOW-TASK-DENIED';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise invalid_parameter_value using message = 'WORKFLOW-TASK-REASON';
  end if;
  select * into v_old from public.workflow_task_assignments
  where id = p_task for update;
  if not found then raise no_data_found using message = 'WORKFLOW-TASK-NOT-FOUND'; end if;
  if not public.has_any_role(array['workflow_admin'])
     and not (
       v_old.branch = (select region from public.profiles where user_id = v_actor)
       or v_old.sector = (select org_scope from public.profiles where user_id = v_actor)
     ) then
    raise insufficient_privilege using message = 'WORKFLOW-TASK-SCOPE';
  end if;
  if p_status is not null and not (
    (v_old.status = 'new' and p_status in ('assigned','cancelled'))
    or (v_old.status = 'assigned' and p_status in ('in_progress','suspended','cancelled'))
    or (v_old.status = 'in_progress' and p_status in ('suspended','completed','cancelled'))
    or (v_old.status = 'suspended' and p_status in ('in_progress','cancelled'))
  ) then
    raise check_violation using message = 'WORKFLOW-TASK-TRANSITION';
  end if;
  if p_active is true and v_old.status in ('completed','cancelled') then
    raise check_violation using message = 'WORKFLOW-TASK-TERMINAL';
  end if;
  if p_set_assignee and p_assignee is null then
    raise invalid_parameter_value using message = 'WORKFLOW-TASK-ASSIGNEE';
  end if;
  update public.workflow_task_assignments
  set status = coalesce(p_status, status),
      assignee = case when p_set_assignee then p_assignee else assignee end,
      active = coalesce(p_active, active),
      reason = btrim(p_reason)
  where id = p_task
  returning * into v_new;
  insert into public.audit_events(
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor, 'workflow_task_assignments', p_task, 'WORKFLOW_TASK_MUTATED',
    to_jsonb(v_old),
    to_jsonb(v_new) || jsonb_build_object('correlation_id', p_correlation_id),
    array['MVP2-REQ-0032']
  );
  return jsonb_build_object(
    'task_id', p_task, 'status', v_new.status, 'active', v_new.active,
    'assignee', v_new.assignee, 'correlation_id', p_correlation_id
  );
end $$;
revoke all on function public.mutate_workflow_task(
  uuid, text, uuid, boolean, boolean, text, uuid
) from public, anon;
grant execute on function public.mutate_workflow_task(
  uuid, text, uuid, boolean, boolean, text, uuid
) to authenticated;

create or replace function public.mutate_sla_timer(
  p_timer uuid,
  p_action text,
  p_reason text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_old public.sla_timers%rowtype;
  v_new public.sla_timers%rowtype;
  v_now timestamptz := now();
  v_pause_minutes integer;
begin
  if v_actor is null
     or not public.has_any_role(array['workflow_admin','compliance_admin','ops','leadership']) then
    raise insufficient_privilege using message = 'SLA-TIMER-DENIED';
  end if;
  if p_action not in ('activate','pause','resume') then
    raise invalid_parameter_value using message = 'SLA-TIMER-ACTION';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise invalid_parameter_value using message = 'SLA-TIMER-REASON';
  end if;
  select * into v_old from public.sla_timers where id = p_timer for update;
  if not found then raise no_data_found using message = 'SLA-TIMER-NOT-FOUND'; end if;
  if (p_action = 'activate' and v_old.status <> 'pending_activation')
     or (p_action = 'pause' and v_old.status <> 'running')
     or (p_action = 'resume' and v_old.status <> 'paused') then
    raise check_violation using message = 'SLA-TIMER-STATE';
  end if;
  v_pause_minutes := case
    when p_action = 'resume'
      then greatest(0, floor(extract(epoch from (v_now - v_old.paused_at)) / 60)::integer)
    else 0
  end;
  update public.sla_timers
  set status = case when p_action = 'pause' then 'paused' else 'running' end,
      started_at = case
        when p_action = 'activate' then coalesce(started_at, v_now)
        else started_at
      end,
      paused_at = case when p_action = 'pause' then v_now else null end,
      accumulated_pause_minutes = accumulated_pause_minutes + v_pause_minutes,
      due_at = case
        when p_action = 'resume' then due_at + make_interval(mins => v_pause_minutes)
        else due_at
      end,
      warn_at = case
        when p_action = 'resume' and warn_at is not null
          then warn_at + make_interval(mins => v_pause_minutes)
        else warn_at
      end,
      breach_at = case
        when p_action = 'resume' and breach_at is not null
          then breach_at + make_interval(mins => v_pause_minutes)
        else breach_at
      end
  where id = p_timer
  returning * into v_new;
  insert into public.audit_events(
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor, 'sla_timers', p_timer, 'SLA_TIMER_' || upper(p_action),
    to_jsonb(v_old),
    to_jsonb(v_new) || jsonb_build_object(
      'reason', btrim(p_reason), 'correlation_id', p_correlation_id
    ),
    array['MVP2-REQ-0033','DEC-003']
  );
  return jsonb_build_object(
    'timer_id', p_timer, 'status', v_new.status,
    'correlation_id', p_correlation_id
  );
end $$;
revoke all on function public.mutate_sla_timer(uuid, text, text, uuid)
  from public, anon;
grant execute on function public.mutate_sla_timer(uuid, text, text, uuid)
  to authenticated;
