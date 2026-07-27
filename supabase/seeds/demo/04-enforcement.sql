-- =====================================================================
-- SAQEEL / MIM Inspection — DEMO SEED 04: ENFORCEMENT
--
-- SYNTHETIC NON-PRODUCTION DEMO DATA.
-- Every row below is fabricated for staging demonstration only. It does
-- not represent a real establishment, inspection, violation, penalty or
-- decision by the Ministry of Industry and Mineral Resources. Never apply
-- this file to a production project.
--
-- Target project: iiozvqntawxfwbgffzqu (staging)
-- Reference date: 2026-07-27; recent activity falls in 2026-06-28..2026-07-27.
-- Scope: enforcement_recommendations, violations (INSERT only),
--        inspection_penalties, penalty_notices, bulk_violation_batches(+items),
--        reopening_notices(+lines), cases, findings, risk_exceptions,
--        correction_evidence.
--
-- IDEMPOTENCY
--   Every id is derived deterministically from md5('saqeel:demo:<table>:v1:<key>')
--   and every write is guarded by ON CONFLICT DO NOTHING or a stable rank
--   filter. Re-running this file is a no-op. Nothing is deleted, truncated
--   or invalidated; no existing row is modified except informational
--   inspection_penalties created by this file's own violations.
--
-- TRIGGERS THAT SHAPE THIS FILE
--   * violations AFTER INSERT -> materialize_informational_penalty()
--     auto-creates one inspection_penalties row per violation and REQUIRES a
--     published/locked penalty_mappings row for (violation_code_id, mapping_version).
--     Only three such mappings exist on this project (V-FS-01, V-FS-09, V-HZ-02,
--     all mapping_version 'v3'), so demo violations use those codes.
--   * inspection_penalties BEFORE UPDATE -> guard_inspection_penalty()
--     permits only informational -> issued with all other columns unchanged.
--   * enforcement_recommendations BEFORE UPDATE -> guard_decided_enforcement_recommendation()
--     blocks any UPDATE once decided_at is set, so decided rows are INSERTed
--     in their final state.
--   * reopening_notice_lines BEFORE INSERT -> reopening_notice_line_type_guard()
--     permits lines only on notice_type = 'production_line'.
--
-- Deterministic uuid shape used throughout, with h = md5(<seed>):
--   substr(h,1,8) '-' substr(h,9,4) '-4' substr(h,14,3) '-a' substr(h,18,3) '-' substr(h,21,12)
-- Demo violations use an 'ff' prefix so they sort to the top of the
-- id-descending window that /enforcement-library reads.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. enforcement_recommendations  (/admin/enforcement-recommendations)
--    Decided rows are inserted already-decided: the guard trigger forbids
--    updating a recommendation after decided_at is set.
-- ---------------------------------------------------------------------
with fx as (
  select id, factory_code, name, row_number() over (order by factory_code) as rn
  from factories where factory_code like 'F-%'
),
base as (
  select fx.*, s.slot, ((fx.rn - 1) * 2 + s.slot) as seq
  from fx cross join (values (1),(2)) s(slot)
  where s.slot = 1 or fx.rn <= 8
),
gen as (
  select b.*,
    md5('saqeel:demo:enf_rec:v1:'||b.factory_code||':'||b.slot) as h,
    (array['fine','committee','warning','closure'])[(b.seq % 4) + 1] as action,
    (array['pending','approved','pending','rejected','approved','pending'])[(b.seq % 6) + 1] as st,
    (array['c2ae5022-91a8-4014-8643-d436d2b3e640','4bb3a1b8-b89e-4279-94db-05a65d8eeff4','5b70c10d-2f59-4b8a-90dd-4b7eb9bb4728','d77105c0-82a6-4522-b073-56aae7915c5e','fe4cfd87-76c6-42f4-9263-9a0cc01f1825','813773b6-6c86-4557-b630-21f06b2a7026'])[(b.seq % 6) + 1]::uuid as rec_by,
    (array['38fd1ad1-ec82-4d62-8da4-a3231271753a','7da93ff6-82c5-45f8-be26-92c8956c2254','f9067e24-99f7-40e7-8421-4717de9ca2db'])[(b.seq % 3) + 1]::uuid as dec_by,
    (timestamptz '2026-07-25 09:00:00+03' - ((b.seq * 17) % 27) * interval '1 day' - ((b.seq * 7) % 9) * interval '1 hour') as rec_at
  from base b
)
insert into enforcement_recommendations
  (id, factory_id, visit_id, recommended_action, recommendation_notes, recommended_by, recommended_at,
   status, decided_by, decided_at, decision_reason)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.id,
  (select v.id from visits v where v.factory_id = g.id order by v.window_start desc limit 1),
  g.action,
  case g.action
    when 'fine' then 'استمرت المخالفة بعد انتهاء المهلة التصحيحية في زيارة المتابعة لمنشأة '||g.name||'؛ يُوصى بإحالة الحالة لتطبيق الغرامة وفق جدول العقوبات المعتمد.'
    when 'committee' then 'تكرار المخالفة للمرة الثالثة خلال اثني عشر شهراً في منشأة '||g.name||'؛ يُوصى برفع الحالة إلى لجنة النظر في مخالفات المنشآت الصناعية.'
    when 'warning' then 'مخالفة من المستوى الثاني دون أثر مباشر على السلامة في منشأة '||g.name||'؛ يُوصى بإصدار إنذار كتابي مع منح مهلة تصحيح.'
    else 'خطر مباشر على سلامة العاملين على خط الإنتاج في منشأة '||g.name||'؛ يُوصى بالإغلاق الجزئي حتى استكمال الإجراءات التصحيحية والتحقق الميداني.'
  end,
  g.rec_by,
  g.rec_at,
  g.st,
  case when g.st = 'pending' then null else g.dec_by end,
  case when g.st = 'pending' then null else g.rec_at + interval '2 days' + ((g.seq % 5) * interval '3 hours') end,
  case g.st
    when 'approved' then 'اعتُمدت التوصية بعد مراجعة محضر الزيارة والأدلة المرفقة وسجل المخالفات السابق للمنشأة.'
    when 'rejected' then 'أُعيدت التوصية؛ الأدلة المرفقة لا تثبت استمرار المخالفة بعد انقضاء المهلة التصحيحية.'
    else null
  end
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. findings — two per selected clean-factory inspection.
--    guard_submitted_inspection() only fires on UPDATE/DELETE, so INSERT is
--    permitted on submitted/approved inspections.
-- ---------------------------------------------------------------------
with insp as (
  select i.id as inspection_id, f.factory_code, f.name as factory_name, i.submitted_at,
    row_number() over (partition by f.factory_code order by (i.submitted_at is null), i.submitted_at desc nulls last, i.id) as prn
  from inspections i join visits v on v.id = i.visit_id join factories f on f.id = v.factory_id
  where f.factory_code like 'F-%'
),
picked as (select *, row_number() over (order by factory_code, prn) as rn from insp where prn <= 2),
gen as (
  select p.*, s.slot, ((p.rn - 1) * 2 + s.slot) as seq,
    md5('saqeel:demo:finding:v1:'||p.inspection_id::text||':'||s.slot) as h
  from picked p cross join (values (1),(2)) s(slot)
)
insert into findings (id, inspection_id, item_id, severity, description)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.inspection_id,
  null,
  (array['L1','L2','L3'])[(g.seq % 3) + 1],
  (array[
    'انسداد جزئي في مسار الإخلاء المؤدي إلى المخرج الشمالي بمواد تعبئة مخزّنة خارج المواقع المخصصة — منشأة '||g.factory_name||'.',
    'انتهاء صلاحية الصيانة الدورية لعدد من طفايات الحريق في صالة الإنتاج دون بطاقات فحص سارية — منشأة '||g.factory_name||'.',
    'تخزين مواد كيميائية متعارضة في المستودع نفسه دون فواصل أو حواجز احتواء مطابقة — منشأة '||g.factory_name||'.',
    'عدم توفر لوحات تحذيرية باللغتين العربية والإنجليزية عند مداخل منطقة المواد الخطرة — منشأة '||g.factory_name||'.',
    'ضعف إضاءة الطوارئ في ممر الخدمة المؤدي إلى لوحة التوزيع الرئيسية — منشأة '||g.factory_name||'.',
    'عدم اكتمال سجل تدريب العاملين على إجراءات الاستجابة للطوارئ للربع الحالي — منشأة '||g.factory_name||'.'
  ])[(g.seq % 6) + 1]
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. violations on clean-factory inspections (INSERT only — no existing
--    violation is invalidated or deleted anywhere in this file).
--    Each INSERT fires materialize_informational_penalty(), which creates
--    the matching inspection_penalties row automatically.
-- ---------------------------------------------------------------------
with codes as (
  select pm.violation_code_id, row_number() over (order by vc.code) - 1 as ci
  from penalty_mappings pm join violation_codes vc on vc.id = pm.violation_code_id
  where pm.status in ('published','locked') and pm.mapping_version = 'v3'
),
insp as (
  select i.id as inspection_id, f.factory_code,
    row_number() over (partition by f.factory_code order by (i.submitted_at is null), i.submitted_at desc nulls last, i.id) as prn
  from inspections i join visits v on v.id = i.visit_id join factories f on f.id = v.factory_id
  where f.factory_code like 'F-%'
),
picked as (select *, row_number() over (order by factory_code, prn) as rn from insp where prn <= 2),
gen as (
  select p.*, s.slot, ((p.rn - 1) * 2 + s.slot) as seq,
    md5('saqeel:demo:violation:v1:'||p.inspection_id::text||':'||s.slot) as h,
    md5('saqeel:demo:finding:v1:'||p.inspection_id::text||':'||s.slot) as fh
  from picked p cross join (values (1),(2)) s(slot)
)
insert into violations (id, inspection_id, violation_code_id, finding_id, mapping_version)
select
  ('ff'||substr(g.h,1,6)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.inspection_id,
  (select c.violation_code_id from codes c where c.ci = g.seq % 3),
  (substr(g.fh,1,8)||'-'||substr(g.fh,9,4)||'-4'||substr(g.fh,14,3)||'-a'||substr(g.fh,18,3)||'-'||substr(g.fh,21,12))::uuid,
  'v3'
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. Issue most demo penalties (informational -> issued).
--    The rank is computed over ALL demo penalties, not only the ones still
--    informational, so a second run cannot promote the deliberately
--    un-issued remainder.
-- ---------------------------------------------------------------------
with target as (
  select ip.id, row_number() over (order by ip.violation_id) as rn
  from inspection_penalties ip
  join violations v on v.id = ip.violation_id
  where v.id::text like 'ff%'
)
update inspection_penalties ip
set status = 'issued',
    issued_at = timestamptz '2026-07-26 12:00:00+03' - ((t.rn * 13) % 26) * interval '1 day' - ((t.rn * 5) % 8) * interval '1 hour',
    issued_by = (array['38fd1ad1-ec82-4d62-8da4-a3231271753a','7da93ff6-82c5-45f8-be26-92c8956c2254','f9067e24-99f7-40e7-8421-4717de9ca2db'])[(t.rn % 3) + 1]::uuid
from target t
where ip.id = t.id and t.rn % 9 <> 0 and ip.status = 'informational';

-- ---------------------------------------------------------------------
-- 5. penalty_notices — one per issued demo penalty. Read by Factory 360.
-- ---------------------------------------------------------------------
with src as (
  select v.id as violation_id, v.inspection_id, f.id as factory_id, f.factory_code,
         ip.issued_at, ip.issued_by,
         row_number() over (partition by f.factory_code order by v.id) as fslot,
         row_number() over (order by v.id) as rn
  from violations v
  join inspection_penalties ip on ip.violation_id = v.id and ip.status = 'issued'
  join inspections i on i.id = v.inspection_id
  join visits vs on vs.id = i.visit_id
  join factories f on f.id = vs.factory_id
  where v.id::text like 'ff%'
),
gen as (
  select s.*, md5('saqeel:demo:penalty_notice:v1:'||s.violation_id::text) as h,
    'PN-2026-'||replace(s.factory_code,'F-','')||'-'||lpad(s.fslot::text,2,'0') as notice_number
  from src s
)
insert into penalty_notices (id, factory_id, inspection_id, violation_id, notice_number, status, issued_at, issued_by, document_path)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.factory_id, g.inspection_id, g.violation_id, g.notice_number,
  (array['issued','served','settled','served','issued','withdrawn'])[(g.rn % 6) + 1],
  g.issued_at, g.issued_by,
  'penalty-notices/2026/'||g.notice_number||'.pdf'
from gen g
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 6a. bulk_violation_batches — 12 issuance runs.
--     package_version_id stays null: this project has no locked+published
--     package_versions, and a governed value is never invented.
-- ---------------------------------------------------------------------
with codes as (
  select pm.violation_code_id, vc.code, vc.title, row_number() over (order by vc.code) - 1 as ci
  from penalty_mappings pm join violation_codes vc on vc.id = pm.violation_code_id
  where pm.status in ('published','locked') and pm.mapping_version = 'v3'
),
b as (
  select gs as seq, md5('saqeel:demo:bulk_batch:v1:'||gs) as h, 4 + (gs % 4) as n
  from generate_series(1,12) gs
)
insert into bulk_violation_batches
  (id, request_id, violation_code_id, notes, issued_by, issued_at, target_count, package_version_id, acknowledged, request_fingerprint, correlation_id)
select
  (substr(b.h,1,8)||'-'||substr(b.h,9,4)||'-4'||substr(b.h,14,3)||'-a'||substr(b.h,18,3)||'-'||substr(b.h,21,12))::uuid,
  (substr(md5('req:'||b.h),1,8)||'-'||substr(md5('req:'||b.h),9,4)||'-4'||substr(md5('req:'||b.h),14,3)||'-a'||substr(md5('req:'||b.h),18,3)||'-'||substr(md5('req:'||b.h),21,12))::uuid,
  c.violation_code_id,
  'حملة تفتيش مجدولة على المدن الصناعية — إصدار جماعي للمخالفة '||c.code||' ('||c.title||') استناداً إلى نتائج جولة المتابعة. تُراجع النتائج الفاشلة قبل اعتبار الدفعة مكتملة.',
  (array['38fd1ad1-ec82-4d62-8da4-a3231271753a','7da93ff6-82c5-45f8-be26-92c8956c2254','f9067e24-99f7-40e7-8421-4717de9ca2db'])[(b.seq % 3) + 1]::uuid,
  timestamptz '2026-07-26 10:00:00+03' - ((b.seq * 2) % 27) * interval '1 day' - (b.seq % 6) * interval '1 hour',
  b.n,
  null,
  true,
  'sha256:'||substr(md5('fp:'||b.h),1,32),
  (substr(md5('corr:'||b.h),1,8)||'-'||substr(md5('corr:'||b.h),9,4)||'-4'||substr(md5('corr:'||b.h),14,3)||'-a'||substr(md5('corr:'||b.h),18,3)||'-'||substr(md5('corr:'||b.h),21,12))::uuid
from b join codes c on c.ci = b.seq % 3
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6b. bulk_violation_batch_items — per-target outcomes.
--     Every 3rd batch carries two failed targets, so the demo can never
--     present a batch as all-succeeded when some targets failed.
--     A demo violation is linked to at most one item: only the first batch
--     (by seq) that hits a given (factory, violation code) pair carries it.
-- ---------------------------------------------------------------------
with fx as (select id, factory_code, row_number() over (order by factory_code) - 1 as fi from factories where factory_code like 'F-%'),
b as (
  select gs as seq, md5('saqeel:demo:bulk_batch:v1:'||gs) as h, 4 + (gs % 4) as n
  from generate_series(1,12) gs
),
batch as (
  select b.*, bb.id as batch_id, bb.violation_code_id
  from b join bulk_violation_batches bb
    on bb.id = (substr(b.h,1,8)||'-'||substr(b.h,9,4)||'-4'||substr(b.h,14,3)||'-a'||substr(b.h,18,3)||'-'||substr(b.h,21,12))::uuid
),
items as (
  select bt.seq, bt.batch_id, bt.violation_code_id, j, fx.id as factory_id, fx.factory_code,
         case when bt.seq % 3 = 0 and j < 2 then 'failed' else 'success' end as status
  from batch bt
  cross join lateral generate_series(0, bt.n - 1) j
  join fx on fx.fi = ((bt.seq * 5) + j) % 24
),
ranked as (
  select it.*, row_number() over (partition by it.factory_id, it.violation_code_id order by it.seq, it.j) as pair_rank
  from items it
),
linked as (
  select r.*, lv.vid, lv.insp_id
  from ranked r
  left join lateral (
    select v.id as vid, v.inspection_id as insp_id
    from violations v
    join inspections i on i.id = v.inspection_id
    join visits vs on vs.id = i.visit_id
    where vs.factory_id = r.factory_id and v.violation_code_id = r.violation_code_id and v.id::text like 'ff%'
    order by v.id limit 1
  ) lv on r.status = 'success' and r.pair_rank = 1
)
insert into bulk_violation_batch_items (id, batch_id, factory_id, status, violation_id, inspection_id, error_code)
select
  (substr(md5('saqeel:demo:bulk_item:v1:'||l.batch_id::text||':'||l.factory_id::text),1,8)||'-'||
   substr(md5('saqeel:demo:bulk_item:v1:'||l.batch_id::text||':'||l.factory_id::text),9,4)||'-4'||
   substr(md5('saqeel:demo:bulk_item:v1:'||l.batch_id::text||':'||l.factory_id::text),14,3)||'-a'||
   substr(md5('saqeel:demo:bulk_item:v1:'||l.batch_id::text||':'||l.factory_id::text),18,3)||'-'||
   substr(md5('saqeel:demo:bulk_item:v1:'||l.batch_id::text||':'||l.factory_id::text),21,12))::uuid,
  l.batch_id, l.factory_id, l.status, l.vid, l.insp_id,
  case when l.status = 'failed'
    then (array['no_active_penalty_mapping','duplicate_open_violation','factory_not_in_scope','license_record_unavailable'])[((l.seq + l.j) % 4) + 1]
    else null end
from linked l
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 7a. reopening_notices.
--     production_line notices go to the five clean factories that actually
--     have plant_production_line_items; every other clean factory gets one
--     factory-level notice. Attendance and submission CHECK constraints:
--       representative_absent -> signature must be null
--       not absent            -> absence_reason must be null
--       status 'submitted'    -> report_number, report_date, submitted_at set
-- ---------------------------------------------------------------------
with pl_f as (
  select distinct p.factory_id from plant_production_line_items p
  join factories f on f.id = p.factory_id where f.factory_code like 'F-%'
),
pl_visits as (
  select v.id as visit_id, v.factory_id, f.factory_code, 'production_line'::text as notice_type,
         row_number() over (order by f.factory_code, v.window_start) as rn
  from visits v join pl_f on pl_f.factory_id = v.factory_id join factories f on f.id = v.factory_id
),
other_visits as (
  select visit_id, factory_id, factory_code, notice_type, 100 + rn as rn from (
    select v.id as visit_id, v.factory_id, f.factory_code, 'factory'::text as notice_type,
           row_number() over (partition by f.factory_code order by v.window_start desc) as prn,
           row_number() over (order by f.factory_code) as rn
    from visits v join factories f on f.id = v.factory_id
    where f.factory_code like 'F-%' and v.factory_id not in (select factory_id from pl_f)
  ) z where prn = 1
),
all_v as (select * from pl_visits union all select * from other_visits),
gen as (
  select a.*,
    md5('saqeel:demo:reopening:v1:'||a.visit_id::text||':'||a.notice_type) as h,
    (a.rn % 5 = 0) as rep_absent,
    (a.rn % 3 <> 0) as submitted,
    (date '2026-07-26' - (((a.rn * 3) % 27)::int)) as rdate
  from all_v a
)
insert into reopening_notices
  (id, visit_id, factory_id, notice_type, report_number, report_date, representative_absent, absence_reason, signature, status, created_by, created_at, submitted_at)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.visit_id, g.factory_id, g.notice_type,
  case when g.submitted then 'RN-2026-'||replace(g.factory_code,'F-','')||'-'||lpad((g.rn % 100)::text,2,'0') else null end,
  case when g.submitted then g.rdate else null end,
  g.rep_absent,
  case when g.rep_absent then (array['تعذر حضور ممثل المنشأة خلال الزيارة رغم الإشعار المسبق.','ممثل المنشأة المفوض في إجازة ولم تُفوَّض جهة بديلة.','لم يحضر ممثل المنشأة في الموعد المحدد لرفع الإيقاف.'])[(g.rn % 3) + 1] else null end,
  case when g.rep_absent then null else jsonb_build_object(
    'rep_name', (array['سعود عبدالرحمن الدوسري','منيرة صالح القحطاني','تركي عبدالله الحربي','عبدالعزيز فهد المالكي'])[(g.rn % 4) + 1],
    'role_title', 'ممثل المنشأة المفوض',
    'method', 'captured_acknowledgement',
    'signed_at', (g.rdate + interval '11 hours')
  ) end,
  case when g.submitted then 'submitted' else 'draft' end,
  (array['c2ae5022-91a8-4014-8643-d436d2b3e640','4bb3a1b8-b89e-4279-94db-05a65d8eeff4','5b70c10d-2f59-4b8a-90dd-4b7eb9bb4728','d77105c0-82a6-4522-b073-56aae7915c5e','fe4cfd87-76c6-42f4-9263-9a0cc01f1825','813773b6-6c86-4557-b630-21f06b2a7026'])[(g.rn % 6) + 1]::uuid,
  g.rdate + interval '8 hours',
  case when g.submitted then g.rdate + interval '13 hours' else null end
from gen g
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 7b. reopening_notice_lines — only on notices this file created, and only
--     on production_line notices (enforced by reopening_notice_line_type_guard).
-- ---------------------------------------------------------------------
with n as (
  select rn.id as notice_id, rn.factory_id,
         (substr(md5('saqeel:demo:reopening:v1:'||rn.visit_id::text||':'||rn.notice_type),1,8)||'-'||
          substr(md5('saqeel:demo:reopening:v1:'||rn.visit_id::text||':'||rn.notice_type),9,4)||'-4'||
          substr(md5('saqeel:demo:reopening:v1:'||rn.visit_id::text||':'||rn.notice_type),14,3)||'-a'||
          substr(md5('saqeel:demo:reopening:v1:'||rn.visit_id::text||':'||rn.notice_type),18,3)||'-'||
          substr(md5('saqeel:demo:reopening:v1:'||rn.visit_id::text||':'||rn.notice_type),21,12))::uuid as expect_id
  from reopening_notices rn where rn.notice_type = 'production_line'
),
mine as (select notice_id, factory_id from n where notice_id = expect_id),
items as (
  select m.notice_id, p.id as item_id,
         row_number() over (partition by m.notice_id order by p.id) as k
  from mine m join plant_production_line_items p on p.factory_id = m.factory_id
)
insert into reopening_notice_lines (notice_id, production_line_item_id)
select notice_id, item_id from items where k <= 4
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 8. cases — one per clean factory. Feeds /operations/exceptions, which
--    projects cases in status open/in_progress.
-- ---------------------------------------------------------------------
with fx as (select id, factory_code, name, row_number() over (order by factory_code) as rn from factories where factory_code like 'F-%'),
gen as (
  select f.*, md5('saqeel:demo:case:v1:'||f.factory_code) as h,
    (array['correction','reinspection','appeal'])[(f.rn % 3) + 1] as ctype,
    (array['open','in_progress','open','resolved','in_progress','open','closed','withdrawn'])[(f.rn % 8) + 1] as st,
    (timestamptz '2026-07-25 08:00:00+03' - ((f.rn * 11) % 27) * interval '1 day') as opened
  from fx f
)
insert into cases (id, factory_id, case_type, status, origin_type, origin_ref, opened_by, closed_by, closed_reason, opened_at, closed_at, updated_at)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.id, g.ctype, g.st,
  case when (select count(*) from inspections i join visits v on v.id=i.visit_id where v.factory_id=g.id) > 0 then 'inspection' else 'visit' end,
  coalesce(
    (select i.id from inspections i join visits v on v.id=i.visit_id where v.factory_id=g.id order by i.submitted_at desc nulls last, i.id limit 1),
    (select v.id from visits v where v.factory_id=g.id order by v.window_start desc limit 1)
  ),
  (array['c2ae5022-91a8-4014-8643-d436d2b3e640','4bb3a1b8-b89e-4279-94db-05a65d8eeff4','5b70c10d-2f59-4b8a-90dd-4b7eb9bb4728','3e1d3b7d-8856-40cb-ab07-5e9e624e6329','38fd1ad1-ec82-4d62-8da4-a3231271753a'])[(g.rn % 5) + 1]::uuid,
  case when g.st in ('resolved','closed','withdrawn') then (array['38fd1ad1-ec82-4d62-8da4-a3231271753a','7da93ff6-82c5-45f8-be26-92c8956c2254','f9067e24-99f7-40e7-8421-4717de9ca2db'])[(g.rn % 3) + 1]::uuid else null end,
  case g.st
    when 'resolved' then 'استُكملت الإجراءات التصحيحية وتم التحقق منها ميدانياً في زيارة المتابعة.'
    when 'closed' then 'أُغلقت الحالة بعد رفع الأدلة المطلوبة واعتمادها من مسؤول الامتثال.'
    when 'withdrawn' then 'سُحبت الحالة؛ تبيّن أن الملاحظة سُجلت على منشأة أخرى ضمن المدينة الصناعية نفسها.'
    else null end,
  g.opened,
  case when g.st in ('resolved','closed','withdrawn') then g.opened + interval '6 days' else null end,
  case when g.st in ('resolved','closed','withdrawn') then g.opened + interval '6 days' else g.opened + interval '2 days' end
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 9. risk_exceptions — model-input exceptions per clean factory.
--    run_id stays null: this project has no risk_runs, and risk_runs is
--    outside this seed's write partition.
-- ---------------------------------------------------------------------
with fx as (select id, factory_code, row_number() over (order by factory_code) as rn from factories where factory_code like 'F-%'),
gen as (
  select f.*, md5('saqeel:demo:risk_exception:v1:'||f.factory_code) as h,
    case when f.rn % 7 = 0 then 'resolved' else 'open' end as st,
    (timestamptz '2026-07-24 07:00:00+03' - ((f.rn * 5) % 26) * interval '1 day') as created
  from fx f
)
insert into risk_exceptions (id, factory_id, run_id, status, reason, evidence_ref, resolved_by, resolved_at, created_at)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.id, null, g.st,
  (array[
    'تعذر احتساب درجة الخطورة: بيانات الترخيص الصناعي غير متزامنة مع المصدر منذ أكثر من ثلاثين يوماً.',
    'تعارض في مدخلات النموذج: عدد العاملين المسجل لا يتوافق مع الطاقة الإنتاجية المصرح بها.',
    'إحداثيات الموقع الرسمية خارج حدود المدينة الصناعية المسجلة؛ يتعذر تطبيق عامل الموقع الجغرافي.',
    'لا توجد زيارة تفتيشية معتمدة خلال دورة النموذج الحالية؛ درجة الخطورة غير قابلة للاعتماد.',
    'سجل المخالفات السابق غير مكتمل بعد ترحيل البيانات؛ عامل التكرار غير محتسب.',
    'تصنيف النشاط الصناعي غير مطابق للدليل المعتمد؛ يتعذر ربط وزن القطاع.'
  ])[(g.rn % 6) + 1],
  'risk/2026-07/'||g.factory_code||'/model-input-exception.json',
  case when g.st = 'resolved' then '394c5c6c-b7da-48e2-b936-5728d0632518'::uuid else null end,
  case when g.st = 'resolved' then g.created + interval '4 days' else null end,
  g.created
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 10a. correction_evidence — factory-uploaded correction proof.
-- ---------------------------------------------------------------------
with fx as (select id, factory_code, row_number() over (order by factory_code) as rn from factories where factory_code like 'F-%'),
base as (
  select f.*, s.slot, md5('saqeel:demo:correction_evidence:v1:'||f.factory_code||':'||s.slot) as h
  from fx f cross join (values (1),(2)) s(slot)
  where s.slot = 1 or f.rn % 3 = 0
),
gen as (
  select b.*,
    (select er.id from external_requests er where er.factory_id = b.id order by er.created_at, er.id offset (b.slot - 1) limit 1) as req_id,
    (select r.id from factory_representatives r where r.factory_id = b.id and r.active order by r.id limit 1) as rep_id
  from base b
)
insert into correction_evidence (id, request_id, factory_id, content_sha256, media_type, uploaded_by_rep, created_at)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.req_id, g.id,
  md5('evidence-a:'||g.h)||md5('evidence-b:'||g.h),
  (array['image/jpeg','application/pdf','image/png','video/mp4'])[((g.rn + g.slot) % 4) + 1],
  g.rep_id,
  timestamptz '2026-07-25 14:00:00+03' - (((g.rn * 7) + g.slot) % 26) * interval '1 day'
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 10b. correction_evidence attached to the remaining external_requests.
-- ---------------------------------------------------------------------
with req as (
  select er.id as req_id, er.factory_id, row_number() over (order by er.created_at, er.id) as rn
  from external_requests er join factories f on f.id = er.factory_id where f.factory_code like 'F-%'
),
gen as (select r.*, md5('saqeel:demo:correction_evidence:req:v1:'||r.req_id::text) as h from req r where r.rn > 1)
insert into correction_evidence (id, request_id, factory_id, content_sha256, media_type, uploaded_by_rep, created_at)
select
  (substr(g.h,1,8)||'-'||substr(g.h,9,4)||'-4'||substr(g.h,14,3)||'-a'||substr(g.h,18,3)||'-'||substr(g.h,21,12))::uuid,
  g.req_id, g.factory_id,
  md5('evidence-a:'||g.h)||md5('evidence-b:'||g.h),
  (array['image/jpeg','application/pdf','image/png','video/mp4'])[(g.rn % 4) + 1],
  (select r.id from factory_representatives r where r.factory_id = g.factory_id and r.active order by r.id limit 1),
  timestamptz '2026-07-24 09:00:00+03' - ((g.rn * 4) % 24) * interval '1 day'
from gen g
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 11. Governed-penalty backfill for the /enforcement-library window.
--     The library reads violations ordered by id desc, limit 100. Legacy
--     violations in that window predate the materialisation trigger and
--     rendered as "Not issued". Each one gets the same penalty_mappings
--     snapshot the trigger would have taken. INSERT only — no legacy
--     violation is touched.
-- ---------------------------------------------------------------------
with win as (select id from violations order by id desc limit 100),
missing as (
  select v.id as violation_id, v.inspection_id, v.violation_code_id, v.mapping_version,
         row_number() over (order by v.id) as rn
  from win w join violations v on v.id = w.id
  left join inspection_penalties ip on ip.violation_id = v.id
  where ip.id is null
),
mapped as (
  select m.*, pm.id as pm_id, to_jsonb(pm) as snap,
         md5('saqeel:demo:inspection_penalty:v1:'||m.violation_id::text) as h
  from missing m
  join lateral (
    select * from penalty_mappings p
    where p.violation_code_id = m.violation_code_id and p.mapping_version = m.mapping_version
      and p.status in ('published','locked')
    order by p.published_at desc nulls last limit 1
  ) pm on true
)
insert into inspection_penalties (id, inspection_id, violation_id, penalty_mapping_id, mapping_snapshot, status, issued_at, issued_by)
select
  (substr(x.h,1,8)||'-'||substr(x.h,9,4)||'-4'||substr(x.h,14,3)||'-a'||substr(x.h,18,3)||'-'||substr(x.h,21,12))::uuid,
  x.inspection_id, x.violation_id, x.pm_id, x.snap,
  case when x.rn % 6 = 0 then 'informational' else 'issued' end,
  case when x.rn % 6 = 0 then null else timestamptz '2026-07-26 11:00:00+03' - ((x.rn * 11) % 27) * interval '1 day' end,
  case when x.rn % 6 = 0 then null else (array['38fd1ad1-ec82-4d62-8da4-a3231271753a','7da93ff6-82c5-45f8-be26-92c8956c2254','f9067e24-99f7-40e7-8421-4717de9ca2db'])[(x.rn % 3) + 1]::uuid end
from mapped x
on conflict do nothing;

commit;

-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- select 'enforcement_recommendations' t, count(*) n from enforcement_recommendations
-- union all select 'violations', count(*) from violations
-- union all select 'inspection_penalties', count(*) from inspection_penalties
-- union all select 'penalty_notices', count(*) from penalty_notices
-- union all select 'bulk_violation_batches', count(*) from bulk_violation_batches
-- union all select 'bulk_violation_batch_items', count(*) from bulk_violation_batch_items
-- union all select 'reopening_notices', count(*) from reopening_notices
-- union all select 'reopening_notice_lines', count(*) from reopening_notice_lines
-- union all select 'cases', count(*) from cases
-- union all select 'findings', count(*) from findings
-- union all select 'risk_exceptions', count(*) from risk_exceptions
-- union all select 'correction_evidence', count(*) from correction_evidence;
