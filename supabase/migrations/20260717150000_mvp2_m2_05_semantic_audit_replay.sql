-- MVP2-CD-031-M2-05 · TASK-MVP2-M2-05-AUDIT-REPLAY-001
-- MVP2-REQ/AC-0137..0172 · ENG-12
-- Additive semantic audit envelope, ontology, correlation and replay reads.
-- Existing public.audit_events remains untouched and absolutely immutable.

create table if not exists public.audit_event_registry (
  event_type text not null,
  schema_version integer not null check (schema_version > 0),
  title text not null,
  aliases text[] not null default '{}',
  requirement_refs text[] not null,
  acceptance_refs text[] not null,
  required_fields text[] not null default '{}',
  source_mapping_status text not null check (source_mapping_status in ('canonical','derived','partial','missing','needs_contract')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (event_type, schema_version)
);

create table if not exists public.audit_event_ontology_versions (
  id uuid primary key default gen_random_uuid(),
  case_type text not null,
  version_label text not null,
  status text not null check (status in ('draft','published','retired')),
  effective_from timestamptz,
  published_at timestamptz,
  published_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  unique (case_type, version_label)
);

create table if not exists public.audit_event_ontology_entries (
  id uuid primary key default gen_random_uuid(),
  ontology_version_id uuid not null references public.audit_event_ontology_versions(id),
  event_type text not null,
  schema_version integer not null default 1,
  chapter text not null,
  ordinal integer not null check (ordinal > 0),
  required boolean not null default true,
  branch_group text,
  branch_minimum integer,
  expected_status text not null check (expected_status in ('recorded','derived','partial','missing','needs_contract')),
  requirement_ref text not null,
  acceptance_ref text not null,
  unique (ontology_version_id, requirement_ref),
  unique (ontology_version_id, ordinal),
  foreign key (event_type, schema_version) references public.audit_event_registry(event_type, schema_version)
);

create table if not exists public.audit_event_order_constraints (
  ontology_version_id uuid not null references public.audit_event_ontology_versions(id),
  event_type text not null,
  must_follow_event_type text not null,
  predecessor_required boolean not null default true,
  guard_text text not null,
  primary key(ontology_version_id,event_type,must_follow_event_type)
);

create table if not exists public.audit_semantic_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  schema_version integer not null default 1,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  actor_id uuid,
  actor_roles text[] not null default '{}',
  actor_scope jsonb not null default '{}'::jsonb,
  aggregate_type text not null,
  aggregate_id uuid,
  aggregate_ref text,
  aggregate_version text,
  case_type text not null,
  case_ref text not null,
  correlation_id uuid not null,
  causation_id uuid references public.audit_semantic_events(id),
  source_system text not null,
  source_action text not null,
  idempotency_key text not null,
  before_state jsonb,
  after_state jsonb,
  semantic_payload jsonb not null default '{}'::jsonb,
  field_provenance jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default '{}',
  evidence_hashes text[] not null default '{}',
  package_hash text,
  report_hash text,
  source_audit_event_id bigint references public.audit_events(id),
  integrity_status text not null default 'not_assessed' check (integrity_status in ('not_assessed','verified','unverified','mismatch','unavailable')),
  chain_status text not null default 'not_assessed' check (chain_status in ('not_assessed','intact','broken','incomplete','unavailable')),
  ingestion_status text not null default 'recorded' check (ingestion_status in ('recorded','mapped','partial','rejected','quarantined')),
  created_at timestamptz not null default now(),
  foreign key (event_type, schema_version) references public.audit_event_registry(event_type, schema_version),
  unique (source_system, idempotency_key)
);

create table if not exists public.audit_event_semantic_mappings (
  id uuid primary key default gen_random_uuid(),
  audit_event_id bigint not null references public.audit_events(id),
  semantic_event_id uuid references public.audit_semantic_events(id),
  mapping_status text not null check (mapping_status in ('mapped','generic_only','ambiguous','missing_fields','unsupported')),
  mapping_reason text not null,
  mapped_at timestamptz not null default now(),
  unique (audit_event_id, semantic_event_id, mapping_status)
);

create table if not exists public.audit_event_source_contracts (
  event_type text not null,
  schema_version integer not null default 1,
  source_object_type text not null,
  source_action text not null,
  primary key(event_type,schema_version,source_object_type,source_action),
  foreign key(event_type,schema_version) references public.audit_event_registry(event_type,schema_version)
);

create index if not exists idx_semantic_case_order
  on public.audit_semantic_events (case_ref, occurred_at desc, id desc);
create index if not exists idx_semantic_correlation_order
  on public.audit_semantic_events (correlation_id, occurred_at, id);
create index if not exists idx_semantic_aggregate
  on public.audit_semantic_events (aggregate_type, aggregate_id, occurred_at desc);
create index if not exists idx_semantic_source_audit
  on public.audit_semantic_events (source_audit_event_id) where source_audit_event_id is not null;

alter table public.audit_event_registry enable row level security;
alter table public.audit_event_ontology_versions enable row level security;
alter table public.audit_event_ontology_entries enable row level security;
alter table public.audit_event_order_constraints enable row level security;
alter table public.audit_semantic_events enable row level security;
alter table public.audit_event_semantic_mappings enable row level security;
alter table public.audit_event_source_contracts enable row level security;

create policy audit_registry_read on public.audit_event_registry for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
);
create policy audit_ontology_versions_read on public.audit_event_ontology_versions for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
);
create policy audit_ontology_entries_read on public.audit_event_ontology_entries for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
);
create policy audit_order_constraints_read on public.audit_event_order_constraints for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
);
create policy audit_semantic_read on public.audit_semantic_events for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
  and (source_audit_event_id is null or exists (
    select 1 from public.audit_events ae where ae.id = source_audit_event_id
  ))
);
create policy audit_semantic_mapping_read on public.audit_event_semantic_mappings for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
  and exists (select 1 from public.audit_events ae where ae.id = audit_event_id)
);

revoke insert, update, delete on public.audit_event_registry from anon, authenticated;
revoke insert, update, delete on public.audit_event_ontology_versions from anon, authenticated;
revoke insert, update, delete on public.audit_event_ontology_entries from anon, authenticated;
revoke insert, update, delete on public.audit_event_order_constraints from anon, authenticated;
revoke insert, update, delete on public.audit_semantic_events from anon, authenticated;
revoke insert, update, delete on public.audit_event_semantic_mappings from anon, authenticated;
revoke insert, update, delete on public.audit_event_source_contracts from anon, authenticated;

create or replace function public.block_semantic_audit_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'IMMUTABLE: semantic audit records are append-only (MVP2-M2-05) — % rejected', tg_op;
end $$;

drop trigger if exists trg_semantic_audit_immutable on public.audit_semantic_events;
create trigger trg_semantic_audit_immutable before update or delete on public.audit_semantic_events
for each row execute function public.block_semantic_audit_mutation();

drop trigger if exists trg_semantic_mapping_immutable on public.audit_event_semantic_mappings;
create trigger trg_semantic_mapping_immutable before update or delete on public.audit_event_semantic_mappings
for each row execute function public.block_semantic_audit_mutation();

drop trigger if exists trg_audit_registry_immutable on public.audit_event_registry;
create trigger trg_audit_registry_immutable before update or delete on public.audit_event_registry
for each row execute function public.block_semantic_audit_mutation();
drop trigger if exists trg_audit_ontology_entry_immutable on public.audit_event_ontology_entries;
create trigger trg_audit_ontology_entry_immutable before update or delete on public.audit_event_ontology_entries
for each row execute function public.block_semantic_audit_mutation();
drop trigger if exists trg_audit_order_constraint_immutable on public.audit_event_order_constraints;
create trigger trg_audit_order_constraint_immutable before update or delete on public.audit_event_order_constraints
for each row execute function public.block_semantic_audit_mutation();
drop trigger if exists trg_audit_ontology_published_immutable on public.audit_event_ontology_versions;
create trigger trg_audit_ontology_published_immutable before update or delete on public.audit_event_ontology_versions
for each row when (old.status = 'published') execute function public.block_semantic_audit_mutation();
drop trigger if exists trg_audit_source_contract_immutable on public.audit_event_source_contracts;
create trigger trg_audit_source_contract_immutable before update or delete on public.audit_event_source_contracts
for each row execute function public.block_semantic_audit_mutation();

create or replace function public.append_semantic_audit_event(
  p_event_type text,
  p_schema_version integer,
  p_occurred_at timestamptz,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_aggregate_ref text,
  p_aggregate_version text,
  p_case_type text,
  p_case_ref text,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_source_system text,
  p_source_action text,
  p_idempotency_key text,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_semantic_payload jsonb default '{}'::jsonb,
  p_field_provenance jsonb default '{}'::jsonb,
  p_evidence_refs text[] default '{}',
  p_evidence_hashes text[] default '{}',
  p_package_hash text default null,
  p_report_hash text default null,
  p_source_audit_event_id bigint default null,
  p_integrity_status text default 'not_assessed',
  p_chain_status text default 'not_assessed'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_roles text[];
  v_region text;
  v_org_scope text;
  v_required_fields text[];
  v_missing_field text;
  v_source public.audit_events%rowtype;
  v_existing public.audit_semantic_events%rowtype;
  v_payload jsonb;
  v_idempotency text;
  v_proven_case uuid;
  v_source_inspection uuid;
  v_case_type text := 'inspection.standard';
  v_evidence_hashes text[] := '{}';
  v_occurred_at timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select required_fields into v_required_fields from audit_event_registry where event_type = p_event_type and schema_version = p_schema_version and active;
  if v_required_fields is null then
    raise exception 'unsupported semantic event type/schema version' using errcode = '22023';
  end if;
  if p_source_audit_event_id is null then
    raise exception 'source_audit_event_id is required for authenticated semantic append' using errcode = '22023';
  end if;
  select * into v_source from audit_events where id = p_source_audit_event_id;
  if not found or v_source.actor is distinct from auth.uid()
    or v_source.object_type is distinct from p_aggregate_type
    or v_source.object_id is distinct from p_aggregate_id
    or v_source.action is distinct from p_source_action then
    raise exception 'source audit event does not prove actor/object/action scope' using errcode = '42501';
  end if;
  if p_source_system <> 'audit_events' then
    raise exception 'semantic append must preserve source system' using errcode = '22023';
  end if;
  if not exists (
    select 1 from audit_event_source_contracts
    where event_type=p_event_type and schema_version=p_schema_version
      and source_object_type=v_source.object_type and source_action=v_source.action
  ) then raise exception 'source object/action is not contracted for semantic event type' using errcode='42501'; end if;
  if v_source.object_type in ('checklist_responses','evidence','submission_versions','reviews') then
    v_source_inspection := (v_source.after_state->>'inspection_id')::uuid;
    select visit_id into v_proven_case from inspections where id=v_source_inspection;
  elsif v_source.object_type='inspections' then
    v_proven_case := (v_source.after_state->>'visit_id')::uuid;
  elsif v_source.object_type in ('visit_plans','regulations','package_versions') then
    v_proven_case := v_source.object_id;
    if v_source.object_type='visit_plans' then v_case_type := 'visit_plan';
    elsif v_source.object_type='regulations' then v_case_type := 'regulation';
    else v_case_type := 'package'; end if;
  end if;
  if v_proven_case is null or p_case_ref !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_correlation_id::text <> lower(p_case_ref) or p_correlation_id is distinct from v_proven_case then
    raise exception 'case_ref must be the correlation UUID' using errcode = '22023';
  end if;
  case p_event_type
    when 'VisitPlanCreated' then
      v_payload := jsonb_build_object('method',v_source.after_state->'method','status',v_source.after_state->'status','created_at',v_source.after_state->'created_at');
      v_occurred_at := (v_source.after_state->>'created_at')::timestamptz;
    when 'InspectionStarted' then
      if v_source.before_state->>'status' = v_source.after_state->>'status' or v_source.after_state->>'status' <> 'executing' then raise exception 'source does not prove inspection start' using errcode='22023'; end if;
      v_payload := jsonb_build_object('inspection_id',v_source.object_id,'visit_id',v_source.after_state->'visit_id','package_version_id',v_source.after_state->'package_version_id','start_time',v_source.after_state->'started_at');
      v_occurred_at := (v_source.after_state->>'started_at')::timestamptz;
    when 'AnswerSaved' then
      if v_source.action='UPDATE' and v_source.before_state->'response' is distinct from v_source.after_state->'response' then raise exception 'material answer update must map to FormAnswerChanged' using errcode='22023'; end if;
      v_payload := jsonb_build_object('inspection_id',v_source.after_state->'inspection_id','question_id',v_source.after_state->'item_id','answer',v_source.after_state->'response','validation_complete',v_source.after_state->'is_complete','saved_at',v_source.after_state->'updated_at');
      v_occurred_at := (v_source.after_state->>'updated_at')::timestamptz;
    when 'FormAnswerChanged' then
      if v_source.before_state->'response' is not distinct from v_source.after_state->'response' then raise exception 'source does not prove material answer change' using errcode='22023'; end if;
      v_payload := jsonb_build_object('inspection_id',v_source.after_state->'inspection_id','question_id',v_source.after_state->'item_id','previous_answer',v_source.before_state->'response','answer',v_source.after_state->'response');
      v_occurred_at := (v_source.after_state->>'updated_at')::timestamptz;
    when 'EvidenceCaptured' then
      v_payload := jsonb_build_object('inspection_id',v_source.after_state->'inspection_id','evidence_id',v_source.object_id,'hash',v_source.after_state->'content_sha256','captured_at',v_source.after_state->'captured_at');
      if v_source.after_state->>'content_sha256' is not null then v_evidence_hashes := array[v_source.after_state->>'content_sha256']; end if;
      v_occurred_at := (v_source.after_state->>'captured_at')::timestamptz;
    when 'InspectionSubmitted' then
      v_payload := jsonb_build_object('inspection_id',v_source.after_state->'inspection_id','submission_version_id',v_source.object_id,'version_number',v_source.after_state->'version_number','submit_time',v_source.after_state->'submitted_at');
      v_occurred_at := (v_source.after_state->>'submitted_at')::timestamptz;
    when 'SignatureRecorded' then
      if v_source.after_state->'acknowledgement' is null or v_source.after_state->'acknowledgement'='null'::jsonb then raise exception 'source does not prove acknowledgement' using errcode='22023'; end if;
      v_payload := jsonb_build_object('outcome','acknowledgement','verification_status','unverified');
      v_occurred_at := (v_source.after_state->>'submitted_at')::timestamptz;
    when 'ReviewDecisionRecorded' then
      if v_source.before_state->>'decided_at' is not null or v_source.after_state->>'decided_at' is null then raise exception 'source does not prove first review decision' using errcode='22023'; end if;
      v_payload := jsonb_build_object('inspection_id',v_source.after_state->'inspection_id','review_id',v_source.object_id,'decision',v_source.after_state->'decision','reason',v_source.after_state->'decision_reason','decided_at',v_source.after_state->'decided_at');
      v_occurred_at := (v_source.after_state->>'decided_at')::timestamptz;
    when 'RegulationVersionPublished' then
      if v_source.before_state->>'status'=v_source.after_state->>'status' or v_source.after_state->>'status'<>'published' then raise exception 'source does not prove regulation publication' using errcode='22023'; end if;
      v_payload := jsonb_build_object('regulation_id',v_source.object_id,'code',v_source.after_state->'code','status',v_source.after_state->'status');
    when 'OfflinePackageLocked' then
      if v_source.before_state->>'status'=v_source.after_state->>'status' or v_source.after_state->>'status'<>'locked' then raise exception 'source does not prove package lock' using errcode='22023'; end if;
      v_payload := jsonb_build_object('package_version_id',v_source.object_id,'version_label',v_source.after_state->'version_label','hash_status','NEEDS_CONTRACT');
    else raise exception 'no server-derived semantic mapper for contracted event' using errcode='22023';
  end case;
  v_occurred_at := coalesce(v_occurred_at,v_source.occurred_at);
  if p_causation_id is not null and not exists (
    select 1 from audit_semantic_events where id=p_causation_id and correlation_id=p_correlation_id and occurred_at <= v_occurred_at
  ) then raise exception 'causation must reference the same correlation' using errcode='22023'; end if;
  v_idempotency := format('audit:%s:%s:v%s',p_source_audit_event_id,p_event_type,p_schema_version);
  if (p_before_state is not null and p_before_state is distinct from v_source.before_state)
    or (p_after_state is not null and p_after_state is distinct from v_source.after_state)
    or (coalesce(p_semantic_payload,'{}'::jsonb) <> '{}'::jsonb and p_semantic_payload is distinct from v_payload)
    or coalesce(array_length(p_evidence_refs,1),0)>0 or coalesce(array_length(p_evidence_hashes,1),0)>0
    or p_package_hash is not null or p_report_hash is not null then
    raise exception 'caller-supplied fact fields must match server-derived source facts' using errcode='22023';
  end if;
  select field into v_missing_field from unnest(v_required_fields) field
  where not coalesce(v_payload,'{}'::jsonb) ? field
    or coalesce(v_payload,'{}'::jsonb)->field is null
    or coalesce(v_payload,'{}'::jsonb)->>field = '' limit 1;
  if v_missing_field is not null then
    raise exception 'missing required semantic field: %',v_missing_field using errcode='22023';
  end if;
  if exists (select 1 from unnest(v_evidence_hashes) h where h !~ '^[a-f0-9]{64}$') then
    raise exception 'evidence hashes must be lowercase sha256 hex' using errcode='22023';
  end if;
  if p_integrity_status <> 'not_assessed' or p_chain_status <> 'not_assessed' then
    raise exception 'callers cannot assert integrity or chain verification' using errcode='22023';
  end if;
  if nullif(btrim(p_case_ref),'') is null then
    raise exception 'case_ref is required' using errcode = '22023';
  end if;
  select coalesce(array_agg(role_key order by role_key), '{}') into v_roles
  from user_roles where user_id = auth.uid();
  select region, org_scope into v_region, v_org_scope from profiles where user_id = auth.uid();

  if p_event_type in ('VisitPlanCreated') and not has_role('planner') then
    raise exception 'not authorized to emit planning semantic event' using errcode='42501';
  elsif p_event_type in ('GeofenceCheckIn','AnswerSaved','FormAnswerChanged','EvidenceCaptured','FindingCreated','SignatureRecorded','DigitalSignatureCaptured','SignatureRefused','InspectionStarted','InspectionSubmitted','SyncCompleted','SyncConflictResolved','PackageDownloaded')
    and not has_role('inspector') then
    raise exception 'not authorized to emit field semantic event' using errcode='42501';
  elsif p_event_type in ('ReviewDecisionRecorded') and not has_any_role(array['reviewer','ops']) then
    raise exception 'not authorized to emit review semantic event' using errcode='42501';
  elsif p_event_type in ('RegulationVersionPublished','TemplatePublished','WorkflowActivated','RiskModelActivated','RiskScoreCalculated','OfflinePackageLocked','PackageCompiled')
    and not has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','ops']) then
    raise exception 'not authorized to emit configuration semantic event' using errcode='42501';
  elsif p_event_type in ('NoticeIssued','CorrectionOrObjectionEvent','CorrectionSubmitted','ObjectionFiled','CommitteeDecisionRecorded','AdminOverrideAttempted')
    and not has_any_role(array['compliance_admin','ops','reviewer','security_admin']) then
    raise exception 'not authorized to emit governed semantic event' using errcode='42501';
  elsif p_event_type='DashboardViewed' and not has_any_role(array['leadership','planner','ops','reviewer']) then
    raise exception 'not authorized to emit access semantic event' using errcode='42501';
  end if;

  insert into audit_semantic_events (
    event_type, schema_version, occurred_at, actor_id, actor_roles, actor_scope,
    aggregate_type, aggregate_id, aggregate_ref, aggregate_version,
    case_type, case_ref, correlation_id, causation_id,
    source_system, source_action, idempotency_key, before_state, after_state,
    semantic_payload, field_provenance, evidence_refs, evidence_hashes,
    package_hash, report_hash, source_audit_event_id, integrity_status, chain_status
  ) values (
    p_event_type, p_schema_version, v_occurred_at, auth.uid(), v_roles,
    jsonb_build_object('roles',v_roles,'region',v_region,'org_scope',v_org_scope), p_aggregate_type, p_aggregate_id,
    p_aggregate_id::text, null, v_case_type, p_case_ref,
    p_correlation_id, p_causation_id, p_source_system, p_source_action,
    v_idempotency, v_source.before_state, v_source.after_state, v_payload,
    jsonb_build_object('source','audit_events','audit_event_id',p_source_audit_event_id), '{}',
    v_evidence_hashes, null, null,
    p_source_audit_event_id, 'not_assessed', 'incomplete'
  ) on conflict (source_system, idempotency_key) do nothing returning id into v_id;

  if v_id is null then
    select * into v_existing from audit_semantic_events
    where source_system = p_source_system and idempotency_key = v_idempotency;
    if v_existing.event_type is distinct from p_event_type
      or v_existing.source_audit_event_id is distinct from p_source_audit_event_id
      or v_existing.semantic_payload is distinct from v_payload
      or v_existing.before_state is distinct from v_source.before_state
      or v_existing.after_state is distinct from v_source.after_state then
      raise exception 'idempotency key reused with different semantic fact' using errcode='23505';
    end if;
    v_id := v_existing.id;
  end if;
  insert into audit_event_semantic_mappings(audit_event_id,semantic_event_id,mapping_status,mapping_reason)
  values (p_source_audit_event_id,v_id,'mapped','Validated authenticated append')
  on conflict (audit_event_id,semantic_event_id,mapping_status) do nothing;
  return v_id;
end $$;

revoke all on function public.append_semantic_audit_event(text,integer,timestamptz,text,uuid,text,text,text,text,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,jsonb,text[],text[],text,text,bigint,text,text) from public, anon;
grant execute on function public.append_semantic_audit_event(text,integer,timestamptz,text,uuid,text,text,text,text,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,jsonb,text[],text[],text,text,bigint,text,text) to authenticated;

create or replace function public.audit_replay_case(
  p_case_ref text,
  p_limit integer default 100,
  p_before_occurred_at timestamptz default null,
  p_before_id uuid default null
) returns setof public.audit_semantic_events
language sql stable security invoker set search_path = public as $$
  select e.* from audit_semantic_events e
  where e.case_ref = p_case_ref
    and (p_before_occurred_at is null or (e.occurred_at, e.id) < (p_before_occurred_at, p_before_id))
  order by e.occurred_at desc, e.id desc
  limit greatest(1, least(coalesce(p_limit,100), 250));
$$;
grant execute on function public.audit_replay_case(text,integer,timestamptz,uuid) to authenticated;

create or replace function public.can_read_semantic_audit_object(p_aggregate_type text, p_aggregate_id uuid, p_source_audit_event_id bigint)
returns boolean language plpgsql stable security invoker set search_path=public as $$
begin
  if has_any_role(array['auditor','ops','security_admin']) then return true; end if;
  if p_aggregate_id is null then return false; end if;
  case p_aggregate_type
    when 'visit_plans' then return exists(select 1 from visit_plans where id=p_aggregate_id);
    when 'geo_events' then return exists(select 1 from geo_events where id=p_aggregate_id);
    when 'inspections' then return exists(select 1 from inspections where id=p_aggregate_id);
    when 'checklist_responses' then return exists(select 1 from checklist_responses where id=p_aggregate_id);
    when 'evidence' then return exists(select 1 from evidence where id=p_aggregate_id);
    when 'findings' then return exists(select 1 from findings where id=p_aggregate_id);
    when 'submission_versions' then return exists(select 1 from submission_versions where id=p_aggregate_id);
    when 'reviews' then return exists(select 1 from reviews where id=p_aggregate_id);
    when 'regulations' then return exists(select 1 from regulations where id=p_aggregate_id);
    when 'package_versions' then return exists(select 1 from package_versions where id=p_aggregate_id);
    else return p_source_audit_event_id is not null and exists(select 1 from audit_events where id=p_source_audit_event_id);
  end case;
end $$;
revoke all on function public.can_read_semantic_audit_object(text,uuid,bigint) from public,anon;
grant execute on function public.can_read_semantic_audit_object(text,uuid,bigint) to authenticated;

drop policy audit_semantic_read on public.audit_semantic_events;
create policy audit_semantic_read on public.audit_semantic_events for select using (
  has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])
  and can_read_semantic_audit_object(aggregate_type,aggregate_id,source_audit_event_id)
);

insert into public.audit_event_registry(event_type,schema_version,title,aliases,requirement_refs,acceptance_refs,required_fields,source_mapping_status)
values
('VisitPlanCreated',1,'Visit planned','{}',array['MVP2-REQ-0137','MVP2-REQ-0154'],array['MVP2-AC-0137','MVP2-AC-0154'],array['method','status','created_at'],'canonical'),
('PackageCompiled',1,'Package compiled','{}',array['MVP2-REQ-0138'],array['MVP2-AC-0138'],array['package_version','package_hash'],'needs_contract'),
('PackageDownloaded',1,'Package downloaded','{}',array['MVP2-REQ-0139','MVP2-REQ-0157'],array['MVP2-AC-0139','MVP2-AC-0157'],array['device_id','package_id','checksum'],'missing'),
('GeofenceCheckIn',1,'Geofence check-in',array['GeoCheckIn'],array['MVP2-REQ-0140','MVP2-REQ-0158'],array['MVP2-AC-0140','MVP2-AC-0158'],array['visit_id','accuracy_m','occurred_at'],'partial'),
('AnswerSaved',1,'Answer saved','{}',array['MVP2-REQ-0141'],array['MVP2-AC-0141'],array['question_id','answer','validation_complete','saved_at'],'canonical'),
('EvidenceCaptured',1,'Evidence captured','{}',array['MVP2-REQ-0142','MVP2-REQ-0161'],array['MVP2-AC-0142','MVP2-AC-0161'],array['evidence_id','hash','captured_at'],'canonical'),
('FindingCreated',1,'Finding created','{}',array['MVP2-REQ-0143','MVP2-REQ-0162'],array['MVP2-AC-0143','MVP2-AC-0162'],array['finding_id','item_id','severity'],'canonical'),
('SignatureRecorded',1,'Signature or refusal recorded',array['DigitalSignatureCaptured','SignatureRefused'],array['MVP2-REQ-0144'],array['MVP2-AC-0144'],array['outcome','verification_status'],'partial'),
('SyncCompleted',1,'Sync completed','{}',array['MVP2-REQ-0145'],array['MVP2-AC-0145'],array['uploaded_items','retry_count'],'missing'),
('ReviewDecisionRecorded',1,'Review decision recorded','{}',array['MVP2-REQ-0146','MVP2-REQ-0167'],array['MVP2-AC-0146','MVP2-AC-0167'],array['decision','reason'],'canonical'),
('NoticeIssued',1,'Enforcement notice issued',array['EnforcementIssued'],array['MVP2-REQ-0147'],array['MVP2-AC-0147'],array['notice_id','clause','delivery_status'],'partial'),
('CorrectionOrObjectionEvent',1,'Correction or objection closure','{}',array['MVP2-REQ-0148'],array['MVP2-AC-0148'],array['case_id','outcome'],'needs_contract'),
('RegulationVersionPublished',1,'Regulation version published','{}',array['MVP2-REQ-0149'],array['MVP2-AC-0149'],array['regulation_id','code','status'],'canonical'),
('TemplatePublished',1,'Template published','{}',array['MVP2-REQ-0150'],array['MVP2-AC-0150'],array['template_version','regulation_version'],'needs_contract'),
('WorkflowActivated',1,'Workflow activated','{}',array['MVP2-REQ-0151'],array['MVP2-AC-0151'],array['workflow_version','approval_id'],'needs_contract'),
('RiskModelActivated',1,'Risk model activated','{}',array['MVP2-REQ-0152'],array['MVP2-AC-0152'],array['model_version','approval_id'],'needs_contract'),
('RiskScoreCalculated',1,'Risk score calculated','{}',array['MVP2-REQ-0153'],array['MVP2-AC-0153'],array['factory_id','score','model_version'],'missing'),
('AssignmentAccepted',1,'Assignment accepted','{}',array['MVP2-REQ-0155'],array['MVP2-AC-0155'],array['assignment_id','accepted_at'],'needs_contract'),
('OfflinePackageLocked',1,'Offline package locked','{}',array['MVP2-REQ-0156'],array['MVP2-AC-0156'],array['package_version_id','hash_status'],'partial'),
('InspectionStarted',1,'Inspection started','{}',array['MVP2-REQ-0159'],array['MVP2-AC-0159'],array['inspection_id','start_time'],'canonical'),
('FormAnswerChanged',1,'Form answer changed','{}',array['MVP2-REQ-0160'],array['MVP2-AC-0160'],array['question_id','answer'],'canonical'),
('DigitalSignatureCaptured',1,'Digital signature captured','{}',array['MVP2-REQ-0163'],array['MVP2-AC-0163'],array['signer_id','method','report_hash','verification_status'],'needs_contract'),
('SignatureRefused',1,'Signature refused','{}',array['MVP2-REQ-0164'],array['MVP2-AC-0164'],array['reason','report_hash'],'needs_contract'),
('InspectionSubmitted',1,'Inspection submitted','{}',array['MVP2-REQ-0165'],array['MVP2-AC-0165'],array['inspection_id','submit_time'],'canonical'),
('SyncConflictResolved',1,'Sync conflict resolved','{}',array['MVP2-REQ-0166'],array['MVP2-AC-0166'],array['local_value','server_value','resolution_rule'],'missing'),
('CommitteeDecisionRecorded',1,'Committee decision recorded','{}',array['MVP2-REQ-0168'],array['MVP2-AC-0168'],array['outcome','rationale','effective_date'],'needs_contract'),
('CorrectionSubmitted',1,'Correction submitted','{}',array['MVP2-REQ-0169'],array['MVP2-AC-0169'],array['violation_id','submitted_at'],'needs_contract'),
('ObjectionFiled',1,'Objection filed','{}',array['MVP2-REQ-0170'],array['MVP2-AC-0170'],array['case_id','grounds','submitted_at'],'needs_contract'),
('DashboardViewed',1,'Dashboard viewed','{}',array['MVP2-REQ-0171'],array['MVP2-AC-0171'],array['dashboard','filters','data_snapshot_id'],'missing'),
('AdminOverrideAttempted',1,'Admin override attempted','{}',array['MVP2-REQ-0172'],array['MVP2-AC-0172'],array['object_id','reason','approval_flag'],'partial')
on conflict (event_type,schema_version) do nothing;

insert into public.audit_event_source_contracts(event_type,schema_version,source_object_type,source_action) values
('VisitPlanCreated',1,'visit_plans','INSERT'),
('InspectionStarted',1,'inspections','UPDATE'),
('AnswerSaved',1,'checklist_responses','INSERT'),
('AnswerSaved',1,'checklist_responses','UPDATE'),
('FormAnswerChanged',1,'checklist_responses','UPDATE'),
('EvidenceCaptured',1,'evidence','INSERT'),
('InspectionSubmitted',1,'submission_versions','INSERT'),
('SignatureRecorded',1,'submission_versions','INSERT'),
('ReviewDecisionRecorded',1,'reviews','UPDATE'),
('RegulationVersionPublished',1,'regulations','UPDATE'),
('OfflinePackageLocked',1,'package_versions','UPDATE')
on conflict do nothing;

with v as (
  insert into public.audit_event_ontology_versions(case_type,version_label,status,effective_from,published_at)
  values ('inspection.standard','MVP2-M2-05-v1','published',now(),now())
  on conflict (case_type,version_label) do nothing
  returning id
), version_id as (
  select id from v union all
  select id from public.audit_event_ontology_versions where case_type='inspection.standard' and version_label='MVP2-M2-05-v1' limit 1
)
insert into public.audit_event_ontology_entries(ontology_version_id,event_type,chapter,ordinal,required,branch_group,branch_minimum,expected_status,requirement_ref,acceptance_ref)
select version_id.id, x.event_type, x.chapter, x.ordinal, x.required, x.branch_group, x.branch_minimum, x.expected_status, x.req, x.ac
from version_id cross join (values
  ('VisitPlanCreated','planning',1,true,null,null,'recorded','MVP2-REQ-0137','MVP2-AC-0137'),
  ('PackageCompiled','package',2,true,null,null,'needs_contract','MVP2-REQ-0138','MVP2-AC-0138'),
  ('PackageDownloaded','package',3,true,null,null,'missing','MVP2-REQ-0139','MVP2-AC-0139'),
  ('GeofenceCheckIn','field',4,true,null,null,'partial','MVP2-REQ-0140','MVP2-AC-0140'),
  ('AnswerSaved','field',5,true,null,null,'recorded','MVP2-REQ-0141','MVP2-AC-0141'),
  ('EvidenceCaptured','field',6,true,null,null,'recorded','MVP2-REQ-0142','MVP2-AC-0142'),
  ('FindingCreated','field',7,true,null,null,'recorded','MVP2-REQ-0143','MVP2-AC-0143'),
  ('SignatureRecorded','closure',8,true,'signature-outcome',1,'partial','MVP2-REQ-0144','MVP2-AC-0144'),
  ('SyncCompleted','sync',9,true,null,null,'missing','MVP2-REQ-0145','MVP2-AC-0145'),
  ('ReviewDecisionRecorded','review',10,true,null,null,'recorded','MVP2-REQ-0146','MVP2-AC-0146'),
  ('NoticeIssued','enforcement',11,true,null,null,'partial','MVP2-REQ-0147','MVP2-AC-0147'),
  ('CorrectionOrObjectionEvent','closure',12,true,null,null,'needs_contract','MVP2-REQ-0148','MVP2-AC-0148'),
  ('RegulationVersionPublished','configuration',13,true,null,null,'recorded','MVP2-REQ-0149','MVP2-AC-0149'),
  ('TemplatePublished','configuration',14,true,null,null,'needs_contract','MVP2-REQ-0150','MVP2-AC-0150'),
  ('WorkflowActivated','configuration',15,true,null,null,'needs_contract','MVP2-REQ-0151','MVP2-AC-0151'),
  ('RiskModelActivated','risk',16,true,null,null,'needs_contract','MVP2-REQ-0152','MVP2-AC-0152'),
  ('RiskScoreCalculated','risk',17,true,null,null,'missing','MVP2-REQ-0153','MVP2-AC-0153'),
  ('VisitPlanCreated','planning',18,true,null,null,'recorded','MVP2-REQ-0154','MVP2-AC-0154'),
  ('AssignmentAccepted','planning',19,true,null,null,'needs_contract','MVP2-REQ-0155','MVP2-AC-0155'),
  ('OfflinePackageLocked','package',20,true,null,null,'partial','MVP2-REQ-0156','MVP2-AC-0156'),
  ('PackageDownloaded','package',21,true,null,null,'missing','MVP2-REQ-0157','MVP2-AC-0157'),
  ('GeofenceCheckIn','field',22,true,null,null,'recorded','MVP2-REQ-0158','MVP2-AC-0158'),
  ('InspectionStarted','field',23,true,null,null,'recorded','MVP2-REQ-0159','MVP2-AC-0159'),
  ('FormAnswerChanged','field',24,true,null,null,'recorded','MVP2-REQ-0160','MVP2-AC-0160'),
  ('EvidenceCaptured','field',25,true,null,null,'recorded','MVP2-REQ-0161','MVP2-AC-0161'),
  ('FindingCreated','field',26,true,null,null,'recorded','MVP2-REQ-0162','MVP2-AC-0162'),
  ('DigitalSignatureCaptured','closure',27,true,'signature-outcome',1,'needs_contract','MVP2-REQ-0163','MVP2-AC-0163'),
  ('SignatureRefused','closure',28,true,'signature-outcome',1,'needs_contract','MVP2-REQ-0164','MVP2-AC-0164'),
  ('InspectionSubmitted','submission',29,true,null,null,'recorded','MVP2-REQ-0165','MVP2-AC-0165'),
  ('SyncConflictResolved','sync',30,true,null,null,'missing','MVP2-REQ-0166','MVP2-AC-0166'),
  ('ReviewDecisionRecorded','review',31,true,null,null,'recorded','MVP2-REQ-0167','MVP2-AC-0167'),
  ('CommitteeDecisionRecorded','committee',32,true,null,null,'needs_contract','MVP2-REQ-0168','MVP2-AC-0168'),
  ('CorrectionSubmitted','correction',33,true,null,null,'needs_contract','MVP2-REQ-0169','MVP2-AC-0169'),
  ('ObjectionFiled','objection',34,true,null,null,'needs_contract','MVP2-REQ-0170','MVP2-AC-0170'),
  ('DashboardViewed','access',35,true,null,null,'missing','MVP2-REQ-0171','MVP2-AC-0171'),
  ('AdminOverrideAttempted','override',36,true,null,null,'partial','MVP2-REQ-0172','MVP2-AC-0172')
) as x(event_type,chapter,ordinal,required,branch_group,branch_minimum,expected_status,req,ac)
on conflict (ontology_version_id,requirement_ref) do nothing;

with version_id as (
  select id from public.audit_event_ontology_versions where case_type='inspection.standard' and version_label='MVP2-M2-05-v1'
)
insert into public.audit_event_order_constraints(ontology_version_id,event_type,must_follow_event_type,predecessor_required,guard_text)
select version_id.id,x.event_type,x.predecessor,x.predecessor_required,x.guard_text from version_id cross join (values
  ('PackageDownloaded','PackageCompiled',true,'Download cannot precede compilation'),
  ('GeofenceCheckIn','VisitPlanCreated',false,'When a plan fact belongs to this case it must precede field arrival; immediate visits have no plan predecessor'),
  ('InspectionStarted','GeofenceCheckIn',true,'Inspection start cannot precede check-in'),
  ('AnswerSaved','InspectionStarted',true,'Answers cannot precede inspection start'),
  ('FormAnswerChanged','InspectionStarted',true,'Answer changes cannot precede inspection start'),
  ('EvidenceCaptured','InspectionStarted',true,'Evidence cannot precede inspection start'),
  ('FindingCreated','InspectionStarted',true,'Findings cannot precede inspection start'),
  ('SignatureRecorded','InspectionStarted',true,'Closure cannot precede inspection start'),
  ('InspectionSubmitted','InspectionStarted',true,'Submission cannot precede inspection start'),
  ('ReviewDecisionRecorded','InspectionSubmitted',true,'Review cannot precede submission'),
  ('NoticeIssued','ReviewDecisionRecorded',true,'Notice cannot precede review'),
  ('CorrectionOrObjectionEvent','NoticeIssued',true,'Closure cannot precede notice')
) as x(event_type,predecessor,predecessor_required,guard_text)
on conflict do nothing;

-- Proven source emitters. These are additive AFTER triggers and never replace
-- the existing generic audit trigger. Facts without authoritative source
-- fields remain absent from the semantic stream.
create or replace function public.emit_mvp2_m2_05_semantic_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_event_type text;
  v_case_type text := 'inspection.standard';
  v_case_ref text;
  v_corr uuid;
  v_aggregate_type text := tg_table_name;
  v_aggregate_id uuid;
  v_payload jsonb := '{}'::jsonb;
  v_before jsonb;
  v_after jsonb;
  v_roles text[];
  v_idempotency text;
  v_occurred_at timestamptz;
  v_root_case uuid;
begin
  select coalesce(array_agg(role_key order by role_key), '{}') into v_roles
  from user_roles where user_id = auth.uid();

  if tg_table_name = 'visit_plans' and tg_op = 'INSERT' then
    v_event_type := 'VisitPlanCreated'; v_case_type := 'visit_plan';
    v_aggregate_id := new.id; v_case_ref := new.id::text; v_corr := new.id;
    v_payload := jsonb_build_object('method',new.method,'status',new.status,'created_at',new.created_at);
    v_after := to_jsonb(new); v_occurred_at := new.created_at;
  elsif tg_table_name = 'geo_events' and tg_op = 'INSERT' and new.kind in ('checkin','arrival','override') then
    v_event_type := 'GeofenceCheckIn'; v_case_type := 'visit';
    v_aggregate_id := new.id; v_case_ref := new.visit_id::text; v_corr := new.visit_id;
    v_payload := jsonb_build_object('visit_id',new.visit_id,'kind',new.kind,'accuracy_m',new.accuracy_m,'geofence_result',new.geofence_result,'gis_version',new.gis_version,'device_id',new.device_id,'occurred_at',new.occurred_at);
    v_after := to_jsonb(new); v_occurred_at := new.occurred_at;
  elsif tg_table_name = 'inspections' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'executing' then
    v_event_type := 'InspectionStarted'; v_aggregate_id := new.id;
    v_root_case := new.visit_id; v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.id,'visit_id',new.visit_id,'package_version_id',new.package_version_id,'start_time',new.started_at);
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := new.started_at;
  elsif tg_table_name = 'checklist_responses' and tg_op in ('INSERT','UPDATE') then
    v_event_type := case when tg_op='UPDATE' and old.response is distinct from new.response then 'FormAnswerChanged' else 'AnswerSaved' end;
    select visit_id into v_root_case from inspections where id=new.inspection_id;
    v_aggregate_id := new.id; v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'question_id',new.item_id,'previous_answer',case when tg_op='UPDATE' then old.response else null end,'answer',new.response,'validation_complete',new.is_complete,'saved_at',new.updated_at);
    if tg_op='UPDATE' then v_before := to_jsonb(old); end if; v_after := to_jsonb(new); v_occurred_at := new.updated_at;
  elsif tg_table_name = 'evidence' and tg_op = 'INSERT' then
    v_event_type := 'EvidenceCaptured'; select visit_id into v_root_case from inspections where id=new.inspection_id; v_aggregate_id := new.id;
    v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'evidence_id',new.id,'media_type',new.evidence_type,'hash',new.content_sha256,'gps',jsonb_build_array(new.captured_lat,new.captured_lng),'captured_at',new.captured_at,'linked_type',new.linked_type,'linked_id',new.linked_id);
    v_after := jsonb_build_object('id',new.id,'inspection_id',new.inspection_id,'content_sha256',new.content_sha256,'captured_at',new.captured_at,'linked_type',new.linked_type,'linked_id',new.linked_id); v_occurred_at := new.captured_at;
  elsif tg_table_name = 'findings' and tg_op = 'INSERT' then
    v_event_type := 'FindingCreated'; select visit_id into v_root_case from inspections where id=new.inspection_id; v_aggregate_id := new.id;
    v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'finding_id',new.id,'item_id',new.item_id,'severity',new.severity,'notes_present',length(new.description)>0);
    v_after := to_jsonb(new); v_occurred_at := now();
  elsif tg_table_name = 'submission_versions' and tg_op = 'INSERT' then
    v_event_type := 'InspectionSubmitted'; select visit_id into v_root_case from inspections where id=new.inspection_id; v_aggregate_id := new.id;
    v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'submission_version_id',new.id,'version_number',new.version_number,'submit_time',new.submitted_at,'acknowledgement_present',new.acknowledgement is not null);
    v_after := jsonb_build_object('id',new.id,'inspection_id',new.inspection_id,'version_number',new.version_number,'submitted_at',new.submitted_at); v_occurred_at := new.submitted_at;
  elsif tg_table_name = 'reviews' and tg_op = 'UPDATE' and old.decided_at is null and new.decided_at is not null then
    v_event_type := 'ReviewDecisionRecorded'; select visit_id into v_root_case from inspections where id=new.inspection_id; v_aggregate_id := new.id;
    v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'review_id',new.id,'submission_version_id',new.submission_version_id,'decision',new.decision,'reason',new.decision_reason,'next_status',new.status,'decided_at',new.decided_at);
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := new.decided_at;
  elsif tg_table_name = 'regulations' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'published' then
    v_event_type := 'RegulationVersionPublished'; v_case_type := 'regulation';
    v_aggregate_id := new.id; v_case_ref := new.id::text; v_corr := new.id;
    v_payload := jsonb_build_object('regulation_id',new.id,'code',new.code,'status',new.status);
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := now();
  elsif tg_table_name = 'package_versions' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'locked' then
    v_event_type := 'OfflinePackageLocked'; v_case_type := 'package';
    v_aggregate_id := new.id; v_case_ref := new.id::text; v_corr := new.id;
    v_payload := jsonb_build_object('package_version_id',new.id,'version_label',new.version_label,'status',new.status,'hash_status','NEEDS_CONTRACT');
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := now();
  else
    return coalesce(new,old);
  end if;

  v_occurred_at := coalesce(v_occurred_at,now());
  v_idempotency := format('%s:%s:%s:%s:%s:%s',tg_table_name,v_aggregate_id,tg_op,v_event_type,v_occurred_at,md5(coalesce(v_before,'null'::jsonb)::text||'|'||coalesce(v_after,'null'::jsonb)::text));
  insert into audit_semantic_events(
    event_type,schema_version,occurred_at,actor_id,actor_roles,actor_scope,
    aggregate_type,aggregate_id,aggregate_ref,case_type,case_ref,correlation_id,
    source_system,source_action,idempotency_key,before_state,after_state,
    semantic_payload,field_provenance,integrity_status,chain_status,ingestion_status
  ) values (
    v_event_type,1,v_occurred_at,auth.uid(),v_roles,
    jsonb_build_object('roles',v_roles),v_aggregate_type,v_aggregate_id,v_aggregate_id::text,
    v_case_type,v_case_ref,v_corr,'postgres-trigger',tg_table_name||'.'||tg_op,v_idempotency,
    v_before,v_after,v_payload,jsonb_build_object('source_table',tg_table_name,'source_operation',tg_op),
    'not_assessed','incomplete','recorded'
  ) on conflict (source_system,idempotency_key) do nothing;

  -- High-level acknowledgement fact only. It is deliberately not promoted to
  -- DigitalSignatureCaptured or PKI verification.
  if tg_table_name='submission_versions' and tg_op='INSERT' and new.acknowledgement is not null then
    insert into audit_semantic_events(
      event_type,schema_version,occurred_at,actor_id,actor_roles,actor_scope,
      aggregate_type,aggregate_id,aggregate_ref,case_type,case_ref,correlation_id,
      source_system,source_action,idempotency_key,semantic_payload,field_provenance,
      report_hash,integrity_status,chain_status,ingestion_status
    ) values (
      'SignatureRecorded',1,new.submitted_at,auth.uid(),v_roles,jsonb_build_object('roles',v_roles),
      'submission_versions',new.id,new.id::text,'inspection.standard',v_root_case::text,v_root_case,
      'postgres-trigger','submission_versions.INSERT',format('submission_versions:%s:SignatureRecorded',new.id),
      jsonb_build_object('outcome','acknowledgement','method','captured acknowledgement','verification_status','unverified'),
      jsonb_build_object('source_table','submission_versions','field','acknowledgement'),null,
      'unverified','incomplete','partial'
    ) on conflict (source_system,idempotency_key) do nothing;
  end if;
  return coalesce(new,old);
end $$;

do $$ declare t text;
begin
  foreach t in array array['visit_plans','geo_events','inspections','checklist_responses','evidence','findings','submission_versions','reviews','regulations','package_versions'] loop
    execute format('drop trigger if exists trg_mvp2_m2_05_semantic_%s on public.%I',t,t);
    execute format('create trigger trg_mvp2_m2_05_semantic_%s after insert or update on public.%I for each row execute function public.emit_mvp2_m2_05_semantic_event()',t,t);
  end loop;
end $$;
