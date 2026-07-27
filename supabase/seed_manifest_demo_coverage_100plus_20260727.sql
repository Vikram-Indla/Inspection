-- SAQEEL widget-first demo coverage manifest
-- Batch: saqeel-demo-coverage-100plus-20260727
-- Classification: deterministic synthetic demo data; non-production only.
--
-- PREPARED ONLY. Execute only after the Product Owner confirms this file's
-- SHA-256 and the target project is the allow-listed staging/demo project.
-- psql variables:
--   target_project_ref
--   approved_planner_user_id
--   approved_inspector_user_id
--   approved_reviewer_user_id
--   approved_package_version_id
--
-- Existing demo modules are inputs but are deliberately not included or
-- modified here. This packet is independently idempotent and refuses partial
-- or payload-mismatched prior application.

\set ON_ERROR_STOP on
begin;

select set_config('saqeel.seed.batch','saqeel-demo-coverage-100plus-20260727',true);
select set_config('saqeel.seed.correlation','7b2f0000-0000-4000-8000-000000000001',true);
select set_config('saqeel.seed.project_ref',:'target_project_ref',true);
select set_config('saqeel.seed.planner',:'approved_planner_user_id',true);
select set_config('saqeel.seed.inspector',:'approved_inspector_user_id',true);
select set_config('saqeel.seed.reviewer',:'approved_reviewer_user_id',true);
select set_config('saqeel.seed.package',:'approved_package_version_id',true);

create temporary table seed_cov_factories(
  ordinal integer primary key,
  factory_code text not null unique,
  expected_region text not null,
  expected_city text not null,
  expected_sector text not null
) on commit drop;

insert into seed_cov_factories values
  (1,'F-1101','Riyadh','2nd Industrial City','petrochemical'),
  (2,'F-3301','Eastern','Dammam 1st Industrial City','steel'),
  (3,'F-2201','Makkah','Jeddah Industrial City 1','chemical'),
  (4,'F-3303','Eastern','Jubail Industrial City 1','fertilizer'),
  (5,'F-3305','Eastern','Al Ahsa Industrial City','food');

create temporary table seed_cov_manifest(
  ordinal integer primary key,
  visit_id uuid not null unique,
  assignment_id uuid not null unique,
  inspection_id uuid,
  factory_ordinal integer not null references seed_cov_factories(ordinal),
  window_start timestamptz not null,
  window_end timestamptz not null,
  priority text not null,
  execution_mode public.execution_mode not null,
  inspected boolean not null,
  review_outcome text check (review_outcome in ('approve','return','reject','pending') or review_outcome is null)
) on commit drop;

insert into seed_cov_manifest
select
  n,
  ('7b20' || lpad(to_hex(n),4,'0') || '-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  ('7b21' || lpad(to_hex(n),4,'0') || '-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  case when n <= 68 then
    ('7b22' || lpad(to_hex(n),4,'0') || '-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid
  end,
  ((n - 1) % 5) + 1,
  case
    when n <= 68 then timestamptz '2026-07-01 05:00+00' + make_interval(days => ((n - 1) % 26), hours => ((n - 1) % 8))
    when n <= 80 then timestamptz '2026-07-27 00:30+00' + make_interval(mins => (n - 69) * 25)
    when n <= 88 then timestamptz '2026-07-28 05:00+00' + make_interval(days => n - 81, hours => (n % 4))
    else timestamptz '2026-07-20 05:00+00' + make_interval(hours => n - 89)
  end,
  case
    when n <= 68 then timestamptz '2026-07-01 09:00+00' + make_interval(days => ((n - 1) % 26), hours => ((n - 1) % 8))
    when n <= 80 then timestamptz '2026-07-27 05:30+00' + make_interval(mins => (n - 69) * 25)
    when n <= 88 then timestamptz '2026-07-28 09:00+00' + make_interval(days => n - 81, hours => (n % 4))
    else timestamptz '2026-07-20 09:00+00' + make_interval(hours => n - 89)
  end,
  case when n % 9 in (0,1) then 'high' when n % 9 = 2 then 'critical' else 'normal' end,
  case when n in (73,76,79,82,85,88,91,92) then 'virtual'::public.execution_mode else 'physical'::public.execution_mode end,
  n <= 68,
  case when n <= 50 then 'approve'
       when n <= 56 then 'return'
       when n <= 61 then 'reject'
       when n <= 68 then 'pending' end
from generate_series(1,92) n;

-- Static authority, FK and governed-reference preflight.
do $$
declare v_count integer;
begin
  if current_database() ilike '%prod%' then
    raise exception 'SEED_REFUSED_PRODUCTION_DATABASE';
  end if;
  if current_setting('saqeel.seed.project_ref') <> 'iiozvqntawxfwbgffzqu' then
    raise exception 'SEED_REFUSED_PROJECT_REF:%',current_setting('saqeel.seed.project_ref');
  end if;
  if current_setting('saqeel.seed.planner')::uuid =
     current_setting('saqeel.seed.reviewer')::uuid then
    raise exception 'SEED_MAKER_CHECKER_COLLISION';
  end if;
  if current_setting('saqeel.seed.inspector')::uuid =
     current_setting('saqeel.seed.reviewer')::uuid then
    raise exception 'SEED_INSPECTOR_REVIEWER_COLLISION';
  end if;
  if not exists (
    select 1 from public.user_roles
    where user_id=current_setting('saqeel.seed.planner')::uuid and role_key='planner'
  ) then raise exception 'SEED_APPROVED_PLANNER_INVALID'; end if;
  if not exists (
    select 1 from public.user_roles
    where user_id=current_setting('saqeel.seed.inspector')::uuid and role_key='inspector'
  ) then raise exception 'SEED_APPROVED_INSPECTOR_INVALID'; end if;
  if not exists (
    select 1 from public.user_roles
    where user_id=current_setting('saqeel.seed.reviewer')::uuid and role_key='reviewer'
  ) then raise exception 'SEED_APPROVED_REVIEWER_INVALID'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('saqeel.seed.inspector'),true);
  if not public.has_capability('execution.submit') then
    raise exception 'SEED_INSPECTOR_SUBMIT_CAPABILITY_MISSING';
  end if;
  perform set_config('request.jwt.claim.sub',current_setting('saqeel.seed.planner'),true);
  if not exists (
    select 1 from public.package_versions
    where id=current_setting('saqeel.seed.package')::uuid
      and status in ('published','locked') and published_at is not null
      and coalesce(jsonb_array_length(coalesce(definition->'sections','[]'::jsonb)),0)>0
  ) then raise exception 'SEED_PACKAGE_NOT_PUBLISHED'; end if;
  select count(*) into v_count
  from seed_cov_factories s join public.factories f on f.factory_code=s.factory_code
  where f.region=s.expected_region and f.city=s.expected_city
    and f.activity_class=s.expected_sector and f.official_lat is not null
    and f.official_lng is not null and f.risk_band in ('high','medium','low');
  if v_count <> 5 then raise exception 'SEED_FACTORY_CONTRACT_MISMATCH:%',v_count; end if;
  select count(*) into v_count from public.inspection_items i
  join public.regulation_clauses c on c.id=i.clause_id
  join public.regulations r on r.id=c.regulation_id
  where i.active and r.status='published'
    and i.code in ('FS-101','FS-102','FS-107','EG-201','HZ-310')
    and nullif(btrim(r.issuing_authority),'') is not null;
  if v_count <> 5 then raise exception 'SEED_GOVERNED_ITEM_SET_MISMATCH:%',v_count; end if;
  if (select count(*) from seed_cov_manifest) <> 92
     or (select count(*) from seed_cov_manifest where inspected) <> 68
     or (select count(*) from seed_cov_manifest where review_outcome='approve') <> 50
     or (select count(*) from seed_cov_manifest where review_outcome='return') <> 6
     or (select count(*) from seed_cov_manifest where review_outcome='reject') <> 5
     or (select count(*) from seed_cov_manifest where review_outcome='pending') <> 7
  then raise exception 'SEED_MANIFEST_CARDINALITY_INVALID'; end if;
end $$;

-- Before counts. Exact manifest IDs must be all absent or the complete packet.
select 'visit_plans' table_name, count(*) existing from public.visit_plans
 where id='7b200000-0000-4000-8000-000000000000'
union all select 'visits',count(*) from public.visits where id in (select visit_id from seed_cov_manifest)
union all select 'assignments',count(*) from public.assignments where id in (select assignment_id from seed_cov_manifest)
union all select 'inspections',count(*) from public.inspections where id in (select inspection_id from seed_cov_manifest where inspected)
union all select 'responses',count(*) from public.checklist_responses where inspection_id in (select inspection_id from seed_cov_manifest where inspected)
union all select 'submissions',count(*) from public.submission_versions where idempotency_key like 'saqeel-demo-coverage-100plus-20260727:%'
union all select 'reviews',count(*) from public.reviews where inspection_id in (select inspection_id from seed_cov_manifest where inspected);

do $$
declare v_owned integer;
begin
  select
    (select count(*) from public.visit_plans where id='7b200000-0000-4000-8000-000000000000') +
    (select count(*) from public.visits where id in (select visit_id from seed_cov_manifest)) +
    (select count(*) from public.assignments where id in (select assignment_id from seed_cov_manifest)) +
    (select count(*) from public.inspections where id in (select inspection_id from seed_cov_manifest where inspected))
  into v_owned;
  if v_owned not in (0,253) then
    raise exception 'SEED_PARTIAL_PRIOR_BATCH:%',v_owned;
  end if;
  if v_owned=253 and (
       (select count(*) from public.checklist_responses where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>340
    or (select count(*) from public.submission_versions where idempotency_key like current_setting('saqeel.seed.batch')||':submit:%')<>68
    or (select count(*) from public.reviews where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>68
    or (select count(*) from public.evidence where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>50
    or (select count(*) from public.findings where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>30
    or (select count(*) from public.violations where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>30
    or (select count(*) from public.action_forms where inspection_id in(select inspection_id from seed_cov_manifest where inspected))<>30
    or (select count(*) from public.geo_events where visit_id in(select visit_id from seed_cov_manifest))<>24
    or (select count(*) from public.virtual_sessions where visit_id in(select visit_id from seed_cov_manifest))<>8
  ) then raise exception 'SEED_PARTIAL_PRIOR_BATCH_DEPENDENCIES'; end if;
  if exists (
    select 1 from public.visits v join seed_cov_manifest m on m.visit_id=v.id
    join seed_cov_factories sf on sf.ordinal=m.factory_ordinal
    join public.factories f on f.factory_code=sf.factory_code
    where v.factory_id is distinct from f.id
       or v.window_start is distinct from m.window_start
       or v.window_end is distinct from m.window_end
       or v.package_version_id is distinct from current_setting('saqeel.seed.package')::uuid
  ) then raise exception 'SEED_VISIT_PAYLOAD_CONFLICT'; end if;
end $$;

insert into public.visit_plans(id,method,criteria,status,created_by,published_at,created_at)
values (
  '7b200000-0000-4000-8000-000000000000','bulk',
  jsonb_build_object(
    'seed_batch',current_setting('saqeel.seed.batch'),
    'correlation_id',current_setting('saqeel.seed.correlation'),
    'classification','synthetic_demo'
  ),
  'published',current_setting('saqeel.seed.planner')::uuid,
  '2026-06-30 09:00+00','2026-06-30 08:00+00'
) on conflict (id) do nothing;

insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end,priority,notes,
  package_version_id,created_by,created_at
)
select m.visit_id,'7b200000-0000-4000-8000-000000000000',f.id,
  'periodic',m.execution_mode,'published',
  case when m.ordinal between 69 and 72 then 'prepared'::public.operational_state
       when m.ordinal between 73 and 76 then 'on_the_way'::public.operational_state
       when m.ordinal between 77 and 80 then 'executing'::public.operational_state
       else 'new'::public.operational_state end,
  m.window_start,m.window_end,m.priority,
  'DEMO:'||current_setting('saqeel.seed.batch')||':'||lpad(m.ordinal::text,3,'0'),
  current_setting('saqeel.seed.package')::uuid,
  current_setting('saqeel.seed.planner')::uuid,m.window_start-interval '14 days'
from seed_cov_manifest m
join seed_cov_factories sf on sf.ordinal=m.factory_ordinal
join public.factories f on f.factory_code=sf.factory_code
on conflict (id) do nothing;

insert into public.assignments(id,visit_id,inspector_id,method,status,candidates,created_at)
select assignment_id,visit_id,current_setting('saqeel.seed.inspector')::uuid,
  'manual','assigned',
  jsonb_build_object('seed_batch',current_setting('saqeel.seed.batch')),
  window_start-interval '10 days'
from seed_cov_manifest on conflict (id) do nothing;

insert into public.inspections(id,visit_id,status,package_version_id,started_at)
select inspection_id,visit_id,'in_progress',current_setting('saqeel.seed.package')::uuid,
  window_start+interval '30 minutes'
from seed_cov_manifest where inspected
on conflict (id) do nothing;

with items as (
  select i.id, row_number() over(order by i.code) item_no
  from public.inspection_items i
  where i.active and i.code in ('FS-101','FS-102','FS-107','EG-201','HZ-310')
), pairs as (
  select m.ordinal,m.inspection_id,it.id item_id,it.item_no,
         ((m.factory_ordinal-1)*10 + ((m.ordinal-1)/5)) as city_seq
  from seed_cov_manifest m cross join items it where m.inspected
)
insert into public.checklist_responses(id,inspection_id,item_id,response,is_complete,updated_at)
select md5(current_setting('saqeel.seed.batch')||':response:'||inspection_id||':'||item_id)::uuid,
  inspection_id,item_id,
  jsonb_build_object(
    'value',
    case
      -- Approved city cohort: exact eligible split across 50 answers/city:
      -- 40/10, 35/15, 30/20, 25/25, 20/30.
      when ordinal <= 50 and item_no + (((ordinal-1)/5)::integer)*5 <=
        case ((ordinal-1)%5)+1 when 1 then 40 when 2 then 35 when 3 then 30 when 4 then 25 else 20 end
      then 'compliant'
      when ordinal <= 50 then 'non_compliant'
      when (ordinal+item_no)%4=0 then 'non_compliant'
      else 'compliant'
    end,
    'seed_batch',current_setting('saqeel.seed.batch')
  ),true,(select window_end from seed_cov_manifest where inspection_id=pairs.inspection_id)
from pairs
on conflict (inspection_id,item_id) do nothing;

-- Evidence is synchronized before submission. No storage object or provider
-- success is claimed; paths are deterministic private demo-object references.
with targets as (
  select m.inspection_id,m.ordinal,i.id item_id,
         row_number() over(order by m.ordinal) rn
  from seed_cov_manifest m
  join public.inspection_items i on i.code='EG-201'
  where m.inspected order by m.ordinal limit 50
)
insert into public.evidence(
  id,inspection_id,evidence_type,linked_type,linked_id,storage_path,captured_at,
  content_sha256,captured_by,synced_at
)
select md5(current_setting('saqeel.seed.batch')||':evidence:'||inspection_id)::uuid,
  inspection_id,'photo','item',item_id,
  'demo/'||current_setting('saqeel.seed.batch')||'/'||inspection_id||'/eg-201.jpg',
  timestamptz '2026-07-01 08:00+00'+make_interval(hours=>rn),
  encode(extensions.digest(convert_to(current_setting('saqeel.seed.batch')||':'||inspection_id,'UTF8'),'sha256'),'hex'),
  current_setting('saqeel.seed.inspector')::uuid,
  timestamptz '2026-07-01 08:05+00'+make_interval(hours=>rn)
from targets on conflict (id) do nothing;

with targets as (
  select m.*,i.id item_id,
    md5(current_setting('saqeel.seed.batch')||':response:'||m.inspection_id||':'||i.id)::uuid response_id
  from seed_cov_manifest m join public.inspection_items i on i.code='EG-201'
  where m.inspected and m.ordinal<=30
)
insert into public.findings(id,inspection_id,item_id,severity,description)
select md5(current_setting('saqeel.seed.batch')||':finding:'||inspection_id)::uuid,
  inspection_id,item_id,case when ordinal%3=0 then 'high' when ordinal%3=1 then 'medium' else 'low' end,
  'Deterministic synthetic finding '||ordinal||' ['||current_setting('saqeel.seed.batch')||']'
from targets on conflict (id) do nothing;

with targets as (
  select m.*,vc.id violation_code_id,i.id item_id,
    md5(current_setting('saqeel.seed.batch')||':finding:'||m.inspection_id)::uuid finding_id,
    md5(current_setting('saqeel.seed.batch')||':response:'||m.inspection_id||':'||i.id)::uuid response_id
  from seed_cov_manifest m
  join public.inspection_items i on i.code='EG-201'
  join public.violation_codes vc on vc.code=case when m.ordinal%3=0 then 'V-FS-01' when m.ordinal%3=1 then 'V-FS-09' else 'V-HZ-02' end
  where m.inspected and m.ordinal<=30
)
insert into public.violations(id,inspection_id,violation_code_id,finding_id,mapping_version,triggered_by_response)
select md5(current_setting('saqeel.seed.batch')||':violation:'||inspection_id)::uuid,
  inspection_id,violation_code_id,finding_id,'v3',response_id
from targets on conflict (id) do nothing;

insert into public.action_forms(id,inspection_id,violation_id,form_type,owner_name,owner_role,required_correction,status,is_blocking)
select md5(current_setting('saqeel.seed.batch')||':action:'||inspection_id)::uuid,
  inspection_id,
  md5(current_setting('saqeel.seed.batch')||':violation:'||inspection_id)::uuid,
  'corrective','Demo Factory Role '||ordinal,'Synthetic compliance owner',
  'Correct the governed linked checklist condition and attach evidence.',
  'open',true
from seed_cov_manifest where inspected and ordinal<=30
on conflict (id) do nothing;

insert into public.geo_events(
  id,visit_id,kind,observed_lat,observed_lng,accuracy_m,geofence_result,
  override_reason,gis_version,device_id,occurred_at,source
)
select md5(current_setting('saqeel.seed.batch')||':geo:'||m.visit_id)::uuid,
  m.visit_id,case when m.ordinal%6=0 then 'override' else 'checkin' end,
  f.official_lat+((m.ordinal%3)-1)*0.0001,
  f.official_lng+((m.ordinal%5)-2)*0.0001,
  8+(m.ordinal%5),
  case when m.ordinal%6=0 then 'override'::public.geofence_result else 'inside'::public.geofence_result end,
  case when m.ordinal%6=0 then 'approved demo exception evidence' end,
  'ksa-gis-2026.07','demo-ipad-'||lpad(m.ordinal::text,3,'0'),
  m.window_start+interval '45 minutes','device'
from seed_cov_manifest m
join seed_cov_factories sf on sf.ordinal=m.factory_ordinal
join public.factories f on f.factory_code=sf.factory_code
where m.ordinal between 69 and 92
on conflict (id) do nothing;

insert into public.virtual_sessions(id,visit_id,state,appointment_at,timeline)
select md5(current_setting('saqeel.seed.batch')||':virtual:'||visit_id)::uuid,
  visit_id,'scheduled',window_start,
  jsonb_build_array(jsonb_build_object('event','scheduled','at',window_start,'seed_batch',current_setting('saqeel.seed.batch')))
from seed_cov_manifest where execution_mode='virtual'
on conflict (visit_id) do nothing;

insert into public.virtual_participants(id,session_id,display_name,role,verification_record)
select md5(current_setting('saqeel.seed.batch')||':participant:'||visit_id)::uuid,
  md5(current_setting('saqeel.seed.batch')||':virtual:'||visit_id)::uuid,
  'Synthetic factory participant '||ordinal,'factory_rep',
  jsonb_build_object('mode','demo','seed_batch',current_setting('saqeel.seed.batch'))
from seed_cov_manifest where execution_mode='virtual'
on conflict (id) do nothing;

-- Canonical immutable submission path. The assigned inspector persona and
-- execution.submit capability are enforced by the RPC.
do $$
declare r record; v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub',current_setting('saqeel.seed.inspector'),true);
  for r in select * from seed_cov_manifest where inspected order by ordinal loop
    v_result := public.submit_inspection(
      r.inspection_id,
      jsonb_build_object(
        'seed_batch',current_setting('saqeel.seed.batch'),
        'sections',jsonb_build_object('s1',jsonb_build_object('complete',true)),
        'section_items',jsonb_build_object('s1',jsonb_build_array('FS-101','FS-102','FS-107','EG-201','HZ-310')),
        'evidence_required','[]'::jsonb
      ),
      current_setting('saqeel.seed.batch')||':submit:'||lpad(r.ordinal::text,3,'0'),
      jsonb_build_object('mode','synthetic_demo_acknowledgement','acknowledged_at',r.window_end)
    );
    if coalesce((v_result->>'version_number')::int,0) <> 1 then
      raise exception 'SEED_SUBMISSION_VERSION_MISMATCH:%',r.ordinal;
    end if;
  end loop;
end $$;

-- Canonical maker-checker review path. Generated review UUIDs are tracked by
-- deterministic inspection/submission membership; immutable rows are never
-- rewritten on rerun.
do $$
declare r record; v_submission uuid; v_review uuid;
begin
  perform set_config('request.jwt.claim.sub',current_setting('saqeel.seed.reviewer'),true);
  for r in select * from seed_cov_manifest where inspected order by ordinal loop
    select id into v_submission from public.submission_versions
      where idempotency_key=current_setting('saqeel.seed.batch')||':submit:'||lpad(r.ordinal::text,3,'0');
    select id into v_review from public.reviews
      where inspection_id=r.inspection_id order by decided_at desc nulls first limit 1;
    if v_review is null then
      v_review := public.start_review(r.inspection_id,v_submission);
    end if;
    if r.review_outcome <> 'pending' and not exists(
      select 1 from public.reviews where id=v_review and decided_at is not null
    ) then
      perform public.decide_review(
        v_review,r.review_outcome,
        case when r.review_outcome='approve' then null else 'Deterministic synthetic review outcome' end,
        case when r.review_outcome='return' then '["s1"]'::jsonb else null end
      );
    end if;
  end loop;
end $$;

-- Exact postconditions: 92 visits + 92 assignments + 68 inspections +
-- 340 complete responses + 68 immutable submissions + 68 reviews + 50
-- evidence + 30 findings + 30 violations + 30 actions + 24 geo events +
-- 8 sessions + 8 participants = 908 direct meaningful rows, before generated
-- notifications/audit/lifecycle rows.
do $$
declare v_direct integer; v_audit integer;
begin
  select
    (select count(*) from public.visits where id in(select visit_id from seed_cov_manifest)) +
    (select count(*) from public.assignments where id in(select assignment_id from seed_cov_manifest)) +
    (select count(*) from public.inspections where id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.checklist_responses where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.submission_versions where idempotency_key like current_setting('saqeel.seed.batch')||':submit:%') +
    (select count(*) from public.reviews where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.evidence where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.findings where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.violations where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.action_forms where inspection_id in(select inspection_id from seed_cov_manifest where inspected)) +
    (select count(*) from public.geo_events where visit_id in(select visit_id from seed_cov_manifest)) +
    (select count(*) from public.virtual_sessions where visit_id in(select visit_id from seed_cov_manifest)) +
    (select count(*) from public.virtual_participants where session_id in(
      select id from public.virtual_sessions where visit_id in(select visit_id from seed_cov_manifest)
    ))
  into v_direct;
  if v_direct <> 908 then raise exception 'SEED_DIRECT_COUNT_INVALID:%',v_direct; end if;
  select count(*) into v_audit from public.audit_events
   where object_id in (
     select visit_id from seed_cov_manifest
     union select inspection_id from seed_cov_manifest where inspected
     union select id from public.reviews where inspection_id in(select inspection_id from seed_cov_manifest where inspected)
   );
  if v_audit < 136 then raise exception 'SEED_AUDIT_COUNT_TOO_LOW:%',v_audit; end if;
end $$;

commit;

-- Rollback is intentionally NOT embedded as executable mutation. Use the
-- companion coverage probe in rollback-preview mode. Immutable submissions,
-- decided reviews and generated audit history are residual and must never be
-- deleted or rewritten. Mutable cleanup requires separate Product Owner
-- approval and reverse-dependency deletion restricted to this exact batch.
