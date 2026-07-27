-- =====================================================================================
-- 05-configuration.sql — SYNTHETIC, NON-PRODUCTION **DEMO** GOVERNED CONFIGURATION
-- =====================================================================================
--
--  ⚠️  READ THIS BEFORE RUNNING OR REVIEWING THIS FILE  ⚠️
--
--  Every value in this file is SYNTHETIC DEMO DATA. It was created so that demo
--  surfaces (/admin/workflows, /admin/notifications, /admin/risk,
--  /admin/dashboard-config, /admin/packages, /reviews, /operations, /dashboard)
--  render populated states instead of "Not configured".
--
--  This is NOT approved ministry policy.
--  No SLA duration, risk weight, KPI threshold, expiry rule, band boundary, penalty
--  or escalation role in this file has been authorised by any governance body.
--  Seeding it was EXPLICITLY AUTHORISED BY THE PRODUCT OWNER for the demo branch
--  only, as a deliberate, time-boxed exception to the repository rule that absent
--  governed data must render as "Not configured" / "Unavailable".
--
--  Every invented value is catalogued in CONFIGURATION-PROVENANCE.md next to this
--  file. If you promote any value from this file into a real environment, it must
--  first go through the governed maker-checker publication route.
--
--  Provenance markers carried by the data itself:
--    * version_label / model_version / version    = 'demo-2026-07'
--    * name / label / title / template            = prefixed 'Demo · ' (or 'تجريبي ·')
--    * jsonb payloads                             = "demo": true + "provenance": "..."
--    * reasons / notes                            = prefixed 'Demo · '
--
--  Target project : iiozvqntawxfwbgffzqu (staging)
--  Demo anchor    : 2026-07-27 12:00:00+03 (all relative timestamps derive from this
--                   fixed anchor, never now(), so re-running is byte-for-byte stable)
--  Idempotency    : every INSERT uses a deterministic md5-derived UUID (or a natural
--                   unique key) with ON CONFLICT DO NOTHING / NOT EXISTS. Re-running
--                   the whole file is a no-op. Nothing is deleted or truncated.
--
--  Tables written (governed-configuration partition ONLY):
--    sla_calendars, sla_timers, workflow_task_assignments, notification_rules,
--    notification_preferences, risk_variables, risk_models, risk_runs,
--    risk_simulations, risk_overrides, engine_settings(engine='risk'),
--    dashboard_config_parameters, dashboard_config_versions, dashboard_config_heads,
--    mvp3_kpi_definitions, packages, package_versions,
--    package_version_item_snapshots, package_version_dependency_snapshots,
--    gis_layers, factory_risk_snapshots
--
--  Personas referenced (public.profiles.user_id):
--    admin@mim.gov.sa    f9067e24-99f7-40e7-8421-4717de9ca2db  (maker)
--    approver@mim.gov.sa 7da93ff6-82c5-45f8-be26-92c8956c2254  (checker)
--    ops@mim.gov.sa      38fd1ad1-ec82-4d62-8da4-a3231271753a
--    planner@mim.gov.sa  61573500-f533-438c-82b6-b0223df88671
--    reviewer@mim.gov.sa 3e1d3b7d-8856-40cb-ab07-5e9e624e6329
--  Maker-checker DB constraints are respected everywhere: created_by <> approved_by.
-- =====================================================================================


-- =====================================================================================
-- BATCH 1 · sla_calendars (DEMO)
-- Trigger context: sla_timer_activation_guard() refuses to let a timer reach 'running'
-- unless its calendar exists, is activation_authorized, and has working_days,
-- working_start and working_end all populated. Two authorised calendars are seeded
-- plus one deliberately UNauthorised calendar so the "Not authorised (DEC-003)" badge
-- is still demonstrable on /admin/workflows.
-- =====================================================================================
insert into public.sla_calendars
  (id, name, version_label, timezone, working_days, working_start, working_end, holidays, activation_authorized, created_by)
values
  (md5('demo:sla_calendar:standard')::uuid,
   'Demo · Ministry standard working calendar (Sun–Thu)',
   'demo-2026-07',
   'Asia/Riyadh',
   '{0,1,2,3,4}'::int[],
   '08:00'::time, '16:00'::time,
   '{2026-02-22,2026-03-19,2026-03-20,2026-03-21,2026-03-22,2026-03-23,2026-05-26,2026-05-27,2026-05-28,2026-05-29,2026-05-30,2026-09-23}'::date[],
   true,
   'f9067e24-99f7-40e7-8421-4717de9ca2db'),
  (md5('demo:sla_calendar:surge')::uuid,
   'Demo · Extended enforcement-surge calendar (Sat–Thu)',
   'demo-2026-07',
   'Asia/Riyadh',
   '{6,0,1,2,3,4}'::int[],
   '07:00'::time, '19:00'::time,
   '{2026-02-22,2026-03-19,2026-03-20,2026-05-26,2026-05-27,2026-09-23}'::date[],
   true,
   'f9067e24-99f7-40e7-8421-4717de9ca2db'),
  (md5('demo:sla_calendar:unauthorised')::uuid,
   'Demo · Ramadan reduced-hours calendar (awaiting authorisation)',
   'demo-2026-07',
   'Asia/Riyadh',
   '{0,1,2,3,4}'::int[],
   '09:00'::time, '14:00'::time,
   '{2026-02-22,2026-03-19,2026-03-20,2026-03-21}'::date[],
   false,
   'f9067e24-99f7-40e7-8421-4717de9ca2db')
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 2 · sla_timers (DEMO) — every timer resolves to real due/warn/breach stamps
--
-- Working-minute → elapsed-minute conversion used here is ×3 (an 8-hour working day
-- inside a 24-hour calendar day). This is a DEMO approximation, not a working-calendar
-- engine: it produces plausible deadlines without pretending the runtime resolves
-- them from sla_calendars.holidays.
--   due_at    = started_at + duration_minutes × 3 minutes
--   warn_at   = started_at + duration_minutes × 3 × 0.8 minutes   (80 % reminder)
--   breach_at = due_at + 24 h                                      (1 working-day grace)
-- Statuses are evaluated against the fixed demo anchor, never now(), so re-running
-- reproduces the same mix of breached / running / paused rows.
-- =====================================================================================
with anchor as (select timestamptz '2026-07-27 12:00:00+03' as a),
cal as (select md5('demo:sla_calendar:standard')::uuid as cid),
src as (
  select r.id as object_ref, 'review'::text as object_type, row_number() over (order by r.id) as rn
    from (select id from public.reviews where status in ('under_review','returned') order by id limit 20) r
  union all
  select v.id, 'visit'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id limit 14) v
  union all
  select v.id, 'correction'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id offset 14 limit 6) v
),
spec as (
  select object_ref, object_type, rn,
    case object_type
      when 'review' then (case when rn % 2 = 1 then 'review.level2_decision' else 'review.resubmission_window' end)
      when 'visit'  then (case when rn % 2 = 1 then 'visit.execution_submit' else 'visit.plan_acknowledgement' end)
      else 'correction.closure' end as sla_key,
    case object_type
      when 'review' then (case when rn % 2 = 1 then 1440 else 2400 end)
      when 'visit'  then (case when rn % 2 = 1 then 960 else 480 end)
      else 4800 end as duration_minutes,
    case object_type when 'review' then 'reviewer' when 'visit' then 'ops' else 'compliance_admin' end as escalation_role,
    case object_type when 'review' then (rn * 9 + 6) when 'visit' then (rn * 7 + 4) else (rn * 40) end as start_offset_hours
  from src
),
calc as (
  select s.*, a.a as anchor_now, cal.cid,
    a.a - (s.start_offset_hours * interval '1 hour') as started_at,
    a.a - (s.start_offset_hours * interval '1 hour') + (s.duration_minutes * 3 * interval '1 minute') as due_at,
    a.a - (s.start_offset_hours * interval '1 hour') + (s.duration_minutes * 3 * 0.8 * interval '1 minute') as warn_at,
    a.a - (s.start_offset_hours * interval '1 hour') + (s.duration_minutes * 3 * interval '1 minute') + interval '24 hours' as breach_at
  from spec s cross join anchor a cross join cal
)
insert into public.sla_timers
  (id, object_type, object_ref, sla_key, calendar_id, duration_minutes, started_at, paused_at,
   accumulated_pause_minutes, due_at, warn_at, breach_at, escalation_role, status, created_by, created_at)
select
  md5('demo:sla_timer:' || c.object_ref::text || ':' || c.sla_key)::uuid,
  c.object_type, c.object_ref, c.sla_key, c.cid, c.duration_minutes, c.started_at,
  case when c.anchor_now <= c.breach_at and c.rn % 7 = 0 then c.anchor_now - interval '3 hours' end,
  case when c.rn % 5 = 0 then 60 else 0 end,
  c.due_at, c.warn_at, c.breach_at, c.escalation_role,
  case when c.anchor_now > c.breach_at then 'breached'
       when c.rn % 7 = 0 then 'paused'
       when c.rn % 11 = 0 then 'met'
       else 'running' end,
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  c.started_at
from calc c
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 3 · workflow_task_assignments (DEMO)
-- Real review/visit ids as task_ref; the five demo personas as assignees.
-- =====================================================================================
with people as (
  select * from (values
    (0,'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid),
    (1,'7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid),
    (2,'38fd1ad1-ec82-4d62-8da4-a3231271753a'::uuid),
    (3,'61573500-f533-438c-82b6-b0223df88671'::uuid),
    (4,'3e1d3b7d-8856-40cb-ab07-5e9e624e6329'::uuid)
  ) p(slot, user_id)
),
src as (
  select r.id as task_ref, 'review'::text as task_type, row_number() over (order by r.id) as rn
    from (select id from public.reviews where status in ('under_review','returned') order by id limit 10) r
  union all
  select v.id, 'visit'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id limit 8) v
  union all
  select v.id, 'correction'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id offset 20 limit 4) v
  union all
  select v.id, 'objection'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id offset 30 limit 3) v
  union all
  select v.id, 'committee'::text, row_number() over (order by v.id)
    from (select id from public.visits where operational_state <> 'submitted' order by id offset 40 limit 3) v
),
numbered as (
  select s.*, row_number() over (order by s.task_type, s.rn) as gn from src s
)
insert into public.workflow_task_assignments
  (id, task_type, task_ref, assignee, status, branch, sector, jurisdiction, active, reason, created_by, created_at, updated_at)
select
  md5('demo:workflow_task:' || n.task_type || ':' || n.task_ref::text)::uuid,
  n.task_type, n.task_ref,
  p.user_id,
  (array['assigned','in_progress','new','in_progress','suspended','completed'])[1 + (n.gn % 6)],
  (array['Riyadh HQ','Eastern Province branch','Makkah branch','Qassim branch','Asir branch'])[1 + (n.gn % 5)],
  (array['Food & beverage','Chemicals & plastics','Metals & fabrication','Building materials','Pharmaceuticals'])[1 + (n.gn % 5)],
  (array['SA-01 Riyadh','SA-04 Eastern','SA-02 Makkah','SA-05 Qassim','SA-11 Asir'])[1 + (n.gn % 5)],
  (n.gn % 9) <> 0,
  'Demo · synthetic workload assignment seeded for the demo branch (demo-2026-07); not an approved dispatch decision.',
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  timestamptz '2026-07-27 12:00:00+03' - ((n.gn * 6) * interval '1 hour'),
  timestamptz '2026-07-27 12:00:00+03' - ((n.gn * 2) * interval '1 hour')
from numbered n
join people p on p.slot = (n.gn % 5)
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 4 · notification_rules (DEMO)
-- Trigger context: guard_published_notification_rule() blocks UPDATE and DELETE of any
-- row already in status 'published'/'locked'. Rows are therefore inserted DIRECTLY in
-- their final published state — there is no draft-then-publish path available to a
-- seed script. event_key values are exactly the live vocabulary observed in
-- public.notifications; recipient_role / escalation_role are FK-checked against
-- public.roles. CHECK constraint: (sla_minutes IS NULL) = (escalation_role IS NULL).
-- =====================================================================================
with r(event_key, channel, recipient_role, template, template_ar, sla_minutes, escalation_role) as (values
  ('assignment','inapp','inspector','Demo · New visit assigned: {{visit_reference}} — {{factory_name}}.','تجريبي · تم إسناد زيارة جديدة: {{visit_reference}} — {{factory_name}}.',null::int,null::text),
  ('assignment','push','inspector','Demo · You have a new visit assignment. Acknowledge within the working day.','تجريبي · لديك إسناد زيارة جديد. يرجى الإقرار خلال يوم العمل.',240,'ops'),
  ('assignment','email','planner','Demo · Assignment confirmation for plan {{plan_reference}}.','تجريبي · تأكيد الإسناد للخطة {{plan_reference}}.',null,null),
  ('assignment','sms','inspector','Demo · MIM: new visit {{visit_reference}} assigned to you.','تجريبي · وزارة الصناعة: تم إسناد الزيارة {{visit_reference}} إليك.',null,null),
  ('submission_received','inapp','reviewer','Demo · Inspection {{inspection_no}} submitted and awaiting Level-2 review.','تجريبي · تم تقديم التفتيش {{inspection_no}} وبانتظار المراجعة من المستوى الثاني.',1440,'ops'),
  ('submission_received','email','reviewer','Demo · A submitted inspection is queued for your review.','تجريبي · يوجد تفتيش مُقدَّم في قائمة مراجعتك.',null,null),
  ('submission_received','push','reviewer','Demo · New submission in your review queue.','تجريبي · تقديم جديد في قائمة المراجعة.',720,'ops'),
  ('review_decision','inapp','inspector','Demo · Review decision recorded for {{inspection_no}}: {{decision}}.','تجريبي · تم تسجيل قرار المراجعة للتفتيش {{inspection_no}}: {{decision}}.',null,null),
  ('review_decision','email','ops','Demo · Level-2 decision {{decision}} recorded on {{inspection_no}}.','تجريبي · تم تسجيل قرار المستوى الثاني {{decision}} على {{inspection_no}}.',480,'leadership'),
  ('review_decision','sms','factory_rep','Demo · MIM: an inspection decision affecting your facility was recorded.','تجريبي · وزارة الصناعة: تم تسجيل قرار تفتيش يخص منشأتك.',null,null),
  ('resubmission','inapp','inspector','Demo · Resubmission required for {{inspection_no}} — see returned sections.','تجريبي · مطلوب إعادة تقديم للتفتيش {{inspection_no}} — راجع الأقسام المُعادة.',2400,'reviewer'),
  ('resubmission','push','inspector','Demo · A returned inspection needs your resubmission.','تجريبي · تفتيش مُعاد يحتاج إعادة تقديم منك.',null,null),
  ('resubmission','email','ops','Demo · Resubmission window opened for {{inspection_no}}.','تجريبي · فُتحت نافذة إعادة التقديم للتفتيش {{inspection_no}}.',2400,'leadership'),
  ('visit_returned','inapp','planner','Demo · Visit {{visit_reference}} returned for correction: {{reason}}.','تجريبي · أُعيدت الزيارة {{visit_reference}} للتصحيح: {{reason}}.',480,'ops'),
  ('visit_returned','email','inspector','Demo · A visit you are assigned to has been returned.','تجريبي · تم إعادة زيارة مُسندة إليك.',null,null),
  ('visit_expired','inapp','planner','Demo · Visit {{visit_reference}} expired under rule {{rule_type}}.','تجريبي · انتهت صلاحية الزيارة {{visit_reference}} وفق القاعدة {{rule_type}}.',null,null),
  ('visit_expired','email','ops','Demo · Expiry sweep closed visit {{visit_reference}}.','تجريبي · أغلقت دورة الانتهاء الزيارة {{visit_reference}}.',1440,'leadership'),
  ('virtual_scheduled','inapp','inspector','Demo · Virtual session scheduled for {{visit_reference}} at {{scheduled_at}}.','تجريبي · جُدولت جلسة افتراضية للزيارة {{visit_reference}} في {{scheduled_at}}.',null,null),
  ('virtual_scheduled','sms','factory_rep','Demo · MIM: your virtual inspection session is scheduled.','تجريبي · وزارة الصناعة: تم جدولة جلسة التفتيش الافتراضية الخاصة بك.',null,null),
  ('geo_override_requested','inapp','ops','Demo · Location override requested on {{visit_reference}}.','تجريبي · طُلب تجاوز الموقع على الزيارة {{visit_reference}}.',120,'gis_admin'),
  ('geo_override_requested','email','security_admin','Demo · A geofence override is awaiting decision.','تجريبي · يوجد تجاوز نطاق جغرافي بانتظار القرار.',null,null),
  ('geo_override_approved','inapp','inspector','Demo · Your location override was approved.','تجريبي · تمت الموافقة على تجاوز الموقع الخاص بك.',null,null),
  ('geo_override_approved','push','ops','Demo · Geofence override approved on {{visit_reference}}.','تجريبي · تمت الموافقة على تجاوز النطاق الجغرافي للزيارة {{visit_reference}}.',null,null),
  ('compliance_request_submitted','inapp','compliance_admin','Demo · Configuration request {{request_reference}} submitted for review.','تجريبي · تم تقديم طلب التهيئة {{request_reference}} للمراجعة.',960,'leadership'),
  ('compliance_request_submitted','email','workflow_admin','Demo · A compliance configuration request needs triage.','تجريبي · طلب تهيئة امتثال يحتاج إلى فرز.',null,null),
  ('compliance_request_returned','inapp','form_admin','Demo · Request {{request_reference}} returned: {{reason}}.','تجريبي · أُعيد الطلب {{request_reference}}: {{reason}}.',null,null),
  ('compliance_request_approved','inapp','compliance_admin','Demo · Request {{request_reference}} approved and ready to publish.','تجريبي · تمت الموافقة على الطلب {{request_reference}} وهو جاهز للنشر.',null,null),
  ('compliance_request_partially_approved','inapp','compliance_admin','Demo · Request {{request_reference}} partially approved — some components were returned.','تجريبي · تمت الموافقة جزئياً على الطلب {{request_reference}} — أُعيدت بعض المكونات.',480,'compliance_admin'),
  ('compliance_request_published','inapp','auditor','Demo · Configuration {{request_reference}} published and locked.','تجريبي · تم نشر التهيئة {{request_reference}} وقفلها.',null,null),
  ('compliance_request_published','email','leadership','Demo · A governed configuration version is now effective.','تجريبي · أصبح إصدار تهيئة محكوم نافذاً الآن.',null,null)
)
insert into public.notification_rules
  (id, event_key, channel, recipient_role, template, template_ar, sla_minutes, escalation_role,
   status, version_label, created_by, approved_by, published_at, created_at)
select
  md5('demo:notification_rule:' || r.event_key || ':' || r.channel || ':' || r.recipient_role)::uuid,
  r.event_key, r.channel, r.recipient_role, r.template, r.template_ar, r.sla_minutes, r.escalation_role,
  'published'::config_status, 'demo-2026-07',
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-07-20 09:00:00+03',
  timestamptz '2026-07-19 09:00:00+03'
from r
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 5a · risk_variables (DEMO)
-- =====================================================================================
with v(var_key, label, data_type, source_ref, active) as (values
  ('violation_history_24mo','Demo · Confirmed violations in the last 24 months','numeric','violations.issued_at',true),
  ('last_outcome_recency_severity','Demo · Recency-weighted severity of the last inspection outcome','numeric','reviews.decided_at + findings.severity',true),
  ('activity_hazard_class','Demo · Declared industrial activity hazard class','categorical','factories.activity_class',true),
  ('license_status','Demo · Industrial licence status','categorical','industrial_licenses.status',true),
  ('open_corrective_actions','Demo · Open corrective actions past due','numeric','findings + correction_evidence',true),
  ('repeat_violation_rate_12mo','Demo · Repeat violation rate over 12 months','numeric','violations.code + inspections',true),
  ('inspection_recency_days','Demo · Days since the last completed inspection','numeric','inspections.submitted_at',true),
  ('checklist_noncompliance_rate','Demo · Checklist non-compliance rate','numeric','checklist_responses.response',true),
  ('evidence_completeness_rate','Demo · Evidence completeness against mandatory rules','numeric','evidence + inspection_items.evidence_rule',true),
  ('penalty_amount_outstanding','Demo · Outstanding penalty exposure','numeric','penalty_notices',true),
  ('worker_headcount_band','Demo · Declared worker headcount band','categorical','factories.headcount_band',true),
  ('hazardous_material_onsite','Demo · Hazardous material declared on site','boolean','factory_materials',true),
  ('facility_age_years','Demo · Facility age in years','numeric','factories.established_on',true),
  ('last_license_renewal_date','Demo · Last industrial licence renewal date','date','industrial_licenses.renewed_on',true),
  ('self_assessment_submitted','Demo · Self-assessment submitted in the current cycle','boolean','self_assessments',true),
  ('geo_override_frequency_90d','Demo · Location-override frequency over 90 days','numeric','geo_override_requests',true),
  ('objection_upheld_rate','Demo · Rate of objections upheld against issued findings','numeric','objections',true),
  ('sector_risk_baseline','Demo · Sector baseline risk classification','categorical','planning_lookups(kind=sector)',true),
  ('cancellation_rate_180d','Demo · Visit cancellation rate over 180 days','numeric','visits.cancellation_reason',true),
  ('production_line_count','Demo · Declared production line count','numeric','plant_production_line_items',false)
)
insert into public.risk_variables (id, var_key, label, data_type, source_ref, active, created_by, created_at)
select md5('demo:risk_variable:' || v.var_key)::uuid, v.var_key, v.label, v.data_type, v.source_ref, v.active,
  'f9067e24-99f7-40e7-8421-4717de9ca2db', timestamptz '2026-07-18 10:00:00+03'
from v
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 5b · engine_settings(engine='risk') → complete DEMO model, plus two risk_models
-- The eight factor weights sum to exactly 1.0000 (the invariant /admin/risk enforces).
-- The UPDATE is guarded on version_label so re-running is a no-op.
-- =====================================================================================
update public.engine_settings
   set settings = jsonb_build_object(
         'factors', jsonb_build_array(
           jsonb_build_object('key','violation_history_24mo','weight',0.22),
           jsonb_build_object('key','last_outcome_recency_severity','weight',0.16),
           jsonb_build_object('key','activity_hazard_class','weight',0.15),
           jsonb_build_object('key','license_status','weight',0.12),
           jsonb_build_object('key','open_corrective_actions','weight',0.11),
           jsonb_build_object('key','repeat_violation_rate_12mo','weight',0.10),
           jsonb_build_object('key','checklist_noncompliance_rate','weight',0.08),
           jsonb_build_object('key','inspection_recency_days','weight',0.06)
         ),
         'bands', jsonb_build_object('low', jsonb_build_array(0,39), 'medium', jsonb_build_array(40,69), 'high', jsonb_build_array(70,100)),
         'recalculation', jsonb_build_object('cadence','nightly','window','02:00 Asia/Riyadh','trigger_on_new_violation',true),
         'normalisation', jsonb_build_object('method','min_max','clamp',jsonb_build_array(0,100)),
         'demo', true,
         'provenance', 'Demo · synthetic risk model seeded for the demo branch (demo-2026-07). Product-Owner authorised demo configuration — NOT approved ministry policy.'
       ),
       version_label = 'demo-2026-07',
       updated_by = 'f9067e24-99f7-40e7-8421-4717de9ca2db',
       updated_at = timestamptz '2026-07-18 11:00:00+03'
 where engine = 'risk'
   and version_label is distinct from 'demo-2026-07';

insert into public.risk_models (id, model_key, version_label, status, payload, row_version, created_by, approved_by, effective_from, created_at, updated_at)
select md5('demo:risk_model:demo-2026-07')::uuid, 'risk', 'demo-2026-07', 'published',
  (select settings from public.engine_settings where engine='risk'),
  1, 'f9067e24-99f7-40e7-8421-4717de9ca2db', '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-07-18 11:00:00+03', timestamptz '2026-07-18 10:30:00+03', timestamptz '2026-07-18 11:00:00+03'
where not exists (select 1 from public.risk_models where id = md5('demo:risk_model:demo-2026-07')::uuid);

insert into public.risk_models (id, model_key, version_label, status, payload, row_version, created_by, approved_by, effective_from, created_at, updated_at)
select md5('demo:risk_model:demo-2026-06')::uuid, 'risk', 'demo-2026-06', 'retired',
  jsonb_build_object(
    'factors', jsonb_build_array(
      jsonb_build_object('key','violation_history_24mo','weight',0.30),
      jsonb_build_object('key','last_outcome_recency_severity','weight',0.20),
      jsonb_build_object('key','activity_hazard_class','weight',0.20),
      jsonb_build_object('key','license_status','weight',0.15),
      jsonb_build_object('key','open_corrective_actions','weight',0.15)),
    'bands', jsonb_build_object('low', jsonb_build_array(0,39), 'medium', jsonb_build_array(40,69), 'high', jsonb_build_array(70,100)),
    'demo', true,
    'provenance', 'Demo · superseded synthetic risk model (demo-2026-06). Product-Owner authorised demo configuration — NOT approved ministry policy.'),
  1, 'f9067e24-99f7-40e7-8421-4717de9ca2db', '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-06-15 11:00:00+03', timestamptz '2026-06-14 10:30:00+03', timestamptz '2026-07-18 11:00:00+03'
where not exists (select 1 from public.risk_models where id = md5('demo:risk_model:demo-2026-06')::uuid);


-- =====================================================================================
-- BATCH 5c · risk_runs / risk_simulations / risk_overrides (DEMO)
-- =====================================================================================
with n as (select generate_series(1,24) as i)
insert into public.risk_runs (id, model_version_label, status, reason, idempotency_key, requested_by, started_at, finished_at, created_at)
select
  md5('demo:risk_run:' || n.i::text)::uuid,
  case when n.i % 6 = 0 then 'demo-2026-06' else 'demo-2026-07' end,
  (array['completed','completed','completed','running','queued','failed'])[1 + (n.i % 6)],
  'Demo · ' || (array[
      'scheduled nightly recalculation',
      'manual recalculation after violation batch',
      'recalculation after model publish demo-2026-07',
      'ad-hoc recalculation for Eastern Province scope',
      'backfill after licence status refresh',
      'failed run — upstream licence feed unavailable'])[1 + (n.i % 6)]
    || ' (synthetic demo data, demo-2026-07)',
  'demo-risk-run-2026-07-' || lpad(n.i::text, 3, '0'),
  case when n.i % 3 = 0 then '38fd1ad1-ec82-4d62-8da4-a3231271753a'::uuid else 'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid end,
  timestamptz '2026-07-27 02:00:00+03' - (n.i * interval '18 hours'),
  case when (array['completed','completed','completed','running','queued','failed'])[1 + (n.i % 6)] in ('completed','failed')
       then timestamptz '2026-07-27 02:00:00+03' - (n.i * interval '18 hours') + ((6 + n.i) * interval '1 minute') end,
  timestamptz '2026-07-27 02:00:00+03' - (n.i * interval '18 hours') - interval '2 minutes'
from n
on conflict (id) do nothing;

with n as (select generate_series(1,12) as i),
m as (select md5('demo:risk_model:demo-2026-07')::uuid as new_id, md5('demo:risk_model:demo-2026-06')::uuid as old_id)
insert into public.risk_simulations (id, model_id, input_ref, result, created_by, created_at)
select
  md5('demo:risk_simulation:' || n.i::text)::uuid,
  case when n.i % 4 = 0 then m.old_id else m.new_id end,
  'demo-scenario-' || lpad(n.i::text, 2, '0') || ' · ' ||
    (array['all F-% factories','Eastern Province cohort','food & beverage cohort','chemicals cohort'])[1 + (n.i % 4)],
  jsonb_build_object(
    'demo', true,
    'provenance', 'Demo · synthetic simulation result (demo-2026-07); not an approved risk assessment.',
    'scope', (array['all F-% factories','Eastern Province cohort','food & beverage cohort','chemicals cohort'])[1 + (n.i % 4)],
    'factories_scored', 24 - (n.i % 5),
    'band_distribution', jsonb_build_object('low', 8 + (n.i % 4), 'medium', 10 - (n.i % 3), 'high', 6 + (n.i % 3)),
    'mean_score', 41.5 + (n.i * 1.25),
    'band_shift_vs_current', jsonb_build_object('upgraded', n.i % 4, 'downgraded', n.i % 3, 'unchanged', 24 - (n.i % 4) - (n.i % 3))
  ),
  case when n.i % 2 = 0 then 'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid else '38fd1ad1-ec82-4d62-8da4-a3231271753a'::uuid end,
  timestamptz '2026-07-24 10:00:00+03' - (n.i * interval '9 hours')
from n cross join m
on conflict (id) do nothing;

with f as (
  select id, row_number() over (order by factory_code) as rn
  from public.factories where factory_code like 'F-%' order by factory_code limit 12
)
insert into public.risk_overrides (id, factory_id, status, sensitivity_class, reason, requested_by, decided_by, effective_from, ended_at, created_at)
select
  md5('demo:risk_override:' || f.id::text)::uuid,
  f.id,
  (array['approved','approved','requested','rejected','ended'])[1 + (f.rn % 5)],
  (array['restricted','internal','restricted','internal','confidential'])[1 + (f.rn % 5)],
  'Demo · ' || (array[
      'strategic-site handling — band held at the governed floor pending committee review',
      'recent remediation verified on site; interim band adjustment requested',
      'licence feed disputed by the operator; override requested pending reconciliation',
      'override rejected — evidence insufficient to displace the modelled band',
      'temporary override ended after the scheduled recalculation'])[1 + (f.rn % 5)]
    || ' (synthetic demo data, demo-2026-07; not an approved risk decision).',
  '38fd1ad1-ec82-4d62-8da4-a3231271753a',
  case when (array['approved','approved','requested','rejected','ended'])[1 + (f.rn % 5)] <> 'requested'
       then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid end,
  case when (array['approved','approved','requested','rejected','ended'])[1 + (f.rn % 5)] in ('approved','ended')
       then timestamptz '2026-07-27 09:00:00+03' - (f.rn * interval '3 days') end,
  case when (array['approved','approved','requested','rejected','ended'])[1 + (f.rn % 5)] = 'ended'
       then timestamptz '2026-07-27 09:00:00+03' - (f.rn * interval '1 day') end,
  timestamptz '2026-07-27 09:00:00+03' - (f.rn * interval '4 days')
from f
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 6a · dashboard_config_parameters (DEMO) — one approved draft per governed domain
-- The kpi_parameters payload carries a threshold triple for EVERY metric_key that
-- exists in public.mvp3_kpi_definitions, plus the period / timezone / scope_precedence
-- keys that rpc operations_kpi_contract() requires.
-- =====================================================================================
with kpi(metric_key, unit, direction, target, warn, critical) as (values
  ('active_executions','count','up',40,25,10),
  ('approval_outcomes','percent','up',80,70,60),
  ('cancellation_rate','percent','down',5,8,12),
  ('checklist_compliance','percent','up',92,85,75),
  ('checklist_items_by_authority','count','up',120,80,40),
  ('compliance_rate_trend','percent','up',90,82,72),
  ('daily_progress','percent','up',85,70,55),
  ('expiring_soon','count','down',10,20,35),
  ('gps_overrides_today','count','down',3,6,10),
  ('health_score_distribution','percent','up',70,60,50),
  ('inspection_coverage','percent','up',88,78,65),
  ('level2_decision_mix','percent','up',75,65,55),
  ('licence_exposure','count','down',15,30,50),
  ('live_activity_feed','count','up',20,10,4),
  ('operational_nudges','count','down',5,12,20),
  ('pending_approvals','count','down',12,25,40),
  ('pending_attention','count','down',15,30,50),
  ('pending_publish','count','down',5,10,18),
  ('personal_trends','percent','up',80,70,60),
  ('remaining_visits','count','down',25,45,70),
  ('repeat_violation_rate','percent','down',8,14,22),
  ('risk_to_attention_mismatch','percent','down',10,18,28),
  ('strategic_summary','percent','up',85,75,65),
  ('today_schedule_load','percent','up',90,75,60),
  ('today_visits','count','up',30,18,8),
  ('uninspected_by_segment','percent','down',12,22,35),
  ('violation_trend_regulation_severity','count','down',20,35,55),
  ('visit_pipeline','count','up',60,40,20)
),
kpi_payload as (
  select jsonb_build_object(
    'demo', true,
    'provenance', 'Demo · synthetic KPI thresholds seeded for the demo branch (demo-2026-07). Product-Owner authorised demo configuration — NOT approved ministry policy.',
    'period', 'rolling_30d',
    'timezone', 'Asia/Riyadh',
    'scope_precedence', jsonb_build_array('user_scope','region','sector','national'),
    'working_week', jsonb_build_object('days','Sun-Thu','hours','08:00-16:00','tz','Asia/Riyadh'),
    'refresh', jsonb_build_object('realtime_seconds',60,'on_demand_seconds',900),
    'metrics', (select jsonb_object_agg(k.metric_key, jsonb_build_object(
        'unit', k.unit, 'direction', k.direction,
        'target', k.target, 'warn', k.warn, 'critical', k.critical,
        'source', 'mvp3_kpi_definitions'
      )) from kpi k)
  ) as payload
),
dom(config_key, title, payload) as (
  select 'kpi_parameters', 'Demo · KPI parameters and thresholds (demo-2026-07)', (select payload from kpi_payload)
  union all select 'factory_eligibility', 'Demo · Factory eligibility policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','require_active_licence',true,'exclude_statuses',jsonb_build_array('closed','suspended'),'min_days_since_last_visit',30)
  union all select 'inspection_cycle_policy', 'Demo · Inspection cycle policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','cycle_days_by_band',jsonb_build_object('high',90,'medium',180,'low',365),'grace_days',14)
  union all select 'sla_urgency_policy', 'Demo · SLA urgency presentation policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','warn_at_fraction',0.8,'breach_grace_working_days',1,'calendar_version','demo-2026-07')
  union all select 'health_risk_presentation', 'Demo · Health and risk presentation (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','bands',jsonb_build_object('low',jsonb_build_array(0,39),'medium',jsonb_build_array(40,69),'high',jsonb_build_array(70,100)),'show_score_numeric',true)
  union all select 'health_risk_engine_refs', 'Demo · Health and risk engine references (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','risk_engine_version','demo-2026-07','health_score_provider',null,'health_score_status','unavailable')
  union all select 'layout_visibility', 'Demo · Dashboard layout visibility (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','strategic_roles',jsonb_build_array('leadership','auditor'),'operational_roles',jsonb_build_array('ops','planner','reviewer'),'field_roles',jsonb_build_array('inspector'))
  union all select 'map_profile', 'Demo · Map profile (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','default_zoom',5,'centre',jsonb_build_object('lat',24.7136,'lng',46.6753),'cluster_threshold',25)
  union all select 'strategic_summary_policy', 'Demo · Strategic summary policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','comparison_window','previous_30d','min_denominator',10)
  union all select 'operational_nudge_policy', 'Demo · Operational nudge policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','max_nudges_per_session',5,'suppress_after_dismiss_hours',24)
  union all select 'freshness_offline_policy', 'Demo · Freshness and offline policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','stale_after_minutes',30,'offline_banner_after_minutes',5)
  union all select 'localization', 'Demo · Localization policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','default_locale','ar','locales',jsonb_build_array('ar','en'),'numerals','latin','calendar','gregorian')
  union all select 'masking_export', 'Demo · Masking and export policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','mask_personal_names_for',jsonb_build_array('auditor'),'export_formats',jsonb_build_array('csv'),'watermark',true)
  union all select 'pre_inspection_pack', 'Demo · Pre-inspection pack policy (demo-2026-07)', jsonb_build_object('demo',true,'provenance','Demo · synthetic configuration; not approved policy.','include_last_visits',3,'include_open_violations',true,'max_pack_mb',25)
)
insert into public.dashboard_config_parameters
  (id, config_key, title, status, revision, payload, requested_effective_from, owner_id,
   return_reason, submitted_at, decided_by, decided_at, correlation_id, created_at, updated_at)
select
  md5('demo:dash_param:' || d.config_key)::uuid,
  d.config_key, d.title, 'approved', 1, d.payload,
  timestamptz '2026-07-20 00:00:00+03',
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  null,
  timestamptz '2026-07-19 10:00:00+03',
  '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-07-20 09:30:00+03',
  md5('demo:dash_corr:' || d.config_key)::uuid,
  timestamptz '2026-07-19 09:00:00+03',
  timestamptz '2026-07-20 09:30:00+03'
from dom d
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 6b · dashboard_config_versions + dashboard_config_heads (DEMO)
-- Trigger context: dash_block_version_mutation() makes dashboard_config_versions
-- append-only (UPDATE/DELETE blocked); INSERT is the only legal path.
-- publication_audit_reference is left NULL: the production publish RPC writes an
-- immutable audit row first and references it — a seed cannot forge that audit entry,
-- and inventing one would misrepresent the publication as governed.
-- Six extra in-flight revisions keep the review lane non-empty.
-- =====================================================================================
insert into public.dashboard_config_versions
  (id, config_key, version_number, payload, effective_from, source_parameter_id, published_by, published_at, correlation_id, publication_audit_reference)
select
  md5('demo:dash_version:' || p.config_key || ':1')::uuid,
  p.config_key, 1, p.payload,
  timestamptz '2026-07-20 00:00:00+03',
  p.id,
  '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-07-20 09:30:00+03',
  p.correlation_id,
  null
from public.dashboard_config_parameters p
where p.status = 'approved'
  and not exists (select 1 from public.dashboard_config_versions v where v.config_key = p.config_key and v.version_number = 1);

insert into public.dashboard_config_heads (config_key, current_version_id, activated_at)
select v.config_key, v.id, timestamptz '2026-07-20 09:30:00+03'
from public.dashboard_config_versions v
where v.version_number = 1
on conflict (config_key) do nothing;

with d(config_key, title, status, revision, return_reason) as (values
  ('kpi_parameters','Demo · KPI parameters — proposed Q3 revision (demo-2026-07)','pending_review',2,null::text),
  ('sla_urgency_policy','Demo · SLA urgency policy — proposed tightening (demo-2026-07)','pending_review',2,null),
  ('map_profile','Demo · Map profile — proposed cluster tuning (demo-2026-07)','pending_review',2,null),
  ('inspection_cycle_policy','Demo · Inspection cycle policy — returned revision (demo-2026-07)','returned',2,'Demo · returned: cycle days for the medium band need a governance reference before publication.'),
  ('masking_export','Demo · Masking and export — returned revision (demo-2026-07)','returned',2,'Demo · returned: export watermark policy must cite the approving authority.'),
  ('localization','Demo · Localization — working draft (demo-2026-07)','draft',2,null)
)
insert into public.dashboard_config_parameters
  (id, config_key, title, status, revision, payload, requested_effective_from, owner_id,
   return_reason, submitted_at, decided_by, decided_at, correlation_id, created_at, updated_at)
select
  md5('demo:dash_param:' || d.config_key || ':rev2')::uuid,
  d.config_key, d.title, d.status, d.revision,
  jsonb_build_object('demo', true,
    'provenance','Demo · synthetic in-flight configuration revision (demo-2026-07); not approved policy.',
    'supersedes_revision', 1),
  timestamptz '2026-08-01 00:00:00+03',
  '38fd1ad1-ec82-4d62-8da4-a3231271753a',
  d.return_reason,
  case when d.status <> 'draft' then timestamptz '2026-07-25 11:00:00+03' end,
  case when d.status = 'returned' then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid end,
  case when d.status = 'returned' then timestamptz '2026-07-26 08:30:00+03' end,
  md5('demo:dash_corr:' || d.config_key || ':rev2')::uuid,
  timestamptz '2026-07-25 10:00:00+03',
  timestamptz '2026-07-26 08:30:00+03'
from d
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 7 · mvp3_kpi_definitions (DEMO) — the seven Operations KPI families
-- rpc operations_kpi_contract() hard-codes these seven required metric_key families
-- and reports source_status 'not_configured' for each one with no PUBLISHED definition.
-- None of them existed. They are seeded here as published demo definitions so
-- /operations stops printing "Not configured" in the published-formula column.
-- The 28 pre-existing definitions are left untouched (still draft).
-- =====================================================================================
with k(metric_key, title_en, title_ar, owner_role, formula, lineage, cadence) as (values
  ('visits_planned','Demo · Visits planned','تجريبي · الزيارات المخططة','ops',
   'count of visits with planning_status = published whose window_start falls inside the selected period','{"tables":["visits","visit_plans"],"demo":true}','on_demand'),
  ('visits_completed','Demo · Visits completed','تجريبي · الزيارات المنجزة','ops',
   'count of distinct visits whose linked inspection reached submitted inside the selected period','{"tables":["visits","inspections"],"demo":true}','on_demand'),
  ('visits_cancelled','Demo · Visits cancelled','تجريبي · الزيارات الملغاة','ops',
   'count of visits with a recorded cancellation_reason inside the selected period','{"tables":["visits","cancellation_requests"],"demo":true}','on_demand'),
  ('visits_overdue','Demo · Visits overdue','تجريبي · الزيارات المتأخرة','ops',
   'count of visits not submitted whose window_end is earlier than the evaluation time','{"tables":["visits"],"demo":true}','realtime'),
  ('active_inspectors','Demo · Active inspectors','تجريبي · المفتشون النشطون','ops',
   'count of distinct inspectors holding at least one visit in operational_state on_the_way, arrived or executing','{"tables":["assignments","visits"],"demo":true}','realtime'),
  ('average_duration','Demo · Average inspection duration','تجريبي · متوسط مدة التفتيش','ops',
   'mean minutes between inspections.started_at and inspections.submitted_at over completed inspections in the period','{"tables":["inspections"],"demo":true}','on_demand'),
  ('sla_breach_rate','Demo · SLA breach rate','تجريبي · معدل تجاوز اتفاقية مستوى الخدمة','ops',
   'sla_timers in status breached divided by all sla_timers started inside the period, using calendar demo-2026-07','{"tables":["sla_timers","sla_calendars"],"demo":true}','on_demand')
)
insert into public.mvp3_kpi_definitions
  (id, metric_key, version, title_en, title_ar, owner_role, formula, source_lineage,
   refresh_cadence, retention_status, status, created_by, approved_by, created_at, published_at)
select
  md5('demo:kpi_def:' || k.metric_key)::uuid,
  k.metric_key, 1, k.title_en, k.title_ar, k.owner_role, k.formula, k.lineage::jsonb,
  k.cadence, 'configured', 'published',
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  '7da93ff6-82c5-45f8-be26-92c8956c2254',
  timestamptz '2026-07-19 09:00:00+03',
  timestamptz '2026-07-20 09:30:00+03'
from k
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 8a · packages (DEMO)
-- =====================================================================================
with p(code, title, scope) as (values
  ('PKG-DEMO-ELEC','Demo · Electrical safety — general factories','demo-2026-07 · general industrial occupancies'),
  ('PKG-DEMO-CHEM','Demo · Chemical storage & handling','demo-2026-07 · chemical and plastics manufacturers'),
  ('PKG-DEMO-FOOD','Demo · Food & beverage hygiene','demo-2026-07 · food and beverage production lines'),
  ('PKG-DEMO-ENV','Demo · Environmental discharge & emissions','demo-2026-07 · facilities with regulated discharge points'),
  ('PKG-DEMO-CONF','Demo · Product conformity & quality mark','demo-2026-07 · finished-goods conformity checks'),
  ('PKG-DEMO-ENERGY','Demo · Energy efficiency & labelling','demo-2026-07 · energy-intensive facilities')
)
insert into public.packages (id, code, title, scope, created_at)
select md5('demo:package:' || p.code)::uuid, p.code, p.title, p.scope, timestamptz '2026-07-18 09:00:00+03'
from p
on conflict (code) do nothing;


-- =====================================================================================
-- BATCH 8b · package_versions (DEMO) — two published versions per demo package
-- Trigger context: guard_package_regulation_dependencies() rejects a published version
-- whose definition references an item code that is not anchored to a published,
-- currently-effective regulation. Only the five real anchored codes are used
-- (FS-101, FS-102, FS-107, EG-201, HZ-310); no item code is invented.
-- guard_publish_requires_approver() + pkg_maker_checker require a distinct approver.
-- =====================================================================================
with pk as (
  select id, code, title, row_number() over (order by code) as rn
  from public.packages where code like 'PKG-DEMO-%'
),
ver(vlabel, seq, eff_from, eff_to) as (values
  ('v2026.06-demo', 1, date '2026-06-15', date '2026-07-14'),
  ('v2026.07-demo', 2, date '2026-07-15', null::date)
)
insert into public.package_versions
  (id, package_id, version_label, status, definition, published_at, created_by, approved_by, effective_from, effective_to, supersedes_id, deactivation_reason)
select
  md5('demo:package_version:' || pk.code || ':' || ver.vlabel)::uuid,
  pk.id, ver.vlabel, 'published'::config_status,
  jsonb_build_object(
    'demo', true,
    'provenance', 'Demo · synthetic inspection package definition (demo-2026-07). Product-Owner authorised demo configuration — NOT approved ministry policy.',
    'sections', jsonb_build_array(
      jsonb_build_object('key','factory_verification','title','Factory verification','fields', jsonb_build_array('rep_name','rep_role','location_confirm')),
      jsonb_build_object('key','s1','title','Fire protection systems','mandatory',true,'items', jsonb_build_array('FS-101','FS-102')),
      jsonb_build_object('key','s2','title','Exits, evacuation & hazardous materials','mandatory',true,'items',
        case when ver.seq = 2 then jsonb_build_array('EG-201','HZ-310','FS-107') else jsonb_build_array('EG-201','HZ-310') end)
    ),
    'action_forms', jsonb_build_array(
      jsonb_build_object('key','corrective_blocking','title','Corrective action form','blocking',true,
        'fields', jsonb_build_array('owner_name','owner_role','due_at','required_correction')))
  ),
  (ver.eff_from + time '09:00')::timestamptz,
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  '7da93ff6-82c5-45f8-be26-92c8956c2254',
  ver.eff_from, ver.eff_to,
  case when ver.seq = 2 then md5('demo:package_version:' || pk.code || ':v2026.06-demo')::uuid end,
  null
from pk cross join ver
on conflict (id) do nothing;


-- =====================================================================================
-- BATCH 8c · package_version_item_snapshots + package_version_dependency_snapshots (DEMO)
-- Snapshots are taken from the REAL inspection_items / regulation_clauses /
-- violation_codes rows, so the frozen content is not invented — only the
-- package↔item association is demo data.
-- =====================================================================================
insert into public.package_version_item_snapshots (package_version_id, item_code, snapshot, frozen_at)
select pv.id, ic.code,
  to_jsonb(ii) || jsonb_build_object(
    'demo', true,
    'provenance', 'Demo · frozen item snapshot for a synthetic demo package version (demo-2026-07).',
    'regulation_clauses', to_jsonb(rc) - 'id' - 'regulation_id')
  , coalesce(pv.published_at, now())
from public.package_versions pv
join public.packages p on p.id = pv.package_id and p.code like 'PKG-DEMO-%'
cross join lateral jsonb_array_elements(pv.definition->'sections') section
cross join lateral jsonb_array_elements_text(coalesce(section->'items','[]'::jsonb)) as ic(code)
join public.inspection_items ii on ii.code = ic.code
left join public.regulation_clauses rc on rc.id = ii.clause_id
on conflict (package_version_id, item_code) do nothing;

with vc(pkg_code, codes) as (values
  ('PKG-DEMO-ELEC', array['V-ELE-01','V-ELE-04']),
  ('PKG-DEMO-CHEM', array['V-CHM-01','V-CHM-04','V-CHM-09']),
  ('PKG-DEMO-FOOD', array['V-FDH-20']),
  ('PKG-DEMO-ENV',  array['V-EFF-90','V-EMS-80']),
  ('PKG-DEMO-CONF', array['V-CNF-10','V-CNF-14']),
  ('PKG-DEMO-ENERGY', array['V-ENL-20','V-ENR-50'])
)
insert into public.package_version_dependency_snapshots (package_version_id, dependency_type, dependency_key, snapshot, frozen_at)
select pv.id, 'violation', c.code,
  to_jsonb(v) || jsonb_build_object('demo', true,
    'provenance','Demo · frozen violation-code dependency snapshot for a synthetic demo package version (demo-2026-07).'),
  coalesce(pv.published_at, now())
from public.package_versions pv
join public.packages p on p.id = pv.package_id and p.code like 'PKG-DEMO-%'
join vc on vc.pkg_code = p.code
cross join lateral unnest(vc.codes) as c(code)
join public.violation_codes v on v.code = c.code
on conflict (package_version_id, dependency_type, dependency_key) do nothing;

insert into public.package_version_dependency_snapshots (package_version_id, dependency_type, dependency_key, snapshot, frozen_at)
select pv.id, 'template', 'corrective_blocking',
  jsonb_build_object('demo', true,
    'key','corrective_blocking','title','Corrective action form','blocking', true,
    'fields', jsonb_build_array('owner_name','owner_role','due_at','required_correction'),
    'provenance','Demo · frozen action-form template dependency snapshot (demo-2026-07).'),
  coalesce(pv.published_at, now())
from public.package_versions pv
join public.packages p on p.id = pv.package_id and p.code like 'PKG-DEMO-%'
on conflict (package_version_id, dependency_type, dependency_key) do nothing;


-- =====================================================================================
-- BATCH 9 · gis_layers, notification_preferences, factory_risk_snapshots top-up (DEMO)
-- The five pre-existing gis_layers rows are throwaway e2e artefacts ('e2e-layer-…');
-- they are LEFT IN PLACE and seven named demo layers are added alongside them.
-- factory_risk_snapshots: every F-% factory already had a snapshot inside the
-- 2026-06-28..2026-07-27 window, so no score is invented — each factory's LATEST
-- stored score and band are carried forward verbatim and restamped with the current
-- demo model version so the model in engine_settings is represented in the history.
-- =====================================================================================
with g(layer_key, label, layer_type, source_ref, sensitivity_class, active) as (values
  ('demo_ksa_admin_regions','Demo · KSA administrative regions','boundary','lib/ksa-regions.ts (canonical region GeoJSON)','internal',true),
  ('demo_industrial_cities','Demo · MODON industrial city boundaries','boundary','demo-2026-07 static extract','internal',true),
  ('demo_factory_points','Demo · Registered factory locations','overlay','factories.lat/lng','restricted',true),
  ('demo_risk_heat','Demo · Factory risk heat surface','heat','factory_risk_snapshots (model demo-2026-07)','restricted',true),
  ('demo_inspection_routes','Demo · Inspection journey routes','route','route_snapshots','restricted',true),
  ('demo_basemap_light','Demo · Light basemap tiles','base','demo-2026-07 tile profile','internal',true),
  ('demo_restricted_zones','Demo · Restricted and strategic zones','overlay','demo-2026-07 static extract','confidential',false)
)
insert into public.gis_layers (id, layer_key, label, layer_type, source_ref, sensitivity_class, active, created_by, created_at)
select md5('demo:gis_layer:' || g.layer_key)::uuid, g.layer_key, g.label, g.layer_type, g.source_ref, g.sensitivity_class, g.active,
  'f9067e24-99f7-40e7-8421-4717de9ca2db', timestamptz '2026-07-18 08:00:00+03'
from g
on conflict (layer_key) do nothing;

insert into public.notification_preferences (user_id, push_enabled, sms_enabled, email_enabled, updated_at)
select p.user_id,
  true,
  p.email in ('ops@mim.gov.sa','admin@mim.gov.sa'),
  true,
  timestamptz '2026-07-18 08:00:00+03'
from public.profiles p
where p.email in ('admin@mim.gov.sa','approver@mim.gov.sa','ops@mim.gov.sa','planner@mim.gov.sa','reviewer@mim.gov.sa')
on conflict (user_id) do nothing;

with latest as (
  select distinct on (s.factory_id) s.factory_id, s.score, s.band
  from public.factory_risk_snapshots s
  join public.factories f on f.id = s.factory_id and f.factory_code like 'F-%'
  order by s.factory_id, s.calculated_at desc
)
insert into public.factory_risk_snapshots (id, factory_id, score, band, model_version, drivers, calculated_by, calculated_at)
select md5('demo:risk_snapshot:' || l.factory_id::text || ':demo-2026-07')::uuid,
  l.factory_id, l.score, l.band, 'demo-2026-07',
  jsonb_build_object(
    'demo', true,
    'provenance','Demo · score and band carried forward from the factory''s latest stored snapshot and restamped with demo model demo-2026-07. Synthetic demo data — not an approved risk assessment.',
    'model_version','demo-2026-07',
    'carried_forward', true),
  'f9067e24-99f7-40e7-8421-4717de9ca2db',
  timestamptz '2026-07-26 02:00:00+03'
from latest l
on conflict (id) do nothing;


-- =====================================================================================
-- VERIFICATION (read-only)
-- =====================================================================================
select 'sla_calendars' t, count(*) n from public.sla_calendars
union all select 'sla_timers', count(*) from public.sla_timers
union all select 'notification_rules', count(*) from public.notification_rules
union all select 'notification_preferences', count(*) from public.notification_preferences
union all select 'risk_models', count(*) from public.risk_models
union all select 'risk_variables', count(*) from public.risk_variables
union all select 'risk_runs', count(*) from public.risk_runs
union all select 'risk_simulations', count(*) from public.risk_simulations
union all select 'risk_overrides', count(*) from public.risk_overrides
union all select 'dashboard_config_heads', count(*) from public.dashboard_config_heads
union all select 'dashboard_config_versions', count(*) from public.dashboard_config_versions
union all select 'dashboard_config_parameters', count(*) from public.dashboard_config_parameters
union all select 'mvp3_kpi_definitions', count(*) from public.mvp3_kpi_definitions
union all select 'gis_layers', count(*) from public.gis_layers
union all select 'packages', count(*) from public.packages
union all select 'package_versions', count(*) from public.package_versions
union all select 'package_version_item_snapshots', count(*) from public.package_version_item_snapshots
union all select 'package_version_dependency_snapshots', count(*) from public.package_version_dependency_snapshots
union all select 'workflow_task_assignments', count(*) from public.workflow_task_assignments
union all select 'factory_risk_snapshots', count(*) from public.factory_risk_snapshots
order by 1;

-- SLA timer resolution proof — 'unresolved' and 'pending_activation' must both be 0.
select
  count(*) total,
  count(*) filter (where calendar_id is not null) with_calendar,
  count(*) filter (where duration_minutes is not null and due_at is not null and warn_at is not null and breach_at is not null) fully_resolved,
  count(*) filter (where due_at is null or warn_at is null or breach_at is null) unresolved,
  count(*) filter (where status = 'running') running,
  count(*) filter (where status = 'breached') breached,
  count(*) filter (where status = 'paused') paused,
  count(*) filter (where status = 'pending_activation') pending_activation,
  count(*) filter (where status = 'running' and now() between warn_at and due_at) approaching_due,
  count(*) filter (where status = 'running' and now() > due_at) past_due_not_yet_breached
from public.sla_timers;

-- Risk model invariant — factor weights must sum to exactly 1.0000.
select round(sum((f->>'weight')::numeric), 4) as risk_weight_sum
from public.engine_settings, jsonb_array_elements(settings->'factors') f
where engine = 'risk';
