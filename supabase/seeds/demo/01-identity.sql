-- SAQEEL demo data pack — 01 · identity
--
-- Synthetic, non-production. Gives every seeded persona a governed display
-- name so the shell account chip renders an officer rather than an email
-- handle, and spreads the inspector workforce across regions so the
-- Operations map shows movement instead of a single pin.
--
-- Idempotent: every statement is an UPDATE or an INSERT ... ON CONFLICT.
-- Safe to re-run. Creates no auth users; every address below already exists.

begin;

-- Named personas from the live test-data guide. The inspector already carried
-- a real name; the rest carried role placeholders ("A. Planner").
update public.profiles set full_name = 'عبدالله محمد القحطاني', region = 'Riyadh'  where email = 'inspector@mim.gov.sa';
update public.profiles set full_name = 'نورة عبدالعزيز الحربي', region = 'Riyadh'  where email = 'planner@mim.gov.sa';
update public.profiles set full_name = 'ريم سعد العتيبي',       region = 'Riyadh'  where email = 'reviewer@mim.gov.sa';
update public.profiles set full_name = 'خالد إبراهيم الشمري',   region = 'Riyadh'  where email = 'admin@mim.gov.sa';
update public.profiles set full_name = 'عمر فهد الدوسري',       region = 'Riyadh'  where email = 'ops@mim.gov.sa';
update public.profiles set full_name = 'بندر ناصر المطيري',     region = 'Riyadh'  where email = 'approver@mim.gov.sa';

-- Field workforce. Regions differ on purpose: the Operations live map, the
-- workload panel and the region scope control are only legible when more than
-- one region carries an inspector.
update public.profiles set full_name = 'سلطان عايض الشهري',   region = 'Riyadh'  where email = 'inspector1@mim.gov.sa';
update public.profiles set full_name = 'ماجد سليمان الزهراني', region = 'Makkah'  where email = 'inspector2@mim.gov.sa';
update public.profiles set full_name = 'فيصل تركي العنزي',     region = 'Eastern' where email = 'inspector3@mim.gov.sa';
update public.profiles set full_name = 'هاني مشعل الغامدي',    region = 'Madinah' where email = 'inspector4@mim.gov.sa';
update public.profiles set full_name = 'ياسر راشد البقمي',     region = 'Qassim'  where email = 'inspector5@mim.gov.sa';

update public.profiles set full_name = 'أحمد صالح المالكي',   region = 'Riyadh'  where email = 'inspector-01@mim-inspection.test';
update public.profiles set full_name = 'مشاري حمد الرشيد',    region = 'Eastern' where email = 'inspector-02@mim-inspection.test';
update public.profiles set full_name = 'طلال عبدالله السبيعي', region = 'Makkah'  where email = 'inspector-03@mim-inspection.test';

update public.profiles set full_name = 'لمياء خالد الصقر',    region = 'Riyadh'  where email = 'planner-01@mim-inspection.test';
update public.profiles set full_name = 'عبدالرحمن علي الحمد', region = 'Makkah'  where email = 'planner-02@mim-inspection.test';
update public.profiles set full_name = 'هند فيصل الجاسر',     region = 'Eastern' where email = 'planner-03@mim-inspection.test';

update public.profiles set full_name = 'سعود منصور الخالدي',  region = 'Riyadh'  where email = 'reviewer-01@mim-inspection.test';
update public.profiles set full_name = 'أمل بدر القصيبي',     region = 'Eastern' where email = 'reviewer-02@mim-inspection.test';
update public.profiles set full_name = 'وليد عثمان الفارس',   region = 'Makkah'  where email = 'reviewer-03@mim-inspection.test';

update public.profiles set full_name = 'منى عادل الشثري',     region = 'Riyadh'  where email = 'ops-01@mim-inspection.test';
update public.profiles set full_name = 'زياد مطلق الحارثي',   region = 'Eastern' where email = 'ops-02@mim-inspection.test';
update public.profiles set full_name = 'دانة سامي الطويل',    region = 'Makkah'  where email = 'ops-03@mim-inspection.test';

update public.profiles set full_name = 'إبراهيم سعود الفهيد',  region = 'Riyadh' where email = 'leadership-01@mim-inspection.test';
update public.profiles set full_name = 'غادة يوسف الرميح',    region = 'Riyadh' where email = 'leadership-02@mim-inspection.test';
update public.profiles set full_name = 'نايف حسن الشمراني',   region = 'Riyadh' where email = 'leadership-03@mim-inspection.test';

update public.profiles set full_name = 'رنا محمد العريفي',    region = 'Riyadh' where email = 'auditor-01@mim-inspection.test';
update public.profiles set full_name = 'عبدالعزيز فهد النمر', region = 'Riyadh' where email = 'auditor-02@mim-inspection.test';
update public.profiles set full_name = 'شهد ثامر البلوي',     region = 'Riyadh' where email = 'auditor-03@mim-inspection.test';

update public.profiles set full_name = 'محمد عبدالله الدخيل', region = 'Riyadh' where email = 'compliance-admin-01@mim-inspection.test';
update public.profiles set full_name = 'سارة أحمد الغانم',    region = 'Riyadh' where email = 'compliance-admin-02@mim-inspection.test';
update public.profiles set full_name = 'تركي سعد المهنا',     region = 'Riyadh' where email = 'compliance-admin-03@mim-inspection.test';
update public.profiles set full_name = 'ريان قاسم الشعيبي',   region = 'Riyadh' where email = 'form-admin-01@mim-inspection.test';
update public.profiles set full_name = 'جواهر ناصر العمري',   region = 'Riyadh' where email = 'form-admin-02@mim-inspection.test';
update public.profiles set full_name = 'أنس وليد الجهني',     region = 'Riyadh' where email = 'form-admin-03@mim-inspection.test';
update public.profiles set full_name = 'حسام يعقوب الشايع',   region = 'Riyadh' where email = 'workflow-admin-01@mim-inspection.test';
update public.profiles set full_name = 'لينا صابر الحقيل',    region = 'Riyadh' where email = 'workflow-admin-02@mim-inspection.test';
update public.profiles set full_name = 'راكان بندر السويلم',  region = 'Riyadh' where email = 'workflow-admin-03@mim-inspection.test';
update public.profiles set full_name = 'عمار طلال البواردي',  region = 'Riyadh' where email = 'risk-owner-01@mim-inspection.test';
update public.profiles set full_name = 'نوف عيسى الدهش',      region = 'Riyadh' where email = 'risk-owner-02@mim-inspection.test';
update public.profiles set full_name = 'صالح مبارك القرني',   region = 'Riyadh' where email = 'risk-owner-03@mim-inspection.test';
update public.profiles set full_name = 'بدر عبدالمحسن الخريف', region = 'Riyadh' where email = 'gis-admin-01@mim-inspection.test';
update public.profiles set full_name = 'إيمان راشد المزروع',  region = 'Riyadh' where email = 'gis-admin-02@mim-inspection.test';
update public.profiles set full_name = 'عادل شاكر الحميدي',   region = 'Riyadh' where email = 'gis-admin-03@mim-inspection.test';
update public.profiles set full_name = 'مازن سعيد الشريف',    region = 'Riyadh' where email = 'security-admin-01@mim-inspection.test';
update public.profiles set full_name = 'رهف علي المنيف',      region = 'Riyadh' where email = 'security-admin-02@mim-inspection.test';
update public.profiles set full_name = 'ثامر جابر الرويلي',   region = 'Riyadh' where email = 'security-admin-03@mim-inspection.test';
update public.profiles set full_name = 'خالد عمر باحمدان',    region = 'Riyadh' where email = 'factory-rep-01@mim-inspection.test';
update public.profiles set full_name = 'منال زهير باعشن',     region = 'Makkah' where email = 'factory-rep-02@mim-inspection.test';
update public.profiles set full_name = 'سامي حاتم الشيخ',     region = 'Eastern' where email = 'factory-rep-03@mim-inspection.test';

-- Governed UAT identities. provision_governed_uat_identities.mjs used to write
-- 'Synthetic <alias>' into full_name, which surfaced on the shell account chip
-- as 'Synthetic planner1'. Non-production is recorded in app_metadata.data_mode
-- and seed_batch_id, which is where a machine reads it; the name is for a human.
--
-- Guarded twice on purpose: the predicate only matches rows that still carry the
-- generated label, and aliases already named by the curated section above are
-- omitted entirely. Re-running can neither clobber a real name nor change a row
-- an operator has since corrected by hand.
update public.profiles set full_name = 'عبدالعزيز السديري' where email = 'admin1@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'سعد الجهني' where email = 'admin2@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'تركي العسيري' where email = 'admin3@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'نايف البلوي' where email = 'admin4@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'رياض الحازمي' where email = 'admin5@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'مشعل الرويلي' where email = 'planner1@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'بدر النفيعي' where email = 'planner2@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'وليد الثبيتي' where email = 'planner3@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'صالح المزيني' where email = 'planner4@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'فهد الشريف' where email = 'planner5@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'ناصر القرني' where email = 'supervisor1@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'عادل الزهراني' where email = 'supervisor2@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'زياد الحربي' where email = 'supervisor3@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'حسام العتيبي' where email = 'supervisor4@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'رائد المطيري' where email = 'supervisor5@mim.gov.sa' and full_name like 'Synthetic %';
-- inspector1..5 are named in the curated block above, which is UNGUARDED and
-- therefore only wins if it runs after the provisioner. Every other alias also
-- has a guarded line here, so a provisioner run that reintroduces
-- 'Synthetic <alias>' is repaired on the next seed; without these five, only
-- inspector1..5 stayed 'Synthetic inspector1' on the account chip. Same names
-- and regions as lines 25-29, so the two blocks cannot disagree.
update public.profiles set full_name = 'سلطان عايض الشهري', region = 'Riyadh' where email = 'inspector1@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'ماجد سليمان الزهراني', region = 'Makkah' where email = 'inspector2@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'فيصل تركي العنزي', region = 'Eastern' where email = 'inspector3@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'هاني مشعل الغامدي', region = 'Madinah' where email = 'inspector4@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'ياسر راشد البقمي', region = 'Qassim' where email = 'inspector5@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'أنس العنزي' where email = 'inspector6@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'رامي الرشيد' where email = 'inspector7@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'مازن الخالدي' where email = 'inspector8@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'فارس القصيبي' where email = 'inspector9@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'عمار الصقر' where email = 'inspector10@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'باسم الجاسر' where email = 'inspector11@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'جابر الحمد' where email = 'inspector12@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'حاتم المالكي' where email = 'inspector13@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'رشيد الشهري' where email = 'inspector14@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'سلمان الفيفي' where email = 'inspector15@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'ضاري الأحمدي' where email = 'inspector16@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'عيسى العمري' where email = 'inspector17@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'غازي الصاعدي' where email = 'inspector18@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'قاسم الطلحي' where email = 'inspector19@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'لؤي السلمي' where email = 'inspector20@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'مهند الحميد' where email = 'inspector21@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'نواف الناصر' where email = 'inspector22@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'هشام الفهد' where email = 'inspector23@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'وسام السعيد' where email = 'inspector24@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'أيمن المهنا' where email = 'inspector25@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'بشير العواد' where email = 'inspector26@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'ثامر البراك' where email = 'inspector27@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'جمال التميمي' where email = 'inspector28@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'حكيم الشايع' where email = 'inspector29@mim.gov.sa' and full_name like 'Synthetic %';
update public.profiles set full_name = 'راكان الدهش' where email = 'inspector30@mim.gov.sa' and full_name like 'Synthetic %';

commit;
