-- Approval / Enforcement P0 contracts.
-- CR-449..470, CR-473..478; CMP-REQ-APQ-001..006; DEC-F; DEC-L.
-- PO direction: explicit CCR vocabulary; CR-471/472 remain Not configured.

-- 1. Explicit CCR vocabulary and typed snapshots.
alter table public.compliance_request_components
  drop constraint if exists compliance_request_components_entity_kind_check;
alter table public.compliance_request_components
  add constraint compliance_request_components_entity_kind_check check (entity_kind in (
    'regulation','inspection_item','violation','penalty','evidence_rule',
    'package','package_item','template_assignment','action_form_trigger',
    'section','item_rule','response_mapping','compliance_mapping',
    'conditional_visibility','conditional_mandatory','response_evidence_rule',
    'violation_trigger','action_form_requirement'
  ));
alter table public.compliance_entity_versions
  drop constraint if exists compliance_entity_versions_entity_kind_check;
alter table public.compliance_entity_versions
  add constraint compliance_entity_versions_entity_kind_check check (entity_kind in (
    'regulation','inspection_item','violation','penalty','evidence_rule',
    'package','package_item','template_assignment','action_form_trigger',
    'section','item_rule','response_mapping','compliance_mapping',
    'conditional_visibility','conditional_mandatory','response_evidence_rule',
    'violation_trigger','action_form_requirement'
  ));
alter table public.compliance_entity_heads
  drop constraint if exists compliance_entity_heads_entity_kind_check;
alter table public.compliance_entity_heads
  add constraint compliance_entity_heads_entity_kind_check check (entity_kind in (
    'regulation','inspection_item','violation','penalty','evidence_rule',
    'package','package_item','template_assignment','action_form_trigger',
    'section','item_rule','response_mapping','compliance_mapping',
    'conditional_visibility','conditional_mandatory','response_evidence_rule',
    'violation_trigger','action_form_requirement'
  ));

create or replace function private.ccr_validate_snapshot(p_kind text,p_value jsonb)
returns void language plpgsql set search_path='' as $$
declare required_keys text[]; k text; j jsonb;
begin
  if jsonb_typeof(p_value) is distinct from 'object' or p_value='{}'::jsonb then
    raise exception using errcode='23514',message='CCR_SNAPSHOT_OBJECT_REQUIRED';
  end if;
  required_keys := case p_kind
    when 'regulation' then array['code','title','issuing_authority']
    when 'inspection_item' then array['code','title','response_type','regulation_version_id']
    when 'violation' then array['code','title','severity','inspection_item_version_id']
    when 'penalty' then array['penalty_type','violation_version_id']
    when 'evidence_rule' then array['inspection_item_version_id','evidence_types','mandatory']
    when 'package' then array['code','title','sections']
    when 'package_item' then array['package_version_id','inspection_item_version_id','display_order']
    when 'template_assignment' then array['target_version_id','template_version_id']
    when 'action_form_trigger' then array['violation_version_id','template_version_id','mandatory']
    when 'section' then array['key','title','display_order']
    when 'item_rule' then array['inspection_item_version_id','mandatory','display_order']
    when 'response_mapping' then array['inspection_item_version_id','responses']
    when 'compliance_mapping' then array['inspection_item_version_id','outcomes']
    when 'conditional_visibility' then array['inspection_item_version_id','condition']
    when 'conditional_mandatory' then array['inspection_item_version_id','condition']
    when 'response_evidence_rule' then array['inspection_item_version_id','response_value','evidence_types']
    when 'violation_trigger' then array['inspection_item_version_id','response_value','violation_version_id']
    when 'action_form_requirement' then array['violation_version_id','template_version_id','mandatory']
    else null
  end;
  if required_keys is null then
    raise exception using errcode='23514',message='CCR_COMPONENT_KIND_INVALID';
  end if;
  foreach k in array required_keys loop
    if not p_value?k or p_value->k in ('null'::jsonb,'""'::jsonb) then
      raise exception using errcode='23514',message='CCR_REQUIRED_FIELD:'||k;
    end if;
  end loop;
  for k,j in select key,value from jsonb_each(p_value) loop
    if k like '%\_version_id' escape '\' then
      if jsonb_typeof(j)<>'string' then raise exception using errcode='23514',message='CCR_VERSION_REFERENCE_INVALID:'||k; end if;
      begin perform (j#>>'{}')::uuid;
      exception when invalid_text_representation then
        raise exception using errcode='23514',message='CCR_VERSION_REFERENCE_INVALID:'||k;
      end;
    end if;
  end loop;
  if p_value?'mandatory' and jsonb_typeof(p_value->'mandatory')<>'boolean' then
    raise exception using errcode='23514',message='CCR_BOOLEAN_REQUIRED:mandatory';
  end if;
  if p_value?'display_order' and (
    jsonb_typeof(p_value->'display_order')<>'number' or (p_value->>'display_order')::numeric<0
  ) then raise exception using errcode='23514',message='CCR_DISPLAY_ORDER_INVALID'; end if;
  if p_value?'evidence_types' and jsonb_typeof(p_value->'evidence_types')<>'array' then
    raise exception using errcode='23514',message='CCR_EVIDENCE_TYPES_ARRAY_REQUIRED';
  end if;
  if p_value?'sections' and jsonb_typeof(p_value->'sections')<>'array' then
    raise exception using errcode='23514',message='CCR_SECTIONS_ARRAY_REQUIRED';
  end if;
end $$;

create or replace function private.ccr_validate_component_trigger()
returns trigger language plpgsql set search_path='' as $$
begin perform private.ccr_validate_snapshot(new.entity_kind,new.proposed_value_snapshot); return new; end $$;
drop trigger if exists trg_ccr_typed_component on public.compliance_request_components;
create trigger trg_ccr_typed_component before insert or update of entity_kind,proposed_value_snapshot
on public.compliance_request_components for each row execute function private.ccr_validate_component_trigger();

create or replace function public.add_compliance_request_component(
  p_request uuid,p_entity_kind text,p_target_entity_id uuid,
  p_current_snapshot jsonb,p_proposed_snapshot jsonb,p_comments text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.compliance_configuration_requests%rowtype; new_id uuid;
begin
  select * into r from public.compliance_configuration_requests where id=p_request for update;
  if r.owner_id<>auth.uid() or not public.ccr_is_writer() then raise exception using errcode='42501',message='CCR_NOT_AUTHORIZED'; end if;
  if r.status<>'draft' then raise exception using errcode='23514',message='CCR_NOT_EDITABLE'; end if;
  perform private.ccr_validate_snapshot(p_entity_kind,p_proposed_snapshot);
  if r.request_type='modify' and p_target_entity_id is null then raise exception using errcode='23514',message='CCR_MODIFY_TARGET_REQUIRED'; end if;
  insert into public.compliance_request_components(
    request_id,revision_number,entity_kind,target_entity_id,current_value_snapshot,
    proposed_value_snapshot,component_comments,created_by
  ) values (
    p_request,r.current_revision,p_entity_kind,p_target_entity_id,p_current_snapshot,
    p_proposed_snapshot,nullif(btrim(p_comments),''),auth.uid()
  ) returning id into new_id;
  return new_id;
end $$;

create or replace function private.ccr_validate_publication_trigger()
returns trigger language plpgsql set search_path='' as $$
declare c public.compliance_request_components%rowtype; k text; ref uuid; expected text;
begin
  perform private.ccr_validate_snapshot(new.entity_kind,new.value_snapshot);
  select * into c from public.compliance_request_components
   where id=new.request_component_id and request_id=new.request_id
     and revision_number=new.request_revision and component_status='approved' for key share;
  if not found then raise exception using errcode='23514',message='CCR_PUBLICATION_COMPONENT_INVALID'; end if;
  for k in select key from jsonb_each(new.value_snapshot) where key like '%\_version_id' escape '\' loop
    ref := (new.value_snapshot->>k)::uuid;
    expected := case k when 'regulation_version_id' then 'regulation'
      when 'inspection_item_version_id' then 'inspection_item'
      when 'violation_version_id' then 'violation'
      when 'package_version_id' then 'package' else null end;
    if k='template_version_id' then
      if not exists(select 1 from public.configuration_templates where id=ref and status in ('published','locked')) then
        raise exception using errcode='23514',message='CCR_TEMPLATE_VERSION_NOT_PUBLISHED';
      end if;
      continue;
    end if;
    if k='package_version_id' and exists(
      select 1 from public.package_versions where id=ref and status in ('published','locked')
    ) then continue; end if;
    if not exists(select 1 from public.compliance_entity_versions v where v.id=ref and (expected is null or v.entity_kind=expected))
       and not exists(
         select 1 from public.compliance_request_component_dependencies d
         join public.compliance_request_components p on p.id=d.parent_component_id
         where d.request_id=new.request_id and d.revision_number=new.request_revision
           and d.child_component_id=new.request_component_id
           and p.component_status in ('approved','published')
           and (expected is null or p.entity_kind=expected)
       ) then raise exception using errcode='23514',message='CCR_DEPENDENCY_VERSION_MISSING:'||k;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists trg_ccr_validate_publication on public.compliance_entity_versions;
create trigger trg_ccr_validate_publication before insert on public.compliance_entity_versions
for each row execute function private.ccr_validate_publication_trigger();

revoke all on function private.ccr_validate_snapshot(text,jsonb) from public,anon,authenticated;
revoke all on function private.ccr_validate_component_trigger() from public,anon,authenticated;
revoke all on function private.ccr_validate_publication_trigger() from public,anon,authenticated;

-- 2. Typed, atomic enforcement recommendation decision.
do $$ begin create type public.enforcement_recommendation_decision as enum('approve','reject');
exception when duplicate_object then null; end $$;
alter table public.enforcement_recommendations add column if not exists decision_idempotency_key uuid,
  add column if not exists correlation_id uuid, add column if not exists decision_receipt jsonb;
create unique index if not exists enforcement_recommendations_decision_idem_uq
on public.enforcement_recommendations(decision_idempotency_key) where decision_idempotency_key is not null;
drop policy if exists enforcement_recommendations_decide on public.enforcement_recommendations;
revoke update,delete on public.enforcement_recommendations from authenticated;
grant select,insert on public.enforcement_recommendations to authenticated;

create or replace function public.decide_enforcement_recommendation(
  p_recommendation uuid,p_decision public.enforcement_recommendation_decision,
  p_reason text,p_idempotency_key uuid,p_correlation_id uuid default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); old_row public.enforcement_recommendations%rowtype;
 existing public.enforcement_recommendations%rowtype; next_status text;
 corr uuid:=coalesce(p_correlation_id,gen_random_uuid()); receipt jsonb;
begin
  if actor is null or not public.has_any_role(array['ops','compliance_admin']) then
    raise exception using errcode='42501',message='ENF_DECISION_NOT_AUTHORIZED'; end if;
  if p_idempotency_key is null then raise exception using errcode='23514',message='ENF_DECISION_IDEMPOTENCY_REQUIRED'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception using errcode='23514',message='ENF_DECISION_REASON_REQUIRED'; end if;
  next_status:=case p_decision when 'approve' then 'approved' else 'rejected' end;
  select * into existing from public.enforcement_recommendations where decision_idempotency_key=p_idempotency_key;
  if found then
    if existing.id<>p_recommendation or existing.status<>next_status or existing.decision_reason is distinct from btrim(p_reason) then
      raise exception using errcode='23505',message='ENF_DECISION_IDEMPOTENCY_CONFLICT'; end if;
    return existing.decision_receipt||jsonb_build_object('replayed',true);
  end if;
  select * into old_row from public.enforcement_recommendations where id=p_recommendation for update;
  if not found then raise no_data_found using message='ENF_RECOMMENDATION_NOT_FOUND'; end if;
  if old_row.decision_idempotency_key=p_idempotency_key then
    if old_row.status<>next_status or old_row.decision_reason is distinct from btrim(p_reason) then
      raise exception using errcode='23505',message='ENF_DECISION_IDEMPOTENCY_CONFLICT'; end if;
    return old_row.decision_receipt||jsonb_build_object('replayed',true);
  end if;
  if old_row.recommended_by=actor then raise exception using errcode='42501',message='ENF_MAKER_CHECKER'; end if;
  if old_row.status<>'pending' or old_row.decided_at is not null then raise exception using errcode='23514',message='ENF_DECISION_CONFLICT'; end if;
  receipt:=jsonb_build_object('recommendation_id',p_recommendation,'status',next_status,'decided_by',actor,
    'correlation_id',corr,'idempotency_key',p_idempotency_key,'replayed',false);
  update public.enforcement_recommendations set status=next_status,decided_by=actor,decided_at=now(),
    decision_reason=btrim(p_reason),decision_idempotency_key=p_idempotency_key,
    correlation_id=corr,decision_receipt=receipt
  where id=p_recommendation and status='pending' and decided_at is null;
  if not found then raise exception using errcode='23514',message='ENF_DECISION_CONFLICT'; end if;
  insert into public.audit_events(actor,object_type,object_id,action,before_state,after_state,requirement_refs,config_versions)
  values(actor,'enforcement_recommendation',p_recommendation,'decision',jsonb_build_object('status',old_row.status),
    jsonb_build_object('status',next_status,'reason',btrim(p_reason)),array['DEC-F','CR-463'],
    jsonb_build_object('correlation_id',corr,'idempotency_key',p_idempotency_key));
  return receipt;
end $$;
revoke all on function public.decide_enforcement_recommendation(
  uuid,public.enforcement_recommendation_decision,text,uuid,uuid) from public,anon;
grant execute on function public.decide_enforcement_recommendation(
  uuid,public.enforcement_recommendation_decision,text,uuid,uuid) to authenticated;

-- 3. Bulk issuance. Explicit locked+published+active version; never latest.
alter table public.bulk_violation_batches add column if not exists package_version_id uuid references public.package_versions(id),
  add column if not exists acknowledged boolean,add column if not exists request_fingerprint text,
  add column if not exists correlation_id uuid;
drop policy if exists bulk_violation_batches_rw on public.bulk_violation_batches;
drop policy if exists bulk_violation_batch_items_rw on public.bulk_violation_batch_items;
create policy bulk_violation_batches_read on public.bulk_violation_batches for select to authenticated
using((select public.has_any_role(array['ops','compliance_admin'])));
create policy bulk_violation_batch_items_read on public.bulk_violation_batch_items for select to authenticated
using((select public.has_any_role(array['ops','compliance_admin'])));
revoke insert,update,delete on public.bulk_violation_batches,public.bulk_violation_batch_items from authenticated;
grant select on public.bulk_violation_batches,public.bulk_violation_batch_items to authenticated;
revoke all on function public.issue_bulk_violation(uuid,uuid[],text,text) from public,anon,authenticated;

create or replace function public.issue_bulk_violation(
  p_request_id uuid,p_factory_ids uuid[],p_violation_code text,p_package_version_id uuid,
  p_notes text,p_acknowledged boolean,p_correlation_id uuid default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); code_row public.violation_codes%rowtype; mapping text;
 package_row public.package_versions%rowtype; batch public.bulk_violation_batches%rowtype;
 factory uuid; visit uuid; inspection uuid; violation uuid; results jsonb; successes int:=0;
 fingerprint text; corr uuid:=coalesce(p_correlation_id,gen_random_uuid());
begin
  if actor is null or not public.has_any_role(array['ops','compliance_admin']) then raise exception using errcode='42501',message='BULK_VIOLATION_NOT_AUTHORIZED'; end if;
  if p_request_id is null then raise exception using errcode='23514',message='BULK_REQUEST_ID_REQUIRED'; end if;
  if p_acknowledged is distinct from true then raise exception using errcode='23514',message='BULK_ACKNOWLEDGEMENT_REQUIRED'; end if;
  if coalesce(array_length(p_factory_ids,1),0)=0 then raise exception using errcode='23514',message='BULK_FACTORY_REQUIRED'; end if;
  if (select count(*) from unnest(p_factory_ids)x)<>(select count(distinct x) from unnest(p_factory_ids)x) then
    raise exception using errcode='23514',message='BULK_DUPLICATE_FACTORY'; end if;
  if exists(select 1 from unnest(p_factory_ids)x left join public.factories f on f.id=x where f.id is null) then
    raise exception using errcode='23514',message='BULK_FACTORY_NOT_FOUND'; end if;
  select * into code_row from public.violation_codes where code=p_violation_code and (active_to is null or active_to>=current_date);
  if not found then raise exception using errcode='23514',message='BULK_VIOLATION_NOT_GOVERNED'; end if;
  select mapping_version into mapping from public.penalty_mappings
   where violation_code_id=code_row.id and status in('published','locked');
  if mapping is null then raise exception using errcode='23514',message='BULK_PENALTY_MAPPING_REQUIRED'; end if;
  select * into package_row from public.package_versions
   where id=p_package_version_id and status='locked' and published_at is not null
     and deactivation_reason is null
     and coalesce(jsonb_array_length(coalesce(definition->'sections','[]'::jsonb)),0)>0;
  if not found then raise exception using errcode='23514',message='BULK_PACKAGE_VERSION_NOT_PUBLISHED_ACTIVE_LOCKED'; end if;
  fingerprint:=encode(extensions.digest(jsonb_build_object(
    'factories',(select jsonb_agg(x order by x) from unnest(p_factory_ids)x),
    'violation_code',p_violation_code,'package_version_id',p_package_version_id,
    'notes',nullif(btrim(coalesce(p_notes,'')),'')
  )::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtext(p_request_id::text));
  select * into batch from public.bulk_violation_batches where request_id=p_request_id;
  if found then
    if batch.request_fingerprint is distinct from fingerprint then raise exception using errcode='23505',message='BULK_IDEMPOTENCY_CONFLICT'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('factory_id',factory_id,'status',status,
      'violation_id',violation_id,'inspection_id',inspection_id,'error_code',error_code) order by factory_id),'[]')
      into results from public.bulk_violation_batch_items where batch_id=batch.id;
    return jsonb_build_object('status','ok','batch_id',batch.id,'replayed',true,
      'success_count',(select count(*) from public.bulk_violation_batch_items where batch_id=batch.id and status='success'),
      'total',batch.target_count,'results',results,'correlation_id',batch.correlation_id);
  end if;
  insert into public.bulk_violation_batches(request_id,violation_code_id,package_version_id,notes,
    issued_by,target_count,acknowledged,request_fingerprint,correlation_id)
  values(p_request_id,code_row.id,p_package_version_id,nullif(btrim(coalesce(p_notes,'')),''),
    actor,array_length(p_factory_ids,1),true,fingerprint,corr) returning * into batch;
  for factory in select x from unnest(p_factory_ids)x order by x loop
    insert into public.visits(factory_id,visit_type,execution_mode,planning_status,operational_state,
      window_start,window_end,package_version_id,notes)
    values(factory,'administrative_enforcement','administrative','published','submitted',
      now(),now()+interval '1 minute',p_package_version_id,'DEC-L bulk violation issuance — batch '||batch.id)
    returning id into visit;
    insert into public.inspections(visit_id,status,package_version_id,started_at,submitted_at)
    values(visit,'submitted',p_package_version_id,now(),now()) returning id into inspection;
    insert into public.violations(inspection_id,violation_code_id,mapping_version)
    values(inspection,code_row.id,mapping) returning id into violation;
    insert into public.bulk_violation_batch_items(batch_id,factory_id,status,violation_id,inspection_id)
    values(batch.id,factory,'success',violation,inspection);
    successes:=successes+1;
  end loop;
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs,config_versions)
  values(actor,'bulk_violation_batch',batch.id,'issue',jsonb_build_object('target_count',array_length(p_factory_ids,1),'success_count',successes),
    array['DEC-L','CR-463','CR-478'],jsonb_build_object('correlation_id',corr,'request_id',p_request_id,'package_version_id',p_package_version_id));
  select coalesce(jsonb_agg(jsonb_build_object('factory_id',factory_id,'status',status,
    'violation_id',violation_id,'inspection_id',inspection_id,'error_code',error_code) order by factory_id),'[]')
    into results from public.bulk_violation_batch_items where batch_id=batch.id;
  return jsonb_build_object('status','ok','batch_id',batch.id,'replayed',false,'success_count',successes,
    'total',array_length(p_factory_ids,1),'results',results,'correlation_id',corr);
end $$;
revoke all on function public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid) from public,anon;
grant execute on function public.issue_bulk_violation(uuid,uuid[],text,uuid,text,boolean,uuid) to authenticated;

-- 4. Submission: canonical action-form fields only; extras remain Not configured.
create or replace function private.guard_submission_action_forms_and_config()
returns trigger language plpgsql set search_path='' as $$
declare i public.inspections%rowtype; snap public.visit_package_snapshots%rowtype;
 mode public.execution_mode; incomplete int;
begin
  select * into i from public.inspections where id=new.inspection_id for key share;
  if not found then raise exception using errcode='23514',message='EXE-SUBMIT-NOT-FOUND'; end if;
  select execution_mode into mode from public.visits where id=i.visit_id;
  select * into snap from public.visit_package_snapshots where visit_id=i.visit_id
   order by preparation_version desc limit 1;
  if found then
    if snap.package_version_id<>i.package_version_id then raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-VERSION-MISMATCH'; end if;
    if snap.checksum<>encode(extensions.digest(snap.definition::text,'sha256'),'hex') then raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-CHECKSUM-MISMATCH'; end if;
    if new.snapshot?'package_version_id' and new.snapshot->>'package_version_id'<>snap.package_version_id::text then
      raise exception using errcode='23514',message='EXE-SUBMIT-SNAPSHOT-VERSION-MISMATCH'; end if;
    if exists(
      select 1 from jsonb_array_elements(coalesce(snap.definition->'action_forms','[]'))f
       where coalesce((f->>'mandatory')::boolean,(f->>'blocking')::boolean,false)
         and not exists(
           select 1 from public.action_forms af where af.inspection_id=new.inspection_id
             and af.is_blocking and af.form_type=f->>'key'
         )
    ) then
      raise exception using errcode='23514',message='EXE-SUBMIT-ACTION-FORM-MISSING'; end if;
  elsif mode is distinct from 'administrative' then
    raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED';
  end if;
  select count(*) into incomplete from public.action_forms where inspection_id=new.inspection_id and is_blocking
   and (nullif(btrim(owner_name),'') is null or nullif(btrim(owner_role),'') is null
     or due_at is null or nullif(btrim(required_correction),'') is null);
  if incomplete>0 then raise exception using errcode='23514',message='EXE-SUBMIT-ACTION-FORM-INCOMPLETE:'||incomplete; end if;
  return new;
end $$;
comment on function private.guard_submission_action_forms_and_config() is
'CR-475: canonical mandatory fields are owner_name, owner_role, due_at and required_correction. Additional dynamic-template mandatory fields remain Not configured.';
drop trigger if exists trg_submission_action_forms_and_config on public.submission_versions;
create trigger trg_submission_action_forms_and_config before insert on public.submission_versions
for each row execute function private.guard_submission_action_forms_and_config();
revoke all on function private.guard_submission_action_forms_and_config() from public,anon,authenticated;
