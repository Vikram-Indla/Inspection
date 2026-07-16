-- ============================================================================
-- Migration 0017 — W3 Factory 360 master data (M07-006/007/008/009).
-- Products (HS codes, capacity), raw materials (local|imported), and
-- source-owned workforce/indicator columns on factories, plus realistic seed
-- rows for the four core demo factories (F-2214/15/16, F-3303) so the
-- Products / Materials / Workforce & Indicators tabs are never empty.
-- Maintainability contract:
--   * factory_products / factory_materials — maintainable in-app
--     (RLS insert: planner|ops|compliance_admin, same as docs/reps in 0011).
--   * employees_total / employees_saudi / capital_invested /
--     production_capacity_note — read-only-from-source like identity
--     (M07-002): displayed only, no app write surface.
-- ============================================================================

-- ---------- M07-006 — products & HS codes ----------------------------------
create table if not exists factory_products (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  name text not null,
  hs_code text,                                  -- harmonized system code, e.g. 3920.10
  unit text,                                     -- tonne | unit | m3 | ...
  annual_capacity numeric(14,2),                 -- in `unit` per year
  is_primary boolean not null default false,
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now()
);
comment on table factory_products is
  'M07-006 — factory product list with HS codes and production capacity. Maintainable by planner/ops/compliance_admin.';

-- ---------- M07-007 — raw materials -----------------------------------------
create table if not exists factory_materials (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  name text not null,
  source text not null default 'local' check (source in ('local','imported')),
  hs_code text,
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now()
);
comment on table factory_materials is
  'M07-007 — raw material list (source: local|imported). Maintainable by planner/ops/compliance_admin.';

alter table factory_products enable row level security;
alter table factory_materials enable row level security;
create policy fprod_read  on factory_products  for select using (auth.uid() is not null);
create policy fprod_write on factory_products  for insert with check (has_any_role(array['planner','ops','compliance_admin']));
create policy fmat_read   on factory_materials for select using (auth.uid() is not null);
create policy fmat_write  on factory_materials for insert with check (has_any_role(array['planner','ops','compliance_admin']));

create index if not exists fprod_factory_idx on factory_products (factory_id);
create index if not exists fmat_factory_idx  on factory_materials (factory_id);

-- ---------- M07-008/009 — workforce & industrial indicators (source-owned) --
alter table factories add column if not exists employees_total integer;
alter table factories add column if not exists employees_saudi integer;
alter table factories add column if not exists capital_invested numeric(16,2);   -- SAR
alter table factories add column if not exists production_capacity_note text;
comment on column factories.employees_total is
  'M07-008 — source-owned (registry sync). Display-only in-app; no write surface.';
comment on column factories.employees_saudi is
  'M07-008 — source-owned (registry sync). Display-only in-app; Saudization % derived.';
comment on column factories.capital_invested is
  'M07-009 — source-owned (registry sync), SAR. Display-only in-app.';
comment on column factories.production_capacity_note is
  'M07-009 — source-owned (registry sync). Display-only in-app.';

-- ---------- Seed: products for the demo core four ---------------------------
insert into factory_products (factory_id, name, hs_code, unit, annual_capacity, is_primary)
select f.id, x.name, x.hs_code, x.unit, x.annual_capacity, x.is_primary
from factories f
join (values
  -- F-2214 Al Amal Plastics Factory
  ('F-2214','Polyethylene film rolls','3920.10','tonne',12000.00,true),
  ('F-2214','PET bottle preforms','3923.30','tonne',8500.00,false),
  ('F-2214','HDPE pressure pipes','3917.21','tonne',6400.00,false),
  -- F-2215 Gulf Steel Works
  ('F-2215','Reinforcement steel bars (rebar)','7214.20','tonne',180000.00,true),
  ('F-2215','Steel wire rod in coils','7213.91','tonne',95000.00,false),
  ('F-2215','Structural H/I sections','7216.33','tonne',40000.00,false),
  -- F-2216 Najd Food Industries
  ('F-2216','Wheat flour','1101.00','tonne',60000.00,true),
  ('F-2216','Dried pasta','1902.19','tonne',15000.00,false),
  ('F-2216','Compound animal feed pellets','2309.90','tonne',22000.00,false),
  -- F-3303 Jubail Fertilizer Co. (SAFCO IV)
  ('F-3303','Granular urea','3102.10','tonne',1100000.00,true),
  ('F-3303','Anhydrous ammonia','2814.10','tonne',500000.00,false)
) as x(code, name, hs_code, unit, annual_capacity, is_primary) on x.code = f.factory_code
where not exists (select 1 from factory_products p where p.factory_id = f.id);

-- ---------- Seed: raw materials for the demo core four ----------------------
insert into factory_materials (factory_id, name, source, hs_code)
select f.id, x.name, x.source, x.hs_code
from factories f
join (values
  ('F-2214','Polyethylene resin (LLDPE)','imported','3901.10'),
  ('F-2214','PET resin','imported','3907.61'),
  ('F-2214','Color masterbatch','local','3206.19'),
  ('F-2215','Ferrous scrap','local','7204.49'),
  ('F-2215','Semi-finished iron billets','imported','7207.11'),
  ('F-2215','Ferroalloys','imported','7202.99'),
  ('F-2216','Milling wheat grain','imported','1001.99'),
  ('F-2216','Durum semolina','imported','1103.11'),
  ('F-2216','Food-grade packaging film','local','3920.20'),
  ('F-3303','Natural gas feedstock','local','2711.21'),
  ('F-3303','Anti-caking additive','imported','3824.99')
) as x(code, name, source, hs_code) on x.code = f.factory_code
where not exists (select 1 from factory_materials m where m.factory_id = f.id);

-- ---------- Seed: workforce & indicators (source-owned snapshot) -------------
update factories f set
  employees_total = x.employees_total,
  employees_saudi = x.employees_saudi,
  capital_invested = x.capital_invested,
  production_capacity_note = x.note
from (values
  ('F-2214', 240,  92,   45000000.00, 'Two extrusion lines + one injection hall; ~85% utilization (registry sync).'),
  ('F-2215', 620, 210,  380000000.00, 'EAF meltshop + rolling mill; ~92% utilization (registry sync).'),
  ('F-2216', 310, 145,   95000000.00, 'Milling and pasta lines; seasonal peak in Q4 (registry sync).'),
  ('F-3303', 850, 510, 2100000000.00, 'Urea/ammonia trains; maintenance turnaround planned H2 (registry sync).')
) as x(code, employees_total, employees_saudi, capital_invested, note)
where f.factory_code = x.code and f.employees_total is null;
