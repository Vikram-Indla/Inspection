-- ============================================================================
-- Migration 0011 — Factory 360 write surfaces (documents, representatives),
-- per-factory geofence override (G-MAP), and KSA-realistic seed expansion
-- (factories across Saudi industrial cities + inspection history) so the
-- platform demos and tests against Ministry-of-Industry-like data.
-- ============================================================================

-- ---------- Factory 360: documents & representatives (SB11 write legs) ------
create table if not exists factory_documents (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  doc_type text not null,                       -- license | cr | safety_cert | layout | other
  title text not null,
  reference_no text,
  valid_from date, valid_to date,
  storage_path text,
  uploaded_by uuid references profiles(user_id),
  created_at timestamptz not null default now()
);
create table if not exists factory_representatives (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  full_name text not null,
  role_title text,
  phone text, email text,
  is_primary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table factory_documents enable row level security;
alter table factory_representatives enable row level security;
create policy fdocs_read on factory_documents for select using (auth.uid() is not null);
create policy fdocs_write on factory_documents for insert with check (has_any_role(array['planner','ops','compliance_admin','gis_admin']));
create policy freps_read on factory_representatives for select using (auth.uid() is not null);
create policy freps_write on factory_representatives for insert with check (has_any_role(array['planner','ops','compliance_admin']));
create policy freps_update on factory_representatives for update using (has_any_role(array['planner','ops','compliance_admin']));

-- ---------- G-MAP: per-factory geofence override (falls back to ENG gis) ----
alter table factories add column if not exists geofence_radius_m integer;
comment on column factories.geofence_radius_m is
  'Per-factory geofence override (G-MAP). NULL = engine_settings gis.geofence_default_radius_m. GIS Admin owned.';

-- ---------- KSA seed expansion: factories across industrial cities ----------
insert into factories (factory_code, name, cr_number, license_number, region, city, activity_class, official_lat, official_lng, source_synced_at, risk_score, risk_band, risk_version) values
 ('F-1101','Riyadh Advanced Petrochem Co.','4030-201101','IL-9101','Riyadh','2nd Industrial City','petrochemical',24.7060000,46.7680000,now(),81.50,'high','v1-accepted-2026-07-11'),
 ('F-1102','Al Watania Plastics','4030-201102','IL-9102','Riyadh','2nd Industrial City','plastics',24.7010000,46.7710000,now(),46.00,'medium','v1-accepted-2026-07-11'),
 ('F-1103','Najd Steel Fabrication','4030-201103','IL-9103','Riyadh','3rd Industrial City','steel',24.5890000,46.8850000,now(),68.25,'high','v1-accepted-2026-07-11'),
 ('F-1104','Alkhorayef Industrial Equipment','4030-201104','IL-9104','Riyadh','1st Industrial City','machinery',24.6540000,46.7770000,now(),35.00,'low','v1-accepted-2026-07-11'),
 ('F-1105','Saudi Dairy & Foodstuff (SADAFCO) Plant 2','4030-201105','IL-9105','Riyadh','Sudair','food',25.0800000,45.5650000,now(),29.75,'low','v1-accepted-2026-07-11'),
 ('F-2201','Jeddah Chemical Industries','4030-202201','IL-9201','Makkah','Jeddah Industrial City 1','chemical',21.4230000,39.2660000,now(),77.00,'high','v1-accepted-2026-07-11'),
 ('F-2202','Red Sea Food Processing','4030-202202','IL-9202','Makkah','Jeddah Industrial City 2','food',21.3980000,39.2830000,now(),33.50,'low','v1-accepted-2026-07-11'),
 ('F-2203','Arabian Paper Products','4030-202203','IL-9203','Makkah','Jeddah Industrial City 3','paper',21.3660000,39.3080000,now(),52.25,'medium','v1-accepted-2026-07-11'),
 ('F-2204','Rabigh Polymers Complex','4030-202204','IL-9204','Makkah','Rabigh PlusTech Park','petrochemical',22.7460000,39.0180000,now(),84.00,'high','v1-accepted-2026-07-11'),
 ('F-3301','Dammam Metal Works','4030-203301','IL-9301','Eastern','Dammam 1st Industrial City','steel',26.4340000,50.1030000,now(),61.00,'medium','v1-accepted-2026-07-11'),
 ('F-3302','Gulf Cables & Electrical','4030-203302','IL-9302','Eastern','Dammam 2nd Industrial City','electrical',26.3520000,50.0350000,now(),48.75,'medium','v1-accepted-2026-07-11'),
 ('F-3303','Jubail Fertilizer Co. (SAFCO IV)','4030-203303','IL-9303','Eastern','Jubail Industrial City 1','fertilizer',27.0450000,49.5610000,now(),88.25,'high','v1-accepted-2026-07-11'),
 ('F-3304','Jubail Advanced Composites','4030-203304','IL-9304','Eastern','Jubail Industrial City 2','composites',27.0740000,49.4880000,now(),57.50,'medium','v1-accepted-2026-07-11'),
 ('F-3305','Al Ahsa Beverage Industries','4030-203305','IL-9305','Eastern','Al Ahsa Industrial City','food',25.3620000,49.5850000,now(),27.00,'low','v1-accepted-2026-07-11'),
 ('F-4401','Yanbu Refining Support Industries','4030-204401','IL-9401','Madinah','Yanbu Industrial City','petrochemical',23.9820000,38.2260000,now(),79.75,'high','v1-accepted-2026-07-11'),
 ('F-4402','Madinah Dates Processing Co.','4030-204402','IL-9402','Madinah','Madinah Industrial City','food',24.4310000,39.5980000,now(),24.50,'low','v1-accepted-2026-07-11'),
 ('F-5501','Qassim Agricultural Machinery','4030-205501','IL-9501','Qassim','Qassim Industrial City','machinery',26.3050000,43.9080000,now(),41.25,'medium','v1-accepted-2026-07-11'),
 ('F-5502','Hail Cement Products','4030-205502','IL-9502','Hail','Hail Industrial City','cement',27.4980000,41.6580000,now(),55.00,'medium','v1-accepted-2026-07-11'),
 ('F-6601','Asir Mineral Water Co.','4030-206601','IL-9601','Asir','Abha Industrial City','food',18.2540000,42.6100000,now(),22.75,'low','v1-accepted-2026-07-11'),
 ('F-6602','Jazan Aluminum Extrusions','4030-206602','IL-9602','Jazan','Jazan Economic City','aluminum',17.2120000,42.6740000,now(),63.50,'medium','v1-accepted-2026-07-11')
on conflict (factory_code) do nothing;

-- Representatives + a document + geofence override for the demo core four
insert into factory_representatives (factory_id, full_name, role_title, phone, email, is_primary)
select id, x.full_name, x.role_title, x.phone, x.email, true from factories f
join (values
  ('F-2214','Ahmed Al-Saleh','HSE Manager','+966-50-1102214','a.saleh@alamalplastics.example'),
  ('F-2215','Khalid Al-Mutairi','Plant Director','+966-55-1102215','k.mutairi@gulfsteel.example'),
  ('F-2216','Sara Al-Qahtani','Compliance Officer','+966-54-1102216','s.qahtani@najdfood.example'),
  ('F-3303','Fahad Al-Dossary','Safety Superintendent','+966-53-1103303','f.dossary@safco.example')
) as x(code, full_name, role_title, phone, email) on x.code = f.factory_code
where not exists (select 1 from factory_representatives r where r.factory_id = f.id);

insert into factory_documents (factory_id, doc_type, title, reference_no, valid_from, valid_to)
select id, 'license', 'Industrial license', f.license_number, current_date - interval '20 months', current_date + interval '16 months'
from factories f where f.factory_code in ('F-2214','F-2215','F-2216','F-3303')
and not exists (select 1 from factory_documents d where d.factory_id = f.id);

update factories set geofence_radius_m = 250 where factory_code in ('F-3303','F-2204') and geofence_radius_m is null; -- large complexes

-- ---------- Inspection history: completed cycles over past months -----------
do $$
declare
  v_planner uuid; v_inspector uuid; v_reviewer uuid; v_pkg uuid;
  f record; v_plan uuid; v_visit uuid; v_ins uuid; v_sub uuid; i int := 0;
begin
  select user_id into v_planner from profiles where email = 'planner@mim.gov.sa';
  select user_id into v_inspector from profiles where email = 'inspector@mim.gov.sa';
  select user_id into v_reviewer from profiles where email = 'reviewer@mim.gov.sa';
  select id into v_pkg from package_versions where status = 'published' order by published_at desc limit 1;
  if v_planner is null or v_inspector is null or v_reviewer is null or v_pkg is null then
    raise notice 'seed history skipped — personas/package missing'; return;
  end if;

  for f in select id, factory_code from factories
           where factory_code in ('F-1101','F-1103','F-2201','F-2203','F-3301','F-3303','F-4401','F-5501')
           order by factory_code loop
    i := i + 1;
    -- skip if this factory already has history
    continue when exists (
      select 1 from visits v where v.factory_id = f.id and v.operational_state = 'submitted');

    insert into visit_plans (method, status, created_by, published_at)
    values ('bulk', 'published', v_planner, now() - (i || ' months')::interval - interval '10 days')
    returning id into v_plan;

    insert into visits (visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
                        operational_state, window_start, window_end, package_version_id)
    values (v_plan, f.id, 'periodic', 'physical', 'published', 'submitted',
            now() - (i || ' months')::interval - interval '9 days',
            now() - (i || ' months')::interval - interval '8 days', v_pkg)
    returning id into v_visit;

    insert into assignments (visit_id, inspector_id, method) values (v_visit, v_inspector, 'manual');

    insert into inspections (visit_id, package_version_id, status, started_at, submitted_at)
    values (v_visit, v_pkg, 'approved',
            now() - (i || ' months')::interval - interval '9 days',
            now() - (i || ' months')::interval - interval '8 days 18 hours')
    returning id into v_ins;

    insert into submission_versions (inspection_id, version_number, snapshot, idempotency_key, acknowledgement, submitted_by, submitted_at)
    values (v_ins, 1,
            jsonb_build_object('answers', jsonb_build_object('FS-101','compliant','FS-102','compliant','EG-201','compliant','HZ-310', case when i % 3 = 0 then 'non_compliant' else 'compliant' end), 'seed', true),
            gen_random_uuid()::text,
            '{"name":"Factory representative","signed":true}',
            v_inspector, now() - (i || ' months')::interval - interval '8 days 17 hours')
    returning id into v_sub;

    insert into reviews (inspection_id, submission_version_id, reviewer_id, status, decision, decision_reason, decided_at)
    values (v_ins, v_sub, v_reviewer, 'approved', 'approve',
            'Historical cycle — evidence adequate (seeded history).',
            now() - (i || ' months')::interval - interval '7 days');
  end loop;
end $$;
