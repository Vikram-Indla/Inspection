\set ON_ERROR_STOP on
begin;

do $$
begin
  if current_setting('server_version_num')::int < 150000 then
    raise exception 'LOCAL-TEST-DATA-ENV-REFUSED: unsupported database';
  end if;
end $$;

insert into public.roles(role_key,title,is_admin,is_assignable,is_internal,deprecated_at) values
 ('admin','Admin',true,true,true,null),('planner','Planner',false,true,true,null),
 ('supervisor','Supervisor',false,true,true,null),('inspector','Inspector',false,true,true,null)
on conflict (role_key) do update set title=excluded.title,is_admin=excluded.is_admin,is_assignable=true,is_internal=true,deprecated_at=null;

with people(role_key,n,uid,full_name,region,scope) as (
 values
 ('admin',1,'a1000000-0000-4000-8000-000000000001'::uuid,'نورة العتيبي','Riyadh','national'),
 ('admin',2,'a1000000-0000-4000-8000-000000000002'::uuid,'ريم القحطاني','Eastern Province','national'),
 ('admin',3,'a1000000-0000-4000-8000-000000000003'::uuid,'سارة الحربي','Makkah','national'),
 ('admin',4,'a1000000-0000-4000-8000-000000000004'::uuid,'هيا الدوسري','Madinah','national'),
 ('admin',5,'a1000000-0000-4000-8000-000000000005'::uuid,'لطيفة الشهري','Qassim','national'),
 ('planner',1,'a2000000-0000-4000-8000-000000000001'::uuid,'عبدالله السبيعي','Riyadh','regional'),
 ('planner',2,'a2000000-0000-4000-8000-000000000002'::uuid,'فيصل الغامدي','Eastern Province','regional'),
 ('planner',3,'a2000000-0000-4000-8000-000000000003'::uuid,'ماجد الزهراني','Makkah','regional'),
 ('planner',4,'a2000000-0000-4000-8000-000000000004'::uuid,'تركي المطيري','Madinah','regional'),
 ('planner',5,'a2000000-0000-4000-8000-000000000005'::uuid,'خالد الرشيدي','Qassim','regional'),
 ('supervisor',1,'a3000000-0000-4000-8000-000000000001'::uuid,'محمد العنزي','Riyadh','regional'),
 ('supervisor',2,'a3000000-0000-4000-8000-000000000002'::uuid,'أحمد الشمري','Eastern Province','regional'),
 ('supervisor',3,'a3000000-0000-4000-8000-000000000003'::uuid,'سلمان الثقفي','Makkah','regional'),
 ('supervisor',4,'a3000000-0000-4000-8000-000000000004'::uuid,'ياسر الجهني','Madinah','regional'),
 ('supervisor',5,'a3000000-0000-4000-8000-000000000005'::uuid,'بدر التميمي','Qassim','regional'),
 ('inspector',1,'a4000000-0000-4000-8000-000000000001'::uuid,'فهد الدوسري','Riyadh','regional'),
 ('inspector',2,'a4000000-0000-4000-8000-000000000002'::uuid,'عمر القحطاني','Eastern Province','regional'),
 ('inspector',3,'a4000000-0000-4000-8000-000000000003'::uuid,'زياد الحارثي','Makkah','regional'),
 ('inspector',4,'a4000000-0000-4000-8000-000000000004'::uuid,'ناصر البلوي','Madinah','regional'),
 ('inspector',5,'a4000000-0000-4000-8000-000000000005'::uuid,'راشد المطيري','Qassim','regional')
), inserted_users as (
 insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 select '00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',role_key||n||'@local.saqeel.test',
        crypt('Password',gen_salt('bf')),now(),jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role',role_key),
        jsonb_build_object('username',role_key||n),now(),now(),'','','',''
 from people on conflict (id) do update set encrypted_password=excluded.encrypted_password,raw_app_meta_data=excluded.raw_app_meta_data,raw_user_meta_data=excluded.raw_user_meta_data,updated_at=now()
 returning id
)
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select ('b'||substr(replace(uid::text,'-',''),2))::uuid,role_key||n||'@local.saqeel.test',uid,
       jsonb_build_object('sub',uid::text,'email',role_key||n||'@local.saqeel.test'),'email',now(),now(),now()
from people on conflict (provider_id,provider) do update set identity_data=excluded.identity_data,updated_at=now();

with people(role_key,n,uid,full_name,region,scope) as (
 values
 ('admin',1,'a1000000-0000-4000-8000-000000000001'::uuid,'نورة العتيبي','Riyadh','national'),('admin',2,'a1000000-0000-4000-8000-000000000002'::uuid,'ريم القحطاني','Eastern Province','national'),('admin',3,'a1000000-0000-4000-8000-000000000003'::uuid,'سارة الحربي','Makkah','national'),('admin',4,'a1000000-0000-4000-8000-000000000004'::uuid,'هيا الدوسري','Madinah','national'),('admin',5,'a1000000-0000-4000-8000-000000000005'::uuid,'لطيفة الشهري','Qassim','national'),
 ('planner',1,'a2000000-0000-4000-8000-000000000001'::uuid,'عبدالله السبيعي','Riyadh','regional'),('planner',2,'a2000000-0000-4000-8000-000000000002'::uuid,'فيصل الغامدي','Eastern Province','regional'),('planner',3,'a2000000-0000-4000-8000-000000000003'::uuid,'ماجد الزهراني','Makkah','regional'),('planner',4,'a2000000-0000-4000-8000-000000000004'::uuid,'تركي المطيري','Madinah','regional'),('planner',5,'a2000000-0000-4000-8000-000000000005'::uuid,'خالد الرشيدي','Qassim','regional'),
 ('supervisor',1,'a3000000-0000-4000-8000-000000000001'::uuid,'محمد العنزي','Riyadh','regional'),('supervisor',2,'a3000000-0000-4000-8000-000000000002'::uuid,'أحمد الشمري','Eastern Province','regional'),('supervisor',3,'a3000000-0000-4000-8000-000000000003'::uuid,'سلمان الثقفي','Makkah','regional'),('supervisor',4,'a3000000-0000-4000-8000-000000000004'::uuid,'ياسر الجهني','Madinah','regional'),('supervisor',5,'a3000000-0000-4000-8000-000000000005'::uuid,'بدر التميمي','Qassim','regional'),
 ('inspector',1,'a4000000-0000-4000-8000-000000000001'::uuid,'فهد الدوسري','Riyadh','regional'),('inspector',2,'a4000000-0000-4000-8000-000000000002'::uuid,'عمر القحطاني','Eastern Province','regional'),('inspector',3,'a4000000-0000-4000-8000-000000000003'::uuid,'زياد الحارثي','Makkah','regional'),('inspector',4,'a4000000-0000-4000-8000-000000000004'::uuid,'ناصر البلوي','Madinah','regional'),('inspector',5,'a4000000-0000-4000-8000-000000000005'::uuid,'راشد المطيري','Qassim','regional')
)
insert into public.profiles(user_id,full_name,email,region,org_scope,account_status)
select uid,full_name,role_key||n||'@local.saqeel.test',region,scope,'active' from people
on conflict (user_id) do update set full_name=excluded.full_name,email=excluded.email,region=excluded.region,org_scope=excluded.org_scope,account_status='active';

with p(role_key,n,uid) as (values
 ('admin',1,'a1000000-0000-4000-8000-000000000001'::uuid),('admin',2,'a1000000-0000-4000-8000-000000000002'::uuid),('admin',3,'a1000000-0000-4000-8000-000000000003'::uuid),('admin',4,'a1000000-0000-4000-8000-000000000004'::uuid),('admin',5,'a1000000-0000-4000-8000-000000000005'::uuid),
 ('planner',1,'a2000000-0000-4000-8000-000000000001'::uuid),('planner',2,'a2000000-0000-4000-8000-000000000002'::uuid),('planner',3,'a2000000-0000-4000-8000-000000000003'::uuid),('planner',4,'a2000000-0000-4000-8000-000000000004'::uuid),('planner',5,'a2000000-0000-4000-8000-000000000005'::uuid),
 ('supervisor',1,'a3000000-0000-4000-8000-000000000001'::uuid),('supervisor',2,'a3000000-0000-4000-8000-000000000002'::uuid),('supervisor',3,'a3000000-0000-4000-8000-000000000003'::uuid),('supervisor',4,'a3000000-0000-4000-8000-000000000004'::uuid),('supervisor',5,'a3000000-0000-4000-8000-000000000005'::uuid),
 ('inspector',1,'a4000000-0000-4000-8000-000000000001'::uuid),('inspector',2,'a4000000-0000-4000-8000-000000000002'::uuid),('inspector',3,'a4000000-0000-4000-8000-000000000003'::uuid),('inspector',4,'a4000000-0000-4000-8000-000000000004'::uuid),('inspector',5,'a4000000-0000-4000-8000-000000000005'::uuid))
insert into public.user_roles(user_id,role_key,granted_by) select uid,role_key,'a1000000-0000-4000-8000-000000000001' from p
on conflict (user_id,role_key) do nothing;

insert into public.factories(id,factory_code,name,legal_name,cr_number,license_number,region,city,activity_class,official_lat,official_lng,source,source_synced_at,employees_total,employees_saudi,capital_invested,production_capacity_note,license_status,license_stage,license_issue_date,license_expiry_date,license_holder,cr_status,exports_products) values
 ('f1000000-0000-4000-8000-000000000001','TST-RUH-001','مصنع نجد للمكونات المعدنية','شركة نجد الصناعية التجريبية','1010999001','LIC-TST-001','Riyadh','Riyadh','Fabricated metal products',24.7136,46.6753,'demo_seed:local-test-data-v1',now(),185,72,42000000,'Fictitious precision components line','active','operational','2022-01-01','2027-12-31','شركة نجد الصناعية التجريبية','active',true),
 ('f1000000-0000-4000-8000-000000000002','TST-DMM-002','مصنع الخليج للتغليف الغذائي','شركة الخليج للتغليف التجريبية','2050999002','LIC-TST-002','Eastern Province','Dammam','Food packaging',26.4207,50.0888,'demo_seed:local-test-data-v1',now(),240,118,67000000,'Fictitious flexible packaging line','active','operational','2021-03-10','2028-03-09','شركة الخليج للتغليف التجريبية','active',false),
 ('f1000000-0000-4000-8000-000000000003','TST-JED-003','مصنع البحر الأحمر للكابلات','شركة البحر الأحمر للكابلات التجريبية','4030999003','LIC-TST-003','Makkah','Jeddah','Electrical equipment',21.4858,39.1925,'demo_seed:local-test-data-v1',now(),310,154,91000000,'Fictitious low-voltage cable line','active','operational','2020-06-15','2027-06-14','شركة البحر الأحمر للكابلات التجريبية','active',true),
 ('f1000000-0000-4000-8000-000000000004','TST-MED-004','مصنع طيبة للمنتجات الزجاجية','شركة طيبة للزجاج التجريبية','4650999004','LIC-TST-004','Madinah','Madinah','Glass products',24.5247,39.5692,'demo_seed:local-test-data-v1',now(),132,61,38000000,'Fictitious architectural glass line','active','operational','2023-02-01','2029-01-31','شركة طيبة للزجاج التجريبية','active',false),
 ('f1000000-0000-4000-8000-000000000005','TST-QSM-005','مصنع القصيم للمعدات الزراعية','شركة القصيم للمعدات التجريبية','1130999005','LIC-TST-005','Qassim','Buraydah','Machinery',26.3592,43.9818,'demo_seed:local-test-data-v1',now(),96,48,25500000,'Fictitious irrigation equipment line','active','operational','2022-09-01','2028-08-31','شركة القصيم للمعدات التجريبية','active',true)
on conflict (id) do update set name=excluded.name,official_lat=excluded.official_lat,official_lng=excluded.official_lng,source=excluded.source;

insert into public.industrial_licenses(id,factory_id,license_number,plant_number,license_type,status,stage,issue_date,expiry_date,holder_name,investment_type,investment_size,source_system,source_synced_at) select
 ('f2000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('f1000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'LIC-TST-00'||g,'PLANT-TST-00'||g,'industrial','active','operational',date '2022-01-01',date '2028-12-31','Fictitious Saudi Industrial Company '||g,'private',20000000+g*5000000,'demo_seed:local-test-data-v1',now() from generate_series(1,5) g
on conflict (id) do update set status=excluded.status,updated_at=now();

insert into public.inspection_items(id,code,title,response_model,evidence_rule,guidance_en,guidance_ar,active) values
 ('71000000-0000-4000-8000-000000000001','TST-SAFETY-001','Emergency exit accessibility','{"responses":["compliant","non_compliant","na"],"mapping":{"non_compliant":{"result":"Non-Compliant"}}}','{"on":"non_compliant","min":1,"type":"photo","mandatory":true}','Verify that marked emergency exits are accessible.','التحقق من سهولة الوصول إلى مخارج الطوارئ.',true)
on conflict (id) do update set title=excluded.title,response_model=excluded.response_model;

insert into public.packages(id,code,title,scope) select ('72000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'TST-PKG-00'||g,'Saudi Industrial Core Inspection '||g,'Fictitious QA cohort '||g from generate_series(1,5) g on conflict (id) do update set title=excluded.title;
insert into public.package_versions(id,package_id,version_label,status,definition,published_at,created_by,approved_by,effective_from) select
 ('73000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('72000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'v1','published','{"sections":[{"key":"safety","title":"Safety"}],"items":[{"code":"TST-SAFETY-001","section":"safety"}]}',now()-interval '30 days',('a1000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('a3000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,current_date-30 from generate_series(1,5) g on conflict (id) do nothing;

insert into public.visit_plans(id,method,criteria,status,created_by,published_at,draft_payload,draft_version,source_channel,plan_reference) select
 ('74000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,case when g=2 then 'bulk'::planning_method else 'single'::planning_method end,'{"purpose":"local QA cohort"}', 'published',('a2000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,now()-interval '2 days',jsonb_build_object('cohort',g),1,'workbook_import','QA-PLAN-00'||g from generate_series(1,5) g on conflict (id) do update set draft_version=excluded.draft_version;

insert into public.visits(id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,operational_state,window_start,window_end,priority,notes,planner_lat,planner_lng,package_version_id,created_by,visit_location_source,visit_reference,source_channel,internal_reference,original_lat,original_lng,execution_date) select
 ('75000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('74000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('f1000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'routine','physical','published',
 (array['prepared','on_the_way','executing','executing','executing']::operational_state[])[g],now()-interval '1 hour',now()+interval '7 hours','normal','Fictitious local QA scenario '||g,
 (array[24.7136,26.4207,21.4858,24.5247,26.3592]::numeric[])[g],(array[46.6753,50.0888,39.1925,39.5692,43.9818]::numeric[])[g],('73000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('a2000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'official','QA-VISIT-00'||g,'workbook_import','COHORT-'||g,
 (array[24.7136,26.4207,21.4858,24.5247,26.3592]::numeric[])[g],(array[46.6753,50.0888,39.1925,39.5692,43.9818]::numeric[])[g],current_date from generate_series(1,5) g on conflict (id) do nothing;

insert into public.assignments(id,visit_id,inspector_id,method,status,candidates) select
 ('76000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('75000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('a4000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'manual',case when g=1 then 'assigned' else 'accepted' end,'[]' from generate_series(1,5) g on conflict (id) do update set status=excluded.status;

insert into public.visit_package_snapshots(id,visit_id,preparation_version,package_version_id,definition,checksum,created_by)
select ('76500000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,
       ('75000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,1,pv.id,pv.definition,
       encode(extensions.digest(pv.definition::text,'sha256'),'hex'),
       ('a4000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid
from generate_series(3,5) g
join public.package_versions pv on pv.id=('73000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid
on conflict (id) do nothing;

insert into public.inspections(id,visit_id,status,package_version_id,started_at,context,lifecycle_status,inspection_no) select
 ('77000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('75000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'in_progress',('73000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,now()-interval '90 minutes','{"seed_batch_id":"local-test-data-v1"}','in_progress','QA-INSP-00'||g from generate_series(3,5) g on conflict (id) do nothing;

insert into public.checklist_responses(id,inspection_id,item_id,response,is_complete) select
 ('78000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,('77000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'71000000-0000-4000-8000-000000000001',(case when g=4 then '{"value":"non_compliant"}'::jsonb else '{"value":"compliant"}'::jsonb end),true from generate_series(3,5) g on conflict (id) do nothing;

insert into public.findings(id,inspection_id,item_id,severity,description) values
 ('79000000-0000-4000-8000-000000000004','77000000-0000-4000-8000-000000000004','71000000-0000-4000-8000-000000000001','minor','Fictitious obstruction documented for returned/corrected scenario.')
on conflict (id) do nothing;

insert into public.evidence(id,inspection_id,evidence_type,linked_type,linked_id,storage_path,captured_at,captured_lat,captured_lng,content_sha256,captured_by,synced_at,visit_id,evidence_note,geo_accuracy_m,geo_source) values
 ('7a000000-0000-4000-8000-000000000004','77000000-0000-4000-8000-000000000004','photo','item','71000000-0000-4000-8000-000000000001','local-test-data-v1/cohort-4/finding-photo.jpg',now()-interval '30 minutes',24.5247,39.5692,repeat('4',64),'a4000000-0000-4000-8000-000000000004',now(),'75000000-0000-4000-8000-000000000004','Metadata only; no real image or personal data.',8,'device')
on conflict (id) do nothing;

do $$
declare
  v_sub jsonb;
  v_review uuid;
begin
  if exists (select 1 from public.submission_versions where idempotency_key='local-test-data-v1-cohort4-v2')
     and exists (select 1 from public.submission_versions where idempotency_key='local-test-data-v1-cohort5-v1') then
    return;
  end if;
  perform set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000004',true);
  v_sub := public.submit_inspection(
    '77000000-0000-4000-8000-000000000004',
    '{"sections":{"safety":{"answers":{"TST-SAFETY-001":"non_compliant"}}},"section_items":{"safety":["TST-SAFETY-001"]},"evidence_required":["71000000-0000-4000-8000-000000000001"]}',
    'local-test-data-v1-cohort4-v1','{"method":"local_qa","acknowledged":true}'
  );
  perform set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000004',true);
  v_review := public.start_review('77000000-0000-4000-8000-000000000004',(v_sub->>'submission_version_id')::uuid);
  perform public.decide_review(v_review,'return','Correct the obstructed emergency exit.','["safety"]');
  update public.checklist_responses set response='{"value":"compliant","corrected":true}',updated_at=now()
   where id='78000000-0000-4000-8000-000000000004';
  perform set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000004',true);
  v_sub := public.submit_inspection(
    '77000000-0000-4000-8000-000000000004',
    '{"sections":{"safety":{"answers":{"TST-SAFETY-001":"compliant"}}},"section_items":{"safety":["TST-SAFETY-001"]},"evidence_required":[]}',
    'local-test-data-v1-cohort4-v2','{"method":"local_qa","acknowledged":true}'
  );
  perform set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000004',true);
  v_review := public.start_review('77000000-0000-4000-8000-000000000004',(v_sub->>'submission_version_id')::uuid);
  perform public.decide_review(v_review,'approve',null,null);

  perform set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000005',true);
  v_sub := public.submit_inspection(
    '77000000-0000-4000-8000-000000000005',
    '{"sections":{"safety":{"answers":{"TST-SAFETY-001":"compliant"}}},"section_items":{"safety":["TST-SAFETY-001"]},"evidence_required":[]}',
    'local-test-data-v1-cohort5-v1','{"method":"local_qa","acknowledged":true}'
  );
  perform set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000005',true);
  perform public.start_review('77000000-0000-4000-8000-000000000005',(v_sub->>'submission_version_id')::uuid);
end $$;

commit;
