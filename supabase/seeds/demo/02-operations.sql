-- =====================================================================
-- SAQEEL / MIM Inspection — SYNTHETIC DEMO DATA (NON-PRODUCTION)
-- File: supabase/seeds/demo/02-operations.sql
-- Partition: Operations Center + field movement
-- Applied to staging project iiozvqntawxfwbgffzqu on 2026-07-27.
--
-- WHAT THIS IS
--   Fabricated demonstration data used to make the Operations Center,
--   /operations/live and the GPS-override analytics metric render populated
--   states instead of empty states. Nothing here is a real inspection, a real
--   incident, a real establishment report, or a real governed decision.
--   DO NOT run this against a production project.
--
-- SAFETY PROPERTIES
--   * Every INSERT is idempotent: primary keys are derived deterministically
--     with md5('saqeel-demo-ops:<purpose>:<natural key>')::uuid and every
--     statement ends in ON CONFLICT DO NOTHING (or a NOT EXISTS guard).
--     Re-running the file cannot duplicate rows.
--   * No DELETE, no TRUNCATE, no UPDATE of pre-existing rows.
--   * Only tables inside the Operations partition are written.
--   * All anchor visits/factories are the 24 curated 'F-%' factories.
--
-- ANCHORS
--   40 "anchor" visits (mixed operational states, 5 regions) drive journeys,
--   geo events, override requests and cancellations. 24 additional "clean"
--   visits carry inside-the-fence tracks so the exception ratio stays sane and
--   feed the virtual-session / feedback surfaces.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. journey_sessions — one demo journey per anchor visit.
--    Guarded against the partial unique index uq_journey_active_per_visit
--    (only one 'on_journey' row may exist per visit).
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
),
ctx as (
  select a.seq, a.visit_id, v.window_start, v.operational_state::text as os,
    f.region,
    coalesce(
      (select a2.inspector_id from assignments a2 where a2.visit_id = a.visit_id order by a2.inspector_id limit 1),
      (select p.user_id from profiles p where p.email = case f.region
         when 'Riyadh' then 'inspector@mim.gov.sa' when 'Makkah' then 'inspector2@mim.gov.sa'
         when 'Eastern' then 'inspector3@mim.gov.sa' when 'Madinah' then 'inspector4@mim.gov.sa'
         when 'Qassim' then 'inspector5@mim.gov.sa' else 'inspector1@mim.gov.sa' end)) as inspector_id,
    case when v.operational_state::text in ('on_the_way','arrived','executing')
      then now() - ((a.seq % 25) * interval '3 minutes')
      else least(v.window_start + interval '30 minutes', now() - interval '2 hours') end as base_ts,
    exists (select 1 from public.journey_sessions j
            where j.visit_id = a.visit_id and j.status = 'on_journey'
              and j.id <> md5('saqeel-demo-ops:journey:' || a.visit_id::text)::uuid) as has_active
  from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
)
insert into public.journey_sessions (
  id, visit_id, inspector_id, started_at, eta_minutes, remaining_distance_m, status,
  prestart, device_started_at, ended_at, device_info, route_provider, eta_updated_at,
  device_id, device_os_version, application_version, routing_provider, route_estimate_mode, route_estimated_at)
select
  md5('saqeel-demo-ops:journey:' || c.visit_id::text)::uuid,
  c.visit_id, c.inspector_id,
  c.base_ts - interval '55 minutes',
  case when c.os = 'on_the_way' then 9 + (c.seq % 21) else 0 end,
  case when c.os = 'on_the_way' then 2400 + (c.seq % 9) * 850 else 0 end,
  case when c.os = 'on_the_way' and not c.has_active then 'on_journey'
       when c.os in ('on_the_way','arrived','executing') then 'arrived'
       else 'completed' end,
  jsonb_build_object('vehicle_checked', true, 'kit_checked', true,
    'note', 'تم استكمال قائمة التحقق قبل الانطلاق من مقر الفرع.'),
  c.base_ts - interval '55 minutes',
  case when c.os in ('on_the_way','arrived','executing') then null else c.base_ts + interval '3 hours' end,
  jsonb_build_object('device_id', 'IPAD-MIM-' || lpad(c.seq::text, 4, '0'),
    'os_version', 'iPadOS 18.4', 'app_version', '2.6.0'),
  'internal_route_estimator',
  c.base_ts - interval '20 minutes',
  'IPAD-MIM-' || lpad(c.seq::text, 4, '0'), 'iPadOS 18.4', '2.6.0',
  'internal_route_estimator', 'production', c.base_ts - interval '50 minutes'
from ctx c
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. geo_events — telemetry / checkin / arrival tracks for every anchor,
--    plus 22 kind='override' events on in-window visits so the
--    gps_override_count analytics metric is non-zero.
--    integration_mode='production' so the Operations reads accept them.
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
),
ctx as (
  select a.seq, a.visit_id, v.operational_state::text as os, v.window_start,
    f.official_lat::numeric as lat, f.official_lng::numeric as lng,
    (a.seq = any (array[4,5,6,7,8,9,10,11,14,16,18,20,21,22,23,28,29,30,31,33,35,38])) as is_override,
    (a.seq = any (array[1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,37,38])) as is_outside,
    case when v.operational_state::text in ('on_the_way','arrived','executing')
      then now() - ((a.seq % 25) * interval '3 minutes')
      else least(v.window_start + interval '30 minutes', now() - interval '2 hours') end as base_ts
  from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
),
tmpl as (
  select * from (values
    ('telemetry', -46, 1), ('telemetry', -24, 2), ('checkin', -9, 3), ('arrival', -4, 4), ('override', -1, 5)
  ) t(kind, off_min, ord)
)
insert into public.geo_events (
  id, journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m, geofence_result,
  override_reason, gis_version, device_id, occurred_at, altitude_m, speed_mps, heading_deg,
  device_occurred_at, device_os_version, application_version, integration_mode, approval_provider, source)
select
  md5('saqeel-demo-ops:geo:' || t.kind || ':' || c.visit_id::text)::uuid,
  md5('saqeel-demo-ops:journey:' || c.visit_id::text)::uuid,
  c.visit_id, t.kind,
  round(c.lat + case t.ord
    when 1 then -0.0280 + (c.seq % 5) * 0.0041
    when 2 then -0.0104 + (c.seq % 5) * 0.0017
    when 3 then case when c.is_outside then 0.0043 + (c.seq % 4) * 0.0006 else ((c.seq % 7) - 3) * 0.00033 end
    when 4 then ((c.seq % 5) - 2) * 0.00028
    else 0.0043 + (c.seq % 4) * 0.0006 end, 7),
  round(c.lng + case t.ord
    when 1 then -0.0312 + (c.seq % 7) * 0.0053
    when 2 then -0.0121 + (c.seq % 7) * 0.0021
    when 3 then case when c.is_outside then 0.0031 + (c.seq % 5) * 0.0005 else ((c.seq % 5) - 2) * 0.00031 end
    when 4 then ((c.seq % 7) - 3) * 0.00026
    else 0.0031 + (c.seq % 5) * 0.0005 end, 7),
  case t.ord when 1 then 14 + (c.seq % 9) * 2 when 2 then 11 + (c.seq % 7) * 2
              when 3 then 8 + (c.seq % 6) when 4 then 6 + (c.seq % 5) else 9 + (c.seq % 8) end,
  case t.kind when 'telemetry' then null
              when 'checkin' then (case when c.is_outside then 'outside' else 'inside' end)::geofence_result
              when 'arrival' then 'inside'::geofence_result
              else 'override'::geofence_result end,
  case when t.kind = 'override' then
    (array['تعذّر الوصول إلى البوابة المعتمدة؛ تم التسجيل من بوابة الشحن الشمالية.',
           'أعمال حفر على الطريق المؤدي للبوابة الرئيسية تمنع الوقوف داخل النطاق.',
           'تعليمات أمن المنشأة تمنع التصوير داخل النطاق؛ التقاط من نقطة التجمع الآمنة.'])[1 + (c.seq % 3)]
  else null end,
  'GIS-2026.07', 'IPAD-MIM-' || lpad(c.seq::text, 4, '0'),
  c.base_ts + (t.off_min * interval '1 minute'),
  round(560 + (c.seq % 11) * 7.5, 1),
  case t.kind when 'telemetry' then round(11.5 + (c.seq % 9) * 1.4, 1) else 0 end,
  ((c.seq * 37) % 360),
  c.base_ts + (t.off_min * interval '1 minute') - interval '4 seconds',
  'iPadOS 18.4', '2.6.0', 'production',
  case when t.kind = 'override' then 'operations_supervisor' else null end,
  case t.kind when 'arrival' then 'confirm_arrival' when 'checkin' then 'field_checkin' else 'field_tracking' end
from ctx c
join tmpl t on (t.kind <> 'override' or c.is_override)
on conflict (id) do nothing;

-- 2b. Clean inside-the-fence tracks for 24 further published visits, so the
--     override/exception ratio in the seeded slice stays plausible.
with clean_anchors as (
  select u.vid as visit_id, (100 + u.ord)::int as seq
  from unnest(array[
    '78fc4d2b-a13f-4654-8f82-16718423b1cb','9c1a1ec3-e229-4ad9-9cb3-9e1a1cbeec56','ed6a4ba3-9c67-44c3-a6a3-86a605f7886f','c23c61ae-3618-4784-87ac-0ac527e4a18a',
    '043718dd-1638-4908-9c5a-bd13e26861b0','145da6aa-2451-4e00-92c1-f89ad181b223','a8b195d2-5ec2-4c8b-90a9-733e29e4e17f','af9f9863-6eed-419a-802f-50cc785c15e8',
    'cbc073d4-93c1-4e0d-beab-82fae5a9ab01','f1b75af9-dccb-4aa7-97b6-2ab5bf9d0a20','221c1c19-52da-44f5-a657-776191def6e7','d6ac6754-a9eb-4b2b-87c7-de113d3c4299',
    'ec5c3ce9-5d18-4f65-85dd-76dddaf4a285','265a4c30-f31e-4040-ba8e-254882ed7a75','6008605b-f9e5-411e-9a5c-49ddff5616c4','857677d7-b633-48cb-806b-db6d655c9922',
    'bbd2df7a-acd6-454b-990f-4246ed53dbc4','587a56a3-3d82-4fd2-aab3-c897e57af526','9cb7ecf0-67b7-400d-95ca-ae9e80f4821e','af581169-b2fc-4d01-90fe-9232ef1c1c45',
    'fa664ba6-df2b-4ee1-a6be-1c06765ea15a','82e09f2f-a4f1-41ad-9e32-fbf276116451','89446f1a-9ec4-4010-b7d9-56f15be704f7','e409c74e-b8de-4f6c-a716-05d4d0439a03'
  ]::uuid[]) with ordinality as u(vid, ord)
),
ctx as (
  select a.seq, a.visit_id, f.official_lat::numeric as lat, f.official_lng::numeric as lng,
    least(v.window_start + interval '35 minutes', now() - interval '90 minutes') as base_ts
  from clean_anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
),
tmpl as (
  select * from (values ('telemetry', -38, 1), ('checkin', -8, 3), ('arrival', -3, 4)) t(kind, off_min, ord)
)
insert into public.geo_events (
  id, journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m, geofence_result,
  gis_version, device_id, occurred_at, altitude_m, speed_mps, heading_deg,
  device_occurred_at, device_os_version, application_version, integration_mode, source)
select
  md5('saqeel-demo-ops:geo:' || t.kind || ':' || c.visit_id::text)::uuid,
  null, c.visit_id, t.kind,
  round(c.lat + case t.ord when 1 then -0.0221 + (c.seq % 6) * 0.0036
                            when 3 then ((c.seq % 7) - 3) * 0.00030
                            else ((c.seq % 5) - 2) * 0.00025 end, 7),
  round(c.lng + case t.ord when 1 then -0.0254 + (c.seq % 5) * 0.0049
                            when 3 then ((c.seq % 5) - 2) * 0.00029
                            else ((c.seq % 7) - 3) * 0.00024 end, 7),
  case t.ord when 1 then 15 + (c.seq % 8) * 2 when 3 then 7 + (c.seq % 6) else 6 + (c.seq % 4) end,
  case t.kind when 'telemetry' then null else 'inside'::geofence_result end,
  'GIS-2026.07', 'IPAD-MIM-' || lpad(c.seq::text, 4, '0'),
  c.base_ts + (t.off_min * interval '1 minute'),
  round(548 + (c.seq % 13) * 6.5, 1),
  case t.kind when 'telemetry' then round(10.5 + (c.seq % 8) * 1.6, 1) else 0 end,
  ((c.seq * 53) % 360),
  c.base_ts + (t.off_min * interval '1 minute') - interval '3 seconds',
  'iPadOS 18.4', '2.6.0', 'production',
  case t.kind when 'arrival' then 'confirm_arrival' when 'checkin' then 'field_checkin' else 'field_tracking' end
from ctx c cross join tmpl t
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. geo_override_requests — 8 pending (Operations queue), 12 approved,
--    4 rejected, 2 expired. Each request owns its own checkin geo_event
--    (unique) and its own journey (unique), and satisfies the
--    geo_override_decision_shape CHECK for its status.
--    Pending rows carry a long expiry so the demo queue stays populated.
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
),
req as (
  select a.seq, a.visit_id,
    case when a.seq = any (array[1,3,15,17,19,32,34,37]) then 'pending'
         when a.seq = any (array[4,5,6,7,8,9,10,11,20,21,22,23]) then 'approved'
         when a.seq = any (array[12,13,24,25]) then 'rejected'
         else 'expired' end as status,
    (array['safety_security','access_point_discrepancy','access_obstruction'])[1 + (a.seq % 3)] as reason_key,
    ge.observed_lat, ge.observed_lng, ge.accuracy_m, ge.occurred_at,
    coalesce(
      (select a2.inspector_id from assignments a2 where a2.visit_id = a.visit_id order by a2.inspector_id limit 1),
      (select p.user_id from profiles p where p.email = case f.region
         when 'Riyadh' then 'inspector@mim.gov.sa' when 'Makkah' then 'inspector2@mim.gov.sa'
         when 'Eastern' then 'inspector3@mim.gov.sa' when 'Madinah' then 'inspector4@mim.gov.sa'
         when 'Qassim' then 'inspector5@mim.gov.sa' else 'inspector1@mim.gov.sa' end)) as inspector_id
  from anchors a
  join visits v on v.id = a.visit_id
  join factories f on f.id = v.factory_id
  join public.geo_events ge on ge.id = md5('saqeel-demo-ops:geo:checkin:' || a.visit_id::text)::uuid
  where a.seq = any (array[1,3,15,17,19,32,34,37,4,5,6,7,8,9,10,11,20,21,22,23,12,13,24,25,26,27])
)
insert into public.geo_override_requests (
  id, visit_id, journey_id, checkin_event_id, requested_by, requested_at, expires_at, status,
  reason_key, reason_label, explanation, safety_security_exception,
  observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at,
  decision_by, decided_at, decision_reason, decision_event_id)
select
  md5('saqeel-demo-ops:override-req:' || r.visit_id::text)::uuid,
  r.visit_id,
  md5('saqeel-demo-ops:journey:' || r.visit_id::text)::uuid,
  md5('saqeel-demo-ops:geo:checkin:' || r.visit_id::text)::uuid,
  r.inspector_id,
  case when r.status = 'pending' then now() - ((2 + (r.seq % 21)) * interval '1 minute') else r.occurred_at end,
  case when r.status = 'pending' then now() + interval '30 days' else r.occurred_at + interval '30 minutes' end,
  r.status,
  r.reason_key,
  case r.reason_key
    when 'safety_security' then 'ظروف السلامة أو الأمن تجعل التقاط الصورة غير آمن'
    when 'access_point_discrepancy' then 'نقطة الوصول المتحققة تختلف عن الموقع المعتمد'
    else 'نقطة الوصول الرسمية محجوبة فعلياً' end,
  case r.reason_key
    when 'safety_security' then 'تعليمات أمن المنشأة تمنع التصوير داخل النطاق الجغرافي؛ تم تسجيل الموقع من نقطة التجمع الآمنة المعتمدة عند البوابة الخارجية.'
    when 'access_point_discrepancy' then 'البوابة الرسمية المسجلة في السجل الجغرافي مغلقة بشكل دائم، والدخول الفعلي يتم من بوابة الشحن الشمالية التي تبعد عن الإحداثية المعتمدة.'
    else 'أعمال حفر وصيانة في الطريق المؤدي إلى البوابة الرئيسية تمنع الوقوف داخل النطاق الجغرافي المعتمد للمنشأة.' end,
  (r.reason_key = 'safety_security'),
  r.observed_lat, r.observed_lng, r.accuracy_m,
  320 + (r.seq % 9) * 65,
  r.occurred_at - interval '4 seconds',
  case when r.status in ('approved','rejected') then (select user_id from profiles where email = 'ops@mim.gov.sa') else null end,
  case when r.status = 'pending' then null else r.occurred_at + interval '9 minutes' end,
  case r.status
    when 'approved' then 'تم التحقق من الأدلة المرفقة ومطابقة نقطة الوصول البديلة؛ اعتُمد الاستثناء لهذه المحاولة فقط.'
    when 'rejected' then 'المسافة المسجلة تتجاوز الحد المسموح به ولا تدعمها الأدلة المرفقة؛ يلزم إعادة المحاولة من النطاق المعتمد.'
    else null end,
  case when r.status = 'approved' then md5('saqeel-demo-ops:geo:override:' || r.visit_id::text)::uuid else null end
from req r
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. cancellation_requests — 8 pending (Operations queue) + 16 decided
--    (cancellation monitoring history). reason_key values come from the
--    governed engine_settings.field vocabulary; the UI localises the label.
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
),
req as (
  select a.seq, a.visit_id, v.operational_state::text as os,
    case when a.seq = any (array[2,6,14,18,26,33,37,39]) then 'pending'
         when a.seq = any (array[3,7,11,15,19,23,27,31]) then 'approved'
         when a.seq = any (array[5,9,17,25,35]) then 'rejected'
         else 'cancelled' end as status,
    (array['factory_closed','access_denied','rep_unavailable','safety_risk','wrong_location','other'])[1 + (a.seq % 6)] as reason_key,
    least(v.window_start + interval '40 minutes', now() - interval '3 hours') as decided_base,
    coalesce(
      (select a2.inspector_id from assignments a2 where a2.visit_id = a.visit_id order by a2.inspector_id limit 1),
      (select p.user_id from profiles p where p.email = case f.region
         when 'Riyadh' then 'inspector@mim.gov.sa' when 'Makkah' then 'inspector2@mim.gov.sa'
         when 'Eastern' then 'inspector3@mim.gov.sa' when 'Madinah' then 'inspector4@mim.gov.sa'
         when 'Qassim' then 'inspector5@mim.gov.sa' else 'inspector1@mim.gov.sa' end)) as inspector_id
  from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
  where a.seq = any (array[2,6,14,18,26,33,37,39,3,7,11,15,19,23,27,31,5,9,17,25,35,13,21,29])
)
insert into public.cancellation_requests (
  id, visit_id, inspection_id, requested_by, requested_at, phase, reason_key, comment,
  evidence_id, status, decided_by, decided_at, decision_reason, idempotency_key)
select
  md5('saqeel-demo-ops:cancel:' || r.visit_id::text)::uuid,
  r.visit_id, null, r.inspector_id,
  case when r.status = 'pending' then now() - ((5 + (r.seq % 40)) * interval '1 minute') else r.decided_base end,
  case r.os when 'on_the_way' then 'on_the_way' when 'arrived' then 'arrived'
            when 'executing' then 'executing' else 'pre_execution' end,
  r.reason_key,
  case r.reason_key
    when 'factory_closed' then 'المصنع مغلق عند الوصول ولا يوجد ممثل مفوض في الموقع؛ تم توثيق البوابة المغلقة.'
    when 'access_denied' then 'رفض مسؤول الأمن السماح بالدخول لعدم وجود إذن مسبق من إدارة المنشأة.'
    when 'rep_unavailable' then 'ممثل المصنع المفوض غير متوفر وتعذر التواصل معه على أرقام السجل المعتمدة.'
    when 'safety_risk' then 'رصد تسرب مواد كيميائية في ساحة الإنتاج يمنع دخول فريق التفتيش بأمان.'
    when 'wrong_location' then 'الإحداثيات المسجلة تشير إلى موقع مهجور؛ الموقع الفعلي للمنشأة يبعد نحو أربعة كيلومترات.'
    else 'تم تعليق الزيارة بناءً على تعميم إداري صادر عن إدارة العمليات بالمنطقة.' end,
  null, r.status,
  case when r.status = 'pending' then null else (select user_id from profiles where email = 'ops@mim.gov.sa') end,
  case when r.status = 'pending' then null else r.decided_base + interval '25 minutes' end,
  case r.status
    when 'approved' then 'اعتُمد الإلغاء وأُعيدت الزيارة إلى التخطيط لإعادة جدولتها خلال خمسة أيام عمل.'
    when 'rejected' then 'الأسباب المقدمة لا تستوفي ضوابط الإلغاء المعتمدة؛ يلزم استكمال الزيارة اليوم.'
    when 'cancelled' then 'سحب المفتش الطلب بعد تمكّنه من الدخول إلى المنشأة واستئناف التنفيذ.'
    else null end,
  'saqeel-demo-ops:cancel:' || r.visit_id::text
from req r
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. visit_location_events (licence + working coordinate provenance)
--    and visit_location_corrections (field/operations corrections).
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
),
ctx as (
  select a.seq, a.visit_id, v.window_start, f.official_lat::numeric lat, f.official_lng::numeric lng, f.region
  from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
),
steps as (select * from (values (1),(2)) s(n))
insert into public.visit_location_events (id, visit_id, lat, lng, source, actor, note, created_at)
select
  md5('saqeel-demo-ops:vle:' || s.n || ':' || c.visit_id::text)::uuid,
  c.visit_id,
  round(c.lat + case s.n when 1 then 0 else ((c.seq % 7) - 3) * 0.00042 end, 7),
  round(c.lng + case s.n when 1 then 0 else ((c.seq % 5) - 2) * 0.00039 end, 7),
  case when s.n = 1 then 'License' else (array['Planner','Inspector','Integration','Historical Inspection'])[1 + (c.seq % 4)] end,
  case when s.n = 1 then (select user_id from profiles where email = 'admin@mim.gov.sa')
       else (select user_id from profiles where email = 'planner@mim.gov.sa') end,
  case when s.n = 1 then 'الإحداثية المعتمدة من الرخصة الصناعية الصادرة عن الوزارة.'
       else (array['حدّث المخطط نقطة الدخول بعد مراجعة كروكي الموقع.',
                   'أكد المفتش موقع بوابة الاستقبال أثناء الزيارة الميدانية.',
                   'وردت الإحداثية من تكامل السجل الجغرافي الوطني.',
                   'مطابقة الموقع مع محضر تفتيش سابق للمنشأة.'])[1 + (c.seq % 4)] end,
  least(c.window_start - (case s.n when 1 then interval '21 days' else interval '6 days' end), now() - interval '1 day')
from ctx c cross join steps s
on conflict (id) do nothing;

with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3','9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc',
    '8b596251-35a9-462b-816f-23bf39ad8cef','2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde',
    '65da44a0-0c19-41bd-abab-58f44ba730d1','10d8a983-e078-48c5-b5a4-70948c038a8d','42e2e668-0c60-4ec5-884a-fa0da7d00b93','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','dbe6917c-d486-4400-94e5-eb6cc493a6e8',
    '3b587fcd-8675-4fa3-a6ee-476a7784d3f0','f97ca075-e6f3-4503-bc05-6eb4d9768b31'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.visit_location_corrections (
  id, visit_id, corrected_lat, corrected_lng, accuracy_m, reason, evidence_id, source, corrected_by, corrected_at, capture_context)
select
  md5('saqeel-demo-ops:vlc:' || a.visit_id::text)::uuid,
  a.visit_id,
  round(f.official_lat::numeric + 0.0041 + (a.seq % 4) * 0.0006, 7),
  round(f.official_lng::numeric + 0.0029 + (a.seq % 5) * 0.0005, 7),
  8 + (a.seq % 12),
  (array['البوابة المعتمدة مغلقة والدخول الفعلي من بوابة الشحن الشمالية.',
         'الإحداثية المسجلة تقع داخل مستودع مجاور؛ صُححت إلى مبنى الإدارة.',
         'أعمال توسعة نقلت مدخل المنشأة إلى الجهة الشرقية من السور.',
         'تم تصحيح الموقع بعد مطابقته مع الرخصة الصناعية والكروكي المعتمد.'])[1 + (a.seq % 4)],
  null,
  case when a.seq % 3 = 0 then 'operations' else 'inspector_field' end,
  coalesce((select a2.inspector_id from assignments a2 where a2.visit_id = a.visit_id order by a2.inspector_id limit 1),
           (select p.user_id from profiles p where p.email = 'inspector@mim.gov.sa')),
  least(v.window_start + interval '55 minutes', now() - interval '2 hours'),
  case when a.seq % 5 = 0 then 'offline' else 'online' end
from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6. Spatial working data: route_snapshots, location_visibility_matrix,
--    factory_locations (working layers — the authoritative pin remains
--    factories.official_*), and regional/national map_packs.
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.route_snapshots (id, visit_id, label, geometry_ref, captured_at)
select
  md5('saqeel-demo-ops:route:' || a.visit_id::text)::uuid,
  a.visit_id,
  (array['المسار المخطط من مقر الفرع إلى المنشأة',
         'المسار الفعلي المسجل أثناء التوجه',
         'مسار بديل بعد إغلاق الطريق الرئيسي',
         'مسار العودة بعد إنهاء الزيارة'])[1 + (a.seq % 4)] || ' · ' || f.factory_code,
  'routes/' || to_char(v.window_start, 'YYYY-MM') || '/' || a.visit_id::text || '-' || (1 + (a.seq % 4))::text || '.geojson',
  least(v.window_start - interval '50 minutes', now() - interval '3 hours')
from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
on conflict (id) do nothing;

insert into public.location_visibility_matrix (id, sensitivity_class, role_key, can_view_precise)
select md5('saqeel-demo-ops:lvm:' || cls.k || ':' || r.role_key)::uuid, cls.k, r.role_key,
  case cls.k
    when 'standard' then r.role_key <> 'factory_rep'
    when 'sensitive' then r.role_key in ('gis_admin','security_admin','compliance_admin','ops','inspector')
    else r.role_key in ('gis_admin','security_admin') end
from (values ('standard'),('sensitive'),('restricted')) cls(k)
cross join public.roles r
on conflict (sensitivity_class, role_key) do nothing;

insert into public.factory_locations (id, factory_id, lat, lng, geofence_radius_m, source, created_by, created_at)
select
  md5('saqeel-demo-ops:floc:' || v.kind || ':' || f.id::text)::uuid,
  f.id,
  round(f.official_lat::numeric + v.dlat, 7),
  round(f.official_lng::numeric + v.dlng, 7),
  coalesce(f.geofence_radius_m, 150) + v.dr,
  v.kind,
  (select user_id from profiles where email = 'admin@mim.gov.sa'),
  now() - (v.age_days * interval '1 day')
from public.factories f
cross join (values
  ('surveyed', 0.00021, -0.00018, 0, 41),
  ('proposed', 0.00126, 0.00094, 50, 17),
  ('corrected', -0.00072, 0.00061, -25, 6)
) v(kind, dlat, dlng, dr, age_days)
where f.factory_code like 'F-%' and f.official_lat is not null and f.official_lng is not null
on conflict (id) do nothing;

insert into public.map_packs (id, pack_key, region, status, bounds, built_at, created_by, created_at)
select
  md5('saqeel-demo-ops:mappack:' || b.region || ':' || g.ver)::uuid,
  'ksa-' || lower(replace(b.region, ' ', '-')) || '-' || g.ver,
  b.region, g.status,
  jsonb_build_object('min_lat', round(b.min_lat - 0.35, 4), 'max_lat', round(b.max_lat + 0.35, 4),
                     'min_lng', round(b.min_lng - 0.35, 4), 'max_lng', round(b.max_lng + 0.35, 4),
                     'zoom_min', 6, 'zoom_max', 14, 'tile_scheme', 'xyz'),
  now() - (g.age_days * interval '1 day'),
  (select user_id from profiles where email = 'admin@mim.gov.sa'),
  now() - ((g.age_days + 2) * interval '1 day')
from (
  select f.region, min(f.official_lat::numeric) min_lat, max(f.official_lat::numeric) max_lat,
         min(f.official_lng::numeric) min_lng, max(f.official_lng::numeric) max_lng
  from public.factories f
  where f.factory_code like 'F-%' and f.region is not null and f.official_lat is not null
  group by f.region
) b
cross join (values ('v2','stale',96),('v3','published',24),('v4','built',2)) g(ver, status, age_days)
on conflict (id) do nothing;

insert into public.map_packs (id, pack_key, region, status, bounds, built_at, created_by, created_at)
values (
  md5('saqeel-demo-ops:mappack:national:v3')::uuid, 'ksa-national-v3', null, 'published',
  jsonb_build_object('min_lat', 16.30, 'max_lat', 32.20, 'min_lng', 34.50, 'max_lng', 55.70,
                     'zoom_min', 4, 'zoom_max', 11, 'tile_scheme', 'xyz'),
  now() - interval '20 days',
  (select user_id from profiles where email = 'admin@mim.gov.sa'),
  now() - interval '22 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7. incident_reports (mid-visit incident log) and
--    operations_export_receipts (governed export audit trail).
--    Reporter names, phone numbers and CR numbers are fabricated.
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3','9bba3922-972e-4f2d-b3bc-ef57849f5064',
    '3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef','2bcf63a8-aa70-4d83-814c-a3f248b1f020',
    'a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1',
    '75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d','4bc16078-0c99-4bab-b28d-0d550d105c8a','96d18195-4e3d-40e2-aef7-b11c02a426b9',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','6b78d98c-6766-484b-af42-b2811d8d2bd4','7a6d7896-c258-402f-8bd5-1c95ef78dc1c',
    '3b587fcd-8675-4fa3-a6ee-476a7784d3f0','553abdc6-7fa3-47fb-8eb0-1414de14df84','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.incident_reports (
  id, establishment_code, commercial_registration_number, report_source, reporter_name,
  reporter_contact_number, report_time, number_of_cases, resulting_damage, incident_type,
  preliminary_incident_description, factory_id, visit_id, inspection_id, created_by, created_at)
select
  md5('saqeel-demo-ops:incident:' || a.visit_id::text)::uuid,
  f.factory_code,
  '10' || lpad(((a.seq * 7919) % 100000000)::text, 8, '0'),
  (array['بلاغ هاتفي من المنشأة','منصة البلاغات الموحدة','ملاحظة ميدانية أثناء التفتيش','إحالة من الدفاع المدني'])[1 + (a.seq % 4)],
  (array['فهد عبدالرحمن الحارثي','سعود منصور العمري','تركي بدر الشمري','نايف خالد الجهني'])[1 + (a.seq % 4)],
  '05' || lpad(((a.seq * 4271) % 100000000)::text, 8, '0'),
  to_char(least(v.window_start + interval '2 hours', now() - interval '2 hours') at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI'),
  (1 + (a.seq % 4))::text,
  (array['أضرار مادية محدودة في خط الإنتاج الثاني',
         'توقف جزئي للتشغيل دون إصابات بشرية',
         'إصابة عامل واحد نُقل إلى المستشفى وحالته مستقرة',
         'تلف في المستودع الفرعي دون امتداد للمباني المجاورة'])[1 + (a.seq % 4)],
  (array['حريق محدود','تسرب مواد كيميائية','إصابة عمل','تسرب غاز','انهيار جزئي في سقف المستودع','صعقة كهربائية'])[1 + (a.seq % 6)],
  (array['اندلع حريق محدود في لوحة التوزيع الكهربائي بخط الإنتاج الثاني وتمت السيطرة عليه بواسطة فرق السلامة الداخلية قبل وصول الدفاع المدني.',
         'رُصد تسرب من خزان المذيبات في ساحة التخزين الخلفية وتم عزل المنطقة وإيقاف التشغيل احترازياً.',
         'أُصيب عامل أثناء تشغيل مكبس هيدروليكي نتيجة غياب حاجز الحماية، وجرى إسعافه فوراً.',
         'شكوى من رائحة غاز في مبنى المرافق أدت إلى إخلاء جزئي وفحص شبكة الأنابيب.',
         'انهيار جزئي في سقف المستودع الفرعي بعد أمطار غزيرة دون إصابات بين العاملين.',
         'تعرض فني صيانة لصعقة كهربائية أثناء أعمال الصيانة الدورية لعدم فصل التيار.'])[1 + (a.seq % 6)],
  f.id, a.visit_id, null,
  coalesce((select a2.inspector_id from assignments a2 where a2.visit_id = a.visit_id order by a2.inspector_id limit 1),
           (select p.user_id from profiles p where p.email = 'inspector@mim.gov.sa')),
  least(v.window_start + interval '3 hours', now() - interval '90 minutes')
from anchors a join visits v on v.id = a.visit_id join factories f on f.id = v.factory_id
on conflict (id) do nothing;

insert into public.operations_export_receipts (id, actor, dataset, filters, row_count, region, correlation_id, created_at)
select
  md5('saqeel-demo-ops:export:' || g.n::text)::uuid,
  (select user_id from profiles where email = case when g.n % 3 = 0 then 'ops@mim.gov.sa'
    when g.n % 3 = 1 then 'planner@mim.gov.sa' else 'admin@mim.gov.sa' end),
  (array['visits','alerts','kpis'])[1 + (g.n % 3)],
  jsonb_build_object(
    'region', (array['Riyadh','Makkah','Eastern','Madinah','Qassim','Hail','Asir','Jazan'])[1 + (g.n % 8)],
    'from', to_char((date '2026-07-27' - ((g.n % 21) + 7)), 'YYYY-MM-DD'),
    'to', to_char((date '2026-07-27' - (g.n % 5)), 'YYYY-MM-DD'),
    'format', 'csv',
    'purpose', 'تقرير دوري لإدارة العمليات'),
  18 + (g.n * 13) % 460,
  (array['Riyadh','Makkah','Eastern','Madinah','Qassim','Hail','Asir','Jazan'])[1 + (g.n % 8)],
  md5('saqeel-demo-ops:export-corr:' || g.n::text)::uuid,
  now() - ((g.n * 7) * interval '1 hour')
from generate_series(1, 21) g(n)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 8. virtual_sessions + virtual_participants (16 sessions x 3 participants).
--    virtual_sessions.visit_id is unique, so a NOT EXISTS guard runs first.
-- ---------------------------------------------------------------------
with vsel as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '78fc4d2b-a13f-4654-8f82-16718423b1cb','9c1a1ec3-e229-4ad9-9cb3-9e1a1cbeec56','ed6a4ba3-9c67-44c3-a6a3-86a605f7886f','c23c61ae-3618-4784-87ac-0ac527e4a18a',
    '043718dd-1638-4908-9c5a-bd13e26861b0','145da6aa-2451-4e00-92c1-f89ad181b223','a8b195d2-5ec2-4c8b-90a9-733e29e4e17f','af9f9863-6eed-419a-802f-50cc785c15e8',
    'cbc073d4-93c1-4e0d-beab-82fae5a9ab01','f1b75af9-dccb-4aa7-97b6-2ab5bf9d0a20','221c1c19-52da-44f5-a657-776191def6e7','d6ac6754-a9eb-4b2b-87c7-de113d3c4299',
    'ec5c3ce9-5d18-4f65-85dd-76dddaf4a285','265a4c30-f31e-4040-ba8e-254882ed7a75','6008605b-f9e5-411e-9a5c-49ddff5616c4','857677d7-b633-48cb-806b-db6d655c9922'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.virtual_sessions (id, visit_id, state, appointment_at, timeline)
select
  md5('saqeel-demo-ops:vsession:' || s.visit_id::text)::uuid,
  s.visit_id,
  (array['scheduled','waiting','joined','verified','in_progress','closed'])[1 + (s.seq % 6)]::virtual_state,
  least(v.window_start + interval '15 minutes', now() + interval '2 days'),
  jsonb_build_array(
    jsonb_build_object('state','scheduled','at', to_char(v.window_start - interval '2 days','YYYY-MM-DD"T"HH24:MI:SSOF'),
      'note','تم إشعار المنشأة بموعد الجلسة الافتراضية.'),
    jsonb_build_object('state','waiting','at', to_char(v.window_start - interval '10 minutes','YYYY-MM-DD"T"HH24:MI:SSOF'),
      'note','فتح المفتش غرفة الجلسة بانتظار ممثل المنشأة.'))
from vsel s join visits v on v.id = s.visit_id
where not exists (select 1 from public.virtual_sessions x where x.visit_id = s.visit_id)
on conflict (id) do nothing;

with vsel as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '78fc4d2b-a13f-4654-8f82-16718423b1cb','9c1a1ec3-e229-4ad9-9cb3-9e1a1cbeec56','ed6a4ba3-9c67-44c3-a6a3-86a605f7886f','c23c61ae-3618-4784-87ac-0ac527e4a18a',
    '043718dd-1638-4908-9c5a-bd13e26861b0','145da6aa-2451-4e00-92c1-f89ad181b223','a8b195d2-5ec2-4c8b-90a9-733e29e4e17f','af9f9863-6eed-419a-802f-50cc785c15e8',
    'cbc073d4-93c1-4e0d-beab-82fae5a9ab01','f1b75af9-dccb-4aa7-97b6-2ab5bf9d0a20','221c1c19-52da-44f5-a657-776191def6e7','d6ac6754-a9eb-4b2b-87c7-de113d3c4299',
    'ec5c3ce9-5d18-4f65-85dd-76dddaf4a285','265a4c30-f31e-4040-ba8e-254882ed7a75','6008605b-f9e5-411e-9a5c-49ddff5616c4','857677d7-b633-48cb-806b-db6d655c9922'
  ]::uuid[]) with ordinality as u(vid, ord)
),
parts as (select * from (values
  (1,'inspector'),(2,'factory_rep'),(3,'factory_rep')) p(n, role))
insert into public.virtual_participants (id, session_id, display_name, role, joined_at, verified_at, otp_attempts, verification_record, user_id)
select
  md5('saqeel-demo-ops:vpart:' || p.n::text || ':' || s.visit_id::text)::uuid,
  vs.id,
  case p.n
    when 1 then coalesce((select pr.full_name from assignments a2 join profiles pr on pr.user_id = a2.inspector_id
                          where a2.visit_id = s.visit_id order by a2.inspector_id limit 1), 'عبدالله محمد القحطاني')
    when 2 then (array['ماجد عوض الشهراني','سامي حسن الغامدي','عبدالعزيز فهد الدوسري','وليد سعيد القرني'])[1 + (s.seq % 4)]
    else (array['هيا عبدالله الرشيد','منال سعد المطيري','أروى ناصر العتيبي','لمياء فيصل الحربي'])[1 + (s.seq % 4)] end,
  p.role,
  case when vs.state::text = 'scheduled' then null else vs.appointment_at + interval '3 minutes' end,
  case when vs.state::text in ('scheduled','waiting') then null else vs.appointment_at + interval '6 minutes' end,
  case when p.n = 1 then 0 else (s.seq % 2) end,
  case when vs.state::text in ('scheduled','waiting') then null
       else jsonb_build_object('method','otp_sms','channel','+9665XXXXXXXX','result','verified',
              'note','تم التحقق من هوية المشارك عبر رمز لمرة واحدة.') end,
  case when p.n = 1 then coalesce((select a2.inspector_id from assignments a2 where a2.visit_id = s.visit_id order by a2.inspector_id limit 1),
                                  (select pr.user_id from profiles pr where pr.email = 'inspector@mim.gov.sa')) else null end
from vsel s
join public.virtual_sessions vs on vs.id = md5('saqeel-demo-ops:vsession:' || s.visit_id::text)::uuid
cross join parts p
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 9. visit_preparations (planner readiness) and inspector_briefing_cache
--    (daily Arabic briefing per inspector persona, 2026-07-23..27).
-- ---------------------------------------------------------------------
with anchors as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '15ef9533-4434-480c-9cb6-f0e4441c3f97','6d431458-8bca-4d1b-94ee-f9874ac97d3a','5568766d-067b-4890-a814-e816be96e654','4745eafa-a6ea-4af6-8b10-fdc0f2aa33a3',
    '9bba3922-972e-4f2d-b3bc-ef57849f5064','3e0c6988-aaab-4665-93b8-c784b92abdee','977da82e-50f0-4fd0-93b7-03464a02d8cc','8b596251-35a9-462b-816f-23bf39ad8cef',
    '2bcf63a8-aa70-4d83-814c-a3f248b1f020','a9a7b8e0-47ab-43ad-8c6a-d08f19c6c6a6','2501a127-0cb9-4cae-9fe0-f46c70fc0cde','7091f1cf-37c4-4c84-85d7-9f6f9c3c3058',
    '0bdb136e-8ccf-417c-932c-8f8f86747c60','65da44a0-0c19-41bd-abab-58f44ba730d1','75953d4a-12df-41a6-8202-abbd87d36722','10d8a983-e078-48c5-b5a4-70948c038a8d',
    '4bc16078-0c99-4bab-b28d-0d550d105c8a','42e2e668-0c60-4ec5-884a-fa0da7d00b93','96d18195-4e3d-40e2-aef7-b11c02a426b9','cdb69da0-e68e-46d3-b5d2-f4ea9845e5f7',
    '066fcae8-18f7-41f8-8dbc-fbcc3cee1760','eed1abfe-5dc6-46c6-8cc6-1a386cc5ac92','a56ea9c1-58e8-4a63-8c70-5f7c5bf53457','23bd3e73-3cd8-4664-ad92-ba26f6f214f6',
    '10c21112-4845-481e-9d0d-d236ee64158f','c8a27c41-8f5e-4910-98dd-500fdc84f0aa','67914f5a-9d8c-4b7c-b3a0-e42f6f48255a','9ead0663-6b0f-4f65-ad0d-e3f90f2df5b7',
    'fd1ba329-88e2-4815-9c88-8d0e2a4c3216','3c0cc43f-fbe3-4e01-9345-566b7cfa4478','2b82c45a-f311-428b-943f-7956ec35a492','6b78d98c-6766-484b-af42-b2811d8d2bd4',
    'dbe6917c-d486-4400-94e5-eb6cc493a6e8','7a6d7896-c258-402f-8bd5-1c95ef78dc1c','3b587fcd-8675-4fa3-a6ee-476a7784d3f0','eb454c6d-b907-4f47-987e-e094449ef05f',
    '553abdc6-7fa3-47fb-8eb0-1414de14df84','f97ca075-e6f3-4503-bc05-6eb4d9768b31','2a8c4fb2-d45f-4247-9731-fc4c6edc8879','26f82010-b4b4-4fb9-b843-8278c2228f1b'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.visit_preparations (
  visit_id, preparation_version, execution_date, confirmed_mode, package_version_id,
  form_config, saved_by, saved_at, confirmed_ready_at, reopened_at)
select
  a.visit_id, 1, v.window_start::date, v.execution_mode, null,
  jsonb_build_object(
    'notify_factory', (a.seq % 3 = 0),
    'removed_optional_section_keys', case when a.seq % 4 = 0 then jsonb_build_array('optional_environmental') else '[]'::jsonb end,
    'added_action_form_template_ids', '[]'::jsonb,
    'preparation_note', (array['تم تجهيز حزمة النموذج ومراجعة الملاحظات السابقة للمنشأة.',
                               'تمت مراجعة المخالفات المفتوحة قبل تأكيد الجاهزية.',
                               'أُرفقت خريطة الوصول ونقاط الدخول المعتمدة للمفتش.'])[1 + (a.seq % 3)]),
  (select user_id from profiles where email = 'planner@mim.gov.sa'),
  least(v.window_start - interval '2 days', now() - interval '1 day'),
  case when a.seq % 5 = 0 then null else least(v.window_start - interval '1 day', now() - interval '12 hours') end,
  case when a.seq % 11 = 0 then least(v.window_start - interval '18 hours', now() - interval '10 hours') else null end
from anchors a join visits v on v.id = a.visit_id
on conflict (visit_id) do nothing;

insert into public.inspector_briefing_cache (id, user_id, scope, period_date, briefing_text, insight_id, provider_status, created_at, updated_at)
select
  md5('saqeel-demo-ops:briefing:' || p.user_id::text || ':' || d.d::text)::uuid,
  p.user_id, 'daily', d.d,
  'إحاطة اليوم لمنطقة ' || coalesce(p.region, 'غير محددة') || ': لديك زيارات ميدانية مجدولة ضمن النطاق المعتمد. '
    || 'راجع المخالفات المفتوحة وحالات تجاوز النطاق الجغرافي السابقة قبل الانطلاق، وتأكد من جاهزية الجهاز والحزمة دون اتصال. '
    || 'التزم بضوابط الالتقاط داخل النطاق وسجّل أي استثناء عبر طلب معتمد من إدارة العمليات.',
  null, 'configured',
  (d.d + time '04:30') at time zone 'Asia/Riyadh',
  (d.d + time '04:30') at time zone 'Asia/Riyadh'
from public.profiles p
cross join (select generate_series(date '2026-07-23', date '2026-07-27', interval '1 day')::date as d) d
where p.email in ('inspector@mim.gov.sa','inspector1@mim.gov.sa','inspector2@mim.gov.sa','inspector3@mim.gov.sa',
                  'inspector4@mim.gov.sa','inspector5@mim.gov.sa','inspector-01@mim-inspection.test',
                  'inspector-02@mim-inspection.test','inspector-03@mim-inspection.test')
on conflict (user_id, scope, period_date) do nothing;

-- ---------------------------------------------------------------------
-- 10. feedback + feedback_aspect (factory-representative feedback) and
--     recent operational notifications for the alerts panel.
--     The signature is a 1x1 transparent PNG placeholder, not a real one.
-- ---------------------------------------------------------------------
with fsel as (
  select u.vid as visit_id, u.ord::int as seq
  from unnest(array[
    '78fc4d2b-a13f-4654-8f82-16718423b1cb','9c1a1ec3-e229-4ad9-9cb3-9e1a1cbeec56','ed6a4ba3-9c67-44c3-a6a3-86a605f7886f','c23c61ae-3618-4784-87ac-0ac527e4a18a',
    '043718dd-1638-4908-9c5a-bd13e26861b0','145da6aa-2451-4e00-92c1-f89ad181b223','a8b195d2-5ec2-4c8b-90a9-733e29e4e17f','af9f9863-6eed-419a-802f-50cc785c15e8',
    'cbc073d4-93c1-4e0d-beab-82fae5a9ab01','f1b75af9-dccb-4aa7-97b6-2ab5bf9d0a20','221c1c19-52da-44f5-a657-776191def6e7','d6ac6754-a9eb-4b2b-87c7-de113d3c4299',
    'ec5c3ce9-5d18-4f65-85dd-76dddaf4a285','265a4c30-f31e-4040-ba8e-254882ed7a75','6008605b-f9e5-411e-9a5c-49ddff5616c4','857677d7-b633-48cb-806b-db6d655c9922',
    'bbd2df7a-acd6-454b-990f-4246ed53dbc4','587a56a3-3d82-4fd2-aab3-c897e57af526','9cb7ecf0-67b7-400d-95ca-ae9e80f4821e','af581169-b2fc-4d01-90fe-9232ef1c1c45',
    'fa664ba6-df2b-4ee1-a6be-1c06765ea15a','82e09f2f-a4f1-41ad-9e32-fbf276116451','89446f1a-9ec4-4010-b7d9-56f15be704f7','e409c74e-b8de-4f6c-a716-05d4d0439a03'
  ]::uuid[]) with ordinality as u(vid, ord)
)
insert into public.feedback (id, visit_id, inspector_id, overall_rating, notes, signed_name, signature_data_url, signed_at, submitted_by, submitted_at, created_at)
select
  md5('saqeel-demo-ops:feedback:' || s.visit_id::text)::uuid,
  s.visit_id,
  coalesce((select a2.inspector_id from assignments a2 where a2.visit_id = s.visit_id order by a2.inspector_id limit 1),
           (select p.user_id from profiles p where p.email = 'inspector@mim.gov.sa')),
  3 + (s.seq % 3),
  (array['أدى فريق التفتيش عمله بمهنية ووضّح الملاحظات وآلية المعالجة.',
         'الزيارة كانت منظمة، ونأمل إشعارنا بموعد الزيارة قبل يوم عمل على الأقل.',
         'شرح المفتش بنود اللائحة بوضوح وأتاح وقتاً كافياً لتقديم المستندات.',
         'نقدّر التزام الفريق بإجراءات السلامة داخل خطوط الإنتاج.'])[1 + (s.seq % 4)],
  (array['ماجد عوض الشهراني','سامي حسن الغامدي','عبدالعزيز فهد الدوسري','وليد سعيد القرني'])[1 + (s.seq % 4)],
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  least(v.window_start + interval '4 hours', now() - interval '2 hours'),
  coalesce((select a2.inspector_id from assignments a2 where a2.visit_id = s.visit_id order by a2.inspector_id limit 1),
           (select p.user_id from profiles p where p.email = 'inspector@mim.gov.sa')),
  least(v.window_start + interval '4 hours', now() - interval '2 hours'),
  least(v.window_start + interval '4 hours', now() - interval '2 hours')
from fsel s join visits v on v.id = s.visit_id
where not exists (select 1 from public.feedback x where x.visit_id = s.visit_id)
on conflict (id) do nothing;

insert into public.feedback_aspect (id, feedback_id, aspect_key, rating)
select md5('saqeel-demo-ops:aspect:' || a.k || ':' || f.id::text)::uuid, f.id, a.k,
  greatest(1, least(5, f.overall_rating + a.delta))
from public.feedback f
cross join (values ('punctuality',0),('professionalism',1),('clarity',0),('fairness',-1),('guidance',0)) a(k, delta)
where f.id = md5('saqeel-demo-ops:feedback:' || f.visit_id::text)::uuid
on conflict (feedback_id, aspect_key) do nothing;

insert into public.notifications (id, event_key, recipient, payload, channel, delivery_state, created_at, read_at, delivered_at, language)
select
  md5('saqeel-demo-ops:notif:' || g.n::text)::uuid,
  (array['geo_override_requested','geo_override_approved','visit_expired','assignment','submission_received','virtual_scheduled'])[1 + (g.n % 6)],
  (select user_id from profiles where email = case when g.n % 4 = 0 then 'ops@mim.gov.sa'
    when g.n % 4 = 1 then 'inspector@mim.gov.sa' when g.n % 4 = 2 then 'planner@mim.gov.sa' else 'reviewer@mim.gov.sa' end),
  jsonb_build_object(
    'title', (array['طلب تجاوز نطاق جغرافي بانتظار القرار','تمت الموافقة على تجاوز النطاق الجغرافي',
                    'انتهت صلاحية نافذة زيارة مخططة','تم إسناد زيارة جديدة إليك',
                    'تم استلام تقرير تفتيش للمراجعة','تم جدولة جلسة تفتيش افتراضية'])[1 + (g.n % 6)],
    'body', (array['يرجى مراجعة الأدلة المرفقة واتخاذ القرار قبل انتهاء المهلة.',
                   'يمكن للمفتش متابعة تسجيل الوصول من النقطة البديلة المعتمدة.',
                   'أُعيدت الزيارة إلى التخطيط لإعادة الجدولة.',
                   'راجع تفاصيل الزيارة وحزمة النموذج قبل موعد التنفيذ.',
                   'التقرير متاح الآن في قائمة المراجعة الخاصة بك.',
                   'تم إشعار ممثل المنشأة بموعد الجلسة ورابط الانضمام.'])[1 + (g.n % 6)],
    'region', (array['Riyadh','Makkah','Eastern','Madinah','Qassim'])[1 + (g.n % 5)]),
  (array['inapp','push','inapp'])[1 + (g.n % 3)],
  (array['delivered','queued','read','delivered'])[1 + (g.n % 4)],
  now() - ((g.n * 5) * interval '1 hour'),
  case when (1 + (g.n % 4)) = 3 then now() - ((g.n * 5 - 2) * interval '1 hour') else null end,
  case when (1 + (g.n % 4)) <> 2 then now() - ((g.n * 5) * interval '1 hour') + interval '40 seconds' else null end,
  'ar'
from generate_series(1, 24) g(n)
on conflict (id) do nothing;

-- =====================================================================
-- END OF SYNTHETIC DEMO SEED — supabase/seeds/demo/02-operations.sql
-- =====================================================================
