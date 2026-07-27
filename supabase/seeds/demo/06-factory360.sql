-- =====================================================================
-- 06-factory360.sql — SYNTHETIC NON-PRODUCTION DEMO DATA
-- =====================================================================
-- Factory 360 dossier completeness for the 24 curated demo factories
-- (factory_code like 'F-%'). Every value in this file is INVENTED for
-- demonstration purposes. No row here originates from Senaei, MIM, ZATCA,
-- GOSI, MHRSD or any real registry. Do NOT load into production.
--
-- Idempotent: deterministic md5-derived UUIDs + ON CONFLICT DO NOTHING /
-- NOT EXISTS guards. UPDATEs are absolute (not incremental). Re-running
-- the whole file is a no-op.
--
-- Partition: factories (UPDATE, F-% only), factory_products,
-- factory_materials, factory_documents, factory_media_assets,
-- factory_government_records, factory_representatives,
-- commercial_registrations, industrial_licenses, plant_addresses,
-- plant_production_line_items, inspection_factory_checks,
-- inspection_factory_snapshots, factory_import_batches,
-- factory_import_rows, factory_document_download_receipts, evidence.
-- Plus senaei_sync_runs — the NOT NULL FK parent of
-- factory_import_batches.sync_run_id; batches cannot exist without it.
--
-- Every later section derives from columns written in Section 1, so each
-- section is independently re-runnable.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Section 1 — factories: legal identity, licence facts, workforce, capital
-- ---------------------------------------------------------------------
update factories f set
  legal_name               = s.legal_ar,
  license_holder           = s.holder_ar,
  cr_owner_details         = s.owner_ar,
  license_status           = s.lic_status,
  license_stage            = s.lic_stage,
  license_issue_date       = s.lic_issue,
  license_expiry_date      = s.lic_expiry,
  cr_status                = s.cr_status,
  employees_total          = s.emp_total,
  employees_saudi          = s.emp_saudi,
  capital_invested         = s.capital,
  production_capacity_note = s.cap_note_ar,
  exports_products         = s.exports,
  geofence_radius_m        = s.geofence,
  source_synced_at         = coalesce(f.source_synced_at, timestamptz '2026-07-20 06:15:00+03')
from (values
 ('F-1101','شركة الرياض للبتروكيماويات المتقدمة','شركة الرياض للبتروكيماويات المتقدمة','شركة مساهمة سعودية مقفلة — الشريك الرئيسي شركة نجد القابضة للاستثمار الصناعي بنسبة 65%، وصندوق التنمية الصناعية السعودي بنسبة 20%، وشركاء أفراد بنسبة 15%','active','operating',date '2019-03-12',date '2029-03-11','active',612,238,480000000,'طاقة إنتاجية سنوية 325,000 طن من البوليمرات — ثلاثة خطوط بلمرة تعمل بنظام ثلاث ورديات على مدار الأسبوع',true,300),
 ('F-1102','شركة الوطنية لصناعة البلاستيك','شركة الوطنية لصناعة البلاستيك','شركة ذات مسؤولية محدودة — المالك عبدالرحمن بن سليمان الوطبان بنسبة 70%، وورثة سليمان الوطبان بنسبة 30%','active','operating',date '2021-06-01',date '2027-05-31','active',214,78,62000000,'طاقة إنتاجية سنوية 900,000 متر طولي من الأنابيب و8,500 طن من الأكياس — خمسة خطوط بثق تعمل بورديتين',false,180),
 ('F-1103','مصنع نجد لتشكيل وتصنيع الحديد','شركة نجد الصناعية للحديد','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة نجد الصناعية القابضة بنسبة 80%، ومحمد بن فهد الرشيد بنسبة 20%','active','operating',date '2018-09-20',date '2028-09-19','active',386,121,275000000,'طاقة إنتاجية سنوية 345,000 طن من منتجات الحديد المدرفلة — فرن قوس كهربائي ومدرفلة ساخنة يعملان بثلاث ورديات',true,320),
 ('F-1104','شركة الخريف للمعدات والحلول الصناعية','شركة الخريف للمعدات والحلول الصناعية','شركة مساهمة سعودية مقفلة — مجموعة الخريف القابضة بنسبة 90%، وشركاء أفراد بنسبة 10%','active','operating',date '2020-01-15',date '2030-01-14','active',168,94,41000000,'طاقة إنتاجية سنوية 9,900 وحدة من المضخات ولوحات التحكم — ثلاثة خطوط تجميع تعمل بوردية واحدة ممتدة',true,150),
 ('F-1105','الشركة السعودية لمنتجات الألبان والأغذية — مصنع سدير','الشركة السعودية لمنتجات الألبان والأغذية','شركة مساهمة عامة مدرجة في السوق المالية السعودية — لا يوجد مالك تتجاوز حصته 20% عدا مؤسسة عامة استثمارية','active','operating',date '2022-02-08',date '2032-02-07','active',445,206,310000000,'طاقة إنتاجية سنوية 86,000,000 لتر من منتجات الألبان طويلة الأجل — أربعة خطوط تعقيم فائق الحرارة تعمل بثلاث ورديات',true,220),
 ('F-2201','شركة جدة للصناعات الكيميائية الأساسية','شركة جدة للصناعات الكيميائية الأساسية','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة البحر الأحمر للاستثمار الصناعي بنسبة 60%، وشركاء أفراد بنسبة 40%','suspended','operating',date '2017-11-05',date '2027-11-04','active',258,83,195000000,'طاقة إنتاجية سنوية 125,000 طن من الكلور القلوي ومشتقاته — وحدتا تحليل كهربائي، إحداهما موقوفة بقرار تصحيحي',false,350),
 ('F-2202','شركة البحر الأحمر لتصنيع وتعليب الأغذية','شركة البحر الأحمر لتصنيع وتعليب الأغذية','شركة ذات مسؤولية محدودة — المالك أسرة باناجه للاستثمار التجاري بنسبة 100%','active','operating',date '2021-04-18',date '2031-04-17','active',322,107,88000000,'طاقة إنتاجية سنوية 48,000,000 علبة من الأسماك المعلبة و37,000 طن من المنتجات المصنعة — خطان للتعليب وخط تجميد',true,200),
 ('F-2203','شركة المنتجات الورقية العربية','شركة المنتجات الورقية العربية','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة الصناعات الورقية الخليجية بنسبة 55%، وشركاء أفراد بنسبة 45%','expired','operating',date '2016-04-01',date '2026-03-31','active',197,64,74000000,'طاقة إنتاجية سنوية 84,000 طن من الورق الصحي وورق التغليف — ماكينتا ورق تعملان بثلاث ورديات',false,190),
 ('F-2204','مجمع رابغ للبوليمرات والمواد الوسيطة','شركة رابغ للبوليمرات','شركة مساهمة سعودية مقفلة — مشروع مشترك بين شركة أرامكو السعودية للتطوير الصناعي بنسبة 50%، وشريك دولي مرخص بنسبة 50%','active','expansion',date '2015-08-10',date '2035-08-09','active',1180,512,4200000000,'طاقة إنتاجية سنوية 1,600,000 طن من البوليمرات والجلايكولات — ستة قطارات إنتاج متكاملة تعمل على مدار الساعة',true,250),
 ('F-2214','مصنع الأمل لصناعة البلاستيك','مؤسسة الأمل الصناعية','مؤسسة فردية — المالك عبدالله بن ناصر العمري بنسبة 100%','active','operating',date '2022-09-01',date '2027-08-31','active',96,41,18500000,'طاقة إنتاجية سنوية 750,000 متر طولي من أنابيب الري و6,500 طن من الأفلام — أربعة خطوط بثق تعمل بورديتين',false,140),
 ('F-2215','شركة الخليج لأعمال الحديد والصلب','شركة الخليج لأعمال الحديد والصلب','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة سدير للاستثمار الصناعي بنسبة 70%، وشركاء أفراد بنسبة 30%','suspended','operating',date '2019-12-01',date '2029-11-30','active',412,126,520000000,'طاقة إنتاجية سنوية 315,000 طن من الألواح والأنابيب — خط الدرفلة الساخنة موقوف مؤقتاً بقرار سلامة',true,300),
 ('F-2216','شركة نجد للصناعات الغذائية','شركة نجد للصناعات الغذائية','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة نجد التجارية بنسبة 75%، وسارة بنت خالد الدوسري بنسبة 25%','active','operating',date '2023-01-22',date '2033-01-21','active',187,96,54000000,'طاقة إنتاجية سنوية 126,000 طن من الدقيق والمعكرونة والبسكويت — مطحنة وخطان للتصنيع يعملان بورديتين',false,170),
 ('F-2217','شركة سدير للبوليمرات المتخصصة','شركة سدير للبوليمرات المتخصصة','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة سدير للاستثمار الصناعي بنسبة 60%، وشريك أجنبي مرخص بنسبة 40%','active','trial_operation',date '2025-05-04',date '2030-05-03','active',143,52,97000000,'طاقة إنتاجية سنوية 67,000 طن من المركبات البوليمرية — خطا تركيب في التشغيل التجريبي بنسبة تحميل 60%',false,200),
 ('F-3301','شركة الدمام للأعمال المعدنية والهياكل الإنشائية','شركة الدمام للأعمال المعدنية','شركة ذات مسؤولية محدودة — الشريك الرئيسي مجموعة الزامل الصناعية بنسبة 65%، وشركاء أفراد بنسبة 35%','active','operating',date '2018-02-14',date '2028-02-13','active',298,104,168000000,'طاقة إنتاجية سنوية 72,000 طن من الهياكل والخزانات المعدنية — ثلاثة مسارات تصنيع وخط جلفنة',true,230),
 ('F-3302','شركة الخليج للكابلات والصناعات الكهربائية','شركة الخليج للكابلات والصناعات الكهربائية','شركة مساهمة سعودية مقفلة — شركة الخليج القابضة بنسبة 55%، ومستثمرون مؤسسيون بنسبة 45%','active','operating',date '2017-07-09',date '2027-07-08','active',356,142,340000000,'طاقة إنتاجية سنوية 60,000 كيلومتر من الكابلات و5,200 لوحة توزيع — أربعة خطوط سحب وبثق العزل',true,240),
 ('F-3303','شركة الجبيل للأسمدة — الوحدة الرابعة','الشركة السعودية للأسمدة','شركة مساهمة عامة مدرجة — الشركة السعودية للصناعات الأساسية بنسبة 43%، ومستثمرون عامون بنسبة 57%','active','operating',date '2014-10-01',date '2034-09-30','active',864,431,3650000000,'طاقة إنتاجية سنوية 1,100,000 طن يوريا و730,000 طن أمونيا — قطارا إنتاج متكاملان يعملان على مدار الساعة',true,250),
 ('F-3304','شركة الجبيل للمواد المركبة المتقدمة','شركة الجبيل للمواد المركبة المتقدمة','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة الجبيل للاستثمار الصناعي بنسبة 60%، وشريك تقني أجنبي مرخص بنسبة 40%','active','expansion',date '2021-11-11',date '2031-11-10','active',176,68,128000000,'طاقة إنتاجية سنوية 210,000 متر طولي من الأنابيب المركبة — خط لف خيطي وخط قولبة تحت التوسعة',true,210),
 ('F-3305','شركة الأحساء لصناعة المشروبات','شركة الأحساء لصناعة المشروبات','شركة ذات مسؤولية محدودة — المالك أسرة القصيبي للاستثمار بنسبة 100%','active','operating',date '2020-06-15',date '2030-06-14','active',268,131,118000000,'طاقة إنتاجية سنوية 335,000,000 لتر من المياه والمشروبات — خمسة خطوط تعبئة تعمل بثلاث ورديات',false,190),
 ('F-4401','شركة ينبع لصناعات دعم التكرير','شركة ينبع لصناعات دعم التكرير','شركة مساهمة سعودية مقفلة — شركة ينبع الوطنية للبتروكيماويات بنسبة 70%، وصندوق الاستثمارات الصناعية بنسبة 30%','active','operating',date '2016-05-23',date '2031-05-22','active',592,244,1850000000,'طاقة إنتاجية سنوية 425,000 طن من زيوت الأساس والشموع والكبريت — ثلاث وحدات معالجة متكاملة',true,280),
 ('F-4402','شركة المدينة المنورة لتصنيع وتعبئة التمور','شركة المدينة المنورة لتصنيع وتعبئة التمور','شركة ذات مسؤولية محدودة — الشريك الرئيسي جمعية المزارعين التعاونية بالمدينة المنورة بنسبة 51%، وشركاء أفراد بنسبة 49%','active','operating',date '2022-12-05',date '2032-12-04','active',134,89,36000000,'طاقة إنتاجية سنوية 39,500 طن من التمور ومشتقاتها — خطا فرز وتعبئة وخط معجون تعمل موسمياً بثلاث ورديات',true,160),
 ('F-5501','شركة القصيم للآليات والمعدات الزراعية','شركة القصيم للآليات والمعدات الزراعية','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة القصيم الزراعية بنسبة 68%، وشركاء أفراد بنسبة 32%','active','operating',date '2019-08-27',date '2029-08-26','active',152,71,47000000,'طاقة إنتاجية سنوية 2,460 وحدة من الآليات الزراعية — خط تجميع ومحطة اختبار حقلي تعمل بوردية واحدة',false,175),
 ('F-5502','شركة حائل لمنتجات الأسمنت والخرسانة','شركة حائل لمنتجات الأسمنت والخرسانة','شركة ذات مسؤولية محدودة — الشريك الرئيسي شركة حائل للتنمية الصناعية بنسبة 60%، وشركاء أفراد بنسبة 40%','expired','operating',date '2015-12-01',date '2025-11-30','active',211,78,92000000,'طاقة إنتاجية سنوية 420,000 متر مكعب من الخرسانة الجاهزة و24,000,000 بلوك — ثلاث محطات خلط',false,260),
 ('F-6601','شركة عسير للمياه المعدنية الطبيعية','شركة عسير للمياه المعدنية الطبيعية','شركة ذات مسؤولية محدودة — المالك مجموعة أبها للاستثمار الغذائي بنسبة 100%','active','operating',date '2023-03-19',date '2033-03-18','active',118,74,44000000,'طاقة إنتاجية سنوية 213,000,000 لتر من المياه المعبأة — ثلاثة خطوط تعبئة تعمل بورديتين',false,165),
 ('F-6602','شركة جازان لسحب وبثق الألمنيوم','شركة جازان لسحب وبثق الألمنيوم','شركة مساهمة سعودية مقفلة — شركة جازان للتنمية الصناعية بنسبة 62%، وشريك أجنبي مرخص بنسبة 38%','active','expansion',date '2020-10-06',date '2030-10-05','active',327,118,610000000,'طاقة إنتاجية سنوية 74,000 طن من قطاعات الألمنيوم المبثوقة — ثلاثة مكابس بثق وخط طلاء بالبودرة',true,235)
) as s(code,legal_ar,holder_ar,owner_ar,lic_status,lic_stage,lic_issue,lic_expiry,cr_status,emp_total,emp_saudi,capital,cap_note_ar,exports,geofence)
where f.factory_code = s.code and f.factory_code like 'F-%';


-- ---------------------------------------------------------------------
-- Section 2 — commercial_registrations / industrial_licenses / plant_addresses
-- All three rows already existed for every F-% factory and are correctly
-- linked (industrial_licenses.factory_id -> factories.id,
--  industrial_licenses.commercial_registration_id -> commercial_registrations.id,
--  plant_addresses.industrial_license_id -> industrial_licenses.id).
-- This section fills the empty registry columns.
-- guard_factory360_external_identifiers() blocks REPLACING a non-null
-- cr_number / unified_number / license_number / factory_id / plant_number,
-- so those are only ever set via coalesce() from NULL.
-- ---------------------------------------------------------------------
with f360 as (
  select f.*,
    '10' || replace(f.factory_code,'F-','') || '01' as plant_no,
    '70' || replace(f.factory_code,'F-','') || lpad(((('x'||substr(md5(f.factory_code),1,7))::bit(28)::int) % 10000)::text,4,'0') as unified,
    case f.region when 'Riyadh' then 'الرياض' when 'Makkah' then 'مكة المكرمة' when 'Eastern' then 'المنطقة الشرقية'
                  when 'Madinah' then 'المدينة المنورة' when 'Qassim' then 'القصيم' when 'Hail' then 'حائل'
                  when 'Asir' then 'عسير' when 'Jazan' then 'جازان' else f.region end as region_ar,
    case f.city
      when '1st Industrial City' then 'المدينة الصناعية الأولى بالرياض'
      when '2nd Industrial City' then 'المدينة الصناعية الثانية بالرياض'
      when '3rd Industrial City' then 'المدينة الصناعية الثالثة بالرياض'
      when 'Sudair' then 'مدينة سدير للصناعة والأعمال'
      when 'Jeddah Industrial City 1' then 'مدينة جدة الصناعية الأولى'
      when 'Jeddah Industrial City 2' then 'مدينة جدة الصناعية الثانية'
      when 'Jeddah Industrial City 3' then 'مدينة جدة الصناعية الثالثة'
      when 'Rabigh PlusTech Park' then 'مجمع رابغ بلس تك الصناعي'
      when 'Dammam 1st Industrial City' then 'مدينة الدمام الصناعية الأولى'
      when 'Dammam 2nd Industrial City' then 'مدينة الدمام الصناعية الثانية'
      when 'Jubail Industrial City 1' then 'مدينة الجبيل الصناعية الأولى'
      when 'Jubail Industrial City 2' then 'مدينة الجبيل الصناعية الثانية'
      when 'Al Ahsa Industrial City' then 'المدينة الصناعية بالأحساء'
      when 'Yanbu Industrial City' then 'مدينة ينبع الصناعية'
      when 'Madinah Industrial City' then 'المدينة الصناعية بالمدينة المنورة'
      when 'Qassim Industrial City' then 'المدينة الصناعية بالقصيم'
      when 'Hail Industrial City' then 'المدينة الصناعية بحائل'
      when 'Abha Industrial City' then 'المدينة الصناعية بأبها'
      when 'Jazan Economic City' then 'مدينة جازان للصناعات الأساسية والتحويلية'
      else f.city end as city_ar
  from factories f where f.factory_code like 'F-%'
),
cr_upd as (
  update commercial_registrations cr set
    legal_name       = x.legal_name,
    legal_name_ar    = x.legal_name,
    legal_name_en    = x.name,
    status           = x.cr_status,
    issue_date       = x.license_issue_date - interval '1 year',
    expiry_date      = x.license_issue_date - interval '1 year' + interval '15 years',
    owner_details    = x.cr_owner_details,
    unified_number   = coalesce(cr.unified_number, x.unified),
    source_system    = 'senaei',
    source_synced_at = timestamptz '2026-07-20 06:15:00+03',
    updated_at       = now()
  from f360 x join industrial_licenses il on il.factory_id = x.id
  where cr.id = il.commercial_registration_id
  returning 1
),
lic_upd as (
  update industrial_licenses il set
    plant_number     = coalesce(il.plant_number, x.plant_no),
    license_type     = 'industrial',
    status           = x.license_status,
    stage            = x.license_stage,
    issue_date       = x.license_issue_date,
    expiry_date      = x.license_expiry_date,
    holder_name      = x.license_holder,
    investment_type  = case when x.cr_owner_details like '%أجنبي%' or x.cr_owner_details like '%دولي%'
                            then 'foreign_joint_venture' else 'domestic' end,
    investment_size  = x.capital_invested,
    source_system    = 'senaei',
    source_synced_at = timestamptz '2026-07-20 06:15:00+03',
    updated_at       = now()
  from f360 x where il.factory_id = x.id
  returning 1
)
update plant_addresses pa set
  external_address_id = 'ADDR-' || coalesce(il.plant_number, x.plant_no),
  address_type_code   = 'plant',
  address_line_1      = 'طريق المصانع رقم ' || substr(x.factory_code,3,2) || '، ' || x.city_ar,
  landmark            = 'يقع خلف مركز الخدمات اللوجستية في ' || x.city_ar,
  district_ar         = 'الحي الصناعي — ' || x.city_ar,
  district_en         = x.city || ' Industrial District',
  building_number     = lpad(((('x'||substr(md5(x.factory_code||'bld'),1,7))::bit(28)::int) % 9000 + 1000)::text,4,'0'),
  additional_number   = lpad(((('x'||substr(md5(x.factory_code||'add'),1,7))::bit(28)::int) % 9000 + 1000)::text,4,'0'),
  postal_code         = lpad(((('x'||substr(md5(x.factory_code||'pc'),1,7))::bit(28)::int) % 90000 + 10000)::text,5,'0'),
  unit_number         = 'مبنى الإدارة الرئيسي',
  street_name_ar      = 'طريق المصانع رقم ' || substr(x.factory_code,3,2),
  street_name_en      = 'Industrial Road ' || substr(x.factory_code,3,2),
  city_ar             = x.city_ar,
  city_en             = x.city,
  region_ar           = x.region_ar,
  region_en           = x.region,
  latitude            = x.official_lat,
  longitude           = x.official_lng,
  source_system       = 'senaei',
  is_current          = true
from f360 x join industrial_licenses il on il.factory_id = x.id
where pa.factory_id = x.id and pa.industrial_license_id = il.id;


-- ---------------------------------------------------------------------
-- Section 3 — factory_products (3 per factory, sector-accurate)
-- ---------------------------------------------------------------------
insert into factory_products (id, factory_id, name, hs_code, unit, annual_capacity, is_primary, created_at)
select md5('f360|prod|'||v.code||'|'||v.ord)::uuid, f.id, v.nm, v.hs, v.unit, v.cap, (v.ord = 1),
       timestamptz '2026-07-20 06:15:00+03'
from (values
 ('F-1101',1,'بولي إيثيلين عالي الكثافة','3901.20','طن',180000),('F-1101',2,'بولي إيثيلين منخفض الكثافة الخطي','3901.40','طن',120000),('F-1101',3,'هكسين-1','2901.29','طن',25000),
 ('F-1102',1,'أنابيب بولي إيثيلين لشبكات المياه','3917.21','متر طولي',900000),('F-1102',2,'أكياس تعبئة بولي إيثيلين','3923.21','طن',8500),('F-1102',3,'أغطية وسدادات بلاستيكية','3923.50','قطعة',40000000),
 ('F-1103',1,'حديد تسليح مضلع','7214.20','طن',220000),('F-1103',2,'قطاعات إنشائية مدرفلة على الساخن','7216.33','طن',95000),('F-1103',3,'شبك حديد ملحوم','7314.20','طن',30000),
 ('F-1104',1,'مضخات طرد مركزي أفقية','8413.70','وحدة',4200),('F-1104',2,'مضخات غاطسة لآبار المياه','8413.70','وحدة',3100),('F-1104',3,'لوحات تحكم كهربائية للمضخات','8537.10','وحدة',2600),
 ('F-1105',1,'حليب طويل الأجل معقم','0401.20','لتر',65000000),('F-1105',2,'قشطة طبخ معقمة','0401.40','لتر',9000000),('F-1105',3,'آيس كريم','2105.00','لتر',12000000),
 ('F-2201',1,'هيدروكسيد الصوديوم (صودا كاوية)','2815.11','طن',60000),('F-2201',2,'حمض الهيدروكلوريك','2806.10','طن',45000),('F-2201',3,'هيبوكلوريت الصوديوم','2828.90','طن',20000),
 ('F-2202',1,'تونة معلبة في الزيت النباتي','1604.14','علبة',48000000),('F-2202',2,'صلصة طماطم مركزة','2002.90','طن',22000),('F-2202',3,'خضار مجمدة مشكلة','0710.90','طن',15000),
 ('F-2203',1,'مناديل ورقية للوجه','4818.20','طن',26000),('F-2203',2,'مناشف ورقية للمطابخ','4818.30','طن',18000),('F-2203',3,'ورق تغليف كرافت','4804.11','طن',40000),
 ('F-2204',1,'بولي بروبيلين متجانس','3902.10','طن',700000),('F-2204',2,'بولي إيثيلين منخفض الكثافة','3901.10','طن',600000),('F-2204',3,'أحادي إيثيلين جلايكول','2905.31','طن',300000),
 ('F-2214',1,'أنابيب بولي إيثيلين للري','3917.32','متر طولي',750000),('F-2214',2,'صناديق بلاستيكية للتعبئة','3923.10','قطعة',1800000),('F-2214',3,'أفلام تغليف مطاطة','3920.10','طن',6500),
 ('F-2215',1,'ألواح صلب مدرفلة على الساخن','7208.51','طن',180000),('F-2215',2,'أنابيب صلب ملحومة','7306.30','طن',90000),('F-2215',3,'زوايا وقطاعات مجلفنة','7216.61','طن',45000),
 ('F-2216',1,'دقيق قمح فاخر','1101.00','طن',90000),('F-2216',2,'معكرونة جافة','1902.19','طن',24000),('F-2216',3,'بسكويت محشو','1905.31','طن',12000),
 ('F-2217',1,'حبيبات بولي بروبيلين مركّبة','3902.30','طن',55000),('F-2217',2,'ألواح بولي كربونات','3920.61','طن',12000),('F-2217',3,'خزانات مياه بولي إيثيلين','3925.10','قطعة',140000),
 ('F-3301',1,'هياكل معدنية إنشائية','7308.90','طن',60000),('F-3301',2,'خزانات صلب للتخزين','7309.00','قطعة',900),('F-3301',3,'سلالم ومنصات معدنية','7308.40','طن',12000),
 ('F-3302',1,'كابلات نحاسية للجهد المنخفض','8544.49','كم',42000),('F-3302',2,'كابلات ألمنيوم للجهد المتوسط','8544.60','كم',18000),('F-3302',3,'لوحات توزيع كهربائية','8537.10','وحدة',5200),
 ('F-3303',1,'يوريا حبيبية','3102.10','طن',1100000),('F-3303',2,'أمونيا لا مائية','2814.10','طن',730000),('F-3303',3,'كبريتات الأمونيوم','3102.21','طن',150000),
 ('F-3304',1,'أنابيب البوليستر المقوى بالألياف الزجاجية','3917.29','متر طولي',210000),('F-3304',2,'خزانات مركبة مقاومة للتآكل','3925.10','قطعة',1400),('F-3304',3,'ألواح مركبة للواجهات','3921.90','متر مربع',320000),
 ('F-3305',1,'مياه شرب معبأة','2201.10','لتر',210000000),('F-3305',2,'مشروبات غازية','2202.10','لتر',85000000),('F-3305',3,'عصائر فواكه طبيعية','2009.89','لتر',40000000),
 ('F-4401',1,'زيوت أساس من المجموعة الثانية','2710.19','طن',260000),('F-4401',2,'شمع البارافين','2712.20','طن',45000),('F-4401',3,'كبريت حبيبي','2503.00','طن',120000),
 ('F-4402',1,'تمور معبأة مكنوزة','0804.10','طن',26000),('F-4402',2,'معجون التمر','2008.99','طن',9000),('F-4402',3,'دبس التمر','1702.90','طن',4500),
 ('F-5501',1,'محاور رش محوري للري','8424.82','وحدة',620),('F-5501',2,'مقطورات زراعية','8716.20','وحدة',1500),('F-5501',3,'آلات حصاد الأعلاف','8433.59','وحدة',340),
 ('F-5502',1,'بلوك خرساني مفرغ','6810.11','قطعة',24000000),('F-5502',2,'بلاط إنترلوك','6810.19','متر مربع',1600000),('F-5502',3,'خرسانة جاهزة','3824.50','متر مكعب',420000),
 ('F-6601',1,'مياه معدنية طبيعية معبأة','2201.10','لتر',150000000),('F-6601',2,'مياه معبأة بعبوات كبيرة','2201.90','لتر',45000000),('F-6601',3,'مياه غازية معدنية','2201.10','لتر',18000000),
 ('F-6602',1,'قطاعات ألمنيوم مبثوقة','7604.21','طن',48000),('F-6602',2,'قطاعات ألمنيوم مطلية بالبودرة','7604.29','طن',26000),('F-6602',3,'ألواح ألمنيوم مركبة','7606.12','متر مربع',900000)
) as v(code,ord,nm,hs,unit,cap)
join factories f on f.factory_code = v.code and f.factory_code like 'F-%'
where not exists (select 1 from factory_products p where p.factory_id = f.id and p.name = v.nm)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 4 — factory_materials (3 per factory)
-- ---------------------------------------------------------------------
insert into factory_materials (id, factory_id, name, source, hs_code, created_at)
select md5('f360|mat|'||v.code||'|'||v.ord)::uuid, f.id, v.nm, v.src, v.hs, timestamptz '2026-07-20 06:15:00+03'
from (values
 ('F-1101',1,'غاز الإيثان','2711.19','local'),('F-1101',2,'غاز الإيثيلين','2901.21','local'),('F-1101',3,'محفزات زيغلر-ناتا','3815.90','imported'),
 ('F-1102',1,'حبيبات بولي إيثيلين عالي الكثافة','3901.20','local'),('F-1102',2,'حبيبات بولي بروبيلين','3902.10','local'),('F-1102',3,'مركزات ألوان (ماستر باتش)','3206.49','imported'),
 ('F-1103',1,'بيليت حديد','7207.11','local'),('F-1103',2,'خردة حديد مصنفة','7204.49','local'),('F-1103',3,'أقطاب جرافيت','8545.11','imported'),
 ('F-1104',1,'صلب كربوني مشغل','7228.30','local'),('F-1104',2,'محركات كهربائية','8501.52','imported'),('F-1104',3,'محامل كروية','8482.10','imported'),
 ('F-1105',1,'حليب خام مبرد','0401.20','local'),('F-1105',2,'مسحوق حليب منزوع الدسم','0402.10','imported'),('F-1105',3,'عبوات كرتون معقمة متعددة الطبقات','4811.59','imported'),
 ('F-2201',1,'ملح صناعي (كلوريد الصوديوم)','2501.00','local'),('F-2201',2,'حمض الكبريتيك','2807.00','local'),('F-2201',3,'كربونات الصوديوم','2836.20','imported'),
 ('F-2202',1,'أسماك تونة مجمدة','0303.42','imported'),('F-2202',2,'زيت نباتي مكرر','1512.19','local'),('F-2202',3,'علب صفيح مطلية','7310.29','local'),
 ('F-2203',1,'لباب ورق سليولوزي','4703.21','imported'),('F-2203',2,'ورق مسترجع (خردة ورقية)','4707.90','local'),('F-2203',3,'نشا الذرة الصناعي','3505.10','imported'),
 ('F-2204',1,'نافثا خفيفة','2710.12','local'),('F-2204',2,'غاز البروبان','2711.12','local'),('F-2204',3,'الأكسجين الصناعي','2804.40','local'),
 ('F-2214',1,'حبيبات بولي إيثيلين منخفض الكثافة الخطي','3901.40','local'),('F-2214',2,'حبيبات بولي بروبيلين','3902.10','local'),('F-2214',3,'إضافات مانعة للأكسدة','3812.31','imported'),
 ('F-2215',1,'بيليت وسلابات حديد','7207.20','local'),('F-2215',2,'خردة حديد مصنفة','7204.41','local'),('F-2215',3,'سبائك الفيرومنجنيز','7202.11','imported'),
 ('F-2216',1,'قمح صلب','1001.19','local'),('F-2216',2,'سكر أبيض مكرر','1701.99','local'),('F-2216',3,'زيت نخيل مهدرج','1511.90','imported'),
 ('F-2217',1,'حبيبات بولي بروبيلين خام','3902.10','local'),('F-2217',2,'مسحوق كربونات الكالسيوم','2836.50','local'),('F-2217',3,'ألياف زجاجية مقطعة','7019.11','imported'),
 ('F-3301',1,'ألواح صلب كربوني','7208.51','local'),('F-3301',2,'أسلاك لحام','8311.20','imported'),('F-3301',3,'دهانات إيبوكسي صناعية','3208.10','local'),
 ('F-3302',1,'قضبان نحاس مستمرة الصب','7408.11','imported'),('F-3302',2,'قضبان ألمنيوم كهربائي','7605.11','local'),('F-3302',3,'مركبات عزل XLPE','3901.90','imported'),
 ('F-3303',1,'غاز طبيعي كوقود ومادة وسيطة','2711.21','local'),('F-3303',2,'ثاني أكسيد الكربون المستخلص','2811.21','local'),('F-3303',3,'مياه منزوعة المعادن','2201.90','local'),
 ('F-3304',1,'راتنج بوليستر غير مشبع','3907.91','imported'),('F-3304',2,'ألياف زجاجية مستمرة (روفينج)','7019.12','imported'),('F-3304',3,'محفزات بيروكسيد عضوي','2909.60','imported'),
 ('F-3305',1,'مركزات عصير الفواكه','2106.90','imported'),('F-3305',2,'ثاني أكسيد الكربون الغذائي','2811.21','local'),('F-3305',3,'عبوات PET أولية (بريفورم)','3923.30','local'),
 ('F-4401',1,'زيت الوقود الثقيل','2710.19','local'),('F-4401',2,'هيدروجين صناعي','2804.10','local'),('F-4401',3,'محفزات هدرجة','3815.19','imported'),
 ('F-4402',1,'تمور خام مستلمة من المزارع','0804.10','local'),('F-4402',2,'عبوات كرتون مطبوعة','4819.10','local'),('F-4402',3,'أفلام تغليف غذائية','3920.20','imported'),
 ('F-5501',1,'صلب إنشائي مجلفن','7210.49','local'),('F-5501',2,'محركات ديزل','8408.90','imported'),('F-5501',3,'أنظمة هيدروليكية','8412.21','imported'),
 ('F-5502',1,'أسمنت بورتلاندي عادي','2523.29','local'),('F-5502',2,'ركام مكسر (بحص)','2517.10','local'),('F-5502',3,'رمل سيليكا مغسول','2505.10','local'),
 ('F-6601',1,'مياه جوفية من الآبار المرخصة','2201.90','local'),('F-6601',2,'عبوات PET أولية (بريفورم)','3923.30','local'),('F-6601',3,'أغطية بلاستيكية وملصقات','3923.50','local'),
 ('F-6602',1,'بيليت ألمنيوم','7601.20','local'),('F-6602',2,'سبائك سيليكون معدني','2804.69','imported'),('F-6602',3,'مساحيق طلاء بوليستر','3208.20','imported')
) as v(code,ord,nm,hs,src)
join factories f on f.factory_code = v.code and f.factory_code like 'F-%'
where not exists (select 1 from factory_materials m where m.factory_id = f.id and m.name = v.nm)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 5 — plant_production_line_items
-- Source-backed plant facts: end products, raw materials, one production
-- line, one machine and two spare-part sets per factory.
-- Read predicate in the dossier loader is
--   .eq(industrial_license_id, licenseId).is(superseded_at, null)
-- Table is append-only (trg_f360_immutable_plant_production_line_items),
-- so this is INSERT ... ON CONFLICT (id) DO NOTHING only.
-- ---------------------------------------------------------------------
with base as (
  select f.id fid, f.factory_code code, f.activity_class ac, il.id lid, il.plant_number pn,
    case f.activity_class when 'petrochemical' then '2011' when 'plastics' then '2220' when 'steel' then '2410'
      when 'machinery' then '2813' when 'food' then '1050' when 'chemical' then '2011' when 'paper' then '1701'
      when 'composites' then '2220' when 'electrical' then '2732' when 'fertilizer' then '2012'
      when 'cement' then '2395' when 'aluminum' then '2432' else '2599' end act_code,
    case f.activity_class when 'petrochemical' then 'صناعة المواد الكيميائية الأساسية والبتروكيماويات'
      when 'plastics' then 'صناعة المنتجات البلاستيكية' when 'steel' then 'صناعة الحديد والصلب'
      when 'machinery' then 'صناعة الآلات والمعدات' when 'food' then 'صناعة المنتجات الغذائية'
      when 'chemical' then 'صناعة المواد الكيميائية الأساسية' when 'paper' then 'صناعة الورق ومنتجاته'
      when 'composites' then 'صناعة المواد المركبة' when 'electrical' then 'صناعة الأسلاك والكابلات الكهربائية'
      when 'fertilizer' then 'صناعة الأسمدة والمركبات النيتروجينية' when 'cement' then 'صناعة منتجات الأسمنت والخرسانة'
      when 'aluminum' then 'صناعة منتجات الألمنيوم' else 'صناعات تحويلية أخرى' end act_ar,
    case f.activity_class when 'petrochemical' then 'Manufacture of basic chemicals and petrochemicals'
      when 'plastics' then 'Manufacture of plastic products' when 'steel' then 'Manufacture of basic iron and steel'
      when 'machinery' then 'Manufacture of machinery and equipment' when 'food' then 'Manufacture of food products'
      when 'chemical' then 'Manufacture of basic chemicals' when 'paper' then 'Manufacture of paper and paper products'
      when 'composites' then 'Manufacture of composite materials' when 'electrical' then 'Manufacture of wiring and cable'
      when 'fertilizer' then 'Manufacture of fertilizers and nitrogen compounds' when 'cement' then 'Manufacture of cement and concrete products'
      when 'aluminum' then 'Manufacture of aluminium products' else 'Other manufacturing' end act_en,
    case f.activity_class when 'petrochemical' then 'خط بلمرة متكامل رقم 1' when 'plastics' then 'خط بثق وتشكيل رقم 1'
      when 'steel' then 'خط الدرفلة الساخنة رقم 1' when 'machinery' then 'خط تجميع المعدات رقم 1'
      when 'food' then 'خط التعبئة والتعقيم رقم 1' when 'chemical' then 'وحدة التحليل الكهربائي رقم 1'
      when 'paper' then 'ماكينة إنتاج الورق رقم 1' when 'composites' then 'خط اللف الخيطي رقم 1'
      when 'electrical' then 'خط سحب الأسلاك وبثق العزل رقم 1' when 'fertilizer' then 'قطار إنتاج اليوريا رقم 1'
      when 'cement' then 'محطة الخلط الخرساني رقم 1' when 'aluminum' then 'مكبس البثق رقم 1' else 'خط الإنتاج الرئيسي رقم 1' end line_ar,
    case f.activity_class when 'petrochemical' then 'Polymerisation Train 1' when 'plastics' then 'Extrusion Line 1'
      when 'steel' then 'Hot Rolling Line 1' when 'machinery' then 'Equipment Assembly Line 1'
      when 'food' then 'Filling and Sterilisation Line 1' when 'chemical' then 'Electrolysis Unit 1'
      when 'paper' then 'Paper Machine 1' when 'composites' then 'Filament Winding Line 1'
      when 'electrical' then 'Wire Drawing and Insulation Line 1' when 'fertilizer' then 'Urea Production Train 1'
      when 'cement' then 'Concrete Batching Plant 1' when 'aluminum' then 'Extrusion Press 1' else 'Main Production Line 1' end line_en,
    case f.activity_class when 'petrochemical' then 'مفاعل بلمرة ذو طبقة مميعة' when 'plastics' then 'ماكينة بثق أحادية اللولب'
      when 'steel' then 'فرن قوس كهربائي' when 'machinery' then 'مركز تشغيل CNC خماسي المحاور'
      when 'food' then 'وحدة تعقيم فائق الحرارة' when 'chemical' then 'خلية تحليل كهربائي غشائية'
      when 'paper' then 'ماكينة تجفيف يانكي' when 'composites' then 'ماكينة لف خيطي بتحكم رقمي'
      when 'electrical' then 'ماكينة سحب الأسلاك النحاسية' when 'fertilizer' then 'برج تحبيب اليوريا'
      when 'cement' then 'خلاط خرساني مزدوج المحور' when 'aluminum' then 'مكبس بثق هيدروليكي 2500 طن' else 'ماكينة الإنتاج الرئيسية' end mach_ar,
    case f.activity_class when 'petrochemical' then 'Fluidised-bed polymerisation reactor' when 'plastics' then 'Single-screw extruder'
      when 'steel' then 'Electric arc furnace' when 'machinery' then 'Five-axis CNC machining centre'
      when 'food' then 'UHT sterilisation unit' when 'chemical' then 'Membrane electrolysis cell'
      when 'paper' then 'Yankee dryer' when 'composites' then 'CNC filament winding machine'
      when 'electrical' then 'Copper wire drawing machine' when 'fertilizer' then 'Urea granulation tower'
      when 'cement' then 'Twin-shaft concrete mixer' when 'aluminum' then 'Hydraulic extrusion press 2500 t' else 'Primary production machine' end mach_en
  from factories f join industrial_licenses il on il.factory_id = f.id
  where f.factory_code like 'F-%'
),
items as (
  select b.*, 'product'::text it, row_number() over (partition by b.fid order by p.name) ord,
         p.name nm_ar, null::text nm_en, p.hs_code hs, p.annual_capacity cap, p.unit unit_ar
  from base b join factory_products p on p.factory_id = b.fid
  union all
  select b.*, 'raw_material', row_number() over (partition by b.fid order by m.name),
         m.name, null, m.hs_code, null, null from base b join factory_materials m on m.factory_id = b.fid
  union all
  select b.*, 'production_line', 1, b.line_ar, b.line_en, null, null, null from base b
  union all
  select b.*, 'machine', 1, b.mach_ar, b.mach_en, null, null, 'وحدة' from base b
  union all
  select b.*, 'spare_part', 1, 'مجموعة أختام ميكانيكية لخط الإنتاج الرئيسي', 'Mechanical seal kit — main line', null, null, 'مجموعة' from base b
  union all
  select b.*, 'spare_part', 2, 'أطقم محامل ومرشحات للصيانة الوقائية', 'Bearing and filter set — preventive maintenance', null, null, 'مجموعة' from base b
)
insert into plant_production_line_items (
  id, factory_id, industrial_license_id, item_type, source_item_id, external_product_id, version_number,
  name_en, name_ar, hs_code, hs_code_type, activity_code, activity_name_en, activity_name_ar,
  quantity, capacity, real_production, maximum_production, price, is_primary,
  unit_code, unit_name_en, unit_name_ar,
  is_spare_part, is_machine, is_end_product, is_raw_material,
  source_created_at, source_updated_at, attributes, source_system, effective_at, created_at)
select
  md5('f360|ppli|'||i.code||'|'||i.it||'|'||i.ord)::uuid, i.fid, i.lid, i.it,
  'SNI-'||i.pn||'-'||upper(left(i.it,4))||'-'||lpad(i.ord::text,2,'0'),
  case when i.it in ('product','raw_material') then 'PRD-'||i.pn||'-'||lpad(i.ord::text,3,'0') end,
  1, i.nm_en, i.nm_ar, i.hs, case when i.hs is not null then 'HS2022' end,
  i.act_code, i.act_en, i.act_ar,
  case when i.it in ('machine','spare_part','production_line') then 1 end,
  i.cap,
  case when i.cap is not null then round(i.cap * 0.82) end,
  case when i.cap is not null then round(i.cap * 1.10) end,
  case when i.it = 'product' then round(((((('x'||substr(md5(i.code||i.nm_ar),1,7))::bit(28)::int) % 4800) + 200))::numeric, 2) end,
  (i.it = 'product' and i.ord = 1),
  case i.unit_ar when 'طن' then 'TON' when 'لتر' then 'LTR' when 'قطعة' then 'PCE' when 'وحدة' then 'UNT'
    when 'متر طولي' then 'MTR' when 'متر مربع' then 'MTK' when 'متر مكعب' then 'MTQ' when 'كم' then 'KMT'
    when 'علبة' then 'BOX' when 'مجموعة' then 'SET' else null end,
  case i.unit_ar when 'طن' then 'Tonne' when 'لتر' then 'Litre' when 'قطعة' then 'Piece' when 'وحدة' then 'Unit'
    when 'متر طولي' then 'Linear metre' when 'متر مربع' then 'Square metre' when 'متر مكعب' then 'Cubic metre'
    when 'كم' then 'Kilometre' when 'علبة' then 'Can' when 'مجموعة' then 'Set' else null end,
  i.unit_ar,
  (i.it = 'spare_part'), (i.it = 'machine'), (i.it = 'product'), (i.it = 'raw_material'),
  timestamptz '2026-07-20 06:15:00+03', timestamptz '2026-07-20 06:15:00+03',
  jsonb_build_object('demo_synthetic', true, 'plant_number', i.pn, 'registry_section',
    case i.it when 'product' then 'end_products' when 'raw_material' then 'raw_materials'
              when 'machine' then 'machines' when 'spare_part' then 'spare_parts' else 'production_lines' end),
  'senaei', timestamptz '2026-07-20 06:15:00+03', timestamptz '2026-07-20 06:15:00+03'
from items i
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 6 — factory_documents (4 per factory)
-- The dossier keeps rows whose industrial_license_id IS NULL or equals the
-- selected licence, so the CR document is deliberately licence-neutral.
-- doc_type stays inside the app canon: license | cr | safety_cert | layout.
-- ---------------------------------------------------------------------
with base as (
  select f.id fid, f.factory_code code, f.legal_name ln, f.license_status ls,
         f.license_issue_date li, f.license_expiry_date le,
         il.id lid, il.license_number lnum, il.plant_number pn,
         cr.id crid, cr.cr_number crnum, cr.issue_date cri, cr.expiry_date cre
  from factories f
  join industrial_licenses il on il.factory_id = f.id
  join commercial_registrations cr on cr.id = il.commercial_registration_id
  where f.factory_code like 'F-%'
),
docs as (
  select b.*, 1 ord, 'license'::text dt, 'industrial_license'::text bc,
         'الرخصة الصناعية — '||b.ln nm, b.lnum ref, b.li vf, b.le vt, b.lid ilid,
         'senaei'::text ss, b.ls::text st from base b
  union all
  select b.*, 2, 'cr', 'commercial_registration', 'السجل التجاري — '||b.ln, b.crnum, b.cri, b.cre, null, 'senaei', 'active' from base b
  union all
  select b.*, 3, 'safety_cert', 'civil_defense_safety_certificate', 'شهادة السلامة الصادرة من المديرية العامة للدفاع المدني',
         'CD-'||b.pn||'-2025', date '2025-09-01', date '2026-08-31', b.lid, 'inspection_platform', 'valid' from base b
  union all
  select b.*, 4, 'layout', 'plant_layout', 'المخطط التنظيمي المعتمد لموقع المصنع',
         'LYT-'||b.pn||'-R3', date '2024-02-15', null, b.lid, 'inspection_platform', 'approved' from base b
)
insert into factory_documents (id, factory_id, doc_type, title, reference_no, valid_from, valid_to,
  storage_path, uploaded_by, created_at, industrial_license_id, business_category, source_system,
  external_document_id, source_status, provenance)
select md5('f360|doc|'||d.code||'|'||d.ord)::uuid, d.fid, d.dt, d.nm, d.ref, d.vf, d.vt,
  'factory-360/'||d.code||'/'||d.dt||'-'||d.ord||'.pdf',
  'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid, timestamptz '2026-07-20 06:15:00+03',
  d.ilid, d.bc, d.ss, 'DOC-'||d.pn||'-'||lpad(d.ord::text,3,'0'), d.st,
  jsonb_build_object('demo_synthetic', true, 'captured_from', d.ss, 'plant_number', d.pn,
                     'retrieved_at', '2026-07-20T06:15:00+03:00')
from docs d
where not exists (select 1 from factory_documents x where x.factory_id = d.fid and x.doc_type = d.dt and x.reference_no = d.ref)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 7 — factory_representatives (3 per factory)
-- ---------------------------------------------------------------------
with nm as (
  select * from (values
   (0,'عبدالعزيز بن سعد الحمدان'),(1,'ماجد بن تركي العتيبي'),(2,'سلمان بن عبدالله الغامدي'),
   (3,'نايف بن مشعل القحطاني'),(4,'أحمد بن يوسف الزهراني'),(5,'هند بنت عبدالرحمن الشمري'),
   (6,'وليد بن فهد الدوسري'),(7,'خالد بن ناصر المطيري'),(8,'ريم بنت سلطان العنزي'),
   (9,'فيصل بن حمد البقمي'),(10,'طلال بن عايض الشهري'),(11,'منيرة بنت إبراهيم الرشيد')
  ) as v(i,n)
),
roles as (
  select * from (values
   (1,'مدير المصنع','plant_manager',true),
   (2,'مسؤول السلامة والصحة المهنية','hse_officer',false),
   (3,'مدير ضبط الجودة','quality_manager',false)
  ) as v(ord, role_ar, role_key, prim)
)
insert into factory_representatives (id, factory_id, full_name, role_title, phone, email, is_primary, active, created_at)
select md5('f360|rep|'||f.factory_code||'|'||r.ord)::uuid, f.id, nm.n, r.role_ar,
  '+9665'||lpad(((('x'||substr(md5(f.factory_code||r.role_key||'ph'),1,7))::bit(28)::int) % 100000000)::text,8,'0'),
  lower(replace(f.factory_code,'-',''))||'.'||r.role_key||'@saqeel-demo.sa',
  r.prim, true, timestamptz '2026-07-20 06:15:00+03'
from factories f
cross join roles r
join nm on nm.i = ((('x'||substr(md5(f.factory_code||r.role_key),1,7))::bit(28)::int) % 12)
where f.factory_code like 'F-%'
  and not exists (select 1 from factory_representatives x where x.factory_id = f.id and x.role_title = r.role_ar)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 8 — factory_government_records (5 per factory)
-- The loader reads .eq(industrial_license_id, licenseId) and then drops
-- rows whose status is pending | returned | rejected | draft, so every row
-- here carries a licence id and a live status.
-- Append-only table: ON CONFLICT on the natural key, never an UPDATE.
-- ---------------------------------------------------------------------
with base as (
  select f.id fid, f.factory_code code, f.legal_name ln, f.employees_total et, f.employees_saudi es,
         f.region reg, il.id lid, il.plant_number pn, cr.cr_number crnum, cr.unified_number un
  from factories f join industrial_licenses il on il.factory_id=f.id
  join commercial_registrations cr on cr.id=il.commercial_registration_id
  where f.factory_code like 'F-%'
),
recs as (
  select b.*, 1 ord, 'environmental_permit'::text rt, 'active'::text st,
    'تصريح بيئي للتشغيل — المركز الوطني للرقابة على الالتزام البيئي'::text ti,
    date '2025-01-15' vf, date '2028-01-14' vt, 'ncec'::text auth,
    jsonb_build_object('permit_class','الفئة الثانية','issuing_authority','المركز الوطني للرقابة على الالتزام البيئي',
      'monitoring_frequency','ربع سنوي','emission_registry_no','ENV-'||b.pn) att from base b
  union all
  select b.*, 2, 'civil_defense_licence', 'issued', 'رخصة السلامة الوقائية — المديرية العامة للدفاع المدني',
    date '2025-09-01', date '2026-08-31', 'gdcd',
    jsonb_build_object('issuing_authority','المديرية العامة للدفاع المدني','risk_class','منشأة صناعية عالية الخطورة',
      'fire_system','شبكة رشاشات أوتوماتيكية ومضخات حريق','last_drill','2026-05-18') from base b
  union all
  select b.*, 3, 'saudization_certificate', 'compliant', 'شهادة الالتزام بنطاقات — وزارة الموارد البشرية والتنمية الاجتماعية',
    date '2026-01-01', date '2026-12-31', 'mhrsd',
    jsonb_build_object('issuing_authority','وزارة الموارد البشرية والتنمية الاجتماعية','nitaqat_band','النطاق الأخضر المتوسط',
      'employees_total',b.et,'employees_saudi',b.es,
      'saudization_rate', round((b.es::numeric / nullif(b.et,0)) * 100, 1)) from base b
  union all
  select b.*, 4, 'zatca_vat_registration', 'active', 'شهادة التسجيل في ضريبة القيمة المضافة — هيئة الزكاة والضريبة والجمارك',
    date '2019-01-01', null, 'zatca',
    jsonb_build_object('issuing_authority','هيئة الزكاة والضريبة والجمارك','vat_number','3'||b.un||'03',
      'filing_cycle','شهري','unified_number',b.un) from base b
  union all
  select b.*, 5, 'gosi_compliance', 'valid', 'شهادة الالتزام — المؤسسة العامة للتأمينات الاجتماعية',
    date '2026-04-01', date '2026-09-30', 'gosi',
    jsonb_build_object('issuing_authority','المؤسسة العامة للتأمينات الاجتماعية','establishment_no','GOSI-'||b.pn,
      'registered_contributors',b.et,'status_note','لا توجد مستحقات متأخرة') from base b
)
insert into factory_government_records (id, factory_id, industrial_license_id, record_type, external_record_id,
  version_number, status, title, valid_from, valid_to, status_history, documents_metadata, attributes,
  source_system, recorded_at)
select md5('f360|gov|'||r.code||'|'||r.ord)::uuid, r.fid, r.lid, r.rt,
  upper(r.auth)||'-'||r.pn||'-'||lpad(r.ord::text,2,'0'), 1, r.st, r.ti, r.vf, r.vt,
  jsonb_build_array(
    jsonb_build_object('status','submitted','at', (r.vf - 21)::text, 'actor', r.auth),
    jsonb_build_object('status', r.st, 'at', r.vf::text, 'actor', r.auth)),
  jsonb_build_array(jsonb_build_object(
    'title', r.ti, 'reference', upper(r.auth)||'-'||r.pn||'-'||lpad(r.ord::text,2,'0'),
    'mime_type','application/pdf','issued_at', r.vf::text, 'source_system', r.auth)),
  r.att || jsonb_build_object('demo_synthetic', true, 'cr_number', r.crnum, 'plant_number', r.pn),
  r.auth, timestamptz '2026-07-20 06:15:00+03'
from recs r
on conflict (source_system, record_type, external_record_id, version_number) do nothing;


-- ---------------------------------------------------------------------
-- Section 9 — factory_media_assets: official / profile imagery
-- The check constraint requires evidence_id, inspection_id and violation_id
-- to be NULL for these two categories.
-- NOTE: the gallery only paints a tile once storage resolves a signed URL
-- from the `evidence` bucket; these rows are metadata only.
-- ---------------------------------------------------------------------
with base as (
  select f.id fid, f.factory_code code, f.legal_name ln, il.id lid, il.plant_number pn
  from factories f join industrial_licenses il on il.factory_id=f.id where f.factory_code like 'F-%'
),
m as (
  select b.*, 1 ord, 'official_factory_image'::text cat, 'صورة المنشأة المعتمدة في السجل الصناعي — '::text pre from base b
  union all
  select b.*, 2, 'factory_profile_image', 'صورة الواجهة الرئيسية للمصنع — ' from base b
)
insert into factory_media_assets (id, factory_id, industrial_license_id, category, evidence_id, inspection_id,
  violation_id, storage_path, title, mime_type, source_system, captured_at, created_at)
select md5('f360|media|'||m.code||'|'||m.ord)::uuid, m.fid, m.lid, m.cat, null, null, null,
  'factory-360/'||m.code||'/media/'||m.cat||'-'||m.ord||'.jpg',
  m.pre||m.ln, 'image/jpeg', 'senaei',
  timestamptz '2026-06-12 09:30:00+03', timestamptz '2026-07-20 06:15:00+03'
from m
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 10 — evidence: arrival proof (one per factory that has a visit)
-- evidence_link target must be a visit or an inspection; arrival evidence
-- hangs off the visit. storage_path is globally unique.
-- ---------------------------------------------------------------------
with arr as (
  select distinct on (f.id) f.id fid, f.factory_code code, v.id vid, v.window_start ws, f.official_lat la, f.official_lng lo
  from factories f join visits v on v.factory_id = f.id
  where f.factory_code like 'F-%' order by f.id, v.window_start nulls last, v.id
)
insert into evidence (id, inspection_id, evidence_type, linked_type, linked_id, storage_path, captured_at,
  captured_lat, captured_lng, content_sha256, captured_by, synced_at, visit_id, evidence_note, geo_accuracy_m, geo_source)
select md5('f360|evd|arrival|'||a.code)::uuid, null, 'photo', 'arrival'::evidence_link, a.vid,
  'factory-360/'||a.code||'/evidence/arrival-01.jpg',
  coalesce(a.ws, timestamptz '2026-06-12 08:05:00+03'),
  a.la, a.lo, encode(sha256(('f360-arrival-'||a.code)::bytea),'hex'),
  'c2ae5022-91a8-4014-8643-d436d2b3e640'::uuid,
  coalesce(a.ws, timestamptz '2026-06-12 08:05:00+03') + interval '12 minutes', a.vid,
  'إثبات وصول عند البوابة الرئيسية للمصنع — بيانات تجريبية', 8.5, 'gps'
from arr a
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 11 — evidence: inspection + violation proof on approved reports
-- guard_submitted_inspection() only fires on UPDATE/DELETE, so INSERT
-- against an approved inspection is permitted.
-- ---------------------------------------------------------------------
with ins as (
  select f.id fid, f.factory_code code, f.official_lat la, f.official_lng lo, i.id iid, v.id vid, v.window_start ws,
         (select vi.id from violations vi where vi.inspection_id=i.id and vi.invalidated_at is null order by vi.id limit 1) viid,
         row_number() over (partition by f.id order by i.id) rn
  from factories f join visits v on v.factory_id=f.id join inspections i on i.visit_id=v.id
  where f.factory_code like 'F-%' and i.status='approved'
),
e as (
  select i.*, 1 ord, 'inspection'::text kind, 'صورة توثيقية لخط الإنتاج أثناء الجولة التفتيشية — بيانات تجريبية'::text note from ins i
  union all
  select i.*, 2, 'violation', 'صورة توثيقية للمخالفة المرصودة أثناء الجولة التفتيشية — بيانات تجريبية' from ins i where i.viid is not null
)
insert into evidence (id, inspection_id, evidence_type, linked_type, linked_id, storage_path, captured_at,
  captured_lat, captured_lng, content_sha256, captured_by, synced_at, visit_id, evidence_note, geo_accuracy_m, geo_source)
select md5('f360|evd|'||e.kind||'|'||e.code||'|'||e.rn)::uuid, e.iid, 'photo',
  (case e.kind when 'violation' then 'finding' else 'inspection' end)::evidence_link,
  coalesce(case when e.kind='violation' then e.viid end, e.iid),
  'factory-360/'||e.code||'/evidence/'||e.kind||'-'||lpad(e.rn::text,2,'0')||'.jpg',
  coalesce(e.ws, timestamptz '2026-06-12 09:00:00+03') + (e.ord || ' hours')::interval,
  e.la, e.lo, encode(sha256(('f360-'||e.kind||'-'||e.code||'-'||e.rn)::bytea),'hex'),
  'c2ae5022-91a8-4014-8643-d436d2b3e640'::uuid,
  coalesce(e.ws, timestamptz '2026-06-12 09:00:00+03') + (e.ord || ' hours')::interval + interval '20 minutes',
  e.vid, e.note, 6.2, 'gps'
from e
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 12 — factory_media_assets: linked inspection/arrival/violation
-- Category shape rules (check constraint factory_media_assets_check1):
--   inspection_evidence -> evidence_id + inspection_id, violation_id NULL
--   arrival_evidence    -> evidence_id, violation_id NULL
--   violation_evidence  -> evidence_id + inspection_id + violation_id
-- evidence_id carries a unique index, hence the NOT EXISTS guard.
-- ---------------------------------------------------------------------
insert into factory_media_assets (id, factory_id, industrial_license_id, category, evidence_id, inspection_id,
  violation_id, storage_path, title, mime_type, source_system, captured_at, created_at)
select md5('f360|media-evd|'||e.id::text)::uuid, f.id, il.id,
  case when e.linked_type = 'arrival' then 'arrival_evidence'
       when e.linked_type = 'finding' then 'violation_evidence'
       else 'inspection_evidence' end,
  e.id,
  case when e.linked_type = 'arrival' then null else e.inspection_id end,
  case when e.linked_type = 'finding' then e.linked_id else null end,
  e.storage_path,
  case when e.linked_type = 'arrival' then 'دليل الوصول — '||f.legal_name
       when e.linked_type = 'finding' then 'دليل المخالفة — '||f.legal_name
       else 'دليل الجولة التفتيشية — '||f.legal_name end,
  'image/jpeg', 'inspection_platform', e.captured_at, timestamptz '2026-07-20 06:15:00+03'
from evidence e
join visits v on v.id = e.visit_id
join factories f on f.id = v.factory_id
join industrial_licenses il on il.factory_id = f.id
where f.factory_code like 'F-%'
  and e.storage_path like 'factory-360/%'
  and not exists (select 1 from factory_media_assets x where x.evidence_id = e.id)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 13 — inspection_factory_checks
-- Field canon = FACTORY_FIELD_EN in apps/web/src/lib/factory-verification.ts.
-- Observations only; factories is never written back to (M04-112).
-- A deterministic minority of workforce fields land as 'updated' so the
-- change counter on the report is non-zero.
-- ---------------------------------------------------------------------
with ins as (
  select f.*, i.id iid, i.submitted_at, il.license_number lnum, cr.cr_number crnum
  from factories f join visits v on v.factory_id=f.id join inspections i on i.visit_id=v.id
  join industrial_licenses il on il.factory_id=f.id
  join commercial_registrations cr on cr.id=il.commercial_registration_id
  where f.factory_code like 'F-%' and i.status='approved'
),
fk as (
  select n.k, n.ord from (values
    ('name',1),('cr_number',2),('license_number',3),('activity_class',4),('region',5),('city',6),
    ('employees_total',7),('employees_saudi',8),('capital_invested',9),('production_capacity_note',10)
  ) as n(k,ord)
),
cells as (
  select i.iid, i.factory_code code, f.k, f.ord,
    case f.k when 'name' then i.name when 'cr_number' then i.crnum when 'license_number' then i.lnum
      when 'activity_class' then i.activity_class when 'region' then i.region when 'city' then i.city
      when 'employees_total' then i.employees_total::text when 'employees_saudi' then i.employees_saudi::text
      when 'capital_invested' then trim(to_char(i.capital_invested,'FM9999999999999'))
      else i.production_capacity_note end as src,
    ((('x'||substr(md5(i.iid::text||f.k),1,7))::bit(28)::int) % 100) as roll,
    i.employees_total et, i.employees_saudi es
  from ins i cross join fk f
)
insert into inspection_factory_checks (id, inspection_id, field_key, source_value, observed_value, status,
  evidence_note, updated_by, created_at, updated_at)
select md5('f360|ifc|'||c.iid::text||'|'||c.k)::uuid, c.iid, c.k, c.src,
  case
    when c.k = 'employees_total' and c.roll < 40 then (c.et + ((c.roll % 17) + 3))::text
    when c.k = 'employees_saudi' and c.roll < 30 then (c.es + ((c.roll % 9) + 1))::text
    else c.src end,
  case
    when c.k = 'employees_total' and c.roll < 40 then 'updated'
    when c.k = 'employees_saudi' and c.roll < 30 then 'updated'
    else 'verified' end,
  case
    when c.k = 'employees_total' and c.roll < 40 then 'تم التحقق من كشف الرواتب الشهري في مكتب الموارد البشرية — العدد الفعلي يختلف عن سجل المصدر'
    when c.k = 'employees_saudi' and c.roll < 30 then 'تم التحقق من شهادة التأمينات الاجتماعية — عدد الموظفين السعوديين محدّث'
    else 'مطابق لسجل المصدر — تم التحقق ميدانياً أثناء الجولة' end,
  'c2ae5022-91a8-4014-8643-d436d2b3e640'::uuid,
  timestamptz '2026-06-12 11:00:00+03', timestamptz '2026-06-12 11:00:00+03'
from cells c
where c.src is not null
on conflict (inspection_id, field_key) do nothing;


-- ---------------------------------------------------------------------
-- Section 14 — inspection_factory_snapshots
-- The dossier resolves the observed-vs-source table via
--   .eq(factory_id).eq(industrial_license_id)  then keeps only the rows
--   whose submission_version belongs to an APPROVED report.
-- Approved submissions are ordered first so every approved report that
-- lacked a governed snapshot gets one; the remainder tops the set up to 60.
-- Append-only table (trg_f360_immutable_inspection_factory_snapshots).
-- ---------------------------------------------------------------------
with cand as (
  select sv.id svid, sv.submitted_at, sv.version_number, i.status istatus,
         f.id fid, f.factory_code code, f.name fname, f.region, f.city, f.official_lat, f.official_lng,
         f.license_status, f.source_synced_at,
         il.id lid, il.license_number lnum, il.plant_number pn,
         cr.id crid, cr.cr_number crnum, cr.unified_number un,
         row_number() over (order by case when i.status='approved' then 0 else 1 end, sv.submitted_at desc nulls last, sv.id) rn
  from factories f
  join visits v on v.factory_id=f.id
  join inspections i on i.visit_id=v.id
  join submission_versions sv on sv.inspection_id=i.id
  join industrial_licenses il on il.factory_id=f.id
  join commercial_registrations cr on cr.id=il.commercial_registration_id
  where f.factory_code like 'F-%'
    and not exists (select 1 from inspection_factory_snapshots s where s.submission_version_id = sv.id)
),
picked as (select * from cand where rn <= 60),
built as (
  select p.*, jsonb_build_object(
      'factory_code', p.code, 'factory_name', p.fname, 'cr_number', p.crnum, 'unified_number', p.un,
      'industrial_license_number', p.lnum, 'plant_number', p.pn, 'license_status', p.license_status,
      'region', p.region, 'city', p.city,
      'official_lat', p.official_lat, 'official_lng', p.official_lng,
      'source_system', 'senaei', 'source_synced_at', to_char(p.source_synced_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'inspection_observation', 'لقطة حوكمة لبيانات المصنع عند اعتماد التقرير — بيانات تجريبية',
      'demo_synthetic', true) as snap
  from picked p
)
insert into inspection_factory_snapshots (id, submission_version_id, factory_id, commercial_registration_id,
  industrial_license_id, snapshot, snapshot_sha256, captured_at)
select md5('f360|ifs|'||b.svid::text)::uuid, b.svid, b.fid, b.crid, b.lid, b.snap,
  encode(sha256(b.snap::text::bytea),'hex'),
  coalesce(b.submitted_at, timestamptz '2026-06-12 15:00:00+03')
from built b
on conflict (submission_version_id) do nothing;


-- ---------------------------------------------------------------------
-- Section 15 — senaei_sync_runs (OUT-OF-PARTITION, unavoidable)
-- factory_import_batches.sync_run_id is NOT NULL with a FK to this table,
-- so staged import batches cannot exist without a parent run. Twelve runs
-- are created here for that sole purpose; nothing else is touched.
-- ---------------------------------------------------------------------
insert into senaei_sync_runs (id, connection_id, mode, status, correlation_id, contract_version, requested_by,
  source_file_name, source_file_sha256, rows_received, rows_accepted, rows_rejected, started_at, completed_at, created_at)
select md5('f360|syncrun|'||b)::uuid, null, 'csv_import',
  case when b <= 6 then 'completed' when b <= 9 then 'partial' when b = 10 then 'running'
       when b = 11 then 'partial' else 'failed' end,
  md5('f360|corr|'||b)::uuid, 'senaei-factory-master-v3',
  'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid,
  'senaei_factory_master_'||to_char(date '2026-02-02' + (b * 14), 'YYYY-MM-DD')||'.csv',
  encode(sha256(('f360-batch-'||b)::bytea),'hex'),
  12, case when b = 12 then 0 when b = 10 then 6 else 10 end,
      case when b = 12 then 0 when b = 10 then 1 else 2 end,
  (timestamptz '2026-02-02 07:00:00+03' + (b || ' weeks')::interval * 2),
  (timestamptz '2026-02-02 07:00:00+03' + (b || ' weeks')::interval * 2) + interval '11 minutes',
  (timestamptz '2026-02-02 07:00:00+03' + (b || ' weeks')::interval * 2)
from generate_series(1,12) b
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 16 — factory_import_batches (12)
-- ---------------------------------------------------------------------
insert into factory_import_batches (id, sync_run_id, file_name, file_sha256, schema_version, status,
  uploaded_by, uploaded_at, completed_at)
select md5('f360|batch|'||b)::uuid, md5('f360|syncrun|'||b)::uuid,
  'senaei_factory_master_'||to_char(date '2026-02-02' + (b * 14), 'YYYY-MM-DD')||'.csv',
  encode(sha256(('f360-batch-'||b)::bytea),'hex'), 'senaei-factory-master-v3',
  case when b <= 6 then 'imported' when b <= 9 then 'partial' when b = 10 then 'validating'
       when b = 11 then 'rejected' else 'failed' end,
  'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid,
  (timestamptz '2026-02-02 07:00:00+03' + (b || ' weeks')::interval * 2),
  case when b = 10 then null else (timestamptz '2026-02-02 07:00:00+03' + (b || ' weeks')::interval * 2) + interval '11 minutes' end
from generate_series(1,12) b
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Section 17 — factory_import_rows (12 per batch, 144 total)
-- Two rows per batch are rejected with real safe_error_codes so
-- /admin/integrations/factory-data has a populated rejected-rows panel.
-- Rejected payloads carry the defect that produced the code (a truncated
-- CR number, an unparseable expiry date).
-- ---------------------------------------------------------------------
with fx as (
  select f.factory_code, f.name, f.legal_name, f.region, f.city, f.activity_class,
         il.license_number, il.plant_number, cr.cr_number, cr.unified_number,
         row_number() over (order by f.factory_code) - 1 idx
  from factories f join industrial_licenses il on il.factory_id=f.id
  join commercial_registrations cr on cr.id=il.commercial_registration_id
  where f.factory_code like 'F-%'
),
grid as (
  select b, r, ((b - 1) * 12 + (r - 1)) % 24 as idx,
    case when r % 6 = 0 then 'rejected'
         when b = 10 and r > 6 then 'pending'
         when b <= 6 then 'reconciled'
         when b = 12 then 'pending'
         else 'accepted' end as st
  from generate_series(1,12) b cross join generate_series(1,12) r
)
insert into factory_import_rows (id, batch_id, row_number, raw_values, status, safe_error_codes, raw_snapshot_id, reconciled_at)
select md5('f360|row|'||g.b||'|'||g.r)::uuid, md5('f360|batch|'||g.b)::uuid, g.r,
  jsonb_build_object(
    'factory_code', fx.factory_code, 'plant_number', fx.plant_number,
    'commercial_registration_number', case when g.st = 'rejected' and g.r = 6 then left(fx.cr_number, 6) else fx.cr_number end,
    'unified_number', fx.unified_number, 'industrial_license_number', fx.license_number,
    'legal_name_ar', fx.legal_name, 'trade_name_en', fx.name,
    'region', fx.region, 'city', fx.city, 'activity_class', fx.activity_class,
    'license_expiry_date', case when g.st = 'rejected' and g.r = 12 then '31/13/2027' else '2029-03-11' end,
    'source_row_hash', substr(md5('f360|row|'||g.b||'|'||g.r), 1, 16)),
  g.st,
  case when g.st = 'rejected' and g.r = 6 then array['CR_NUMBER_LENGTH_INVALID','CROSS_FIELD_UNIFIED_NUMBER_MISMATCH']
       when g.st = 'rejected' then array['LICENSE_EXPIRY_DATE_UNPARSEABLE']
       else array[]::text[] end,
  null,
  case when g.st = 'reconciled'
       then (timestamptz '2026-02-02 07:00:00+03' + (g.b || ' weeks')::interval * 2) + interval '9 minutes' end
from grid g join fx on fx.idx = g.idx
on conflict (batch_id, row_number) do nothing;


-- ---------------------------------------------------------------------
-- Section 18 — factory_document_download_receipts
-- Two receipts per factory (licence + CR) proving governed access.
-- Rows without a storage_path are skipped: the column is NOT NULL here.
-- ---------------------------------------------------------------------
with d as (
  select distinct on (fd.factory_id, fd.doc_type)
         fd.id did, fd.factory_id fid, fd.storage_path sp, fd.doc_type, f.factory_code code
  from factory_documents fd join factories f on f.id = fd.factory_id
  where f.factory_code like 'F-%' and fd.doc_type in ('license','cr') and fd.storage_path is not null
  order by fd.factory_id, fd.doc_type, fd.created_at desc
),
a as (select * from (values
  (1,'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid,'inspection_preparation_pack'),
  (2,'3e1d3b7d-8856-40cb-ab07-5e9e624e6329'::uuid,'review_evidence_verification')
 ) as v(k, actor, purpose))
insert into factory_document_download_receipts (id, document_id, factory_id, actor, storage_path, purpose,
  correlation_id, requested_at)
select md5('f360|dlr|'||d.code||'|'||d.doc_type||'|'||a.k)::uuid, d.did, d.fid, a.actor, d.sp, a.purpose,
  md5('f360|dlrcorr|'||d.code||'|'||d.doc_type||'|'||a.k)::uuid,
  timestamptz '2026-06-10 08:40:00+03' + ((a.k * 37) || ' minutes')::interval
from d cross join a
on conflict (id) do nothing;


-- =====================================================================
-- KNOWN GAPS (structural, not data defects)
-- =====================================================================
-- 1. "No chemical permits found for this plant." and "No customs exemptions
--    found for this plant." CANNOT be cleared by seeding. Those two panels
--    are live Senaei REST calls, not database reads:
--      GET /api/v3/inspection/plants/{plant_number}/chemical-permits
--      GET /api/v3/inspection/plants/{plant_number}/customs-exemptions
--    (apps/web/src/lib/integrations/senaei/adapters/factory360.ts).
--    Every licence now carries a plant_number, so the panels no longer show
--    "no plant number"; with SENAEI_* env unset they render the degraded
--    state instead.
-- 2. Linked inspection/arrival/violation evidence is absent for F-4402,
--    F-5502, F-6601 and F-6602 — those four factories have no visits, and
--    visits/inspections are outside this partition.
-- 3. The observed-vs-source snapshot panel needs an APPROVED inspection.
--    Only 11 of the 24 factories have one. The other 13 keep the empty
--    state until an approved report exists for them.
-- =====================================================================
