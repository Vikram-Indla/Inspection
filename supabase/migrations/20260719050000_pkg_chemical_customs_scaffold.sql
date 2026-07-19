-- ============================================================================
-- BUILD UNIT B - Chemical Clearance (فسح كيميائي) + Customs Exemption
-- (إعفاء جمركي) report configurations as PACKAGE DEFINITIONS over the existing
-- generic inspection engine (DEC-A: config-driven; no bespoke React forms, no
-- parallel backend). This migration seeds DATA only (two draft package_versions
-- rows + their localization strings). It is authored LOCALLY and MUST NOT be
-- applied against any live project.
--
-- SCOPE = CAPTURED SUBSET ONLY. Both definitions carry captured_only=true and a
-- status_note "captured subset - full catalog pending authoritative package".
-- The following are DELIBERATELY OMITTED because they are HUMAN_DECISION_REQUIRED
-- in TRANSLATION_REVIEW_REGISTER.csv and no authoritative catalog exists yet:
--   * Chemical: the VR-057 16-item chemical-safety checklist catalog.
--   * Customs:  the customs tariff-code domain (HT-019) and the
--               utilization-method / verification-method option domains behind
--               CU-004 (register disposition = HUMAN_DECISION_REQUIRED).
--   * Partial option-domain VALUES (CR-004/CR-011/CR-017/CR-023 clearance-type /
--     disposition / substance-type / country; CU-003/CU-006 item-type;
--     CR-008/CR-010/EM-102 NON_PRODUCT_REFERENCE sample data) are NOT invented
--     into checklist criteria here.
--
-- Every user-facing string is traceable to a TRANSLATION_REVIEW_REGISTER.csv
-- string_id and reuses the localization keys already seeded by
-- 20260719000000_mim_ipad_figma_localization_seed.sql
-- (figma.report.*, figma.customsreport.*, figma.establishmentmanagement.*).
-- The ui_strings rows are re-asserted below with ON CONFLICT (key) DO NOTHING so
-- this migration is self-contained and idempotent, and never clobbers an
-- already-reviewed translation. All rows land status='draft' (DEC-H: the flagged
-- legal/native-review rows remain draft but do not block development).
--
-- Package versions are inserted with status='draft': they are NOT published,
-- so the M09-012/029 publish-time dependency validation and the RBAC-002
-- maker-checker approver guard are not exercised. Promotion to a real published
-- package (with item-bank-backed inspection_items, violation/penalty mappings
-- and the full VR-057 / tariff catalogs) is the follow-on authoritative work.
--
-- Paste-safe: straight ASCII quotes and Arabic text only, no smart quotes.
-- ============================================================================

-- ---------- 1 - Localization strings (AR + EN, draft) -----------------------
-- Reuses the keys already present from the Figma localization seed; ON CONFLICT
-- DO NOTHING keeps this idempotent and non-destructive.
insert into ui_strings (key, en, ar, status, context) values
  -- Chemical report section headers (CR-002..CR-024, context = Section header)
  ('figma.report.cr002', 'Basic Data', 'البيانات الأساسية', 'draft', 'Chemical package CR-002 - section header'),
  ('figma.report.cr003', 'Chemical Clearance', 'الفسح الكيميائي', 'draft', 'Chemical package CR-003 - section header - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.report.cr005', 'Import Data', 'بيانات الاستيراد', 'draft', 'Chemical package CR-005 - section header'),
  ('figma.report.cr006', 'Raw Material Usage', 'استخدام المادة الخام', 'draft', 'Chemical package CR-006 - section header'),
  ('figma.report.cr009', 'Production Data', 'بيانات الإنتاج', 'draft', 'Chemical package CR-009 - section header'),
  ('figma.report.cr012', 'Regulatory Status', 'الحالة التنظيمية', 'draft', 'Chemical package CR-012 - section header'),
  ('figma.report.cr014', 'Chemical Data', 'البيانات الكيميائية', 'draft', 'Chemical package CR-014 - section header'),
  ('figma.report.cr015', 'International Conventions', 'الاتفاقيات الدولية', 'draft', 'Chemical package CR-015 - section header - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.report.cr016', 'Substance Usage', 'استخدام المادة', 'draft', 'Chemical package CR-016 - section header'),
  ('figma.report.cr018', 'Product Data', 'بيانات المنتج', 'draft', 'Chemical package CR-018 - section header'),
  ('figma.report.cr019', 'Export Clearance', 'الفسح التصديري', 'draft', 'Chemical package CR-019 - section header - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.report.cr021', 'Export Data', 'بيانات التصدير', 'draft', 'Chemical package CR-021 - section header'),
  ('figma.report.cr024', 'Chemical Safety', 'السلامة الكيميائية', 'draft', 'Chemical package CR-024 - section header (VR-057 catalog omitted)'),
  -- Chemical report - the 4 captured Yes/No inspection questions
  ('figma.report.cr007', 'Was the entire quantity used in the manufacturing process?', 'هل تم استخدام كامل الكمية في العملية التصنيعية؟', 'draft', 'Chemical package CR-007 - Yes/No question'),
  ('figma.report.cr013', 'Are substances restricted under international conventions used within the establishment?', 'هل يتم استخدام مواد مقيدة في اتفاقيات دولية ضمن المنشأة؟', 'draft', 'Chemical package CR-013 - Yes/No question - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.report.cr020', 'Does the establishment hold a chemical clearance for export?', 'هل المنشأة حاصل على فسح كيميائي للتصدير؟', 'draft', 'Chemical package CR-020 - Yes/No question - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.report.cr022', 'Was the entire quantity used for export?', 'هل تم استخدام كامل الكمية في التصدير؟', 'draft', 'Chemical package CR-022 - Yes/No question'),
  -- Customs report section headers + the 1 captured question + evidence label
  ('figma.customsreport.cu001', 'Customs Exemption', 'الإعفاء الجمركي', 'draft', 'Customs package CU-001 - section header'),
  ('figma.customsreport.cu002', 'Item Data', 'بيانات البنود', 'draft', 'Customs package CU-002 - section header'),
  ('figma.customsreport.cu004', 'Utilization Details', 'تفاصيل الاستفادة', 'draft', 'Customs package CU-004 - section header (tariff/utilization option domains omitted) - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.customsreport.cu005', 'Was the exemption utilized correctly?', 'هل تم الاستفادة بشكل صحيح؟', 'draft', 'Customs package CU-005 - Yes/No question - PENDING_LEGAL_NATIVE_REVIEW'),
  ('figma.customsreport.cu007', 'Photograph the Item', 'تصوير البند', 'draft', 'Customs package CU-007 - evidence action label'),
  -- Customs item field labels (EM-101..EM-106, Establishment field labels)
  ('figma.establishmentmanagement.em101', 'Product Name', 'اسم المنتج', 'draft', 'Customs package EM-101 - field label'),
  ('figma.establishmentmanagement.em103', 'Licensed Quantity', 'الكمية المرخصة', 'draft', 'Customs package EM-103 - field label'),
  ('figma.establishmentmanagement.em104', 'Approved Quantity', 'الكمية المعتمدة', 'draft', 'Customs package EM-104 - field label'),
  ('figma.establishmentmanagement.em105', 'Exemption Status', 'حالة الإعفاء', 'draft', 'Customs package EM-105 - field label'),
  ('figma.establishmentmanagement.em106', 'Last Exemption Date', 'تاريخ آخر إعفاء', 'draft', 'Customs package EM-106 - field label')
on conflict (key) do nothing;

-- ---------- 2 - Package parents (config engine ENG-02, M09) -----------------
insert into packages (id, code, title, scope) values
  ('e1000000-0000-4000-8000-000000000001', 'PKG-CHEM-CLEAR', 'Chemical Clearance (scaffold)', 'chemical clearance report family - captured subset'),
  ('e1000000-0000-4000-8000-000000000002', 'PKG-CUST-EXEMPT', 'Customs Exemption (scaffold)', 'customs exemption report family - captured subset')
on conflict (id) do nothing;

-- ---------- 3 - Chemical Clearance draft package version --------------------
-- Section scaffold from CR-002..CR-024 headers; ONLY the 4 captured Yes/No
-- questions CR-007, CR-013, CR-020, CR-022 as inspection questions. The
-- CR-024 Chemical Safety section is intentionally empty: the VR-057 16-item
-- catalog is HUMAN_DECISION_REQUIRED and pending an authoritative package.
insert into package_versions (id, package_id, version_label, status, definition) values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'v0-scaffold-2026-07-19', 'draft',
   '{
     "package_kind": "chemical_clearance",
     "captured_only": true,
     "status_note": "captured subset - full catalog pending authoritative package",
     "provenance": "TRANSLATION_REVIEW_REGISTER.csv Chemical report page, string_ids CR-002..CR-024",
     "omitted_pending_authoritative": [
       "VR-057 16-item chemical-safety checklist catalog (HUMAN_DECISION_REQUIRED)",
       "option-domain values CR-004 clearance-type / CR-011 disposition / CR-017 substance-type / CR-023 country (partial, not invented)"
     ],
     "sections": [
       {"key":"basic_data","title_key":"figma.report.cr002","title_en":"Basic Data","title_ar":"البيانات الأساسية","fields":[]},
       {"key":"chemical_clearance","title_key":"figma.report.cr003","title_en":"Chemical Clearance","title_ar":"الفسح الكيميائي","fields":[]},
       {"key":"import_data","title_key":"figma.report.cr005","title_en":"Import Data","title_ar":"بيانات الاستيراد","fields":[]},
       {"key":"raw_material_usage","title_key":"figma.report.cr006","title_en":"Raw Material Usage","title_ar":"استخدام المادة الخام","questions":[
         {"string_id":"CR-007","label_key":"figma.report.cr007","label_en":"Was the entire quantity used in the manufacturing process?","response_model":{"responses":["yes","no"]}}
       ]},
       {"key":"production_data","title_key":"figma.report.cr009","title_en":"Production Data","title_ar":"بيانات الإنتاج","fields":[]},
       {"key":"regulatory_status","title_key":"figma.report.cr012","title_en":"Regulatory Status","title_ar":"الحالة التنظيمية","questions":[
         {"string_id":"CR-013","label_key":"figma.report.cr013","label_en":"Are substances restricted under international conventions used within the establishment?","response_model":{"responses":["yes","no"]}}
       ]},
       {"key":"chemical_data","title_key":"figma.report.cr014","title_en":"Chemical Data","title_ar":"البيانات الكيميائية","fields":[]},
       {"key":"international_conventions","title_key":"figma.report.cr015","title_en":"International Conventions","title_ar":"الاتفاقيات الدولية","fields":[]},
       {"key":"substance_usage","title_key":"figma.report.cr016","title_en":"Substance Usage","title_ar":"استخدام المادة","fields":[]},
       {"key":"product_data","title_key":"figma.report.cr018","title_en":"Product Data","title_ar":"بيانات المنتج","fields":[]},
       {"key":"export_clearance","title_key":"figma.report.cr019","title_en":"Export Clearance","title_ar":"الفسح التصديري","questions":[
         {"string_id":"CR-020","label_key":"figma.report.cr020","label_en":"Does the establishment hold a chemical clearance for export?","response_model":{"responses":["yes","no"]}}
       ]},
       {"key":"export_data","title_key":"figma.report.cr021","title_en":"Export Data","title_ar":"بيانات التصدير","questions":[
         {"string_id":"CR-022","label_key":"figma.report.cr022","label_en":"Was the entire quantity used for export?","response_model":{"responses":["yes","no"]}}
       ]},
       {"key":"chemical_safety","title_key":"figma.report.cr024","title_en":"Chemical Safety","title_ar":"السلامة الكيميائية","items":[],"note":"VR-057 16-item catalog OMITTED - HUMAN_DECISION_REQUIRED authoritative package pending"}
     ],
     "action_forms": [],
     "item_rules": {}
   }')
on conflict (id) do nothing;

-- ---------- 4 - Customs Exemption draft package version ---------------------
-- Section scaffold from CU-001..CU-007; field labels EM-101..EM-106; ONLY the
-- single captured question CU-005. The tariff-code and utilization-method
-- option domains behind CU-004 are HUMAN_DECISION_REQUIRED and OMITTED.
insert into package_versions (id, package_id, version_label, status, definition) values
  ('e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'v0-scaffold-2026-07-19', 'draft',
   '{
     "package_kind": "customs_exemption",
     "captured_only": true,
     "status_note": "captured subset - full catalog pending authoritative package",
     "provenance": "TRANSLATION_REVIEW_REGISTER.csv Customs report CU-001..CU-007 + Establishment fields EM-101..EM-106",
     "omitted_pending_authoritative": [
       "customs tariff-code domain HT-019 and utilization-method / verification-method option domains behind CU-004 (HUMAN_DECISION_REQUIRED)",
       "item-type value domain CU-003 Raw Material / CU-006 Final Product (partial, not invented)"
     ],
     "sections": [
       {"key":"customs_exemption","title_key":"figma.customsreport.cu001","title_en":"Customs Exemption","title_ar":"الإعفاء الجمركي","fields":[]},
       {"key":"item_data","title_key":"figma.customsreport.cu002","title_en":"Item Data","title_ar":"بيانات البنود","fields":[
         {"key":"product_name","string_id":"EM-101","label_key":"figma.establishmentmanagement.em101","label_en":"Product Name"},
         {"key":"licensed_quantity","string_id":"EM-103","label_key":"figma.establishmentmanagement.em103","label_en":"Licensed Quantity"},
         {"key":"approved_quantity","string_id":"EM-104","label_key":"figma.establishmentmanagement.em104","label_en":"Approved Quantity"},
         {"key":"exemption_status","string_id":"EM-105","label_key":"figma.establishmentmanagement.em105","label_en":"Exemption Status"},
         {"key":"last_exemption_date","string_id":"EM-106","label_key":"figma.establishmentmanagement.em106","label_en":"Last Exemption Date"}
       ]},
       {"key":"utilization_details","title_key":"figma.customsreport.cu004","title_en":"Utilization Details","title_ar":"تفاصيل الاستفادة","questions":[
         {"string_id":"CU-005","label_key":"figma.customsreport.cu005","label_en":"Was the exemption utilized correctly?","response_model":{"responses":["yes","no"]},"evidence_prompt":{"string_id":"CU-007","label_key":"figma.customsreport.cu007","label_en":"Photograph the Item"}}
       ]}
     ],
     "action_forms": [],
     "item_rules": {}
   }')
on conflict (id) do nothing;
