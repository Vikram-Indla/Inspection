-- =====================================================================
-- 03-compliance.sql — SYNTHETIC NON-PRODUCTION DEMO DATA
-- =====================================================================
-- Partition: compliance library + maker-checker approvals + review
--            collaboration.
--
-- This file contains SYNTHETIC DEMO DATA ONLY. It is not production
-- data, it is not a governed regulatory source, and none of the
-- regulation codes, clause references, violation codes, penalty bands
-- or approval decisions in it may be relied on as real Ministry of
-- Industry and Mineral Resources content. It exists so that demo and
-- staging environments render populated screens instead of empty
-- states.
--
-- Target: staging project iiozvqntawxfwbgffzqu
-- Applied: 2026-07-27
--
-- Properties:
--   * Every insert is idempotent — deterministic md5-derived UUIDs with
--     ON CONFLICT DO NOTHING or NOT EXISTS guards. Re-running is a
--     no-op.
--   * No existing row is dropped, truncated, updated or deleted, with
--     one exception: regulations created by THIS file are moved from
--     'draft' to 'published'/'review' after their child rows are
--     inserted, because guard_regulation_child_write() only permits
--     clause/attachment writes while the parent regulation is a draft.
--   * Nothing outside the compliance partition is written directly.
--     Rows in audit_events / audit_semantic_events are trigger
--     side-effects.
--
-- Run order: sections are dependency-ordered; run the file top to
-- bottom in a single session.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. compliance_lookup_values — governed dropdown catalogues
-- ---------------------------------------------------------------------
insert into compliance_lookup_values (id, lookup_type_key, code, label_en, label_ar, active, effective_from, display_order, version_number, created_by, created_at)
select md5('sqd:lookup:'||v.lookup_type_key||':'||v.code)::uuid, v.lookup_type_key, v.code, v.label_en, v.label_ar, true, date '2026-01-01', v.display_order, 1,
       'f9067e24-99f7-40e7-8421-4717de9ca2db'::uuid, timestamptz '2026-06-28 07:00:00+03'
from (values
 ('competent_departments','DEP-SAFETY','Industrial Safety Department','إدارة السلامة الصناعية',10),
 ('competent_departments','DEP-ENV','Environmental Compliance Department','إدارة الامتثال البيئي',20),
 ('competent_departments','DEP-LIC','Industrial Licensing Department','إدارة التراخيص الصناعية',30),
 ('competent_departments','DEP-QUAL','Quality and Standards Department','إدارة الجودة والمواصفات',40),
 ('competent_departments','DEP-ENF','Enforcement and Penalties Department','إدارة الإنفاذ والعقوبات',50),
 ('competent_departments','DEP-INSP','Inspection Operations Department','إدارة عمليات التفتيش',60),
 ('document_types','DOC-LICENSE','Industrial licence','رخصة صناعية',10),
 ('document_types','DOC-CR','Commercial registration','سجل تجاري',20),
 ('document_types','DOC-CIVIL-DEFENCE','Civil Defence certificate','شهادة الدفاع المدني',30),
 ('document_types','DOC-ENV-PERMIT','Environmental permit','تصريح بيئي',40),
 ('document_types','DOC-CALIBRATION','Calibration certificate','شهادة معايرة',50),
 ('document_types','DOC-TRAINING','Training record','سجل تدريب',60),
 ('document_types','DOC-MSDS','Material safety data sheet','صحيفة بيانات سلامة المادة',70),
 ('document_types','DOC-MAINT-LOG','Maintenance log','سجل الصيانة',80),
 ('issuing_authorities','AUTH-MIM','Ministry of Industry and Mineral Resources','وزارة الصناعة والثروة المعدنية',10),
 ('issuing_authorities','AUTH-SASO','Saudi Standards, Metrology and Quality Organization','الهيئة السعودية للمواصفات والمقاييس والجودة',20),
 ('issuing_authorities','AUTH-HCIS','High Commission for Industrial Security','الهيئة العليا للأمن الصناعي',30),
 ('issuing_authorities','AUTH-NCEC','National Center for Environmental Compliance','المركز الوطني للرقابة على الالتزام البيئي',40),
 ('issuing_authorities','AUTH-MHRSD','Ministry of Human Resources and Social Development','وزارة الموارد البشرية والتنمية الاجتماعية',50),
 ('issuing_authorities','AUTH-SFDA','Saudi Food and Drug Authority','الهيئة العامة للغذاء والدواء',60),
 ('issuing_authorities','AUTH-SBC','Saudi Building Code National Committee','اللجنة الوطنية لكود البناء السعودي',70),
 ('inspection_sections','SEC-FIRE','Fire safety','السلامة من الحريق',10),
 ('inspection_sections','SEC-ELEC','Electrical safety','السلامة الكهربائية',20),
 ('inspection_sections','SEC-MECH','Mechanical and machinery','المعدات والآلات',30),
 ('inspection_sections','SEC-CHEM','Chemicals and hazardous materials','المواد الكيميائية والخطرة',40),
 ('inspection_sections','SEC-ENV','Environment and emissions','البيئة والانبعاثات',50),
 ('inspection_sections','SEC-LABOR','Labour and welfare','العمالة والرعاية',60),
 ('inspection_sections','SEC-DOCS','Licences and documentation','التراخيص والوثائق',70),
 ('report_types','RPT-ROUTINE','Routine inspection report','تقرير تفتيش دوري',10),
 ('report_types','RPT-FOLLOWUP','Follow-up inspection report','تقرير تفتيش متابعة',20),
 ('report_types','RPT-COMPLAINT','Complaint-driven inspection report','تقرير تفتيش بلاغ',30),
 ('report_types','RPT-EMERGENCY','Emergency inspection report','تقرير تفتيش طارئ',40),
 ('report_types','RPT-LICENSING','Licensing verification report','تقرير التحقق من الترخيص',50),
 ('response_types','RT-SINGLE','Single select','اختيار واحد',10),
 ('response_types','RT-MULTI','Multi select','اختيار متعدد',20),
 ('response_types','RT-NUMERIC','Numeric value','قيمة رقمية',30),
 ('response_types','RT-DATE','Date value','قيمة تاريخ',40),
 ('response_types','RT-TEXT','Free text','نص حر',50),
 ('response_types','RT-BOOLEAN','Yes / No','نعم / لا',60),
 ('response_values','RV-COMPLIANT','Compliant','مطابق',10),
 ('response_values','RV-NON-COMPLIANT','Non-compliant','غير مطابق',20),
 ('response_values','RV-PARTIAL','Partially compliant','مطابق جزئياً',30),
 ('response_values','RV-NA','Not applicable','لا ينطبق',40),
 ('response_values','RV-NEEDS-REVIEW','Needs review','يحتاج مراجعة',50),
 ('response_evaluation_mappings','REM-COMPLIANT','Maps to compliant outcome','يُقيَّم مطابقاً',10),
 ('response_evaluation_mappings','REM-NON-COMPLIANT','Maps to non-compliant outcome','يُقيَّم غير مطابق',20),
 ('response_evaluation_mappings','REM-EXCLUDED','Excluded from scoring','مستبعد من الاحتساب',30),
 ('response_evaluation_mappings','REM-REVIEW','Escalated to reviewer','يُحال إلى المراجع',40),
 ('severity','SEV-L1','Critical','حرجة',10),
 ('severity','SEV-L2','Major','كبيرة',20),
 ('severity','SEV-L3','Moderate','متوسطة',30),
 ('severity','SEV-L4','Minor','بسيطة',40),
 ('grace_period_types','GP-CALENDAR-DAYS','Calendar days','أيام تقويمية',10),
 ('grace_period_types','GP-WORKING-DAYS','Working days','أيام عمل',20),
 ('grace_period_types','GP-MONTHS','Months','أشهر',30),
 ('grace_period_types','GP-IMMEDIATE','Immediate correction','تصحيح فوري',40),
 ('penalty_types','PT-WARNING','Written warning','إنذار كتابي',10),
 ('penalty_types','PT-CORRECTIVE-ORDER','Corrective action order','أمر إجراء تصحيحي',20),
 ('penalty_types','PT-FINE','Financial fine','غرامة مالية',30),
 ('penalty_types','PT-SUSPENSION','Partial activity suspension','إيقاف جزئي للنشاط',40),
 ('penalty_types','PT-CLOSURE','Facility closure','إغلاق المنشأة',50),
 ('penalty_types','PT-LICENCE-REVOCATION','Industrial licence revocation','سحب الرخصة الصناعية',60),
 ('evidence_types','EV-PHOTO','Photograph','صورة',10),
 ('evidence_types','EV-VIDEO','Video','مقطع مرئي',20),
 ('evidence_types','EV-DOCUMENT','Document','وثيقة',30),
 ('evidence_types','EV-COMMENT','Inspector comment','ملاحظة المفتش',40),
 ('action_form_references','AF-CORRECTIVE','Corrective action form','نموذج إجراء تصحيحي',10),
 ('action_form_references','AF-BLOCKING','Blocking corrective form','نموذج إجراء تصحيحي مانع',20),
 ('action_form_references','AF-NOTICE','Violation notice form','نموذج إشعار مخالفة',30),
 ('action_form_references','AF-SEIZURE','Seizure and impound form','نموذج ضبط وحجز',40),
 ('governed_reason','GR-RETURN-EVIDENCE','Returned — evidence insufficient','مُعاد — الأدلة غير كافية',10),
 ('governed_reason','GR-RETURN-SCOPE','Returned — scope needs clarification','مُعاد — يلزم توضيح النطاق',20),
 ('governed_reason','GR-REJECT-DUPLICATE','Rejected — duplicate of a governed record','مرفوض — تكرار لسجل محكوم',30),
 ('governed_reason','GR-REJECT-OUT-OF-SCOPE','Rejected — outside regulatory scope','مرفوض — خارج النطاق التنظيمي',40),
 ('governed_reason','GR-DEACTIVATE-SUPERSEDED','Deactivated — superseded by a newer version','مُعطَّل — استُبدل بإصدار أحدث',50),
 ('governed_reason','GR-DEACTIVATE-REPEALED','Deactivated — instrument repealed','مُعطَّل — أُلغيت الأداة النظامية',60)
) as v(lookup_type_key, code, label_en, label_ar, display_order)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2. regulations — inserted as DRAFT so that clause/attachment child
--    writes pass guard_regulation_child_write(); published in step 5.
-- ---------------------------------------------------------------------
insert into regulations (id, code, title, issuing_authority, status, created_at, created_by, approved_by, published_at, effective_from, version_label)
select md5('sqd:reg:'||r.code)::uuid, r.code, r.title, r.authority, 'draft'::config_status,
       timestamptz '2026-06-28 08:00:00+03' + (r.ord||' hours')::interval,
       r.creator::uuid, null, null, r.eff, r.ver
from (values
 ('MIM-IS-101','Industrial Licensing and Registration Regulation — نظام التراخيص والتسجيل الصناعي','Ministry of Industry and Mineral Resources','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2025-01-01','v3',1),
 ('MIM-IS-102','Industrial Occupational Safety Regulation — نظام السلامة المهنية الصناعية','Ministry of Industry and Mineral Resources','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2025-03-01','v2',2),
 ('MIM-IS-103','Hazardous Chemicals Handling and Storage Rules — قواعد تداول وتخزين المواد الكيميائية الخطرة','Ministry of Industry and Mineral Resources','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2025-05-15','v2',3),
 ('MIM-IS-104','Industrial Waste Management Regulation — نظام إدارة النفايات الصناعية','Ministry of Industry and Mineral Resources','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2024-11-01','v4',4),
 ('MIM-IS-105','Machinery Guarding and Preventive Maintenance Rules — قواعد تحصين الآلات والصيانة الوقائية','Ministry of Industry and Mineral Resources','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2025-02-01','v1',5),
 ('MIM-IS-106','Pressure Vessels and Steam Boilers Regulation — نظام أوعية الضغط والمراجل البخارية','Ministry of Industry and Mineral Resources','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2024-09-01','v3',6),
 ('MIM-IS-107','Industrial Electrical Installations Rules — قواعد التمديدات الكهربائية الصناعية','Ministry of Industry and Mineral Resources','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2025-06-01','v1',7),
 ('MIM-IS-108','Worker Accommodation and Welfare Standards — معايير سكن العمال والرعاية','Ministry of Industry and Mineral Resources','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2025-04-01','v2',8),
 ('MIM-IS-109','Industrial Metering and Utility Consumption Reporting — قياس ورفع تقارير استهلاك المرافق الصناعية','Ministry of Industry and Mineral Resources','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2026-01-01','v1',9),
 ('SASO-TR-201','Technical Regulation for Low Voltage Electrical Equipment — اللائحة الفنية للمعدات الكهربائية منخفضة الجهد','Saudi Standards, Metrology and Quality Organization','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2024-07-01','v5',10),
 ('SASO-TR-202','Energy Efficiency Labelling Technical Regulation — اللائحة الفنية لبطاقة كفاءة الطاقة','Saudi Standards, Metrology and Quality Organization','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2025-01-15','v2',11),
 ('SASO-TR-203','SALEEM Product Safety Programme Requirements — متطلبات برنامج سليم لسلامة المنتجات','Saudi Standards, Metrology and Quality Organization','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2025-09-01','v1',12),
 ('SBC-401','Mechanical Code — Industrial Ventilation — الكود الميكانيكي: التهوية الصناعية','Saudi Building Code National Committee','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2024-01-01','v2',13),
 ('SBC-601','Energy Conservation Code — Industrial Facilities — كود ترشيد الطاقة للمنشآت الصناعية','Saudi Building Code National Committee','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2024-06-01','v2',14),
 ('HCIS-SEC-01','Physical Security and Fire Protection Directives — تعليمات الأمن المادي والحماية من الحريق','High Commission for Industrial Security','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2025-02-15','v3',15),
 ('HCIS-SEC-02','Emergency Preparedness and Response Directives — تعليمات الاستعداد والاستجابة للطوارئ','High Commission for Industrial Security','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2025-07-01','v1',16),
 ('NCEC-EN-301','Ambient Air Emissions Standard — معيار الانبعاثات في الهواء المحيط','National Center for Environmental Compliance','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2024-10-01','v3',17),
 ('NCEC-EN-302','Industrial Wastewater Discharge Standard — معيار تصريف مياه الصرف الصناعي','National Center for Environmental Compliance','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',date '2025-03-15','v2',18),
 ('MHRSD-LB-401','Occupational Health Requirements in Workplaces — متطلبات الصحة المهنية في بيئة العمل','Ministry of Human Resources and Social Development','8b78fc11-1e3b-4a22-973e-29fbb5099906',date '2024-12-01','v2',19),
 ('SFDA-FD-501','Food Manufacturing Hygiene Requirements — متطلبات الاشتراطات الصحية لمصانع الأغذية','Saudi Food and Drug Authority','f19bd875-ac08-452c-8067-c27416ecd8a4',date '2025-05-01','v4',20)
) as r(code, title, authority, creator, eff, ver, ord)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. regulation_clauses — NOT EXISTS guard (not ON CONFLICT): the
--    BEFORE INSERT guard trigger fires before conflict resolution.
-- ---------------------------------------------------------------------
insert into regulation_clauses (id, regulation_id, clause_ref, title, applicability, legal_source)
select md5('sqd:clause:'||c.reg||':'||c.ref)::uuid, md5('sqd:reg:'||c.reg)::uuid, c.ref, c.title, c.appl, c.src
from (values
 ('MIM-IS-101','2.1','Licence validity and on-site display','All licensed industrial facilities — جميع المنشآت الصناعية المرخصة','Royal Decree M/17 art. 4 — المرسوم الملكي م/17 المادة 4'),
 ('MIM-IS-101','3.4','Notification of change of industrial activity','Facilities changing activity or capacity — المنشآت المغيّرة للنشاط أو الطاقة','Ministerial Resolution 1442/318 — القرار الوزاري 1442/318'),
 ('MIM-IS-101','5.2','Annual industrial survey submission','All licensed facilities — جميع المنشآت المرخصة','Ministerial Resolution 1443/104 — القرار الوزاري 1443/104'),
 ('MIM-IS-102','3.1','Provision and use of personal protective equipment','All production areas — جميع مناطق الإنتاج','Royal Decree M/51 art. 121 — المرسوم الملكي م/51 المادة 121'),
 ('MIM-IS-102','4.5','Safety committee and incident register','Facilities with 50+ workers — المنشآت التي بها 50 عاملاً فأكثر','Ministerial Resolution 1435/4499 — القرار الوزاري 1435/4499'),
 ('MIM-IS-102','6.2','Confined space entry permit system','Facilities with confined spaces — المنشآت ذات الأماكن المحصورة','MIM Safety Guide 2024 §6 — دليل السلامة الصناعية 2024 البند 6'),
 ('MIM-IS-103','2.3','Chemical inventory and MSDS availability','Facilities storing regulated chemicals — المنشآت المخزّنة لمواد كيميائية منظمة','GHS/SASO 2902 — المواصفة السعودية 2902'),
 ('MIM-IS-103','4.1','Segregation of incompatible hazard classes','Chemical warehouses — مستودعات المواد الكيميائية','HCIS Directive SEC-04 — تعليمات الأمن الصناعي SEC-04'),
 ('MIM-IS-103','6.4','Secondary containment for bulk liquid storage','Bulk tanks above 1,000 L — الخزانات التي تتجاوز 1000 لتر','NCEC Standard EN-11 — معيار المركز الوطني EN-11'),
 ('MIM-IS-104','3.2','Waste classification and transfer manifest','All waste-generating facilities — جميع المنشآت المولّدة للنفايات','Environmental Law M/165 art. 22 — نظام البيئة م/165 المادة 22'),
 ('MIM-IS-104','5.1','Disposal through a licensed contractor','Hazardous waste generators — مولّدو النفايات الخطرة','NCEC Waste Regulation 2023 — لائحة النفايات 2023'),
 ('MIM-IS-104','7.3','On-site temporary storage duration limits','All facilities — جميع المنشآت','NCEC Waste Regulation 2023 §7 — لائحة النفايات 2023 البند 7'),
 ('MIM-IS-105','2.2','Guarding of rotating and moving parts','All machinery areas — جميع مناطق الآلات','Royal Decree M/51 art. 122 — المرسوم الملكي م/51 المادة 122'),
 ('MIM-IS-105','4.3','Lockout–tagout procedure during maintenance','Maintenance operations — أعمال الصيانة','MIM Safety Guide 2024 §9 — دليل السلامة الصناعية 2024 البند 9'),
 ('MIM-IS-105','6.1','Documented preventive maintenance schedule','All production machinery — جميع آلات الإنتاج','MIM Safety Guide 2024 §11 — دليل السلامة الصناعية 2024 البند 11'),
 ('MIM-IS-106','3.3','Statutory periodic pressure vessel inspection','Facilities operating pressure vessels — المنشآت المشغّلة لأوعية الضغط','SASO ASME BPVC adoption — اعتماد كود المراجل ASME'),
 ('MIM-IS-106','5.4','Safety relief valve certification and setting','Pressure systems — أنظمة الضغط','SASO ASME BPVC §VIII — كود المراجل القسم الثامن'),
 ('MIM-IS-106','7.1','Boiler operator competency certification','Steam boiler facilities — منشآت المراجل البخارية','Ministerial Resolution 1440/2260 — القرار الوزاري 1440/2260'),
 ('MIM-IS-107','2.4','Earthing and bonding continuity verification','All electrical installations — جميع التمديدات الكهربائية','SBC-401 §12 — كود البناء السعودي 401 البند 12'),
 ('MIM-IS-107','4.2','Distribution board labelling and clear access','All distribution boards — جميع لوحات التوزيع','SBC-401 §14 — كود البناء السعودي 401 البند 14'),
 ('MIM-IS-107','6.3','Portable appliance testing records','Facilities using portable equipment — المنشآت المستخدمة لمعدات متنقلة','SASO IEC 60364 — المواصفة السعودية IEC 60364'),
 ('MIM-IS-108','3.1','Accommodation occupancy density limits','Facilities providing worker housing — المنشآت التي توفّر سكناً للعمال','MHRSD Resolution 1439/70273 — قرار الموارد البشرية 1439/70273'),
 ('MIM-IS-108','4.4','Potable water supply and sanitation facilities','Worker accommodation — سكن العمال','MHRSD Resolution 1439/70273 §4 — القرار 1439/70273 البند 4'),
 ('MIM-IS-108','5.3','Worker transport vehicle safety','Facilities transporting workers — المنشآت الناقلة للعمال','Traffic Law M/85 art. 61 — نظام المرور م/85 المادة 61'),
 ('MIM-IS-109','2.1','Sub-metering of major energy loads','Facilities above 5 MW connected load — المنشآت التي تتجاوز 5 ميجاواط','MIM Circular 1447/12 — تعميم الوزارة 1447/12'),
 ('MIM-IS-109','3.2','Monthly utility consumption reporting','All licensed facilities — جميع المنشآت المرخصة','MIM Circular 1447/12 §3 — تعميم الوزارة 1447/12 البند 3'),
 ('MIM-IS-109','4.1','Meter calibration certificates on file','Metered facilities — المنشآت المزوّدة بعدادات','SASO Metrology Regulation — لائحة المقاييس السعودية'),
 ('SASO-TR-201','3.2','Validity of the conformity certificate','Low voltage equipment producers — منتجو المعدات منخفضة الجهد','SASO Technical Regulation 2019/01 — اللائحة الفنية 2019/01'),
 ('SASO-TR-201','5.1','SASO quality mark applied to product','Regulated product lines — خطوط المنتجات المنظمة','SASO Technical Regulation 2019/01 §5 — اللائحة الفنية البند 5'),
 ('SASO-TR-201','6.3','Retention of the technical file','All regulated producers — جميع المنتجين المنظمين','SASO Technical Regulation 2019/01 §6 — اللائحة الفنية البند 6'),
 ('SASO-TR-202','2.2','Energy efficiency label present and legible','Appliance manufacturers — مصنّعو الأجهزة','SASO 2663 — المواصفة السعودية 2663'),
 ('SASO-TR-202','3.5','Verification of declared performance','Appliance manufacturers — مصنّعو الأجهزة','SASO 2663 §3 — المواصفة السعودية 2663 البند 3'),
 ('SASO-TR-202','4.2','Retail display and packaging requirements','Distribution and retail — التوزيع والتجزئة','SASO 2663 §4 — المواصفة السعودية 2663 البند 4'),
 ('SASO-TR-203','2.1','SALEEM platform product registration','Consumer product manufacturers — مصنّعو المنتجات الاستهلاكية','SALEEM Programme Rules 2021 — قواعد برنامج سليم 2021'),
 ('SASO-TR-203','3.3','Batch traceability records','Consumer product manufacturers — مصنّعو المنتجات الاستهلاكية','SALEEM Programme Rules 2021 §3 — قواعد سليم البند 3'),
 ('SASO-TR-203','5.2','Documented non-conforming product recall plan','Consumer product manufacturers — مصنّعو المنتجات الاستهلاكية','SALEEM Programme Rules 2021 §5 — قواعد سليم البند 5'),
 ('SBC-401','4.1','Local exhaust ventilation capacity','Process areas emitting fumes — مناطق التشغيل المنبعث منها أبخرة','SBC-401 §4 — كود البناء السعودي 401 البند 4'),
 ('SBC-401','5.3','Make-up air provision','Mechanically ventilated areas — المناطق ذات التهوية الميكانيكية','SBC-401 §5 — كود البناء السعودي 401 البند 5'),
 ('SBC-401','6.2','Duct fire damper integrity','Ducted systems crossing fire barriers — المجاري العابرة لحواجز الحريق','SBC-801 §6 — كود البناء السعودي 801 البند 6'),
 ('SBC-601','3.1','Thermal insulation of process piping','Heated or chilled process lines — خطوط التشغيل الساخنة أو المبردة','SBC-601 §3 — كود البناء السعودي 601 البند 3'),
 ('SBC-601','4.4','Lighting power density limits','All occupied areas — جميع المناطق المشغولة','SBC-601 §4 — كود البناء السعودي 601 البند 4'),
 ('SBC-601','5.2','Retention of energy audit records','Facilities above 3 GWh/year — المنشآت التي تتجاوز 3 جيجاواط ساعة سنوياً','SEEC Regulation 2022 — لائحة كفاءة الطاقة 2022'),
 ('HCIS-SEC-01','2.2','Perimeter protection and access control','Class A and B industrial sites — المواقع الصناعية فئة أ وب','HCIS Directive SEC-01 — تعليمات الأمن الصناعي SEC-01'),
 ('HCIS-SEC-01','4.1','Fire detection and alarm coverage','All occupied buildings — جميع المباني المشغولة','HCIS Directive SEC-01 §4 — تعليمات SEC-01 البند 4'),
 ('HCIS-SEC-01','5.5','Fire water supply adequacy and pump readiness','Facilities with fixed fire systems — المنشآت ذات أنظمة إطفاء ثابتة','HCIS Directive SEC-01 §5 — تعليمات SEC-01 البند 5'),
 ('HCIS-SEC-02','3.1','Emergency response plan currency and approval','All industrial facilities — جميع المنشآت الصناعية','HCIS Directive SEC-02 — تعليمات الأمن الصناعي SEC-02'),
 ('HCIS-SEC-02','4.2','Evacuation drill frequency and records','All industrial facilities — جميع المنشآت الصناعية','HCIS Directive SEC-02 §4 — تعليمات SEC-02 البند 4'),
 ('HCIS-SEC-02','6.1','Emergency lighting and exit signage','All occupied buildings — جميع المباني المشغولة','SBC-801 §10 — كود البناء السعودي 801 البند 10'),
 ('NCEC-EN-301','2.3','Stack emission monitoring programme','Facilities with point-source stacks — المنشآت ذات المداخن','Environmental Law M/165 art. 15 — نظام البيئة م/165 المادة 15'),
 ('NCEC-EN-301','4.1','Compliance with ambient emission limits','All emitting facilities — جميع المنشآت الباعثة','NCEC Air Standard 2023 — معيار الهواء 2023'),
 ('NCEC-EN-301','5.2','Retention of continuous monitoring data','Facilities with CEMS — المنشآت ذات أنظمة المراقبة المستمرة','NCEC Air Standard 2023 §5 — معيار الهواء 2023 البند 5'),
 ('NCEC-EN-302','3.2','Discharge permit conditions observed','Facilities discharging effluent — المنشآت المصرّفة للمياه','Environmental Law M/165 art. 18 — نظام البيئة م/165 المادة 18'),
 ('NCEC-EN-302','4.3','Effluent sampling frequency','Facilities discharging effluent — المنشآت المصرّفة للمياه','NCEC Water Standard 2024 — معيار المياه 2024'),
 ('NCEC-EN-302','6.1','Pre-treatment unit operation and logs','Facilities with pre-treatment — المنشآت ذات وحدات المعالجة الأولية','NCEC Water Standard 2024 §6 — معيار المياه 2024 البند 6'),
 ('MHRSD-LB-401','2.1','Pre-placement and periodic occupational health examinations','Workers in hazardous roles — العاملون في المهن الخطرة','Labour Law M/51 art. 141 — نظام العمل م/51 المادة 141'),
 ('MHRSD-LB-401','3.4','Noise exposure assessment and controls','High-noise production areas — مناطق الإنتاج عالية الضجيج','MHRSD Occupational Health Guide — دليل الصحة المهنية'),
 ('MHRSD-LB-401','5.1','First aid provision and trained first aiders','All facilities — جميع المنشآت','Labour Law M/51 art. 142 — نظام العمل م/51 المادة 142'),
 ('SFDA-FD-501','2.2','Personnel hygiene and valid health cards','Food handling staff — العاملون في تداول الأغذية','SFDA Food Law M/1 art. 9 — نظام الغذاء م/1 المادة 9'),
 ('SFDA-FD-501','4.1','Cold chain temperature control and records','Chilled and frozen production — الإنتاج المبرد والمجمد','SFDA GMP Guide 2023 — دليل التصنيع الجيد 2023'),
 ('SFDA-FD-501','6.3','Documented pest control programme','All food premises — جميع منشآت الأغذية','SFDA GMP Guide 2023 §6 — دليل التصنيع الجيد 2023 البند 6')
) as c(reg, ref, title, appl, src)
where not exists (select 1 from regulation_clauses x where x.id = md5('sqd:clause:'||c.reg||':'||c.ref)::uuid);

-- ---------------------------------------------------------------------
-- 4. regulation_attachments — also gated on the parent being a draft.
-- ---------------------------------------------------------------------
insert into regulation_attachments (id, regulation_id, file_name, storage_path, media_type, sha256, uploaded_by, created_at)
select md5('sqd:regatt:'||a.reg||':'||a.kind)::uuid, md5('sqd:reg:'||a.reg)::uuid,
       a.reg||'-'||a.kind||'.pdf', 'compliance/regulations/'||lower(a.reg)||'/'||a.kind||'.pdf', 'application/pdf',
       encode(digest('sqd:regatt:'||a.reg||':'||a.kind,'sha256'),'hex'),
       a.uploader::uuid, timestamptz '2026-06-29 09:30:00+03' + (a.ord||' hours')::interval
from (values
 ('MIM-IS-101','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',1),
 ('MIM-IS-101','implementing-guide','8b78fc11-1e3b-4a22-973e-29fbb5099906',2),
 ('MIM-IS-102','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',3),
 ('MIM-IS-102','inspection-checklist','f19bd875-ac08-452c-8067-c27416ecd8a4',4),
 ('MIM-IS-103','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',5),
 ('MIM-IS-104','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',6),
 ('MIM-IS-105','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',7),
 ('MIM-IS-106','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',8),
 ('MIM-IS-107','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',9),
 ('MIM-IS-108','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',10),
 ('MIM-IS-109','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',11),
 ('SASO-TR-201','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',12),
 ('SASO-TR-201','conformity-annex','8b78fc11-1e3b-4a22-973e-29fbb5099906',13),
 ('SASO-TR-202','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',14),
 ('SASO-TR-203','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',15),
 ('SBC-401','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',16),
 ('SBC-601','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',17),
 ('HCIS-SEC-01','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',18),
 ('HCIS-SEC-02','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',19),
 ('NCEC-EN-301','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',20),
 ('NCEC-EN-301','sampling-annex','f19bd875-ac08-452c-8067-c27416ecd8a4',21),
 ('NCEC-EN-302','official-text','3839f674-54c9-4ea9-bdf9-970ea6fe9b16',22),
 ('MHRSD-LB-401','official-text','8b78fc11-1e3b-4a22-973e-29fbb5099906',23),
 ('SFDA-FD-501','official-text','f19bd875-ac08-452c-8067-c27416ecd8a4',24)
) as a(reg, kind, uploader, ord)
where not exists (select 1 from regulation_attachments x where x.id = md5('sqd:regatt:'||a.reg||':'||a.kind)::uuid);

-- ---------------------------------------------------------------------
-- 5. Move the regulations created above out of draft. Idempotent: the
--    predicate only matches rows still in draft.
-- ---------------------------------------------------------------------
update regulations r set status='published'::config_status,
  approved_by='7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid,
  published_at = r.created_at + interval '3 days'
where r.status='draft'::config_status
  and r.code in ('MIM-IS-101','MIM-IS-102','MIM-IS-103','MIM-IS-104','MIM-IS-105','MIM-IS-106','MIM-IS-107','MIM-IS-108','SASO-TR-201','SASO-TR-202','SBC-401','SBC-601','HCIS-SEC-01','HCIS-SEC-02','NCEC-EN-301','NCEC-EN-302','MHRSD-LB-401','SFDA-FD-501');

update regulations r set status='review'::config_status
where r.status='draft'::config_status and r.code in ('MIM-IS-109','SASO-TR-203');

-- ---------------------------------------------------------------------
-- 6. inspection_items — validate_inspection_item_authoring() requires an
--    object response_model with a responses array; scoring stays enabled
--    so score_weight is permitted.
-- ---------------------------------------------------------------------
insert into inspection_items (id, code, title, clause_id, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, active, configuration_version)
select md5('sqd:item:'||i.code)::uuid, i.code, i.title, md5('sqd:clause:'||i.reg||':'||i.ref)::uuid,
  jsonb_build_object(
    'responses', jsonb_build_array('compliant','non_compliant','na'),
    'scoring_enabled', true,
    'score_excluded_on', jsonb_build_array('na'),
    'mapping', jsonb_build_object('non_compliant', jsonb_build_object('result','Non-Compliant','violation', i.vcode))),
  jsonb_build_object('on','non_compliant','type', i.ev, 'min', 1, 'mandatory', true),
  i.w, array['na']::text[], i.gen, i.gar, true, 1
from (values
 ('LIC-201','Industrial licence valid and displayed on site','MIM-IS-101','2.1','V-LIC-01','document',5,'Confirm the licence is current and displayed at the main entrance.','تأكد من سريان الرخصة وعرضها عند المدخل الرئيسي.'),
 ('LIC-205','Annual industrial survey submitted for the current year','MIM-IS-101','5.2','V-LIC-05','document',3,'Verify the acknowledgement receipt for the annual survey.','تحقق من إشعار استلام المسح الصناعي السنوي.'),
 ('OSH-301','Personal protective equipment issued and worn in production areas','MIM-IS-102','3.1','V-OSH-01','photo',8,'Observe PPE use across at least three production zones.','لاحظ استخدام معدات الوقاية في ثلاث مناطق إنتاج على الأقل.'),
 ('OSH-305','Safety committee minutes and incident register current','MIM-IS-102','4.5','V-OSH-05','document',5,'Check the last two committee meetings and the incident log.','راجع آخر اجتماعين للجنة السلامة وسجل الحوادث.'),
 ('OSH-312','Confined space entry permits issued and closed out','MIM-IS-102','6.2','V-OSH-12','document',6,'Sample three permits from the last quarter.','اختر ثلاثة تصاريح من الربع الأخير للفحص.'),
 ('CHM-401','Chemical inventory matches materials stored on site','MIM-IS-103','2.3','V-CHM-01','document',6,'Reconcile the register against the warehouse walk-through.','طابق السجل مع الجولة الميدانية في المستودع.'),
 ('CHM-404','Incompatible chemicals segregated by hazard class','MIM-IS-103','4.1','V-CHM-04','photo',9,'Verify separation distances and barriers between classes.','تحقق من مسافات الفصل والحواجز بين الأصناف.'),
 ('CHM-409','Secondary containment intact for bulk liquid tanks','MIM-IS-103','6.4','V-CHM-09','photo',8,'Inspect bunds for cracks, standing water and drain valve state.','افحص الأحواض من التشققات وتجمع المياه وحالة صمام التصريف.'),
 ('WST-501','Waste classified and transfer manifests retained','MIM-IS-104','3.2','V-WST-01','document',5,'Match manifests to the waste classification register.','طابق بيانات النقل مع سجل تصنيف النفايات.'),
 ('WST-506','Waste disposal contractor licence valid','MIM-IS-104','5.1','V-WST-06','document',4,'Confirm the contractor licence covers the waste streams handled.','تأكد أن رخصة المقاول تغطي أنواع النفايات المتداولة.'),
 ('MCH-601','Machine guards fitted on rotating and moving parts','MIM-IS-105','2.2','V-MCH-01','photo',9,'Check guarding on every accessible drive and nip point.','افحص التحصين على كل نقطة إدارة أو قرص متاحة.'),
 ('MCH-604','Lockout–tagout applied during maintenance activity','MIM-IS-105','4.3','V-MCH-04','photo',7,'Observe an active maintenance task or review recent permits.','راقب عملية صيانة قائمة أو راجع التصاريح الأخيرة.'),
 ('MCH-609','Preventive maintenance schedule executed as planned','MIM-IS-105','6.1','V-MCH-09','document',4,'Compare planned against completed maintenance orders.','قارن أوامر الصيانة المخططة بالمنفذة.'),
 ('PRV-701','Pressure vessel statutory inspection certificate valid','MIM-IS-106','3.3','V-PRV-01','document',9,'Check certificate dates against the vessel nameplate.','طابق تواريخ الشهادة مع لوحة بيانات الوعاء.'),
 ('PRV-705','Safety relief valves certified, set and sealed','MIM-IS-106','5.4','V-PRV-05','photo',8,'Verify seal integrity and the set pressure tag.','تحقق من سلامة الختم وبطاقة ضغط الضبط.'),
 ('PRV-709','Boiler operator competency certificates valid','MIM-IS-106','7.1','V-PRV-09','document',6,'Check certificates for all operators on the current shift.','راجع شهادات جميع المشغلين في الوردية الحالية.'),
 ('ELE-801','Earthing and bonding continuity results within limits','MIM-IS-107','2.4','V-ELE-01','document',7,'Review the latest earth continuity test report.','راجع أحدث تقرير لاختبار استمرارية التأريض.'),
 ('ELE-804','Distribution boards labelled with clear working space','MIM-IS-107','4.2','V-ELE-04','photo',6,'Confirm labelling and the required clearance in front of boards.','تأكد من الترميز ومساحة العمل أمام اللوحات.'),
 ('WLF-901','Worker accommodation occupancy within density limit','MIM-IS-108','3.1','V-WLF-01','photo',5,'Count beds per room against the permitted density.','احسب عدد الأسرّة في الغرفة مقابل الكثافة المسموحة.'),
 ('WLF-904','Potable water supply and sanitation facilities adequate','MIM-IS-108','4.4','V-WLF-04','photo',6,'Check water quality certificate and sanitary unit ratio.','راجع شهادة جودة المياه ونسبة الوحدات الصحية.'),
 ('UTL-950','Monthly utility consumption report submitted','MIM-IS-109','3.2','V-UTL-50','document',3,'Verify submission receipts for the last three months.','تحقق من إشعارات الرفع لآخر ثلاثة أشهر.'),
 ('CNF-110','Conformity certificate valid for the produced line','SASO-TR-201','3.2','V-CNF-10','document',7,'Match certificate scope to the products in production.','طابق نطاق الشهادة مع المنتجات قيد التصنيع.'),
 ('CNF-114','SASO quality mark applied to finished goods','SASO-TR-201','5.1','V-CNF-14','photo',5,'Inspect the mark on finished stock in the despatch area.','افحص العلامة على المنتج النهائي في منطقة الشحن.'),
 ('ENL-120','Energy efficiency label present and legible','SASO-TR-202','2.2','V-ENL-20','photo',4,'Check label placement and legibility on packaged units.','تحقق من موضع البطاقة ووضوحها على الوحدات المعبأة.'),
 ('TRC-130','Batch traceability records complete for sampled lots','SASO-TR-203','3.3','V-TRC-30','document',5,'Trace two lots from raw material to despatch.','تتبع دفعتين من المادة الخام حتى الشحن.'),
 ('VNT-140','Local exhaust ventilation operating at design flow','SBC-401','4.1','V-VNT-40','document',7,'Compare measured face velocity to the design record.','قارن السرعة المقاسة بسجل التصميم.'),
 ('ENR-150','Energy audit report available for the reporting period','SBC-601','5.2','V-ENR-50','document',3,'Confirm the audit covers the current reporting year.','تأكد أن التدقيق يغطي سنة التقرير الحالية.'),
 ('SEC-160','Fire detection coverage complete and functionally tested','HCIS-SEC-01','4.1','V-SEC-60','photo',9,'Verify detector coverage and the last functional test record.','تحقق من تغطية الكواشف وسجل آخر اختبار وظيفي.'),
 ('SEC-165','Fire water supply level and pump readiness verified','HCIS-SEC-01','5.5','V-SEC-65','photo',9,'Check tank level, pump auto-start and the churn test log.','افحص منسوب الخزان وبدء المضخة الآلي وسجل اختبار الدوران.'),
 ('SEC-172','Evacuation drill conducted within the required interval','HCIS-SEC-02','4.2','V-SEC-72','document',6,'Review the drill report and attendance record.','راجع تقرير الإخلاء وسجل الحضور.'),
 ('EMS-180','Stack emission monitoring records complete','NCEC-EN-301','2.3','V-EMS-80','document',7,'Check monitoring frequency and reported values against limits.','راجع تكرار المراقبة والقيم المسجلة مقابل الحدود.'),
 ('EFF-190','Effluent sampling performed at the required frequency','NCEC-EN-302','4.3','V-EFF-90','document',6,'Compare sampling dates to the permit condition.','قارن تواريخ العينات باشتراط التصريح.'),
 ('OHE-210','Occupational health examinations up to date','MHRSD-LB-401','2.1','V-OHE-10','document',6,'Sample five workers in hazardous roles.','اختر خمسة عاملين في مهن خطرة للفحص.'),
 ('OHE-215','First aid kits stocked and trained first aiders on shift','MHRSD-LB-401','5.1','V-OHE-15','photo',5,'Check kit contents, expiry dates and the first aider roster.','افحص محتويات الحقيبة وتواريخ الصلاحية وكشف المسعفين.'),
 ('FDH-220','Cold chain temperature logs within specified limits','SFDA-FD-501','4.1','V-FDH-20','document',8,'Review 30 days of chiller and freezer temperature logs.','راجع سجلات حرارة المبردات والمجمدات لثلاثين يوماً.')
) as i(code, title, reg, ref, vcode, ev, w, gen, gar)
where not exists (select 1 from inspection_items x where x.id = md5('sqd:item:'||i.code)::uuid);

-- ---------------------------------------------------------------------
-- 7. inspection_item_versions — configuration snapshots for the items
--    created above.
-- ---------------------------------------------------------------------
insert into inspection_item_versions (item_id, configuration_version, snapshot, recorded_at, recorded_by)
select i.id, i.configuration_version, to_jsonb(i), timestamptz '2026-06-30 10:00:00+03', '8b78fc11-1e3b-4a22-973e-29fbb5099906'::uuid
from inspection_items i
where i.id in (select md5('sqd:item:'||c)::uuid from unnest(array['LIC-201','LIC-205','OSH-301','OSH-305','OSH-312','CHM-401','CHM-404','CHM-409','WST-501','WST-506','MCH-601','MCH-604','MCH-609','PRV-701','PRV-705','PRV-709','ELE-801','ELE-804','WLF-901','WLF-904','UTL-950','CNF-110','CNF-114','ENL-120','TRC-130','VNT-140','ENR-150','SEC-160','SEC-165','SEC-172','EMS-180','EFF-190','OHE-210','OHE-215','FDH-220']) c)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 8. violation_codes — one per new inspection item, triggered by the
--    non_compliant response. Grace / action-form fields satisfy
--    violation_grace_fields and violation_action_form_fields.
-- ---------------------------------------------------------------------
insert into violation_codes (id, code, title, level, clause_id, inspection_item_id, trigger_response, active_from, status, configuration_version,
  category, applicability, description, corrective_action, corrective_action_required, grace_period_required, grace_period_type, grace_period_value,
  action_form_required, action_form_reference, notify_entity, created_by, approved_by, published_at)
select md5('sqd:vc:'||v.code)::uuid, v.code, v.title, v.lvl, i.clause_id, i.id, 'non_compliant', date '2026-01-01', 'published'::config_status, 1,
  v.cat, 'Licensed industrial facilities — المنشآت الصناعية المرخصة', v.descr,
  v.corr, true, v.gd > 0, case when v.gd > 0 then 'GP-CALENDAR-DAYS' else null end, case when v.gd > 0 then v.gd::numeric else null end,
  v.lvl = 'L1', case when v.lvl = 'L1' then 'AF-BLOCKING' else null end, true,
  'cfc5a737-6ffb-46af-a6ac-5c08d7979401'::uuid, '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid, timestamptz '2026-06-30 12:00:00+03'
from (values
 ('V-LIC-01','LIC-201','L2','Industrial licence expired or not displayed','Licences and documentation','عدم سريان الرخصة الصناعية أو عدم عرضها في الموقع','Renew or display the valid industrial licence',15),
 ('V-LIC-05','LIC-205','L3','Annual industrial survey not submitted','Licences and documentation','عدم تقديم المسح الصناعي السنوي','Submit the annual industrial survey through the ministry portal',30),
 ('V-OSH-01','OSH-301','L1','Personal protective equipment not provided or not used','Labour and welfare','عدم توفير معدات الوقاية الشخصية أو عدم استخدامها','Provide compliant PPE and enforce its use immediately',0),
 ('V-OSH-05','OSH-305','L3','Safety committee or incident register not maintained','Labour and welfare','عدم إنشاء لجنة السلامة أو عدم تحديث سجل الحوادث','Constitute the safety committee and bring the incident register up to date',30),
 ('V-OSH-12','OSH-312','L1','Confined space entry without a valid permit','Labour and welfare','الدخول إلى الأماكن المحصورة دون تصريح ساري','Stop confined space work and implement the permit system',0),
 ('V-CHM-01','CHM-401','L2','Chemical inventory incomplete or MSDS missing','Chemicals and hazardous materials','نقص في حصر المواد الكيميائية أو غياب صحائف بيانات السلامة','Complete the chemical register and file the MSDS for every substance',20),
 ('V-CHM-04','CHM-404','L1','Incompatible chemicals stored without segregation','Chemicals and hazardous materials','تخزين مواد كيميائية غير متوافقة دون فصل','Re-segregate stored chemicals by hazard class immediately',0),
 ('V-CHM-09','CHM-409','L1','Secondary containment missing or breached','Chemicals and hazardous materials','غياب أو تلف الحوض الاحتوائي الثانوي','Restore secondary containment before resuming bulk storage',7),
 ('V-WST-01','WST-501','L2','Waste not classified or manifests not retained','Environment and emissions','عدم تصنيف النفايات أو عدم حفظ بيانات النقل','Classify all waste streams and retain transfer manifests',20),
 ('V-WST-06','WST-506','L2','Waste disposed through an unlicensed contractor','Environment and emissions','التخلص من النفايات عبر مقاول غير مرخص','Contract a licensed disposal provider and retain the licence copy',20),
 ('V-MCH-01','MCH-601','L1','Rotating or moving parts left unguarded','Mechanical and machinery','ترك الأجزاء الدوارة أو المتحركة دون تحصين','Fit compliant guards before the machine is returned to service',0),
 ('V-MCH-04','MCH-604','L1','Maintenance performed without lockout–tagout','Mechanical and machinery','تنفيذ الصيانة دون تطبيق نظام العزل والوسم','Apply the lockout–tagout procedure for all maintenance work',0),
 ('V-MCH-09','MCH-609','L3','Preventive maintenance schedule not executed','Mechanical and machinery','عدم تنفيذ خطة الصيانة الوقائية','Execute overdue maintenance orders and record completion',45),
 ('V-PRV-01','PRV-701','L1','Pressure vessel operated without a valid inspection certificate','Mechanical and machinery','تشغيل وعاء ضغط دون شهادة فحص سارية','Withdraw the vessel from service until it is re-certified',0),
 ('V-PRV-05','PRV-705','L1','Safety relief valve uncertified, mis-set or bypassed','Mechanical and machinery','صمام تنفيس غير معتمد أو مضبوط بشكل خاطئ أو معطّل','Re-certify and reseal the relief valve at the design set pressure',7),
 ('V-PRV-09','PRV-709','L2','Boiler operated by an uncertified operator','Mechanical and machinery','تشغيل المرجل بواسطة مشغل غير مؤهل','Assign a certified operator and enrol staff in the competency programme',15),
 ('V-ELE-01','ELE-801','L2','Earthing continuity outside the accepted limit','Electrical safety','قيم استمرارية التأريض خارج الحدود المقبولة','Repair the earthing system and re-test continuity',15),
 ('V-ELE-04','ELE-804','L3','Distribution board unlabelled or access obstructed','Electrical safety','لوحة توزيع غير مرمّزة أو الوصول إليها معاق','Label the board and clear the required working space',15),
 ('V-WLF-01','WLF-901','L2','Accommodation occupancy exceeds the permitted density','Labour and welfare','تجاوز الكثافة المسموحة في سكن العمال','Reduce occupancy to the permitted density',30),
 ('V-WLF-04','WLF-904','L2','Potable water or sanitation provision inadequate','Labour and welfare','عدم كفاية مياه الشرب أو المرافق الصحية','Restore potable water supply and sanitary units to the required ratio',20),
 ('V-UTL-50','UTL-950','L3','Monthly utility consumption report not submitted','Licences and documentation','عدم رفع تقرير استهلاك المرافق الشهري','Submit the outstanding consumption reports',30),
 ('V-CNF-10','CNF-110','L2','Conformity certificate expired or out of scope','Licences and documentation','انتهاء صلاحية شهادة المطابقة أو خروجها عن النطاق','Obtain a valid conformity certificate covering the produced line',20),
 ('V-CNF-14','CNF-114','L2','Quality mark not applied to finished goods','Licences and documentation','عدم وضع علامة الجودة على المنتج النهائي','Apply the quality mark to all released finished goods',20),
 ('V-ENL-20','ENL-120','L3','Energy efficiency label missing or illegible','Licences and documentation','غياب بطاقة كفاءة الطاقة أو عدم وضوحها','Apply a compliant and legible energy efficiency label',30),
 ('V-TRC-30','TRC-130','L2','Batch traceability records incomplete','Licences and documentation','نقص في سجلات تتبع الدفعات','Complete batch traceability records for all released lots',20),
 ('V-VNT-40','VNT-140','L2','Local exhaust ventilation below design flow','Environment and emissions','أداء التهوية الموضعية أقل من التصميم','Service the ventilation system and re-measure the face velocity',20),
 ('V-ENR-50','ENR-150','L3','Energy audit report unavailable for the period','Environment and emissions','عدم توفر تقرير تدقيق الطاقة للفترة','Commission an energy audit covering the reporting period',60),
 ('V-SEC-60','SEC-160','L1','Fire detection coverage incomplete or untested','Fire safety','تغطية كشف الحريق غير مكتملة أو غير مختبرة','Restore full detection coverage and complete a functional test',7),
 ('V-SEC-65','SEC-165','L1','Fire water supply or pump not in a ready state','Fire safety','عدم جاهزية مصدر مياه الإطفاء أو المضخة','Restore fire water supply and pump readiness immediately',0),
 ('V-SEC-72','SEC-172','L2','Evacuation drill overdue','Fire safety','تأخر تنفيذ تجربة الإخلاء','Conduct and document an evacuation drill',30),
 ('V-EMS-80','EMS-180','L2','Stack emission monitoring records incomplete','Environment and emissions','نقص في سجلات مراقبة انبعاثات المداخن','Restore the monitoring programme and submit the missing records',20),
 ('V-EFF-90','EFF-190','L2','Effluent sampling below the required frequency','Environment and emissions','تكرار أخذ عينات الصرف أقل من المطلوب','Resume sampling at the permitted frequency',20),
 ('V-OHE-10','OHE-210','L2','Occupational health examinations overdue','Labour and welfare','تأخر إجراء الفحوص الطبية المهنية','Complete overdue occupational health examinations',30),
 ('V-OHE-15','OHE-215','L3','First aid provision or trained first aiders insufficient','Labour and welfare','نقص في وسائل الإسعاف الأولي أو المسعفين المدربين','Restock first aid kits and train the required number of first aiders',30),
 ('V-FDH-20','FDH-220','L1','Cold chain temperature outside the specified limits','Chemicals and hazardous materials','خروج درجات حرارة سلسلة التبريد عن الحدود المحددة','Quarantine affected product and restore the cold chain',0)
) as v(code, item_code, lvl, title, cat, descr, corr, gd)
join inspection_items i on i.id = md5('sqd:item:'||v.item_code)::uuid
where not exists (select 1 from violation_codes x where x.id = md5('sqd:vc:'||v.code)::uuid);

-- ---------------------------------------------------------------------
-- 9. penalty_mappings — one band per new violation code. Fine columns
--    satisfy the penalty_fine_configuration CHECK.
-- ---------------------------------------------------------------------
insert into penalty_mappings (id, violation_code_id, penalty_ref, penalty_range, repeat_rule, legal_basis, mapping_version, status,
  effective_from, created_by, approved_by, published_at, penalty_type, amount, grace_period_days, due_period_days,
  administrative_rules, technical_rules, penalty_types, financial_fine_enabled, fine_periodicity, fine_amount, maximum_fine_limit)
select md5('sqd:pm:'||v.code)::uuid, v.id, 'P-'||v.code,
  jsonb_build_object('schedule','approved','level', v.level),
  jsonb_build_object('repeat_12mo','escalate_one_level','repeat_24mo','maximum_of_band'),
  r.code||' §'||c.clause_ref||' — '||r.code||' البند '||c.clause_ref,
  'v1', 'published'::config_status, date '2026-01-01',
  'cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'::uuid, '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid, timestamptz '2026-06-30 13:00:00+03',
  case v.level when 'L1' then 'PT-SUSPENSION' when 'L2' then 'PT-FINE' else 'PT-WARNING' end,
  case v.level when 'L1' then 50000 when 'L2' then 20000 else 0 end::numeric,
  case v.level when 'L1' then 0 when 'L2' then 15 else 30 end,
  case v.level when 'L1' then 30 when 'L2' then 30 else 45 end,
  case v.level
    when 'L1' then 'Immediate corrective order with partial suspension of the affected activity until verified closure. — أمر تصحيحي فوري مع إيقاف جزئي للنشاط المتأثر حتى التحقق من الإغلاق.'
    when 'L2' then 'Corrective order with a financial fine on expiry of the grace period. — أمر تصحيحي مع غرامة مالية عند انتهاء فترة السماح.'
    else 'Written warning with a corrective order and follow-up inspection. — إنذار كتابي مع أمر تصحيحي وزيارة متابعة.' end,
  'Closure requires re-inspection evidence against the triggering inspection item. — يتطلب الإغلاق دليل إعادة تفتيش مقابل بند التفتيش المُشغِّل.',
  case v.level when 'L1' then array['PT-CORRECTIVE-ORDER','PT-SUSPENSION'] when 'L2' then array['PT-CORRECTIVE-ORDER','PT-FINE'] else array['PT-WARNING','PT-CORRECTIVE-ORDER'] end::text[],
  v.level in ('L1','L2'),
  case when v.level in ('L1','L2') then 'total' else null end,
  case v.level when 'L1' then 50000 when 'L2' then 20000 else null end::numeric,
  case v.level when 'L1' then 200000 when 'L2' then 60000 else null end::numeric
from violation_codes v
join regulation_clauses c on c.id = v.clause_id
join regulations r on r.id = c.regulation_id
where v.id in (select md5('sqd:vc:'||x)::uuid from unnest(array['V-LIC-01','V-LIC-05','V-OSH-01','V-OSH-05','V-OSH-12','V-CHM-01','V-CHM-04','V-CHM-09','V-WST-01','V-WST-06','V-MCH-01','V-MCH-04','V-MCH-09','V-PRV-01','V-PRV-05','V-PRV-09','V-ELE-01','V-ELE-04','V-WLF-01','V-WLF-04','V-UTL-50','V-CNF-10','V-CNF-14','V-ENL-20','V-TRC-30','V-VNT-40','V-ENR-50','V-SEC-60','V-SEC-65','V-SEC-72','V-EMS-80','V-EFF-90','V-OHE-10','V-OHE-15','V-FDH-20']) x)
  and not exists (select 1 from penalty_mappings p where p.id = md5('sqd:pm:'||v.code)::uuid);

-- ---------------------------------------------------------------------
-- 10. configuration_templates — report / form / action-form / penalty
--     templates. approved_by differs from created_by (maker-checker).
-- ---------------------------------------------------------------------
insert into configuration_templates (id, template_key, template_type, version_label, title_en, title_ar, status, schema, effective_from, created_by, approved_by, published_at, created_at)
select md5('sqd:tpl:'||t.k||':'||t.ver)::uuid, t.k, t.ttype, t.ver, t.ten, t.tar, t.st::config_status,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('key','identification','title_en','Identification','title_ar','بيانات التعريف','fields', jsonb_build_array('facility_name','licence_number','inspection_date')),
      jsonb_build_object('key','findings','title_en','Findings','title_ar','النتائج','fields', jsonb_build_array('item_code','response','evidence','remarks')),
      jsonb_build_object('key','closure','title_en','Closure','title_ar','الإغلاق','fields', jsonb_build_array('inspector_name','representative_acknowledgement','issued_at'))),
    'locale', jsonb_build_array('ar','en'),
    'direction','rtl'),
  t.eff, t.creator::uuid,
  case when t.st in ('published','locked') then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid else null end,
  case when t.st in ('published','locked') then timestamptz '2026-07-01 09:00:00+03' else null end,
  timestamptz '2026-06-29 09:00:00+03'
from (values
 ('tpl.report.routine-inspection','report','v3','Routine Inspection Report','تقرير التفتيش الدوري','published',date '2026-01-01','cfc5a737-6ffb-46af-a6ac-5c08d7979401'),
 ('tpl.report.followup-inspection','report','v2','Follow-up Inspection Report','تقرير تفتيش المتابعة','published',date '2026-01-01','cfc5a737-6ffb-46af-a6ac-5c08d7979401'),
 ('tpl.report.complaint-inspection','report','v1','Complaint Inspection Report','تقرير تفتيش البلاغ','published',date '2026-02-01','4dbe2765-911a-4ac8-97e0-cbecabd2ba66'),
 ('tpl.report.emergency-inspection','report','v1','Emergency Inspection Report','تقرير التفتيش الطارئ','published',date '2026-02-01','4dbe2765-911a-4ac8-97e0-cbecabd2ba66'),
 ('tpl.form.fire-safety-checklist','form','v4','Fire Safety Inspection Form','نموذج تفتيش السلامة من الحريق','published',date '2026-01-01','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'),
 ('tpl.form.chemical-storage-checklist','form','v2','Chemical Storage Inspection Form','نموذج تفتيش تخزين المواد الكيميائية','published',date '2026-01-15','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'),
 ('tpl.form.electrical-checklist','form','v2','Electrical Installations Inspection Form','نموذج تفتيش التمديدات الكهربائية','published',date '2026-01-15','cfc5a737-6ffb-46af-a6ac-5c08d7979401'),
 ('tpl.form.worker-welfare-checklist','form','v1','Worker Welfare Inspection Form','نموذج تفتيش رعاية العمال','published',date '2026-03-01','4dbe2765-911a-4ac8-97e0-cbecabd2ba66'),
 ('tpl.form.environmental-checklist','form','v1','Environmental Compliance Inspection Form','نموذج تفتيش الامتثال البيئي','locked',date '2026-03-01','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'),
 ('tpl.action.corrective-order','action_form','v3','Corrective Action Order','أمر الإجراء التصحيحي','published',date '2026-01-01','cfc5a737-6ffb-46af-a6ac-5c08d7979401'),
 ('tpl.action.blocking-corrective','action_form','v2','Blocking Corrective Action Order','أمر إجراء تصحيحي مانع','published',date '2026-01-01','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'),
 ('tpl.action.violation-notice','action_form','v2','Violation Notice','إشعار المخالفة','published',date '2026-01-01','4dbe2765-911a-4ac8-97e0-cbecabd2ba66'),
 ('tpl.penalty.fine-schedule','penalty','v2','Financial Fine Schedule','جدول الغرامات المالية','published',date '2026-01-01','cfc5a737-6ffb-46af-a6ac-5c08d7979401'),
 ('tpl.penalty.suspension-order','penalty','v1','Activity Suspension Order','أمر إيقاف النشاط','draft',date '2026-07-01','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd'),
 ('tpl.form.pressure-equipment-checklist','form','v1','Pressure Equipment Inspection Form','نموذج تفتيش معدات الضغط','draft',date '2026-08-01','4dbe2765-911a-4ac8-97e0-cbecabd2ba66'),
 ('tpl.report.licensing-verification','report','v1','Licensing Verification Report','تقرير التحقق من الترخيص','draft',date '2026-08-01','cfc5a737-6ffb-46af-a6ac-5c08d7979401')
) as t(k, ttype, ver, ten, tar, st, eff, creator)
where not exists (select 1 from configuration_templates x where x.id = md5('sqd:tpl:'||t.k||':'||t.ver)::uuid);

-- ---------------------------------------------------------------------
-- 11. compliance_configuration_requests + revisions.
--     Owners are deliberately spread across compliance-admin-*,
--     form-admin-*, reviewer-* and planner-* so that the approvals queue
--     (which excludes requests owned by the viewing user) is non-empty
--     for admin@mim.gov.sa and approver@mim.gov.sa alike.
--     `sqd_ccr_spec` is a session-local scratch table; start this file
--     in a fresh psql session.
-- ---------------------------------------------------------------------
create temporary table sqd_ccr_spec (n int, num text, title text, rtype text, owner uuid, st text, rev int, descr text);
insert into sqd_ccr_spec values
 (101,'CCR-2026-000101','Add fire-water readiness inspection item to HCIS-SEC-01 — إضافة بند تفتيش جاهزية مياه الإطفاء','create','cfc5a737-6ffb-46af-a6ac-5c08d7979401','pending_review',1,'Introduces the fire-water supply readiness item, its violation and penalty band ahead of the Q3 inspection cycle. — يقدّم بند جاهزية مصدر مياه الإطفاء ومخالفته وشريحة عقوبته قبل دورة تفتيش الربع الثالث.'),
 (102,'CCR-2026-000102','Revise chemical segregation severity to critical — رفع خطورة فصل المواد الكيميائية إلى حرجة','modify','8b78fc11-1e3b-4a22-973e-29fbb5099906','pending_review',1,'Raises the severity band for incompatible chemical storage following the 2026 incident review. — يرفع مستوى خطورة تخزين المواد غير المتوافقة بعد مراجعة حوادث 2026.'),
 (103,'CCR-2026-000103','Publish worker accommodation density item set — نشر مجموعة بنود كثافة سكن العمال','create','f19bd875-ac08-452c-8067-c27416ecd8a4','pending_review',1,'Adds the accommodation density and sanitation items required by MIM-IS-108. — يضيف بنود كثافة السكن والمرافق الصحية المطلوبة في MIM-IS-108.'),
 (104,'CCR-2026-000104','Add effluent sampling frequency item for NCEC-EN-302 — إضافة بند تكرار عينات الصرف','create','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','pending_review',1,'Aligns the effluent sampling item with the 2026 discharge permit conditions. — يوائم بند عينات الصرف مع اشتراطات تصريح التصريف لعام 2026.'),
 (105,'CCR-2026-000105','Revise evacuation drill interval and penalty band — تعديل دورية تجربة الإخلاء وشريحة العقوبة','modify','9cde47c0-c427-47c4-96ec-f81dbf51bd93','pending_review',2,'Second revision after the returned scope clarification on drill records. — الإصدار الثاني بعد إعادة الطلب لتوضيح نطاق سجلات التجربة.'),
 (106,'CCR-2026-000106','Add pressure vessel certificate verification set — إضافة مجموعة التحقق من شهادات أوعية الضغط','create','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','pending_review',1,'Adds statutory certificate verification for pressure vessels and steam boilers. — يضيف التحقق النظامي من شهادات أوعية الضغط والمراجل البخارية.'),
 (107,'CCR-2026-000107','Revise energy label violation to moderate — تعديل مخالفة بطاقة الطاقة إلى متوسطة','modify','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd','pending_review',1,'Reduces the energy efficiency labelling violation band to moderate per SASO guidance. — يخفض شريحة مخالفة بطاقة كفاءة الطاقة إلى متوسطة وفق توجيه الهيئة.'),
 (108,'CCR-2026-000108','Add licensing verification item for annual survey — إضافة بند التحقق من المسح الصناعي السنوي','create','3464eed4-1cfb-403a-bf85-5761071e560e','pending_review',1,'Adds the annual industrial survey verification item to the licensing section. — يضيف بند التحقق من المسح الصناعي السنوي إلى قسم التراخيص.'),
 (109,'CCR-2026-000109','Add lockout–tagout item and blocking action form — إضافة بند العزل والوسم ونموذج الإجراء المانع','create','8b78fc11-1e3b-4a22-973e-29fbb5099906','partially_approved',2,'Regulation and item components approved; the penalty component is still under decision. — اعتُمدت مكوّنات اللائحة والبند وما زال مكوّن العقوبة قيد القرار.'),
 (110,'CCR-2026-000110','Revise ventilation design-flow threshold — تعديل حد تدفق التهوية التصميمي','modify','cfc5a737-6ffb-46af-a6ac-5c08d7979401','partially_approved',2,'Threshold and violation approved; the penalty mapping was returned for legal basis. — اعتُمد الحد والمخالفة وأُعيد ربط العقوبة لتوثيق السند النظامي.'),
 (111,'CCR-2026-000111','Add cold chain temperature control set for SFDA-FD-501 — إضافة مجموعة ضبط سلسلة التبريد','create','f19bd875-ac08-452c-8067-c27416ecd8a4','partially_approved',1,'Cold chain item approved; the fine band component awaits the penalty committee. — اعتُمد بند سلسلة التبريد وينتظر مكوّن الغرامة لجنة العقوبات.'),
 (112,'CCR-2026-000112','Publish earthing continuity verification set — نشر مجموعة التحقق من استمرارية التأريض','create','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','approved',1,'All components approved and ready for governed publication. — اعتُمدت جميع المكوّنات وهي جاهزة للنشر المحكوم.'),
 (113,'CCR-2026-000113','Revise waste manifest retention period — تعديل مدة حفظ بيانات نقل النفايات','modify','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','approved',1,'All components approved after the environmental compliance review. — اعتُمدت جميع المكوّنات بعد مراجعة الامتثال البيئي.'),
 (114,'CCR-2026-000114','Publish occupational health examination set — نشر مجموعة الفحوص الطبية المهنية','create','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd','approved',2,'Second revision approved in full after the first was returned. — اعتُمد الإصدار الثاني بالكامل بعد إعادة الأول.'),
 (115,'CCR-2026-000115','Add batch traceability item for SALEEM scope — إضافة بند تتبع الدفعات ضمن نطاق سليم','create','8b78fc11-1e3b-4a22-973e-29fbb5099906','returned',1,'Returned — the SALEEM scope statement and evidence rule need clarification. — مُعاد لتوضيح نطاق سليم وقاعدة الأدلة.'),
 (116,'CCR-2026-000116','Revise first aid provision guidance text — تعديل النص الإرشادي لوسائل الإسعاف الأولي','modify','cfc5a737-6ffb-46af-a6ac-5c08d7979401','returned',1,'Returned — Arabic guidance text does not match the approved English wording. — مُعاد لعدم تطابق النص الإرشادي العربي مع الصيغة الإنجليزية المعتمدة.'),
 (117,'CCR-2026-000117','Add duplicate machine guarding violation code — إضافة رمز مخالفة مكرر لتحصين الآلات','create','f19bd875-ac08-452c-8067-c27416ecd8a4','rejected',1,'Rejected — the proposed violation duplicates published code V-MCH-01. — مرفوض لتكرار المخالفة المقترحة مع الرمز المنشور V-MCH-01.'),
 (118,'CCR-2026-000118','Add municipal signage requirement item — إضافة بند اشتراط اللوحات البلدية','create','ac4ab8f3-f758-4848-b2c7-ae2e590ff41f','rejected',1,'Rejected — the requirement sits outside the ministry regulatory scope. — مرفوض لخروج الاشتراط عن النطاق التنظيمي للوزارة.'),
 (119,'CCR-2026-000119','Draft metering sub-load reporting item — مسودة بند تقارير القياس الفرعي','create','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','draft',1,'Drafting in progress against MIM-IS-109 §2.1. — قيد الإعداد وفق MIM-IS-109 البند 2.1.'),
 (120,'CCR-2026-000120','Draft revision of PPE evidence rule — مسودة تعديل قاعدة أدلة معدات الوقاية','modify','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','draft',1,'Drafting in progress; evidence minimum count under review. — قيد الإعداد ومراجعة الحد الأدنى لعدد الأدلة.');

insert into compliance_configuration_requests (id, request_number, title, description, request_type, owner_id, created_at, submitted_at, current_revision, status, comments, return_reason, correlation_id, audit_references)
select md5('sqd:ccr:'||s.n)::uuid, s.num, s.title, s.descr, s.rtype, s.owner,
  timestamptz '2026-06-29 09:00:00+03' + ((s.n - 101) * 19 || ' hours')::interval,
  case when s.st = 'draft' then null else timestamptz '2026-07-02 09:00:00+03' + ((s.n - 101) * 19 || ' hours')::interval end,
  s.rev, s.st,
  case when s.st in ('approved','partially_approved') then 'Decision recorded by the compliance approval committee. — سُجّل القرار من لجنة اعتماد الامتثال.' else null end,
  case when s.st = 'returned' then 'GR-RETURN-SCOPE — مُعاد لتوضيح النطاق' when s.st = 'rejected' then 'GR-REJECT-DUPLICATE — مرفوض لتكرار سجل محكوم' else null end,
  md5('sqd:ccr:corr:'||s.n)::uuid, '[]'::jsonb
from sqd_ccr_spec s
where not exists (select 1 from compliance_configuration_requests x where x.id = md5('sqd:ccr:'||s.n)::uuid);

insert into compliance_request_revisions (id, request_id, revision_number, created_by, created_at, submitted_at, comments, return_reason)
select md5('sqd:ccrrev:'||s.n||':'||r.rev)::uuid, md5('sqd:ccr:'||s.n)::uuid, r.rev, s.owner,
  timestamptz '2026-06-29 09:00:00+03' + ((s.n - 101) * 19 + (r.rev - 1) * 24 || ' hours')::interval,
  case when s.st = 'draft' and r.rev = s.rev then null else timestamptz '2026-07-02 09:00:00+03' + ((s.n - 101) * 19 + (r.rev - 1) * 24 || ' hours')::interval end,
  case when r.rev < s.rev then 'Superseded by a later revision. — استُبدل بإصدار لاحق.' else null end,
  case when r.rev < s.rev then 'GR-RETURN-EVIDENCE — مُعاد لعدم كفاية الأدلة' else null end
from sqd_ccr_spec s
cross join lateral (select generate_series(1, s.rev) as rev) r
where not exists (select 1 from compliance_request_revisions x where x.id = md5('sqd:ccrrev:'||s.n||':'||r.rev)::uuid);

-- ---------------------------------------------------------------------
-- 12. compliance_request_components — four typed components per request
--     (regulation, inspection_item, violation, penalty). Snapshots
--     satisfy private.ccr_validate_snapshot() required-key rules.
-- ---------------------------------------------------------------------
with spec(n, st, rev, rtype, owner, regc, regt, itemc, itemt, vioc, viot, sev, pent) as (values
 (101,'pending_review',1,'create','cfc5a737-6ffb-46af-a6ac-5c08d7979401','HCIS-SEC-01','Physical Security and Fire Protection Directives — تعليمات الأمن المادي والحماية من الحريق','SEC-166','Fire water tank level telemetry verified — التحقق من قياس منسوب خزان مياه الإطفاء','V-SEC-66','Fire water telemetry unavailable — عدم توفر قياس منسوب مياه الإطفاء','L1','PT-SUSPENSION'),
 (102,'pending_review',1,'modify','8b78fc11-1e3b-4a22-973e-29fbb5099906','MIM-IS-103','Hazardous Chemicals Handling and Storage Rules — قواعد تداول وتخزين المواد الكيميائية الخطرة','CHM-404','Incompatible chemicals segregated by hazard class — فصل المواد الكيميائية غير المتوافقة','V-CHM-04','Incompatible chemicals stored without segregation — تخزين مواد غير متوافقة دون فصل','L1','PT-SUSPENSION'),
 (103,'pending_review',1,'create','f19bd875-ac08-452c-8067-c27416ecd8a4','MIM-IS-108','Worker Accommodation and Welfare Standards — معايير سكن العمال والرعاية','WLF-906','Accommodation ventilation and cooling adequate — كفاية التهوية والتبريد في السكن','V-WLF-06','Accommodation ventilation inadequate — عدم كفاية التهوية في السكن','L2','PT-FINE'),
 (104,'pending_review',1,'create','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','NCEC-EN-302','Industrial Wastewater Discharge Standard — معيار تصريف مياه الصرف الصناعي','EFF-191','Composite effluent sample retained for the period — حفظ عينة الصرف المركبة للفترة','V-EFF-91','Composite effluent sample not retained — عدم حفظ عينة الصرف المركبة','L2','PT-FINE'),
 (105,'pending_review',2,'modify','9cde47c0-c427-47c4-96ec-f81dbf51bd93','HCIS-SEC-02','Emergency Preparedness and Response Directives — تعليمات الاستعداد والاستجابة للطوارئ','SEC-173','Evacuation drill report signed by the site controller — اعتماد تقرير الإخلاء من مسؤول الموقع','V-SEC-73','Evacuation drill report unsigned — تقرير الإخلاء غير معتمد','L2','PT-FINE'),
 (106,'pending_review',1,'create','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','MIM-IS-106','Pressure Vessels and Steam Boilers Regulation — نظام أوعية الضغط والمراجل البخارية','PRV-702','Vessel nameplate matches the inspection certificate — تطابق لوحة البيانات مع شهادة الفحص','V-PRV-02','Vessel nameplate does not match the certificate — عدم تطابق لوحة البيانات مع الشهادة','L1','PT-SUSPENSION'),
 (107,'pending_review',1,'modify','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd','SASO-TR-202','Energy Efficiency Labelling Technical Regulation — اللائحة الفنية لبطاقة كفاءة الطاقة','ENL-120','Energy efficiency label present and legible — وضوح بطاقة كفاءة الطاقة','V-ENL-20','Energy efficiency label missing or illegible — غياب أو عدم وضوح بطاقة كفاءة الطاقة','L3','PT-WARNING'),
 (108,'pending_review',1,'create','3464eed4-1cfb-403a-bf85-5761071e560e','MIM-IS-101','Industrial Licensing and Registration Regulation — نظام التراخيص والتسجيل الصناعي','LIC-206','Annual survey acknowledgement receipt on file — حفظ إشعار استلام المسح السنوي','V-LIC-06','Annual survey acknowledgement missing — غياب إشعار استلام المسح السنوي','L3','PT-WARNING'),
 (109,'partially_approved',2,'create','8b78fc11-1e3b-4a22-973e-29fbb5099906','MIM-IS-105','Machinery Guarding and Preventive Maintenance Rules — قواعد تحصين الآلات والصيانة الوقائية','MCH-605','Lockout–tagout register maintained per shift — سجل العزل والوسم لكل وردية','V-MCH-05','Lockout–tagout register not maintained — عدم مسك سجل العزل والوسم','L1','PT-SUSPENSION'),
 (110,'partially_approved',2,'modify','cfc5a737-6ffb-46af-a6ac-5c08d7979401','SBC-401','Mechanical Code — Industrial Ventilation — الكود الميكانيكي: التهوية الصناعية','VNT-140','Local exhaust ventilation operating at design flow — تشغيل التهوية الموضعية بالتدفق التصميمي','V-VNT-40','Local exhaust ventilation below design flow — أداء التهوية الموضعية أقل من التصميم','L2','PT-FINE'),
 (111,'partially_approved',1,'create','f19bd875-ac08-452c-8067-c27416ecd8a4','SFDA-FD-501','Food Manufacturing Hygiene Requirements — متطلبات الاشتراطات الصحية لمصانع الأغذية','FDH-221','Cold chain alarm response record complete — اكتمال سجل الاستجابة لإنذار سلسلة التبريد','V-FDH-21','Cold chain alarm response not recorded — عدم تسجيل الاستجابة لإنذار سلسلة التبريد','L1','PT-SUSPENSION'),
 (112,'approved',1,'create','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','MIM-IS-107','Industrial Electrical Installations Rules — قواعد التمديدات الكهربائية الصناعية','ELE-802','Earth continuity test performed by an accredited body — تنفيذ اختبار التأريض من جهة معتمدة','V-ELE-02','Earth continuity test not performed by an accredited body — الاختبار غير منفذ من جهة معتمدة','L2','PT-FINE'),
 (113,'approved',1,'modify','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','MIM-IS-104','Industrial Waste Management Regulation — نظام إدارة النفايات الصناعية','WST-502','Waste transfer manifests retained for three years — حفظ بيانات نقل النفايات ثلاث سنوات','V-WST-02','Waste transfer manifests not retained for the required period — عدم حفظ بيانات النقل للمدة المطلوبة','L2','PT-FINE'),
 (114,'approved',2,'create','cd614f09-bb7e-4f4f-a2cf-8a96ef3e4fdd','MHRSD-LB-401','Occupational Health Requirements in Workplaces — متطلبات الصحة المهنية في بيئة العمل','OHE-211','Occupational health file held for each hazardous role — ملف صحة مهنية لكل مهنة خطرة','V-OHE-11','Occupational health file missing for hazardous roles — غياب الملف الصحي للمهن الخطرة','L2','PT-FINE'),
 (115,'returned',1,'create','8b78fc11-1e3b-4a22-973e-29fbb5099906','SASO-TR-203','SALEEM Product Safety Programme Requirements — متطلبات برنامج سليم لسلامة المنتجات','TRC-131','Batch traceability extends to raw material lots — امتداد تتبع الدفعات إلى دفعات المواد الخام','V-TRC-31','Batch traceability does not reach raw material lots — عدم وصول التتبع إلى دفعات المواد الخام','L2','PT-FINE'),
 (116,'returned',1,'modify','cfc5a737-6ffb-46af-a6ac-5c08d7979401','MHRSD-LB-401','Occupational Health Requirements in Workplaces — متطلبات الصحة المهنية في بيئة العمل','OHE-215','First aid kits stocked and trained first aiders on shift — تجهيز حقائب الإسعاف ووجود مسعفين','V-OHE-15','First aid provision or trained first aiders insufficient — نقص وسائل الإسعاف أو المسعفين','L3','PT-WARNING'),
 (117,'rejected',1,'create','f19bd875-ac08-452c-8067-c27416ecd8a4','MIM-IS-105','Machinery Guarding and Preventive Maintenance Rules — قواعد تحصين الآلات والصيانة الوقائية','MCH-602','Guard interlock function verified — التحقق من عمل مفتاح تعشيق التحصين','V-MCH-02','Guard interlock not functional — عدم عمل مفتاح تعشيق التحصين','L1','PT-SUSPENSION'),
 (118,'rejected',1,'create','ac4ab8f3-f758-4848-b2c7-ae2e590ff41f','MIM-IS-101','Industrial Licensing and Registration Regulation — نظام التراخيص والتسجيل الصناعي','LIC-207','Municipal signage permit displayed — عرض تصريح اللوحات البلدية','V-LIC-07','Municipal signage permit not displayed — عدم عرض تصريح اللوحات البلدية','L3','PT-WARNING'),
 (119,'draft',1,'create','3839f674-54c9-4ea9-bdf9-970ea6fe9b16','MIM-IS-109','Industrial Metering and Utility Consumption Reporting — قياس ورفع تقارير استهلاك المرافق الصناعية','UTL-951','Sub-meter readings reconciled with the main meter — مطابقة قراءات العدادات الفرعية بالعداد الرئيسي','V-UTL-51','Sub-meter readings not reconciled — عدم مطابقة قراءات العدادات الفرعية','L3','PT-WARNING'),
 (120,'draft',1,'modify','4dbe2765-911a-4ac8-97e0-cbecabd2ba66','MIM-IS-102','Industrial Occupational Safety Regulation — نظام السلامة المهنية الصناعية','OSH-301','Personal protective equipment issued and worn — صرف واستخدام معدات الوقاية الشخصية','V-OSH-01','Personal protective equipment not provided or not used','L1','PT-SUSPENSION')
), kinds(kord, kind) as (values (1,'regulation'),(2,'inspection_item'),(3,'violation'),(4,'penalty'))
insert into compliance_request_components (id, request_id, revision_number, entity_kind, target_entity_id, component_status,
  current_value_snapshot, proposed_value_snapshot, component_comments, decision_comments, decided_by, decided_at, created_by, created_at)
select md5('sqd:ccrcomp:'||s.n||':'||k.kind)::uuid, md5('sqd:ccr:'||s.n)::uuid, s.rev, k.kind,
  case when s.rtype = 'modify' then
    case k.kind
      when 'regulation' then md5('sqd:reg:'||s.regc)::uuid
      when 'inspection_item' then md5('sqd:item:'||s.itemc)::uuid
      when 'violation' then md5('sqd:vc:'||s.vioc)::uuid
      else md5('sqd:pm:'||s.vioc)::uuid end
  else null end,
  case s.st
    when 'draft' then 'draft'
    when 'pending_review' then 'pending_review'
    when 'approved' then 'approved'
    when 'returned' then 'returned'
    when 'rejected' then case when k.kord <= 2 then 'rejected' else 'auto_rejected' end
    else case when k.kord <= 2 then 'approved' when k.kord = 3 then 'returned' else 'pending_review' end end,
  case when s.rtype = 'modify' then jsonb_build_object('source','published library head','entity_kind', k.kind, 'reference', case k.kind when 'regulation' then s.regc when 'inspection_item' then s.itemc when 'violation' then s.vioc else 'P-'||s.vioc end) else null end,
  case k.kind
    when 'regulation' then jsonb_build_object('code', s.regc, 'title', s.regt, 'issuing_authority', 'Ministry of Industry and Mineral Resources — وزارة الصناعة والثروة المعدنية', 'effective_from','2026-09-01','operational_status','active')
    when 'inspection_item' then jsonb_build_object('code', s.itemc, 'title', s.itemt, 'response_type','single_select','regulation_version_id', md5('sqd:cev:'||s.n||':regulation')::uuid::text, 'evidence_types', jsonb_build_array('photo','document'), 'mandatory', true, 'display_order', k.kord)
    when 'violation' then jsonb_build_object('code', s.vioc, 'title', s.viot, 'severity', s.sev, 'inspection_item_version_id', md5('sqd:cev:'||s.n||':inspection_item')::uuid::text, 'trigger_response','non_compliant','notify_entity', true)
    else jsonb_build_object('penalty_type', s.pent, 'violation_version_id', md5('sqd:cev:'||s.n||':violation')::uuid::text, 'penalty_ref','P-'||s.vioc, 'grace_period_days', case s.sev when 'L1' then 0 when 'L2' then 15 else 30 end, 'legal_basis', s.regc)
  end,
  'Component drafted against '||s.regc||' — أُعدّ المكوّن استناداً إلى '||s.regc,
  case s.st
    when 'returned' then 'Returned — supporting evidence and scope require clarification. — مُعاد لتوضيح الأدلة المؤيدة والنطاق.'
    when 'rejected' then case when k.kord <= 2 then 'Rejected — duplicates a governed published record. — مرفوض لتكرار سجل منشور محكوم.' else 'Auto-rejected — parent component was rejected. — رُفض تلقائياً لرفض المكوّن الأصل.' end
    when 'approved' then 'Approved — consistent with the published library and legal basis. — معتمد لاتساقه مع المكتبة المنشورة والسند النظامي.'
    when 'partially_approved' then case when k.kord <= 2 then 'Approved — consistent with the published library. — معتمد لاتساقه مع المكتبة المنشورة.' when k.kord = 3 then 'Returned — severity band needs the committee minute reference. — مُعاد لإضافة مرجع محضر اللجنة لشريحة الخطورة.' else null end
    else null end,
  case when s.st in ('approved','returned','rejected','partially_approved') and not (s.st = 'partially_approved' and k.kord = 4)
       then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid else null end,
  case when s.st in ('approved','returned','rejected','partially_approved') and not (s.st = 'partially_approved' and k.kord = 4)
       then timestamptz '2026-07-08 11:00:00+03' + ((s.n - 101) * 7 + k.kord || ' hours')::interval else null end,
  s.owner::uuid,
  timestamptz '2026-06-29 10:00:00+03' + ((s.n - 101) * 19 + k.kord || ' hours')::interval
from spec s cross join kinds k
where not exists (select 1 from compliance_request_components x where x.id = md5('sqd:ccrcomp:'||s.n||':'||k.kind)::uuid);

-- ---------------------------------------------------------------------
-- 13. compliance_request_component_dependencies — regulation →
--     inspection_item → violation → penalty chain per request.
-- ---------------------------------------------------------------------
with spec(n, rev) as (values (101,1),(102,1),(103,1),(104,1),(105,2),(106,1),(107,1),(108,1),(109,2),(110,2),(111,1),(112,1),(113,1),(114,2),(115,1),(116,1),(117,1),(118,1),(119,1),(120,1)),
edges(parent, child) as (values ('regulation','inspection_item'),('inspection_item','violation'),('violation','penalty'))
insert into compliance_request_component_dependencies (id, request_id, revision_number, parent_component_id, child_component_id, created_at)
select md5('sqd:ccrdep:'||s.n||':'||e.parent||'>'||e.child)::uuid, md5('sqd:ccr:'||s.n)::uuid, s.rev,
       md5('sqd:ccrcomp:'||s.n||':'||e.parent)::uuid, md5('sqd:ccrcomp:'||s.n||':'||e.child)::uuid,
       timestamptz '2026-06-29 12:00:00+03' + ((s.n - 101) * 19 || ' hours')::interval
from spec s cross join edges e
where not exists (select 1 from compliance_request_component_dependencies x where x.id = md5('sqd:ccrdep:'||s.n||':'||e.parent||'>'||e.child)::uuid);

-- ---------------------------------------------------------------------
-- 14. compliance_request_decisions — component-level decisions derived
--     from component_status, plus a request-level decision row.
-- ---------------------------------------------------------------------
with newc as (
  select c.*, r.correlation_id, r.status req_status
  from compliance_request_components c
  join compliance_configuration_requests r on r.id = c.request_id
  where c.request_id in (select md5('sqd:ccr:'||n)::uuid from generate_series(101,120) n)
    and c.decided_at is not null
)
insert into compliance_request_decisions (id, request_id, revision_number, component_id, decision, comments, decided_by, decided_at, correlation_id)
select md5('sqd:ccrdec:'||c.id::text)::uuid, c.request_id, c.revision_number, c.id,
  case c.component_status when 'approved' then 'approve' when 'returned' then 'return' when 'rejected' then 'reject' else 'auto_reject' end,
  coalesce(c.decision_comments, 'Decision recorded by the compliance approval committee. — سُجّل القرار من لجنة اعتماد الامتثال.'),
  c.decided_by, c.decided_at, c.correlation_id
from newc c
where not exists (select 1 from compliance_request_decisions x where x.id = md5('sqd:ccrdec:'||c.id::text)::uuid);

insert into compliance_request_decisions (id, request_id, revision_number, component_id, decision, comments, decided_by, decided_at, correlation_id)
select md5('sqd:ccrdec:req:'||r.id::text)::uuid, r.id, r.current_revision, null,
  case r.status when 'approved' then 'approve' when 'rejected' then 'reject' when 'returned' then 'return' end,
  case r.status
    when 'approved' then 'All components approved; the request is ready for governed publication. — اعتُمدت جميع المكوّنات والطلب جاهز للنشر المحكوم.'
    when 'rejected' then coalesce(r.return_reason,'Rejected at request level. — رُفض على مستوى الطلب.')
    else coalesce(r.return_reason,'Returned at request level. — أُعيد على مستوى الطلب.') end,
  '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid,
  timestamptz '2026-07-09 12:00:00+03', r.correlation_id
from compliance_configuration_requests r
where r.id in (select md5('sqd:ccr:'||n)::uuid from generate_series(101,120) n)
  and r.status in ('approved','rejected','returned')
  and not exists (select 1 from compliance_request_decisions x where x.id = md5('sqd:ccrdec:req:'||r.id::text)::uuid);

-- ---------------------------------------------------------------------
-- 15. compliance_entity_versions / publications / heads for the fully
--     approved requests (112–114). Kinds are published in dependency
--     order because ccr_validate_publication_trigger() resolves each
--     *_version_id reference against already-published versions.
-- ---------------------------------------------------------------------
do $seed$
declare k text; n int;
begin
  foreach k in array array['regulation','inspection_item','violation','penalty'] loop
    for n in 112..114 loop
      insert into compliance_entity_versions (id, entity_kind, entity_id, target_legacy_id, version_number, value_snapshot, dependency_versions,
        request_id, request_revision, request_component_id, published_by, published_at, correlation_id)
      select md5('sqd:cev:'||n||':'||k)::uuid, k, c.id, c.target_entity_id, 1, c.proposed_value_snapshot,
        coalesce((select jsonb_agg(md5('sqd:cev:'||n||':'||p.entity_kind)::uuid::text)
                  from compliance_request_component_dependencies d
                  join compliance_request_components p on p.id = d.parent_component_id
                  where d.child_component_id = c.id), '[]'::jsonb),
        c.request_id, c.revision_number, c.id, '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid,
        timestamptz '2026-07-10 10:00:00+03', r.correlation_id
      from compliance_request_components c
      join compliance_configuration_requests r on r.id = c.request_id
      where c.id = md5('sqd:ccrcomp:'||n||':'||k)::uuid
        and not exists (select 1 from compliance_entity_versions v where v.id = md5('sqd:cev:'||n||':'||k)::uuid);
    end loop;
  end loop;
end $seed$;

insert into compliance_request_publications (id, request_id, revision_number, component_id, version_id, published_by, published_at, correlation_id)
select md5('sqd:ccrpub:'||v.id::text)::uuid, v.request_id, v.request_revision, v.request_component_id, v.id, v.published_by, v.published_at, v.correlation_id
from compliance_entity_versions v
where v.request_id in (select md5('sqd:ccr:'||n)::uuid from generate_series(112,114) n)
  and not exists (select 1 from compliance_request_publications p where p.id = md5('sqd:ccrpub:'||v.id::text)::uuid)
  and not exists (select 1 from compliance_request_publications p2 where p2.version_id = v.id or p2.component_id = v.request_component_id);

insert into compliance_entity_heads (entity_kind, entity_id, current_version_id, target_legacy_id, activated_at)
select v.entity_kind, v.entity_id, v.id, v.target_legacy_id, v.published_at
from compliance_entity_versions v
where v.request_id in (select md5('sqd:ccr:'||n)::uuid from generate_series(112,114) n)
  and not exists (select 1 from compliance_entity_heads h where h.entity_kind = v.entity_kind and h.entity_id = v.entity_id)
  and not exists (select 1 from compliance_entity_heads h2 where h2.current_version_id = v.id);

-- ---------------------------------------------------------------------
-- 16. review_comments — append-only reviewer collaboration thread on the
--     20 most recently decided reviews (trg_review_comments_immutable
--     blocks UPDATE/DELETE, so inserts must be right first time).
-- ---------------------------------------------------------------------
with picked as (
  select r.id, r.inspection_id, r.submission_version_id, r.reviewer_id, r.decision,
         row_number() over (order by coalesce(r.decided_at, timestamptz '2026-07-01') desc, r.id) rn
  from reviews r
  where r.submission_version_id is not null and r.inspection_id is not null and r.reviewer_id is not null
  order by coalesce(r.decided_at, timestamptz '2026-07-01') desc, r.id
  limit 20
), pool(i, txt) as (values
 (0,'Evidence for the fire-safety section does not show the extinguisher service tag dates. Re-capture with the tag legible. — الأدلة الخاصة بقسم السلامة من الحريق لا تُظهر تواريخ صيانة الطفايات؛ يُعاد التصوير بوضوح.'),
 (1,'The chemical storage photographs cover one aisle only; segregation between hazard classes cannot be assessed. — صور تخزين المواد الكيميائية تغطي ممراً واحداً فقط ولا تكفي لتقييم الفصل بين الأصناف.'),
 (2,'Item ELE-804 is marked non-compliant but no photograph of the distribution board was attached. — تم رصد البند ELE-804 كغير مطابق دون إرفاق صورة للوحة التوزيع.'),
 (3,'The representative acknowledgement is present and the geofence record matches the licensed site. — إقرار ممثل المنشأة موجود وسجل النطاق الجغرافي مطابق للموقع المرخص.'),
 (4,'Findings are consistent with the responses recorded; the corrective order reference is correct. — النتائج متسقة مع الاستجابات المسجلة ومرجع الأمر التصحيحي صحيح.'),
 (5,'Grace period applied to V-CHM-09 does not match the published penalty mapping. Please correct before resubmission. — فترة السماح المطبقة على V-CHM-09 لا تطابق ربط العقوبات المنشور؛ يُرجى التصحيح قبل إعادة الرفع.'),
 (6,'Cold chain temperature logs were reviewed for the full 30-day window and are within limits. — روجعت سجلات حرارة سلسلة التبريد لكامل الثلاثين يوماً وهي ضمن الحدود.'),
 (7,'Reported non-compliance duplicates a finding already closed under an earlier visit. — عدم المطابقة المرصود يكرر نتيجة سبق إغلاقها في زيارة سابقة.'),
 (8,'The occupational health examination sample is smaller than the guidance requires. — عينة الفحوص الطبية المهنية أقل من العدد الوارد في الدليل الإرشادي.'),
 (9,'Effluent sampling dates align with the discharge permit condition; no further action needed. — تواريخ عينات الصرف مطابقة لاشتراط تصريح التصريف ولا يلزم إجراء إضافي.')
), comment_rows as (
  select p.id review_id, p.inspection_id, p.submission_version_id, p.reviewer_id, 1 seq, 'return'::text decision,
         (select txt from pool where i = (p.rn * 2) % 10) comment
  from picked p
  union all
  select p.id, p.inspection_id, p.submission_version_id, p.reviewer_id, 2,
         case when p.decision in ('approve','return','reject') then p.decision else 'approve' end,
         (select txt from pool where i = (p.rn * 3 + 1) % 10)
  from picked p
)
insert into review_comments (id, review_id, inspection_id, submission_version_id, reviewer_id, decision, comment, created_at)
select md5('sqd:rc:'||cr.review_id::text||':'||cr.seq)::uuid, cr.review_id, cr.inspection_id, cr.submission_version_id,
       cr.reviewer_id, cr.decision, cr.comment,
       timestamptz '2026-07-05 10:00:00+03' + ((cr.seq * 3)||' hours')::interval
from comment_rows cr
where not exists (select 1 from review_comments x where x.id = md5('sqd:rc:'||cr.review_id::text||':'||cr.seq)::uuid);

-- ---------------------------------------------------------------------
-- 17. compliance_inspection_handoffs — one per inspection (both
--     inspection_id and review_id are UNIQUE).
-- ---------------------------------------------------------------------
with picked as (
  select distinct on (r.inspection_id) r.id review_id, r.inspection_id, r.submission_version_id
  from reviews r
  where r.submission_version_id is not null and r.inspection_id is not null
  order by r.inspection_id, r.id
), numbered as (
  select p.*, row_number() over (order by p.inspection_id) rn from picked p limit 18
)
insert into compliance_inspection_handoffs (id, inspection_id, review_id, submission_version_id, handed_off_by, status, correlation_id, created_at)
select md5('sqd:handoff:'||n.review_id::text)::uuid, n.inspection_id, n.review_id, n.submission_version_id,
       (array['9cde47c0-c427-47c4-96ec-f81dbf51bd93','ac4ab8f3-f758-4848-b2c7-ae2e590ff41f','6f7a9934-deb1-4c58-b79b-619774a532c1'])[1 + (n.rn % 3)]::uuid,
       (array['ready','accepted','closed'])[1 + (n.rn % 3)],
       md5('sqd:handoff:corr:'||n.review_id::text)::uuid,
       timestamptz '2026-07-06 09:00:00+03' + ((n.rn)||' hours')::interval
from numbered n
where not exists (select 1 from compliance_inspection_handoffs x where x.id = md5('sqd:handoff:'||n.review_id::text)::uuid)
  and not exists (select 1 from compliance_inspection_handoffs y where y.inspection_id = n.inspection_id or y.review_id = n.review_id);

-- ---------------------------------------------------------------------
-- 18. external_requests — factory-portal correspondence.
-- ---------------------------------------------------------------------
with f as (
  select id, row_number() over (order by id) rn from (select id from factories order by id limit 20) t
), spec(rn, rtype, st, subj_en, subj_ar, reason) as (values
 (1,'correction','submitted','Correction of the licence number recorded in report','تصحيح رقم الرخصة الوارد في التقرير',null),
 (2,'correction','in_review','Correction of the recorded production capacity','تصحيح الطاقة الإنتاجية المسجلة',null),
 (3,'extension','accepted','Extension of the grace period for corrective order','تمديد فترة السماح للأمر التصحيحي','Extension granted for 15 calendar days — مُنح التمديد لخمسة عشر يوماً تقويمياً'),
 (4,'extension','rejected','Extension of the grace period for fire system repair','تمديد فترة السماح لإصلاح نظام الإطفاء','Critical violation — extension not permitted — مخالفة حرجة ولا يجوز التمديد'),
 (5,'clarification','submitted','Clarification of the applicable ventilation clause','استيضاح البند المنطبق للتهوية',null),
 (6,'clarification','returned','Clarification of the effluent sampling frequency','استيضاح تكرار أخذ عينات الصرف','Attach the current discharge permit — يُرجى إرفاق تصريح التصريف الساري'),
 (7,'reschedule','accepted','Reschedule of the follow-up inspection visit','إعادة جدولة زيارة التفتيش المتابعة','Rescheduled within the same reporting month — أعيدت الجدولة في نفس شهر التقرير'),
 (8,'reschedule','in_review','Reschedule request due to planned shutdown','طلب إعادة جدولة بسبب إيقاف مخطط',null),
 (9,'correction','accepted','Correction of the representative contact details','تصحيح بيانات التواصل لممثل المنشأة','Contact record updated — حُدّث سجل التواصل'),
 (10,'objection','in_review','Objection to violation V-CHM-04 recorded in the report','اعتراض على المخالفة V-CHM-04 الواردة في التقرير',null),
 (11,'objection','submitted','Objection to violation V-SEC-72 recorded in the report','اعتراض على المخالفة V-SEC-72 الواردة في التقرير',null),
 (12,'objection','rejected','Objection to the financial fine band applied','اعتراض على شريحة الغرامة المالية المطبقة','Fine band matches the published penalty mapping — الشريحة مطابقة لربط العقوبات المنشور'),
 (13,'objection','accepted','Objection to the machine guarding finding','اعتراض على نتيجة تحصين الآلات','Re-inspection confirmed the guard was fitted — أكدت إعادة التفتيش تركيب التحصين'),
 (14,'correction','withdrawn','Correction of the inspection date in the report header','تصحيح تاريخ التفتيش في ترويسة التقرير',null),
 (15,'clarification','accepted','Clarification of worker accommodation density limits','استيضاح حدود كثافة سكن العمال','Density limit is defined in MIM-IS-108 §3.1 — الحد معرف في MIM-IS-108 البند 3.1')
)
insert into external_requests (id, factory_id, request_type, status, subject, body, submitted_by_rep, decided_by, decision_reason, created_at, updated_at)
select md5('sqd:extreq:'||s.rn)::uuid, f.id, s.rtype, s.st, s.subj_en,
  jsonb_build_object('subject_ar', s.subj_ar, 'channel','factory_portal','locale','ar',
    'narrative_ar','قُدّم الطلب عبر بوابة المنشآت مرفقاً بالمستندات المؤيدة.',
    'narrative_en','Submitted through the factory portal with supporting documents attached.'),
  (select fr.id from factory_representatives fr where fr.factory_id = f.id limit 1),
  case when s.st in ('accepted','rejected','returned') then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid else null end,
  s.reason,
  timestamptz '2026-06-30 08:00:00+03' + ((s.rn * 17)||' hours')::interval,
  timestamptz '2026-07-02 08:00:00+03' + ((s.rn * 17)||' hours')::interval
from spec s join f on f.rn = s.rn
where not exists (select 1 from external_requests x where x.id = md5('sqd:extreq:'||s.rn)::uuid);

-- ---------------------------------------------------------------------
-- 19. objections — four linked to an external_request, ten standalone.
-- ---------------------------------------------------------------------
with f as (
  select id, row_number() over (order by id) rn from (select id from factories order by id limit 20) t
), spec(rn, linked_req, st, grounds) as (values
 (1, 10, 'under_review','The segregation distance recorded by the inspector was measured before the pallets were repositioned on the same day. — قِيست مسافة الفصل قبل إعادة ترتيب المنصات في اليوم نفسه.'),
 (2, 11, 'filed','The evacuation drill was conducted on 12 Jumada II and the attendance sheet was not requested during the visit. — نُفذت تجربة الإخلاء في 12 جمادى الآخرة ولم يُطلب كشف الحضور أثناء الزيارة.'),
 (3, 12, 'dismissed','The applied fine band exceeds the value in the published penalty schedule for this level. — شريحة الغرامة المطبقة تتجاوز القيمة الواردة في جدول العقوبات المنشور لهذا المستوى.'),
 (4, 13, 'upheld','The machine guard was installed prior to the visit; the maintenance work order is attached as evidence. — رُكّب تحصين الآلة قبل الزيارة وأُرفق أمر الصيانة كدليل.'),
 (5, null, 'filed','The extinguisher service contract covers the units cited; the tags had been replaced two days before the visit. — يغطي عقد صيانة الطفايات الوحدات المذكورة وقد استُبدلت البطاقات قبل الزيارة بيومين.'),
 (6, null, 'under_review','The cited clause applies to bulk storage above 1,000 litres; the tank on site holds 750 litres. — ينطبق البند المذكور على التخزين الذي يتجاوز 1000 لتر بينما سعة الخزان 750 لتراً.'),
 (7, null, 'upheld','The occupational health examinations were completed and uploaded before the reported deadline. — أُنجزت الفحوص الطبية المهنية ورُفعت قبل الموعد المذكور.'),
 (8, null, 'dismissed','The facility disputes the effluent sampling frequency required by the discharge permit. — تعترض المنشأة على تكرار أخذ عينات الصرف المطلوب في تصريح التصريف.'),
 (9, null, 'filed','The energy audit report was issued for the previous reporting year and covers the same scope. — صدر تقرير تدقيق الطاقة عن سنة التقرير السابقة ويغطي النطاق نفسه.'),
 (10, null,'under_review','The distribution board labelling was completed under a work order issued before the inspection. — استُكمل ترميز لوحة التوزيع بأمر عمل صادر قبل التفتيش.'),
 (11, null,'upheld','Accommodation occupancy on the visit date included a temporary transit group not resident at the site. — شمل إشغال السكن يوم الزيارة مجموعة عابرة غير مقيمة في الموقع.'),
 (12, null,'dismissed','The facility contests the classification of the waste stream as hazardous. — تعترض المنشأة على تصنيف مجرى النفايات كنفايات خطرة.'),
 (13, null,'filed','The relief valve seal was broken by the certifying body during the scheduled test. — كُسر ختم صمام التنفيس من قبل جهة الاعتماد أثناء الاختبار المجدول.'),
 (14, null,'under_review','The cold chain excursion was limited to a defrost cycle recorded in the equipment log. — اقتصر خروج سلسلة التبريد على دورة إذابة مسجلة في سجل المعدة.')
)
insert into objections (id, request_id, factory_id, grounds, status, filed_by_rep, decided_by, created_at)
select md5('sqd:objection:'||s.rn)::uuid,
  case when s.linked_req is not null then md5('sqd:extreq:'||s.linked_req)::uuid else null end,
  f.id, s.grounds, s.st,
  (select fr.id from factory_representatives fr where fr.factory_id = f.id limit 1),
  case when s.st in ('upheld','dismissed') then '7da93ff6-82c5-45f8-be26-92c8956c2254'::uuid else null end,
  timestamptz '2026-07-03 09:00:00+03' + ((s.rn * 11)||' hours')::interval
from spec s join f on f.rn = s.rn
where not exists (select 1 from objections x where x.id = md5('sqd:objection:'||s.rn)::uuid);

-- ---------------------------------------------------------------------
-- 20. self_assessments — risk_signal_emitted only where status =
--     'accepted' (self_assessment_risk_only_when_accepted CHECK).
-- ---------------------------------------------------------------------
with f as (
  select id, row_number() over (order by id) rn from (select id from factories order by id limit 20) t
), spec(rn, st, risk) as (values
 (1,'submitted',false),(2,'accepted',true),(3,'accepted',false),(4,'draft',false),(5,'returned',false),
 (6,'submitted',false),(7,'accepted',true),(8,'accepted',false),(9,'draft',false),(10,'submitted',false),
 (11,'accepted',false),(12,'returned',false),(13,'submitted',false),(14,'accepted',true),(15,'draft',false),
 (16,'submitted',false),(17,'accepted',false),(18,'returned',false)
)
insert into self_assessments (id, factory_id, status, answers, risk_signal_emitted, submitted_by_rep, reviewed_by, reviewed_at, created_at, updated_at)
select md5('sqd:selfassess:'||s.rn)::uuid, f.id, s.st,
  jsonb_build_object(
    'period','2026-Q2',
    'sections', jsonb_build_object(
      'fire_safety', jsonb_build_object('extinguishers_serviced', s.rn % 3 <> 0, 'alarm_tested', s.rn % 4 <> 0, 'note_ar','تمت الصيانة الدورية وفق العقد.'),
      'chemicals', jsonb_build_object('msds_complete', s.rn % 2 = 0, 'segregation_verified', s.rn % 5 <> 0, 'note_ar','تم فصل المواد حسب صنف الخطورة.'),
      'labour', jsonb_build_object('ppe_issued', true, 'health_exams_current', s.rn % 3 <> 1, 'note_ar','تم صرف معدات الوقاية لجميع العاملين.'),
      'environment', jsonb_build_object('waste_manifests_retained', s.rn % 2 = 1, 'effluent_sampled', s.rn % 4 <> 2, 'note_ar','تُحفظ بيانات نقل النفايات لدى إدارة السلامة.')),
    'declared_by_role','Compliance Officer — مسؤول الامتثال'),
  s.risk,
  case when s.st <> 'draft' then (select fr.id from factory_representatives fr where fr.factory_id = f.id limit 1) else null end,
  case when s.st in ('accepted','returned') then '885ea7cc-a9c5-4d4d-b1a5-a94293c3593f'::uuid else null end,
  case when s.st in ('accepted','returned') then timestamptz '2026-07-12 11:00:00+03' + ((s.rn * 7)||' hours')::interval else null end,
  timestamptz '2026-07-01 08:00:00+03' + ((s.rn * 13)||' hours')::interval,
  timestamptz '2026-07-12 08:00:00+03' + ((s.rn * 13)||' hours')::interval
from spec s join f on f.rn = s.rn
where not exists (select 1 from self_assessments x where x.id = md5('sqd:selfassess:'||s.rn)::uuid);

-- ---------------------------------------------------------------------
-- 21. report_verifications — append-only signature verification ledger.
-- ---------------------------------------------------------------------
insert into report_verifications (id, report_hash, provider, status, detail, checked_at, created_at)
select md5('sqd:reportverif:'||v.rn)::uuid,
  encode(digest('sqd:reportverif:'||v.rn,'sha256'),'hex'), v.provider, v.st,
  jsonb_build_object('envelope_id', md5('sqd:reportverif:env:'||v.rn)::uuid, 'report_type', v.rtype,
    'signer_role','factory_representative', 'note_ar','تم التحقق من بصمة التقرير مقابل النسخة الموقعة.'),
  timestamptz '2026-07-14 09:00:00+03' + ((v.rn * 5)||' hours')::interval,
  timestamptz '2026-07-14 09:05:00+03' + ((v.rn * 5)||' hours')::interval
from (values
 (1,'docusign','verified','RPT-ROUTINE'),(2,'docusign','verified','RPT-ROUTINE'),(3,'docusign','pending','RPT-FOLLOWUP'),
 (4,'docusign','verified','RPT-COMPLAINT'),(5,'docusign','unverified','RPT-ROUTINE'),(6,'nafath','verified','RPT-ROUTINE'),
 (7,'nafath','verified','RPT-EMERGENCY'),(8,'nafath','pending','RPT-FOLLOWUP'),(9,'nafath','failed','RPT-ROUTINE'),
 (10,'nafath','verified','RPT-LICENSING'),(11,'docusign','verified','RPT-ROUTINE'),(12,'docusign','unavailable','RPT-FOLLOWUP'),
 (13,'nafath','verified','RPT-ROUTINE'),(14,'nafath','verified','RPT-COMPLAINT'),(15,'docusign','pending','RPT-ROUTINE'),
 (16,'docusign','verified','RPT-EMERGENCY')
) as v(rn, provider, st, rtype)
where not exists (select 1 from report_verifications x where x.id = md5('sqd:reportverif:'||v.rn)::uuid);

-- =====================================================================
-- End of 03-compliance.sql — synthetic non-production demo data.
-- =====================================================================
