-- ============================================================================
-- Migration 0003 — Contract seed data: the exact configuration the design
-- frames specified (SBC-801, FS/EG/HZ items, Fire & Life Safety package,
-- V-FS violation codes, penalty mappings, demo factories).
-- ============================================================================

insert into regulations (id, code, title, issuing_authority, status) values
 ('a0000000-0000-4000-8000-000000000001','SBC-801','Fire Code — Industrial','Saudi Building Code Committee','published');

insert into regulation_clauses (id, regulation_id, clause_ref, title, applicability, legal_source) values
 ('a0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000001','4.2','Portable extinguishers — service & tagging','all industrial occupancies','Royal Decree M/43 art. 12'),
 ('a0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000001','4.7','Fire pump weekly churn test','facilities with fixed pumps','SBC-801'),
 ('a0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000001','5.1','Exit route obstruction','all occupancies','SBC-801'),
 ('a0000000-0000-4000-8000-000000000014','a0000000-0000-4000-8000-000000000001','7.3','Hazmat segregation per class','hazmat storage','SBC-801');

insert into inspection_items (id, code, title, clause_id, response_model, evidence_rule, score_weight, guidance_en) values
 ('b0000000-0000-4000-8000-000000000101','FS-101','Extinguisher service tags current','a0000000-0000-4000-8000-000000000011',
  '{"responses":["compliant","non_compliant","na"],"mapping":{"non_compliant":{"result":"Non-Compliant","violation":"V-FS-09","action_form":"corrective_blocking"}}}',
  '{"on":"non_compliant","type":"photo","min":1,"mandatory":true}', 5, 'Check service tag dates on all extinguishers'),
 ('b0000000-0000-4000-8000-000000000102','FS-102','Sprinkler control valve accessible & sealed open','a0000000-0000-4000-8000-000000000011',
  '{"responses":["compliant","non_compliant","na"],"mapping":{"non_compliant":{"result":"Non-Compliant"}},"score_excluded_on":["na"]}',
  null, 5, 'Valve must be accessible and sealed in open position'),
 ('b0000000-0000-4000-8000-000000000107','FS-107','Pump room weekly run log','a0000000-0000-4000-8000-000000000012',
  '{"responses":["value_date"],"conditional":{"visible_when":"fire_pump_present=yes","mandatory_when_visible":true}}',
  '{"on":"any","type":"document","mandatory":false}', 3, 'Verify weekly churn test log'),
 ('b0000000-0000-4000-8000-000000000201','EG-201','Exit routes unobstructed','a0000000-0000-4000-8000-000000000013',
  '{"responses":["compliant","non_compliant"],"mapping":{"non_compliant":{"result":"Non-Compliant","violation":"V-FS-01","action_form":"corrective_blocking"}}}',
  '{"on":"non_compliant","type":"photo","min":1,"mandatory":true,"note":true}', 8, 'All egress paths clear of obstruction'),
 ('b0000000-0000-4000-8000-000000000310','HZ-310','Hazmat segregation per class','a0000000-0000-4000-8000-000000000014',
  '{"responses":["compliant","non_compliant","na"],"conditional":{"visible_when":"hazmat_present=yes","mandatory_when_visible":true},"mapping":{"non_compliant":{"result":"Non-Compliant","violation":"V-HZ-02"}}}',
  '{"on":"non_compliant","type":"photo","min":1,"mandatory":true}', 8, 'Verify segregation distances per hazard class');

insert into packages (id, code, title, scope) values
 ('c0000000-0000-4000-8000-000000000001','PKG-FS','Fire & Life Safety — General Factories','general industrial occupancies');

insert into package_versions (id, package_id, version_label, status, definition, published_at) values
 ('c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000001','v2026.07.02','published',
  '{"sections":[
     {"key":"factory_verification","title":"Factory verification","fields":["rep_name","rep_role","location_confirm"]},
     {"key":"s1","title":"Fire protection systems","items":["FS-101","FS-102","FS-107"],"mandatory":true},
     {"key":"s2","title":"Exits & evacuation","items":["EG-201"],"mandatory":true},
     {"key":"s3","title":"Hazardous materials","items":["HZ-310"],"mandatory":true}],
    "action_forms":[{"key":"corrective_blocking","title":"Corrective action form","blocking":true,"fields":["owner_name","owner_role","due_at","required_correction"]}]}',
  '2026-07-02T08:00:00Z');

insert into violation_codes (id, code, title, level, clause_id, active_from) values
 ('d0000000-0000-4000-8000-000000000001','V-FS-01','Exit route obstruction','L1','a0000000-0000-4000-8000-000000000013','2026-07-10'),
 ('d0000000-0000-4000-8000-000000000009','V-FS-09','Extinguisher service lapsed','L2','a0000000-0000-4000-8000-000000000011','2026-07-10'),
 ('d0000000-0000-4000-8000-000000000022','V-HZ-02','Hazmat segregation breach','L1','a0000000-0000-4000-8000-000000000014','2026-07-10');

insert into penalty_mappings (violation_code_id, penalty_ref, penalty_range, repeat_rule, legal_basis, mapping_version) values
 ('d0000000-0000-4000-8000-000000000001','P-001','{"schedule":"approved"}','{"repeat_12mo":"escalate_one_level"}','SBC-801 §5.1 / M-43','v3'),
 ('d0000000-0000-4000-8000-000000000009','P-014','{"schedule":"approved"}','{"repeat_12mo":"escalate_one_level"}','SBC-801 §4.2 / M-43','v3'),
 ('d0000000-0000-4000-8000-000000000022','P-031','{"schedule":"approved"}','{"repeat_12mo":"escalate_one_level"}','SBC-801 §7.3','v3');

insert into factories (id, factory_code, name, cr_number, license_number, region, city, activity_class, official_lat, official_lng, source_synced_at, risk_score, risk_band, risk_version) values
 ('f0000000-0000-4000-8000-000000002214','F-2214','Al Amal Plastics Factory','4030-118845','IL-7741','Riyadh','2nd Industrial City','plastics', 24.7136000, 46.6753000, now(), 52.00,'medium','v1-accepted-2026-07-11'),
 ('f0000000-0000-4000-8000-000000002215','F-2215','Gulf Steel Works','4030-102211','IL-5520','Riyadh','Sudair','steel', 25.0731000, 45.5601000, now(), 74.50,'high','v1-accepted-2026-07-11'),
 ('f0000000-0000-4000-8000-000000002216','F-2216','Najd Food Industries','4030-095512','IL-3311','Riyadh','3rd Industrial City','food', 24.5943000, 46.8802000, now(), 31.25,'low','v1-accepted-2026-07-11'),
 ('f0000000-0000-4000-8000-000000002217','F-2217','Sudair Polymer Co.','4030-140033','IL-8804','Riyadh','Sudair','plastics', 25.0698000, 45.5722000, now(), 66.00,'medium','v1-accepted-2026-07-11');
