# Factory / Product / Raw-Material Coherence Rules

Purpose: prevent the exact class of error found in the legacy SENAI export
(a perfume factory linked to sunflower-seed oil; `asdf` as a mechanism value;
`onsite` as a fuel type; 21 unlicensed products against 2 actual licensed
ones). Every synthetic factory in `FACTORY_MASTER_SEED_PLAN.csv` must satisfy
every rule below before it is used in any scenario.

## Rule 1 — sector is the single source of truth for products

A factory's `sector_activity_class` (mapped to `factories.activity_class`)
determines the **closed set** of plausible product families. A product name
may only be assigned to a factory if it appears in that sector's allowed
family list below. No product may be invented outside its sector's list
without updating this document first (change-controlled, same as any other
product-contract artifact).

| sector_activity_class | allowed product families (examples, HS chapter) | disallowed cross-sector examples |
|---|---|---|
| petrochemical | polyethylene/polypropylene resin (39), ethylene glycol (29), ammonia (28), industrial solvents (29) | food products, textiles, ceramics |
| plastics | injection-molded goods (39), PVC pipe/fittings (39), PET preforms (39) | steel bar, dairy products |
| steel | rebar/wire rod/structural sections (72), sheet-metal fabrications, steel doors | plastics resin, cosmetics |
| machinery | pumps, irrigation equipment, tractor implements, industrial pumps (84) | fertilizer, seafood |
| food | milled grain, dairy, seafood, dates, beverages, mineral water (per 04/09/11/19/20/22 chapters, sub-typed by factory) | industrial solvents, cement |
| chemical | detergents, surfactants, specialty/industrial chemicals (34/38) | dairy, textiles |
| paper | corrugated boxes, tissue, kraft paper products (48) | steel, fertilizer |
| fertilizer | urea, ammonia, ammonium compounds (31) | ceramics, textiles |
| composites | carbon-fiber panels, fiberglass products | dairy, paper |
| electrical | cables, wiring harnesses, low-voltage equipment (85) | food, cement |
| pharmaceutical_packaging | blister packs, sterile secondary packaging, printed cartons (39/48/76 laminate) | raw fertilizer, seafood |
| cement | precast blocks, cement paving/bags (68) | electronics, textiles |
| aluminum | extruded profiles, aluminum rod/billet products (76) | dairy, fertilizer |
| ceramics | glazed tile, sanitaryware (69) | steel bar, cables |
| electronics | consumer electronics assembly, PCB sub-assemblies (85) | cement, fertilizer |
| textiles | woven fabric, workwear garments (52/61/62) | petrochemical resin, cement |

## Rule 2 — raw materials must be upstream of the assigned products

For every product assigned to a factory, its raw materials must be a
plausible upstream input to that specific product, not merely "in the same
sector." Example correct chain (F-3303, already seeded in
`0017_w3_factory_master_data.sql`): granular urea (product) ← natural gas
feedstock (material); anhydrous ammonia (product) ← natural gas feedstock
(material). Example of what Rule 2 forbids: assigning "sunflower-seed oil"
as a raw material to a factory whose product is "perfume" — oil-seed
extraction is not an upstream input to fragrance compounding, which is the
exact legacy SENAI defect this rule exists to prevent.

## Rule 3 — HS code chapter must match the product family

Every `hs_code` value seeded into `factory_products.hs_code` or
`plant_production_line_items.hs_code` must fall in the HS chapter
appropriate to Rule 1's family (e.g. chapter 39 for plastics/polymers,
chapter 72 for iron/steel, chapter 31 for fertilizers). A product whose name
says "urea" but whose `hs_code` is a textile chapter is a coherence
violation and must be rejected by the seeder's validation pass
(`14-validation.ts` in the seeder architecture plan).

## Rule 4 — `source` on `factory_materials` must be defensible

`factory_materials.source` is constrained to `local` / `imported`
(`0017_w3_factory_master_data.sql:35`). Assign `local` only to materials
genuinely available inside Saudi Arabia for that sector (e.g. natural gas
feedstock, ferrous scrap, aggregate/sand, local dates/produce). Assign
`imported` to materials not domestically produced at the required grade
(e.g. PCB blanks, ball clay/kaolin, cotton fiber, pharma-grade laminate).
Do not default every row to one value — the legacy export's repeated
identical values (e.g. all counts exactly 12) is the failure mode Rule 4
exists to avoid at the raw-material level.

## Rule 5 — no placeholder or free-association text

Never seed values like the legacy `asdf` mechanism or `onsite` fuel type.
Every free-text field (`production_capacity_note`, `role_title`,
`doc_type`, etc.) must be a real, sector-plausible sentence or token drawn
from an existing governed vocabulary (`planning_lookups`, `ui_strings`) where
one exists, or a specific, checkable synthetic fact otherwise (e.g.
"Two extrusion lines + one injection hall; ~85% utilization" — the pattern
already used in `0017_w3_factory_master_data.sql:116-121`).

## Rule 6 — licensed-product count must be internally consistent

The legacy SENAI defect of "21 unlicensed products vs. 2 actual/licensed
products" must not repeat. Every `factory_products` row for a seeded
factory must have a corresponding `industrial_licenses`-backed activity
(once the v2 `plant_production_line_items.is_end_product` /
`is_raw_material` typing is populated, per the schema gap noted in
`FACTORY_MASTER_SEED_PLAN.csv`). Do not seed more product rows than the
factory's license realistically supports (2–4 primary product lines is the
realistic range used throughout this plan, matching the existing
`0017_w3_factory_master_data.sql` pattern of one `is_primary=true` product
plus 1–2 secondary products per factory).

## Rule 7 — one factory, one coherent Factory 360 story

Every factory in `FACTORY_MASTER_SEED_PLAN.csv` must be assignable to at
least one complete scenario in `SEED_SCENARIO_CATALOG.csv` (identity, GIS
location, licence, products/materials, at least one visit/inspection
history entry or a clearly-stated "never visited" status, and a documented
risk band). A factory row that cannot be attached to any scenario is not
acceptable inventory — it is dead seed data, per the acceptance gate
"no frontend fixture appears in a QA journey."

## Open item

Column-level enforcement (a DB `CHECK` mapping `hs_code` chapter to
`activity_class`, or a trigger validating raw-material/product coherence)
does not exist today and is out of scope for this discovery-and-plan
exercise; Rules 1–7 are currently enforceable only at seeder-script
validation time (`14-validation.ts`), not at the database constraint layer.
This is noted as a design decision to raise with the compliance_admin/
form_admin owners before implementation, not invented here.
