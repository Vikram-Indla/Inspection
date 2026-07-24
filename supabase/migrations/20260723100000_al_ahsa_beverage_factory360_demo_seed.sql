-- ============================================================================
-- Migration 20260723100000 — Factory 360 demonstration seed for the existing
-- factory "Al Ahsa Beverage Industries" (F-3305 / CR 4030-203305 / IL-9305).
-- Sponsor live-QA data request: this factory currently renders empty
-- "Not Available" / 0 / blank Factory 360 states because it has no license
-- holder/date data, no approved inspection history, and no production-line
-- (product / raw material) rows. This migration fills those in, following the
-- exact conventions established by 0011_factory360_gis_ksa_seed.sql (KSA
-- industrial-city realism, demo-obvious names, plausible 2026 dates).
--
-- Content is clearly synthetic/demo (fictional holder name, no real-company
-- impersonation) but structurally realistic and matches production shapes.
-- ============================================================================

-- ---------- Industrial license: holder + validity window --------------------
update industrial_licenses
set holder_name = 'Al Ahsa Beverage Industries Est.',
    plant_number = coalesce(plant_number, 'PLT-9305-01'),
    license_type = coalesce(license_type, 'industrial'),
    status = coalesce(status, 'active'),
    stage = coalesce(stage, 'operating'),
    issue_date = coalesce(issue_date, date '2019-03-10'),
    expiry_date = coalesce(expiry_date, date '2027-03-09'),
    investment_type = coalesce(investment_type, 'domestic'),
    investment_size = coalesce(investment_size, 18500000),
    source_system = coalesce(source_system, 'industry_shared_demo_seed'),
    source_synced_at = coalesce(source_synced_at, now())
where id = '82883ea4-303e-4ee5-b403-75e315113718'
  and license_number = 'IL-9305';

-- ---------- Products & raw materials (plant_production_line_items) ----------
insert into plant_production_line_items (
  factory_id, industrial_license_id, item_type, source_item_id, version_number,
  name_en, name_ar, hs_code, quantity, capacity, real_production, maximum_production,
  price, is_primary, unit_code, unit_name_en, is_end_product, is_raw_material, source_system, effective_at
)
select f.id, l.id, x.item_type, x.source_item_id, 1, x.name_en, x.name_ar, x.hs_code, x.quantity, x.capacity,
       x.real_production, x.maximum_production, x.price, x.is_primary, x.unit_code, x.unit_name_en,
       x.is_end_product, x.is_raw_material, 'industry_shared_demo_seed', now()
from factories f
join industrial_licenses l on l.factory_id = f.id and l.license_number = 'IL-9305'
join (values
  ('product', 'DEMO-F3305-P1', 'Bottled natural mineral water 500ml', 'مياه معدنية طبيعية معبأة 500 مل', '2201.10', 9200000::numeric, 11000000::numeric, 8650000::numeric, 11000000::numeric, 0.85::numeric, true, 'unit', 'unit', true, false),
  ('product', 'DEMO-F3305-P2', 'Carbonated soft drink 330ml can', 'مشروب غازي معبأ بعلبة 330 مل', '2202.10', 6100000::numeric, 7500000::numeric, 5480000::numeric, 7500000::numeric, 1.10::numeric, false, 'unit', 'unit', true, false),
  ('product', 'DEMO-F3305-P3', 'Fruit juice blend 1L carton', 'عصير فواكه مخلوط كرتون 1 لتر', '2009.90', 2400000::numeric, 3000000::numeric, 2050000::numeric, 3000000::numeric, 4.25::numeric, false, 'unit', 'unit', true, false),
  ('raw_material', 'DEMO-F3305-R1', 'PET preform resin', 'راتنج بريفورم PET', '3907.61', 1850::numeric, 2200::numeric, null, null, null, false, 'tonne', 'tonne', false, true),
  ('raw_material', 'DEMO-F3305-R2', 'Food-grade citric acid', 'حمض الستريك بدرجة غذائية', '2918.14', 240::numeric, 300::numeric, null, null, null, false, 'tonne', 'tonne', false, true),
  ('raw_material', 'DEMO-F3305-R3', 'Aluminium can stock (coil)', 'لفائف صفائح الألمنيوم للعلب', '7606.12', 520::numeric, 650::numeric, null, null, null, false, 'tonne', 'tonne', false, true)
) as x(item_type, source_item_id, name_en, name_ar, hs_code, quantity, capacity, real_production, maximum_production, price, is_primary, unit_code, unit_name_en, is_end_product, is_raw_material)
  on true
where f.factory_code = 'F-3305'
  and not exists (
    select 1 from plant_production_line_items existing
    where existing.industrial_license_id = l.id and existing.superseded_at is null
  );

-- ---------- Approved inspection history (drives "Approved inspection
-- compliance" and "Approved inspections" on the Factory 360 read model) ------
do $$
declare
  v_planner uuid; v_inspector uuid; v_reviewer uuid; v_pkg uuid;
  v_factory uuid; v_plan uuid; v_visit uuid; v_ins uuid; v_sub uuid; i int;
begin
  select user_id into v_planner from profiles where email = 'planner@mim.gov.sa';
  select user_id into v_inspector from profiles where email = 'inspector@mim.gov.sa';
  select user_id into v_reviewer from profiles where email = 'reviewer@mim.gov.sa';
  -- Pinned to the package version whose frozen item_snapshot has scored items
  -- with a compliance-recognised response_model mapping (lowercase
  -- compliant/non_compliant results), so the demo compliance rate is
  -- genuinely computed by calculateApprovedCompliance(), not hardcoded.
  select id into v_pkg from package_versions where id = '4fc1f6ef-851b-420b-a240-9121753a2ffa';
  select id into v_factory from factories where factory_code = 'F-3305';

  if v_planner is null or v_inspector is null or v_reviewer is null or v_pkg is null or v_factory is null then
    raise notice 'Al Ahsa demo seed skipped — personas/package/factory missing';
    return;
  end if;

  if exists (select 1 from visits v where v.factory_id = v_factory and v.operational_state = 'submitted') then
    raise notice 'Al Ahsa demo seed skipped — inspection history already present';
    return;
  end if;

  for i in 1..3 loop
    insert into visit_plans (method, status, created_by, published_at)
    values ('single', 'published', v_planner, now() - (i || ' months')::interval - interval '10 days')
    returning id into v_plan;

    insert into visits (visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
                        operational_state, window_start, window_end, package_version_id)
    values (v_plan, v_factory, 'periodic', 'physical', 'published', 'submitted',
            now() - (i || ' months')::interval - interval '9 days',
            now() - (i || ' months')::interval - interval '8 days', v_pkg)
    returning id into v_visit;

    insert into assignments (visit_id, inspector_id, method) values (v_visit, v_inspector, 'manual');

    insert into inspections (visit_id, package_version_id, status, started_at, submitted_at)
    values (v_visit, v_pkg, 'approved',
            now() - (i || ' months')::interval - interval '9 days',
            now() - (i || ' months')::interval - interval '8 days 18 hours')
    returning id into v_ins;

    -- Most recent cycle (i=1) shows one open item, matching a realistic
    -- "verify on next visit" demo state; older cycles are clean.
    insert into submission_versions (inspection_id, version_number, snapshot, idempotency_key, acknowledgement, submitted_by, submitted_at)
    values (v_ins, 1,
            jsonb_build_object('answers', jsonb_build_object(
              'F360R016-PASS', 'compliant',
              'F360R016-FAIL', case when i = 1 then 'non_compliant' else 'compliant' end,
              'F360R016-NOTE', 'compliant'
            ), 'seed', true),
            gen_random_uuid()::text,
            '{"name":"Factory representative","signed":true}',
            v_inspector, now() - (i || ' months')::interval - interval '8 days 17 hours')
    returning id into v_sub;

    insert into reviews (inspection_id, submission_version_id, reviewer_id, status, decision, decision_reason, decided_at)
    values (v_ins, v_sub, v_reviewer, 'approved', 'approve',
            'Historical cycle — evidence adequate (demo seed, Al Ahsa Beverage Industries).',
            now() - (i || ' months')::interval - interval '7 days');
  end loop;
end $$;
