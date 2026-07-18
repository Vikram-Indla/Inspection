-- MVP3 P01/P07/P09 enterprise control-plane foundation.
-- Additive only. No provider is enabled and no policy value is invented here.

create table if not exists public.mvp3_integration_endpoints (
  id uuid primary key default gen_random_uuid(),
  endpoint_key text not null unique,
  display_name text not null,
  endpoint_kind text not null check (endpoint_kind in ('ebda','identity','master_data','license','map','document','analytics','data_exchange','other')),
  contract_version text not null,
  status text not null default 'dependency_blocked' check (status in ('dependency_blocked','disabled','configured','degraded')),
  base_url text,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'configured' or nullif(base_url, '') is not null)
);

create table if not exists public.mvp3_api_events (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid references public.mvp3_integration_endpoints(id),
  event_kind text not null,
  direction text not null check (direction in ('inbound','outbound','internal')),
  outcome text not null check (outcome in ('accepted','rejected','blocked','failed','delivered')),
  correlation_id uuid not null default gen_random_uuid(),
  actor_id uuid default auth.uid() references public.profiles(user_id),
  object_type text,
  object_id text,
  payload_digest text,
  detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists mvp3_api_events_correlation_idx on public.mvp3_api_events(correlation_id, occurred_at desc);
create index if not exists mvp3_api_events_endpoint_idx on public.mvp3_api_events(endpoint_id, occurred_at desc);

create table if not exists public.mvp3_export_jobs (
  id uuid primary key default gen_random_uuid(),
  export_kind text not null,
  requested_by uuid not null default auth.uid() references public.profiles(user_id),
  purpose text not null check (length(btrim(purpose)) >= 8),
  status text not null default 'prepared' check (status in ('prepared','dependency_blocked','queued','delivered','failed','cancelled')),
  endpoint_id uuid references public.mvp3_integration_endpoints(id),
  object_scope jsonb not null default '{}'::jsonb,
  artifact_hash text,
  receipt jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  check (status <> 'delivered' or (artifact_hash is not null and completed_at is not null))
);
create index if not exists mvp3_export_jobs_status_idx on public.mvp3_export_jobs(status, requested_at desc);

create table if not exists public.mvp3_error_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  operation text not null,
  idempotency_key text not null unique,
  correlation_id uuid not null default gen_random_uuid(),
  status text not null default 'failed' check (status in ('failed','retry_requested','dependency_blocked','resolved','dead_letter')),
  attempt_count integer not null default 1 check (attempt_count >= 0),
  last_error_code text,
  safe_detail jsonb not null default '{}'::jsonb,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists mvp3_error_queue_work_idx on public.mvp3_error_queue(status, next_attempt_at, created_at);

create table if not exists public.mvp3_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null,
  version integer not null default 1 check (version > 0),
  description text not null,
  enabled boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','retired')),
  created_by uuid not null default auth.uid() references public.profiles(user_id),
  approved_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(flag_key, version),
  check (status <> 'published' or (approved_by is not null and approved_by <> created_by and published_at is not null))
);

create table if not exists public.mvp3_access_reviews (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references public.profiles(user_id),
  scope text not null,
  purpose text not null,
  status text not null default 'open' check (status in ('open','retain','revoke','expired')),
  opened_by uuid not null default auth.uid() references public.profiles(user_id),
  reviewed_by uuid references public.profiles(user_id),
  review_reason text,
  due_at timestamptz not null,
  opened_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (status = 'open' or (reviewed_by is not null and reviewed_by <> subject_user_id and length(btrim(review_reason)) >= 8))
);
create index if not exists mvp3_access_reviews_due_idx on public.mvp3_access_reviews(status, due_at);

create table if not exists public.mvp3_evidence_access_grants (
  id uuid primary key default gen_random_uuid(),
  grantee_user_id uuid not null references public.profiles(user_id),
  evidence_scope jsonb not null,
  purpose text not null check (length(btrim(purpose)) >= 8),
  granted_by uuid not null default auth.uid() references public.profiles(user_id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > granted_at)
);
create index if not exists mvp3_evidence_access_grants_grantee_idx on public.mvp3_evidence_access_grants(grantee_user_id, expires_at);

create table if not exists public.mvp3_devices (
  id uuid primary key default gen_random_uuid(),
  device_identifier text not null unique,
  platform text not null check (platform in ('ipad_os','web_managed')),
  assigned_user_id uuid references public.profiles(user_id),
  trust_status text not null default 'pending' check (trust_status in ('pending','trusted','suspended','revoked','wipe_pending','wiped')),
  mdm_reference text,
  app_version text,
  app_version_compliant boolean not null default false,
  last_seen_at timestamptz,
  enrolled_by uuid not null default auth.uid() references public.profiles(user_id),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trust_status <> 'trusted' or (nullif(mdm_reference,'') is not null and app_version_compliant))
);
create index if not exists mvp3_devices_assignee_idx on public.mvp3_devices(assigned_user_id, trust_status);

create table if not exists public.mvp3_device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.mvp3_devices(id),
  requested_device_identifier text not null,
  command text not null check (command in ('suspend','resume','remote_wipe','expire_packages')),
  status text not null default 'queued' check (status in ('queued','acknowledged','completed','failed','dependency_blocked')),
  reason text not null check (length(btrim(reason)) >= 8),
  requested_by uuid not null default auth.uid() references public.profiles(user_id),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists mvp3_device_commands_device_idx on public.mvp3_device_commands(device_id, requested_at desc);

create table if not exists public.mvp3_inspection_package_manifests (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null unique references public.inspections(id),
  package_version_id uuid not null references public.package_versions(id),
  workflow_version_id uuid references public.config_versions(id),
  manifest jsonb not null,
  manifest_hash text not null unique check (manifest_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  compiled_by uuid not null default auth.uid() references public.profiles(user_id),
  compiled_at timestamptz not null default now(),
  check (expires_at > compiled_at)
);
create index if not exists mvp3_package_manifests_package_idx on public.mvp3_inspection_package_manifests(package_version_id, compiled_at desc);

create table if not exists public.mvp3_package_access_events (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.mvp3_inspection_package_manifests(id),
  device_id uuid not null references public.mvp3_devices(id),
  actor_id uuid not null default auth.uid() references public.profiles(user_id),
  outcome text not null check (outcome in ('opened','denied_missing','denied_untrusted','denied_unassigned','denied_expired','denied_app_version')),
  reason text,
  occurred_at timestamptz not null default now()
);
create index if not exists mvp3_package_access_events_manifest_idx on public.mvp3_package_access_events(manifest_id, occurred_at desc);

create table if not exists public.mvp3_signature_refusals (
  id uuid primary key default gen_random_uuid(),
  signature_act_id uuid not null unique references public.signature_acts(id),
  refusal_reason text not null check (length(btrim(refusal_reason)) >= 8),
  witness_name text,
  inspector_statement text not null check (length(btrim(inspector_statement)) >= 8),
  device_context jsonb not null,
  location_context jsonb not null,
  workflow_continuation text not null,
  recorded_by uuid not null default auth.uid() references public.profiles(user_id),
  recorded_at timestamptz not null default now()
);

create table if not exists public.mvp3_kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  version integer not null default 1 check (version > 0),
  title_en text not null,
  title_ar text,
  owner_role text not null references public.roles(role_key),
  formula text not null,
  source_lineage jsonb not null,
  refresh_cadence text not null,
  retention_status text not null default 'policy_unresolved' check (retention_status in ('policy_unresolved','configured')),
  status text not null default 'draft' check (status in ('draft','published','retired')),
  created_by uuid not null default auth.uid() references public.profiles(user_id),
  approved_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(metric_key, version),
  check (status <> 'published' or (approved_by is not null and approved_by <> created_by and published_at is not null))
);

create or replace function public.mvp3_block_append_only_mutation() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end $$;

create or replace function public.mvp3_enforce_maker_checker() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if auth.uid() is null or new.approved_by is distinct from auth.uid() or old.created_by = auth.uid() then
      raise exception 'independent authenticated checker required' using errcode = '42501';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_mvp3_api_events_append_only on public.mvp3_api_events;
create trigger trg_mvp3_api_events_append_only before update or delete on public.mvp3_api_events
for each row execute function public.mvp3_block_append_only_mutation();
drop trigger if exists trg_mvp3_device_commands_append_only on public.mvp3_device_commands;
create trigger trg_mvp3_device_commands_append_only before update or delete on public.mvp3_device_commands
for each row execute function public.mvp3_block_append_only_mutation();
drop trigger if exists trg_mvp3_package_manifests_append_only on public.mvp3_inspection_package_manifests;
create trigger trg_mvp3_package_manifests_append_only before update or delete on public.mvp3_inspection_package_manifests
for each row execute function public.mvp3_block_append_only_mutation();
drop trigger if exists trg_mvp3_package_access_events_append_only on public.mvp3_package_access_events;
create trigger trg_mvp3_package_access_events_append_only before update or delete on public.mvp3_package_access_events
for each row execute function public.mvp3_block_append_only_mutation();
drop trigger if exists trg_mvp3_signature_refusals_append_only on public.mvp3_signature_refusals;
create trigger trg_mvp3_signature_refusals_append_only before update or delete on public.mvp3_signature_refusals
for each row execute function public.mvp3_block_append_only_mutation();
drop trigger if exists trg_mvp3_feature_flags_checker on public.mvp3_feature_flags;
create trigger trg_mvp3_feature_flags_checker before update on public.mvp3_feature_flags
for each row execute function public.mvp3_enforce_maker_checker();
drop trigger if exists trg_mvp3_kpi_definitions_checker on public.mvp3_kpi_definitions;
create trigger trg_mvp3_kpi_definitions_checker before update on public.mvp3_kpi_definitions
for each row execute function public.mvp3_enforce_maker_checker();

create or replace function public.mvp3_publish_feature_flag(p_flag_id uuid) returns public.mvp3_feature_flags
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.mvp3_feature_flags;
begin
  if auth.uid() is null or not has_role('security_admin') then raise exception 'not authorized' using errcode='42501'; end if;
  select * into v from public.mvp3_feature_flags where id = p_flag_id for update;
  if not found or v.status <> 'draft' then raise exception 'flag is not a draft' using errcode='22023'; end if;
  if v.created_by = auth.uid() then raise exception 'maker cannot approve own flag' using errcode='42501'; end if;
  update public.mvp3_feature_flags set status='published', approved_by=auth.uid(), published_at=now() where id=p_flag_id returning * into v;
  return v;
end $$;

create or replace function public.mvp3_request_error_retry(p_error_id uuid) returns public.mvp3_error_queue
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.mvp3_error_queue;
begin
  if auth.uid() is null or not (has_role('ops') or has_role('security_admin')) then raise exception 'not authorized' using errcode='42501'; end if;
  update public.mvp3_error_queue set status='retry_requested', attempt_count=attempt_count+1,
    next_attempt_at=now(), updated_at=now() where id=p_error_id and status in ('failed','dependency_blocked') returning * into v;
  if not found then raise exception 'error is not retryable' using errcode='22023'; end if;
  return v;
end $$;

create or replace function public.mvp3_decide_access_review(p_review_id uuid, p_decision text, p_reason text) returns public.mvp3_access_reviews
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.mvp3_access_reviews;
begin
  if auth.uid() is null or not has_role('security_admin') then raise exception 'not authorized' using errcode='42501'; end if;
  if p_decision not in ('retain','revoke') or length(btrim(p_reason)) < 8 then raise exception 'invalid decision or reason' using errcode='22023'; end if;
  select * into v from public.mvp3_access_reviews where id=p_review_id for update;
  if not found or v.status <> 'open' then raise exception 'review is not open' using errcode='22023'; end if;
  if v.subject_user_id=auth.uid() then raise exception 'subject cannot review own access' using errcode='42501'; end if;
  update public.mvp3_access_reviews set status=p_decision, reviewed_by=auth.uid(), review_reason=p_reason, reviewed_at=now() where id=p_review_id returning * into v;
  return v;
end $$;

create or replace function public.mvp3_issue_device_command(p_device_id uuid, p_command text, p_reason text) returns public.mvp3_device_commands
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.mvp3_device_commands;
begin
  if auth.uid() is null or not (has_role('ops') or has_role('security_admin')) then raise exception 'not authorized' using errcode='42501'; end if;
  if p_command not in ('suspend','resume','remote_wipe','expire_packages') or length(btrim(p_reason)) < 8 then raise exception 'invalid command or reason' using errcode='22023'; end if;
  insert into public.mvp3_device_commands(device_id,command,reason) values(p_device_id,p_command,p_reason) returning * into v;
  if p_command='suspend' then update public.mvp3_devices set trust_status='suspended',updated_at=now() where id=p_device_id;
  elsif p_command='resume' then update public.mvp3_devices set trust_status='trusted',updated_at=now() where id=p_device_id;
  elsif p_command='remote_wipe' then update public.mvp3_devices set trust_status='wipe_pending',updated_at=now() where id=p_device_id;
  end if;
  return v;
end $$;

create or replace function public.mvp3_compile_inspection_package(
  p_inspection_id uuid, p_package_version_id uuid, p_workflow_version_id uuid,
  p_manifest jsonb, p_expires_at timestamptz
) returns public.mvp3_inspection_package_manifests
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v public.mvp3_inspection_package_manifests; v_hash text;
begin
  if auth.uid() is null or not (has_role('form_admin') or has_role('planner') or has_role('security_admin')) then
    raise exception 'not authorized to compile package' using errcode='42501';
  end if;
  if p_manifest is null or jsonb_typeof(p_manifest) <> 'object' or p_expires_at <= now() then
    raise exception 'complete manifest and future expiry required' using errcode='22023';
  end if;
  if not (p_manifest ?& array['forms','clauses','evidence_rules','report_template','locales']) then
    raise exception 'manifest dependencies incomplete' using errcode='22023';
  end if;
  v_hash := encode(digest(convert_to(p_manifest::text,'UTF8'),'sha256'),'hex');
  insert into public.mvp3_inspection_package_manifests(
    inspection_id,package_version_id,workflow_version_id,manifest,manifest_hash,expires_at
  ) values(p_inspection_id,p_package_version_id,p_workflow_version_id,p_manifest,v_hash,p_expires_at)
  returning * into v;
  return v;
end $$;

create or replace function public.mvp3_open_inspection_package(p_manifest_id uuid, p_device_identifier text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_manifest public.mvp3_inspection_package_manifests; v_device public.mvp3_devices; v_outcome text;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_manifest from public.mvp3_inspection_package_manifests where id=p_manifest_id;
  select * into v_device from public.mvp3_devices where device_identifier=p_device_identifier;
  if v_manifest.id is null then v_outcome := 'denied_missing';
  elsif v_device.id is null or v_device.assigned_user_id is distinct from auth.uid() then v_outcome := 'denied_unassigned';
  elsif v_device.trust_status <> 'trusted' then v_outcome := 'denied_untrusted';
  elsif not v_device.app_version_compliant then v_outcome := 'denied_app_version';
  elsif v_manifest.expires_at <= now() then v_outcome := 'denied_expired';
  else v_outcome := 'opened'; end if;
  if v_manifest.id is not null then
    insert into public.mvp3_package_access_events(manifest_id,device_id,requested_device_identifier,outcome,reason)
    values(v_manifest.id,v_device.id,p_device_identifier,v_outcome,case when v_outcome='opened' then null else v_outcome end);
  end if;
  if v_outcome <> 'opened' then
    return jsonb_build_object('status','denied','reason',v_outcome);
  end if;
  return jsonb_build_object('status','opened','manifest_hash',v_manifest.manifest_hash);
end $$;

create or replace function public.mvp3_record_signature_refusal(
  p_refusal_reason text, p_witness_name text, p_inspector_statement text,
  p_device_context jsonb, p_location_context jsonb, p_workflow_continuation text
) returns public.mvp3_signature_refusals
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_act uuid; v public.mvp3_signature_refusals;
begin
  if auth.uid() is null or not (has_role('inspector') or has_role('reviewer') or has_role('compliance_admin')) then
    raise exception 'not authorized to record refusal' using errcode='42501';
  end if;
  if length(btrim(p_refusal_reason)) < 8 or length(btrim(p_inspector_statement)) < 8 or
     p_device_context is null or p_location_context is null or length(btrim(p_workflow_continuation)) < 3 then
    raise exception 'refusal reason, inspector statement, device/location context and continuation are required' using errcode='22023';
  end if;
  insert into public.signature_acts(kind,method,outcome,verification_status,actor_user)
  values('refusal','refusal','refused','unverified',auth.uid()) returning id into v_act;
  insert into public.mvp3_signature_refusals(signature_act_id,refusal_reason,witness_name,inspector_statement,device_context,location_context,workflow_continuation)
  values(v_act,p_refusal_reason,nullif(btrim(p_witness_name),''),p_inspector_statement,p_device_context,p_location_context,p_workflow_continuation)
  returning * into v;
  return v;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'mvp3_integration_endpoints','mvp3_api_events','mvp3_export_jobs','mvp3_error_queue',
    'mvp3_feature_flags','mvp3_access_reviews','mvp3_evidence_access_grants','mvp3_devices',
    'mvp3_device_commands','mvp3_inspection_package_manifests','mvp3_package_access_events','mvp3_signature_refusals','mvp3_kpi_definitions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select on public.mvp3_integration_endpoints, public.mvp3_api_events, public.mvp3_export_jobs,
  public.mvp3_error_queue, public.mvp3_feature_flags, public.mvp3_access_reviews,
  public.mvp3_evidence_access_grants, public.mvp3_devices, public.mvp3_device_commands,
  public.mvp3_inspection_package_manifests, public.mvp3_package_access_events, public.mvp3_signature_refusals,
  public.mvp3_kpi_definitions to authenticated;
grant insert, update on public.mvp3_integration_endpoints, public.mvp3_evidence_access_grants to authenticated;
grant insert on public.mvp3_feature_flags, public.mvp3_access_reviews, public.mvp3_devices,
  public.mvp3_kpi_definitions to authenticated;
grant insert on public.mvp3_api_events, public.mvp3_export_jobs, public.mvp3_error_queue,
  public.mvp3_device_commands to authenticated;
grant execute on function public.mvp3_publish_feature_flag(uuid), public.mvp3_request_error_retry(uuid),
  public.mvp3_decide_access_review(uuid,text,text), public.mvp3_issue_device_command(uuid,text,text),
  public.mvp3_compile_inspection_package(uuid,uuid,uuid,jsonb,timestamptz), public.mvp3_open_inspection_package(uuid,text),
  public.mvp3_record_signature_refusal(text,text,text,jsonb,jsonb,text) to authenticated;
revoke all on function public.mvp3_publish_feature_flag(uuid), public.mvp3_request_error_retry(uuid),
  public.mvp3_decide_access_review(uuid,text,text), public.mvp3_issue_device_command(uuid,text,text) from public, anon;
revoke all on function public.mvp3_compile_inspection_package(uuid,uuid,uuid,jsonb,timestamptz),
  public.mvp3_open_inspection_package(uuid,text), public.mvp3_record_signature_refusal(text,text,text,jsonb,jsonb,text) from public, anon;

create policy mvp3_integrations_read on public.mvp3_integration_endpoints for select to authenticated
  using ((select has_role('security_admin')) or (select has_role('workflow_admin')));
create policy mvp3_integrations_write on public.mvp3_integration_endpoints for all to authenticated
  using ((select has_role('security_admin'))) with check ((select has_role('security_admin')));
create policy mvp3_api_events_read on public.mvp3_api_events for select to authenticated
  using ((select has_role('security_admin')) or (select has_role('ops')) or (select has_role('auditor')));
create policy mvp3_api_events_insert on public.mvp3_api_events for insert to authenticated
  with check (actor_id=(select auth.uid()) and ((select has_role('security_admin')) or (select has_role('ops')) or (select has_role('workflow_admin'))));
create policy mvp3_exports_read on public.mvp3_export_jobs for select to authenticated
  using (requested_by=(select auth.uid()) or (select has_role('security_admin')) or (select has_role('auditor')) or (select has_role('leadership')));
create policy mvp3_exports_insert on public.mvp3_export_jobs for insert to authenticated
  with check (requested_by=(select auth.uid()));
create policy mvp3_errors_read on public.mvp3_error_queue for select to authenticated
  using ((select has_role('ops')) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_errors_insert on public.mvp3_error_queue for insert to authenticated
  with check ((select has_role('ops')) or (select has_role('security_admin')));
create policy mvp3_flags_read on public.mvp3_feature_flags for select to authenticated using (true);
create policy mvp3_flags_insert on public.mvp3_feature_flags for insert to authenticated
  with check ((select has_role('security_admin')) and created_by=(select auth.uid()) and status='draft' and approved_by is null);
create policy mvp3_access_reviews_read on public.mvp3_access_reviews for select to authenticated
  using (subject_user_id=(select auth.uid()) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_access_reviews_insert on public.mvp3_access_reviews for insert to authenticated
  with check ((select has_role('security_admin')) and opened_by=(select auth.uid()) and status='open' and reviewed_by is null);
create policy mvp3_evidence_grants_read on public.mvp3_evidence_access_grants for select to authenticated
  using (grantee_user_id=(select auth.uid()) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_evidence_grants_write on public.mvp3_evidence_access_grants for all to authenticated
  using ((select has_role('security_admin'))) with check ((select has_role('security_admin')) and granted_by=(select auth.uid()));
create policy mvp3_devices_read on public.mvp3_devices for select to authenticated
  using (assigned_user_id=(select auth.uid()) or (select has_role('ops')) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_devices_insert on public.mvp3_devices for insert to authenticated
  with check (((select has_role('ops')) or (select has_role('security_admin'))) and enrolled_by=(select auth.uid()) and trust_status='pending');
create policy mvp3_device_commands_read on public.mvp3_device_commands for select to authenticated
  using ((select has_role('ops')) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_device_commands_insert on public.mvp3_device_commands for insert to authenticated
  with check (requested_by=(select auth.uid()) and ((select has_role('ops')) or (select has_role('security_admin'))));
create policy mvp3_package_manifests_read on public.mvp3_inspection_package_manifests for select to authenticated
  using (
    (select has_role('form_admin')) or (select has_role('planner')) or (select has_role('security_admin')) or
    exists (
      select 1 from public.inspections i join public.assignments a on a.visit_id=i.visit_id
      where i.id=inspection_id and a.inspector_id=(select auth.uid())
    )
  );
create policy mvp3_package_access_events_read on public.mvp3_package_access_events for select to authenticated
  using (actor_id=(select auth.uid()) or (select has_role('ops')) or (select has_role('security_admin')) or (select has_role('auditor')));
create policy mvp3_signature_refusals_read on public.mvp3_signature_refusals for select to authenticated
  using (recorded_by=(select auth.uid()) or (select has_role('reviewer')) or (select has_role('compliance_admin')) or (select has_role('auditor')));
create policy mvp3_kpis_read on public.mvp3_kpi_definitions for select to authenticated using (true);
create policy mvp3_kpis_insert on public.mvp3_kpi_definitions for insert to authenticated
  with check (((select has_role('leadership')) or (select has_role('security_admin'))) and created_by=(select auth.uid()) and status='draft' and approved_by is null);

insert into public.mvp3_integration_endpoints(endpoint_key,display_name,endpoint_kind,contract_version,status,created_by)
select x.endpoint_key,x.display_name,x.endpoint_kind,'UNAPPROVED', 'dependency_blocked', p.user_id
from (values
  ('ebda','EBDA data exchange','ebda'),('external_identity','External identity and SSO','identity'),
  ('mapbox','Mapbox runtime','map'),('digital_signature','Digital signature trust service','document')
) x(endpoint_key,display_name,endpoint_kind)
cross join lateral (select user_id from public.profiles order by created_at nulls last limit 1) p
on conflict(endpoint_key) do nothing;
