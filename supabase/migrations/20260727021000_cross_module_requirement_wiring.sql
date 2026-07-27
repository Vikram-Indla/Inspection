-- Cross-module requirement wiring.
-- Factory: CR-424/425/426/428 · WA-AC-0424/0425/0426/0428
-- Review: CR-360/365/366/405/407/408 · WA-AC-0360/0365/0366/0405/0407/0408
-- Operations: CR-444/445/446 · WA-AC-0444/0445/0446
--
-- Additive/forward-only. No DEC-028 KPI period, threshold or formula value is
-- invented. Timeline projections derive only persisted source facts.

-- ---------------------------------------------------------------------------
-- Factory 360: capability-bound risk, audited document retrieval, timeline.
-- ---------------------------------------------------------------------------
drop policy if exists factory_risk_snapshots_read
  on public.factory_risk_snapshots;
create policy factory_risk_snapshots_read
on public.factory_risk_snapshots for select to authenticated
using (public.has_permission('view_risk_details'));

create table if not exists public.factory_document_download_receipts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.factory_documents(id),
  factory_id uuid not null references public.factories(id),
  actor uuid not null references public.profiles(user_id),
  storage_path text not null,
  purpose text not null check (btrim(purpose) <> ''),
  correlation_id uuid not null,
  requested_at timestamptz not null default now()
);
create index if not exists factory_document_download_actor_idx
  on public.factory_document_download_receipts(actor, requested_at desc);
create index if not exists factory_document_download_factory_idx
  on public.factory_document_download_receipts(factory_id, requested_at desc);
alter table public.factory_document_download_receipts enable row level security;
revoke all on public.factory_document_download_receipts from public, anon, authenticated;

create or replace function public.authorize_factory_document_download(
  p_document_id uuid,
  p_purpose text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_doc public.factory_documents%rowtype;
  v_receipt uuid;
begin
  if v_actor is null
     or not public.has_permission('download_factory_documents') then
    raise insufficient_privilege using message = 'FACTORY-DOCUMENT-DOWNLOAD-DENIED';
  end if;
  if nullif(btrim(p_purpose), '') is null then
    raise invalid_parameter_value using message = 'FACTORY-DOCUMENT-DOWNLOAD-PURPOSE';
  end if;
  select * into v_doc from public.factory_documents
  where id = p_document_id for share;
  if not found or v_doc.storage_path is null then
    raise no_data_found using message = 'FACTORY-DOCUMENT-DOWNLOAD-NOT-FOUND';
  end if;
  insert into public.factory_document_download_receipts(
    document_id, factory_id, actor, storage_path, purpose, correlation_id
  ) values (
    v_doc.id, v_doc.factory_id, v_actor, v_doc.storage_path,
    btrim(p_purpose), p_correlation_id
  ) returning id into v_receipt;
  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'factory_documents', v_doc.id, 'FACTORY_DOCUMENT_DOWNLOAD_AUTHORIZED',
    jsonb_build_object(
      'factory_id', v_doc.factory_id,
      'receipt_id', v_receipt,
      'purpose', btrim(p_purpose),
      'correlation_id', p_correlation_id
    ),
    array['CR-425','WA-AC-0425']
  );
  return jsonb_build_object(
    'receipt_id', v_receipt,
    'document_id', v_doc.id,
    'factory_id', v_doc.factory_id,
    'storage_path', v_doc.storage_path,
    'correlation_id', p_correlation_id
  );
end $$;
revoke all on function public.authorize_factory_document_download(
  uuid, text, uuid
) from public, anon;
grant execute on function public.authorize_factory_document_download(
  uuid, text, uuid
) to authenticated;

create or replace function public.factory_timeline(p_factory_id uuid)
returns table(
  event_key text,
  occurred_at timestamptz,
  object_type text,
  object_id uuid,
  source text,
  payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with allowed as (
    select public.has_permission('view_factory_360') as ok
  ), events(
    event_key, occurred_at, object_type, object_id, source, payload
  ) as (
    select 'source_sync'::text, f.source_synced_at, 'factories'::text, f.id,
      coalesce(f.source, 'factories')::text,
      jsonb_build_object('source', f.source)
    from public.factories f
    where f.id = p_factory_id and f.source_synced_at is not null
    union all
    select 'visit_planned', v.created_at, 'visits', v.id, 'visits',
      jsonb_build_object(
        'planning_status', v.planning_status,
        'visit_type', v.visit_type
      )
    from public.visits v where v.factory_id = p_factory_id
    union all
    select 'inspection_submitted',
      sv.submitted_at,
      'inspections', i.id, 'inspections',
      jsonb_build_object(
        'inspection_status', i.status,
        'submission_version_id', sv.id,
        'version_number', sv.version_number
      )
    from public.inspections i
    join public.visits v on v.id = i.visit_id
    join public.submission_versions sv on sv.inspection_id = i.id
    where v.factory_id = p_factory_id
    union all
    select 'inspection_approved', r.decided_at,
      'reviews', r.id, 'reviews',
      jsonb_build_object(
        'inspection_id', i.id,
        'submission_version_id', r.submission_version_id,
        'decision', r.decision
      )
    from public.reviews r
    join public.inspections i on i.id = r.inspection_id
    join public.visits v on v.id = i.visit_id
    where v.factory_id = p_factory_id
      and r.decision = 'approve'
      and r.decided_at is not null
    union all
    select 'penalty_issued', pn.issued_at, 'penalty_notices', pn.id,
      'penalty_notices',
      jsonb_build_object(
        'inspection_id', pn.inspection_id,
        'status', pn.status,
        'notice_number', pn.notice_number
      )
    from public.penalty_notices pn where pn.factory_id = p_factory_id
    union all
    select 'risk_calculated', risk.calculated_at, 'factory_risk_snapshots',
      risk.id, 'risk_engine',
      case when public.has_permission('view_risk_details')
        then jsonb_build_object(
          'score', risk.score,
          'band', risk.band,
          'model_version', risk.model_version,
          'drivers', risk.drivers
        )
        else jsonb_build_object('permission_restricted', true)
      end
    from public.factory_risk_snapshots risk
    where risk.factory_id = p_factory_id
  )
  select e.*
  from events e, allowed
  where allowed.ok
  order by e.occurred_at desc, e.object_id
$$;
revoke all on function public.factory_timeline(uuid) from public, anon;
grant execute on function public.factory_timeline(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Review: immutable comments, Compliance handoff and canonical chronology.
-- ---------------------------------------------------------------------------
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id),
  inspection_id uuid not null references public.inspections(id),
  submission_version_id uuid not null references public.submission_versions(id),
  reviewer_id uuid not null references public.profiles(user_id),
  decision text not null check (decision in ('approve','return','reject')),
  comment text not null check (btrim(comment) <> ''),
  created_at timestamptz not null default now()
);
create index if not exists review_comments_inspection_idx
  on public.review_comments(inspection_id, created_at, id);
alter table public.review_comments enable row level security;
revoke all on public.review_comments from public, anon, authenticated;
grant select on public.review_comments to authenticated;
create policy review_comments_read on public.review_comments
for select to authenticated using (
  reviewer_id = (select auth.uid())
  or public.has_any_role(array['reviewer','ops','auditor','compliance_admin'])
  or exists (
    select 1
    from public.inspections i
    join public.assignments a on a.visit_id = i.visit_id
    where i.id = review_comments.inspection_id
      and a.inspector_id = (select auth.uid())
  )
);

create or replace function public.block_review_comment_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE: reviewer comments cannot be changed or deleted';
end $$;
drop trigger if exists trg_review_comments_immutable on public.review_comments;
create trigger trg_review_comments_immutable
before update or delete on public.review_comments
for each row execute function public.block_review_comment_mutation();
revoke all on function public.block_review_comment_mutation()
  from public, anon, authenticated;

create table if not exists public.compliance_inspection_handoffs (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null unique references public.inspections(id),
  review_id uuid not null unique references public.reviews(id),
  submission_version_id uuid not null references public.submission_versions(id),
  handed_off_by uuid not null references public.profiles(user_id),
  status text not null default 'ready'
    check (status in ('ready','accepted','closed')),
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.compliance_inspection_handoffs enable row level security;
revoke all on public.compliance_inspection_handoffs from public, anon, authenticated;
grant select on public.compliance_inspection_handoffs to authenticated;
create policy compliance_handoffs_read
on public.compliance_inspection_handoffs for select to authenticated using (
  public.has_any_role(array['reviewer','ops','auditor','compliance_admin'])
);

create or replace function public.decide_review_with_handoff(
  p_review uuid,
  p_decision text,
  p_reason text default null,
  p_comment text default null,
  p_returned_sections jsonb default null,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_review public.reviews%rowtype;
  v_result jsonb;
  v_version integer;
  v_comment uuid;
  v_handoff uuid;
begin
  select * into v_review from public.reviews
  where id = p_review for update;
  if not found then
    raise no_data_found using message = 'REVIEW-DECIDE-NOT-FOUND';
  end if;
  if nullif(btrim(p_comment), '') is not null
     and v_review.reviewer_id <> v_actor then
    raise insufficient_privilege using message = 'REVIEW-COMMENT-OWNER';
  end if;
  v_result := public.decide_review(
    p_review, p_decision, p_reason, p_returned_sections
  );
  select version_number into v_version
  from public.submission_versions
  where id = v_review.submission_version_id;
  if nullif(btrim(p_comment), '') is not null then
    insert into public.review_comments(
      review_id, inspection_id, submission_version_id, reviewer_id,
      decision, comment
    ) values (
      p_review, v_review.inspection_id, v_review.submission_version_id,
      v_actor, p_decision, btrim(p_comment)
    ) returning id into v_comment;
  end if;
  if p_decision = 'approve' then
    insert into public.compliance_inspection_handoffs(
      inspection_id, review_id, submission_version_id, handed_off_by,
      correlation_id
    ) values (
      v_review.inspection_id, p_review, v_review.submission_version_id,
      v_actor, p_correlation_id
    )
    on conflict (inspection_id) do nothing
    returning id into v_handoff;
    if v_handoff is null then
      raise unique_violation using message = 'REVIEW-COMPLIANCE-HANDOFF-EXISTS';
    end if;
  end if;
  insert into public.audit_events(
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor, 'reviews', p_review, 'REVIEW_DECISION_COMPLETE',
    jsonb_build_object('status', v_review.status),
    jsonb_build_object(
      'inspection_id', v_review.inspection_id,
      'submission_version_id', v_review.submission_version_id,
      'submission_version_number', v_version,
      'decision', p_decision,
      'reason', nullif(btrim(p_reason), ''),
      'comment_id', v_comment,
      'comment', nullif(btrim(p_comment), ''),
      'returned_sections', p_returned_sections,
      'previous_status', v_review.status,
      'new_status', v_result->>'status',
      'handoff_id', v_handoff,
      'correlation_id', p_correlation_id
    ),
    array[
      'CR-360','CR-365','CR-366','CR-405','CR-407','CR-408',
      'WA-AC-0360','WA-AC-0365','WA-AC-0366',
      'WA-AC-0405','WA-AC-0407','WA-AC-0408'
    ]
  );
  return v_result || jsonb_build_object(
    'comment_id', v_comment,
    'handoff_id', v_handoff,
    'submission_version_number', v_version,
    'correlation_id', p_correlation_id
  );
end $$;
revoke all on function public.decide_review_with_handoff(
  uuid, text, text, text, jsonb, uuid
) from public, anon;
grant execute on function public.decide_review_with_handoff(
  uuid, text, text, text, jsonb, uuid
) to authenticated;

create or replace function public.review_timeline(p_inspection_id uuid)
returns table(
  event_key text,
  occurred_at timestamptz,
  object_type text,
  object_id uuid,
  actor_id uuid,
  payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with allowed as (
    select exists (
      select 1 from public.inspections i
      left join public.assignments a on a.visit_id = i.visit_id
      where i.id = p_inspection_id
        and (
          a.inspector_id = (select auth.uid())
          or public.has_any_role(array[
            'reviewer','ops','auditor','compliance_admin'
          ])
        )
    ) ok
  ), events(
    event_key, occurred_at, object_type, object_id, actor_id, payload
  ) as (
    select case when sv.version_number = 1 then 'submitted' else 'resubmitted' end,
      sv.submitted_at, 'submission_versions'::text,
      sv.id, sv.submitted_by,
      jsonb_build_object(
        'version_number', sv.version_number,
        'submission_version_id', sv.id
      )
    from public.submission_versions sv
    where sv.inspection_id = p_inspection_id
    union all
    select 'review_opened', ae.occurred_at,
      'reviews', r.id, r.reviewer_id,
      jsonb_build_object(
        'submission_version_id', r.submission_version_id,
        'status', r.status
      )
    from public.reviews r
    join public.audit_events ae
      on ae.object_type = 'reviews'
      and ae.object_id = r.id
      and ae.action = 'start_review'
    where r.inspection_id = p_inspection_id
    union all
    select
      case r.decision
        when 'approve' then 'approved'
        when 'return' then 'returned'
        else 'rejected'
      end,
      r.decided_at, 'reviews', r.id, r.reviewer_id,
      jsonb_build_object(
        'submission_version_id', r.submission_version_id,
        'decision', r.decision,
        'reason', r.decision_reason,
        'returned_sections', r.returned_sections
      )
    from public.reviews r
    where r.inspection_id = p_inspection_id and r.decided_at is not null
    union all
    select 'reviewer_comment', c.created_at, 'review_comments', c.id,
      c.reviewer_id,
      jsonb_build_object(
        'review_id', c.review_id,
        'submission_version_id', c.submission_version_id,
        'decision', c.decision,
        'comment', c.comment
      )
    from public.review_comments c
    where c.inspection_id = p_inspection_id
    union all
    select 'compliance_handoff', h.created_at,
      'compliance_inspection_handoffs', h.id, h.handed_off_by,
      jsonb_build_object(
        'review_id', h.review_id,
        'submission_version_id', h.submission_version_id,
        'status', h.status,
        'correlation_id', h.correlation_id
      )
    from public.compliance_inspection_handoffs h
    where h.inspection_id = p_inspection_id
  )
  select e.* from events e, allowed
  where allowed.ok
  order by e.occurred_at, e.object_id
$$;
revoke all on function public.review_timeline(uuid) from public, anon;
grant execute on function public.review_timeline(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Operations: governed visit timeline, effective KPI contract, export receipt.
-- ---------------------------------------------------------------------------
create or replace function public.operations_visit_timeline(p_visit_id uuid)
returns table(
  event_key text,
  occurred_at timestamptz,
  object_type text,
  object_id uuid,
  payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select v.*, f.region
    from public.visits v
    join public.factories f on f.id = v.factory_id
    where v.id = p_visit_id
      and public.has_any_role(array['ops','auditor','leadership'])
      and (
        public.has_any_role(array['auditor','leadership'])
        or f.region = (
          select p.region from public.profiles p
          where p.user_id = (select auth.uid())
        )
      )
  ), events(
    event_key, occurred_at, object_type, object_id, payload
  ) as (
    select 'visit_planned'::text, t.created_at, 'visits'::text, t.id,
      jsonb_build_object(
        'planning_status', t.planning_status,
        'operational_state', t.operational_state,
        'region', t.region
      )
    from target t
    union all
    select 'visit_' || vle.event_type, vle.created_at,
      'visit_lifecycle_events', vle.id,
      jsonb_build_object(
        'reason_key', vle.reason_key,
        'comments', vle.comments,
        'previous', vle.previous
      )
    from public.visit_lifecycle_events vle
    join target t on t.id = vle.visit_id
    union all
    select 'inspection_' || i.status, coalesce(i.submitted_at, i.started_at),
      'inspections', i.id,
      jsonb_build_object('status', i.status)
    from public.inspections i join target t on t.id = i.visit_id
    where coalesce(i.submitted_at, i.started_at) is not null
    union all
    select 'review_' || coalesce(r.decision, r.status::text),
      coalesce(r.decided_at, sv.submitted_at), 'reviews', r.id,
      jsonb_build_object(
        'status', r.status,
        'decision', r.decision,
        'submission_version_id', r.submission_version_id
      )
    from public.reviews r
    join public.inspections i on i.id = r.inspection_id
    join target t on t.id = i.visit_id
    join public.submission_versions sv on sv.id = r.submission_version_id
    union all
    select 'compliance_handoff', h.created_at,
      'compliance_inspection_handoffs', h.id,
      jsonb_build_object(
        'status', h.status,
        'submission_version_id', h.submission_version_id,
        'correlation_id', h.correlation_id
      )
    from public.compliance_inspection_handoffs h
    join public.inspections i on i.id = h.inspection_id
    join target t on t.id = i.visit_id
  )
  select * from events
  order by occurred_at, object_id
$$;
revoke all on function public.operations_visit_timeline(uuid) from public, anon;
grant execute on function public.operations_visit_timeline(uuid) to authenticated;

create or replace function public.operations_kpi_contract()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with policy as (
    select v.id, v.version_number, v.payload, v.effective_from,
      v.correlation_id
    from public.dashboard_config_heads h
    join public.dashboard_config_versions v on v.id = h.current_version_id
    where h.config_key = 'kpi_parameters'
      and v.effective_from <= now()
    limit 1
  ), required_families(metric_key) as (
    values
      ('visits_planned'::text),
      ('visits_completed'),
      ('visits_cancelled'),
      ('visits_overdue'),
      ('active_inspectors'),
      ('average_duration'),
      ('sla_breach_rate')
  ), definitions as (
    select jsonb_agg(jsonb_build_object(
      'metric_key', required_families.metric_key,
      'formula', k.formula,
      'source_lineage', k.source_lineage,
      'definition_version', k.version,
      'source_status',
        case when k.metric_key is null then 'not_configured' else k.status end
    ) order by required_families.metric_key) rows
    from required_families
    left join lateral (
      select d.metric_key, d.version, d.formula, d.source_lineage, d.status
      from public.mvp3_kpi_definitions d
      where d.metric_key = required_families.metric_key
        and d.status = 'published'
      order by d.version desc
      limit 1
    ) k on true
  )
  select case
    when not public.has_any_role(array['ops','leadership','auditor'])
      then jsonb_build_object('authorized', false)
    when policy.id is null then jsonb_build_object(
      'authorized', true,
      'configured', false,
      'decision', 'DEC-028',
      'period', null,
      'timezone', null,
      'policy_version', null,
      'blocked_by', 'DEC-028',
      'definitions', definitions.rows
    )
    else jsonb_build_object(
      'authorized', true,
      'configured', true,
      'decision', 'DEC-028',
      'period', policy.payload->'period',
      'timezone', policy.payload->'timezone',
      'scope_precedence', policy.payload->'scope_precedence',
      'policy_version', policy.version_number,
      'policy_id', policy.id,
      'effective_from', policy.effective_from,
      'correlation_id', policy.correlation_id,
      'definitions', definitions.rows
    )
  end
  from policy full join definitions on true
$$;
revoke all on function public.operations_kpi_contract() from public, anon;
grant execute on function public.operations_kpi_contract() to authenticated;

create table if not exists public.operations_export_receipts (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null references public.profiles(user_id),
  dataset text not null check (dataset in ('visits','alerts','kpis')),
  filters jsonb not null check (jsonb_typeof(filters) = 'object'),
  row_count integer not null check (row_count >= 0),
  region text,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists operations_export_actor_idx
  on public.operations_export_receipts(actor, created_at desc);
alter table public.operations_export_receipts enable row level security;
revoke all on public.operations_export_receipts from public, anon, authenticated;

create or replace function public.authorize_operations_export(
  p_dataset text,
  p_filters jsonb,
  p_row_count integer,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_region text;
  v_requested_region text;
  v_receipt uuid;
begin
  if v_actor is null
     or not public.has_any_role(array['ops','leadership']) then
    raise insufficient_privilege using message = 'OPERATIONS-EXPORT-DENIED';
  end if;
  if p_dataset not in ('visits','alerts','kpis')
     or p_filters is null or jsonb_typeof(p_filters) <> 'object'
     or p_row_count is null or p_row_count < 0 then
    raise invalid_parameter_value using message = 'OPERATIONS-EXPORT-REQUEST';
  end if;
  select region into v_actor_region from public.profiles where user_id = v_actor;
  v_requested_region := nullif(btrim(p_filters->>'region'), '');
  if public.has_any_role(array['leadership']) then
    null;
  elsif v_actor_region is null
     or v_requested_region is distinct from v_actor_region then
    raise insufficient_privilege using message = 'OPERATIONS-EXPORT-SCOPE';
  end if;
  insert into public.operations_export_receipts(
    actor, dataset, filters, row_count, region, correlation_id
  ) values (
    v_actor, p_dataset, p_filters, p_row_count,
    v_requested_region, p_correlation_id
  ) returning id into v_receipt;
  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'operations_export_receipts', v_receipt,
    'OPERATIONS_EXPORT_AUTHORIZED',
    jsonb_build_object(
      'dataset', p_dataset,
      'filters', p_filters,
      'row_count', p_row_count,
      'region', v_requested_region,
      'correlation_id', p_correlation_id
    ),
    array['CR-446','WA-AC-0446']
  );
  return jsonb_build_object(
    'receipt_id', v_receipt,
    'dataset', p_dataset,
    'row_count', p_row_count,
    'correlation_id', p_correlation_id
  );
end $$;
revoke all on function public.authorize_operations_export(
  text, jsonb, integer, uuid
) from public, anon;
grant execute on function public.authorize_operations_export(
  text, jsonb, integer, uuid
) to authenticated;
