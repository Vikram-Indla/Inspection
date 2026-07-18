-- ============================================================================
-- Migration 20260717250000 — TASK-MVP2-M2-05-AUDIT-REPLAY-001 (regression fix 2)
--
-- Second MVP1-regression fix in emit_mvp2_m2_05_semantic_event, surfaced live on
-- staging by the golden-journey arrival-evidence replay step.
--
-- ROOT CAUSE: visit-anchored evidence (arrival/cancellation) is inserted with
-- inspection_id = NULL and visit_id set (offline.ts outbox). The evidence branch
-- derived the case from `select visit_id from inspections where id=new.inspection_id`,
-- so with a NULL inspection_id v_root_case was NULL → case_ref := NULL → violated
-- audit_semantic_events.case_ref NOT NULL (23502) → the evidence INSERT aborted,
-- so arrival evidence never persisted (upload to storage succeeded, table insert
-- failed and the op stayed queued in the field outbox).
--
-- FIX: (1) the evidence branch uses new.visit_id when inspection_id is NULL;
--      (2) a NOT-NULL safety net before the append — case_ref / correlation_id
--          fall back to the aggregate id so no branch can ever emit a NULL key.
-- Semantics otherwise unchanged. Idempotent CREATE OR REPLACE.
-- ============================================================================

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
  elsif tg_table_name = 'geo_events' and tg_op = 'INSERT' then
    if new.kind not in ('checkin','arrival','override') then return coalesce(new,old); end if;
    v_event_type := 'GeofenceCheckIn'; v_case_type := 'visit';
    v_aggregate_id := new.id; v_case_ref := new.visit_id::text; v_corr := new.visit_id;
    v_payload := jsonb_build_object('visit_id',new.visit_id,'kind',new.kind,'accuracy_m',new.accuracy_m,'geofence_result',new.geofence_result,'gis_version',new.gis_version,'device_id',new.device_id,'occurred_at',new.occurred_at);
    v_after := to_jsonb(new); v_occurred_at := new.occurred_at;
  elsif tg_table_name = 'inspections' and tg_op = 'UPDATE' then
    if not (old.status is distinct from new.status and new.status = 'executing') then return coalesce(new,old); end if;
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
    v_event_type := 'EvidenceCaptured';
    if new.inspection_id is not null then select visit_id into v_root_case from inspections where id=new.inspection_id;
    else v_root_case := new.visit_id; end if;
    v_aggregate_id := new.id;
    v_case_ref := coalesce(v_root_case, new.visit_id)::text; v_corr := coalesce(v_root_case, new.visit_id);
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
  elsif tg_table_name = 'reviews' and tg_op = 'UPDATE' then
    if not (old.decided_at is null and new.decided_at is not null) then return coalesce(new,old); end if;
    v_event_type := 'ReviewDecisionRecorded'; select visit_id into v_root_case from inspections where id=new.inspection_id; v_aggregate_id := new.id;
    v_case_ref := v_root_case::text; v_corr := v_root_case;
    v_payload := jsonb_build_object('inspection_id',new.inspection_id,'review_id',new.id,'submission_version_id',new.submission_version_id,'decision',new.decision,'reason',new.decision_reason,'next_status',new.status,'decided_at',new.decided_at);
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := new.decided_at;
  elsif tg_table_name = 'regulations' and tg_op = 'UPDATE' then
    if not (old.status is distinct from new.status and new.status = 'published') then return coalesce(new,old); end if;
    v_event_type := 'RegulationVersionPublished'; v_case_type := 'regulation';
    v_aggregate_id := new.id; v_case_ref := new.id::text; v_corr := new.id;
    v_payload := jsonb_build_object('regulation_id',new.id,'code',new.code,'status',new.status);
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := now();
  elsif tg_table_name = 'package_versions' and tg_op = 'UPDATE' then
    if not (old.status is distinct from new.status and new.status = 'locked') then return coalesce(new,old); end if;
    v_event_type := 'OfflinePackageLocked'; v_case_type := 'package';
    v_aggregate_id := new.id; v_case_ref := new.id::text; v_corr := new.id;
    v_payload := jsonb_build_object('package_version_id',new.id,'version_label',new.version_label,'status',new.status,'hash_status','NEEDS_CONTRACT');
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_occurred_at := now();
  else
    return coalesce(new,old);
  end if;

  v_occurred_at := coalesce(v_occurred_at,now());
  -- NOT-NULL safety net: no branch may emit a NULL correlation/case key.
  v_corr := coalesce(v_corr, v_aggregate_id);
  v_case_ref := coalesce(v_case_ref, v_aggregate_id::text);
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

  if tg_table_name='submission_versions' and tg_op='INSERT' then
    if new.acknowledgement is not null then
      insert into audit_semantic_events(
        event_type,schema_version,occurred_at,actor_id,actor_roles,actor_scope,
        aggregate_type,aggregate_id,aggregate_ref,case_type,case_ref,correlation_id,
        source_system,source_action,idempotency_key,semantic_payload,field_provenance,
        report_hash,integrity_status,chain_status,ingestion_status
      ) values (
        'SignatureRecorded',1,new.submitted_at,auth.uid(),v_roles,jsonb_build_object('roles',v_roles),
        'submission_versions',new.id,new.id::text,'inspection.standard',
        coalesce(v_root_case, new.id)::text, coalesce(v_root_case, new.id),
        'postgres-trigger','submission_versions.INSERT',format('submission_versions:%s:SignatureRecorded',new.id),
        jsonb_build_object('outcome','acknowledgement','method','captured acknowledgement','verification_status','unverified'),
        jsonb_build_object('source_table','submission_versions','field','acknowledgement'),null,
        'unverified','incomplete','partial'
      ) on conflict (source_system,idempotency_key) do nothing;
    end if;
  end if;
  return coalesce(new,old);
end $$;
