-- ============================================================================
-- Visit Report · Results (Step 3 of 4) — persistence.
--
-- DESIGN OF RECORD: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html.
-- The screen is five cards over one inspection:
--   1 Specialty Details        → visit_result_reports.specialty_*
--   2 Sample Details           → visit_result_samples (gated repeater)
--   3 Seizure Details          → visit_result_seized_products (gated repeater)
--   4 Documents Pending Review → visit_result_reports.pending_document_type
--   5 Inspector Notes          → visit_result_reports.inspector_notes
--
-- REQUIREMENTS POSITION — read this before extending the table.
-- All 30 columns of product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv
-- (478 rows) were searched. 'specialty', 'competent', 'sample', 'seizure' and
-- 'seiz' return ZERO rows. 'inspector note' returns exactly one, CR-258
-- ("Capture Inspector Comments"), whose target_designs is PHASE2_IPAD_DEFERRED.
-- So this screen's entities are design-derived, not requirement-derived. They
-- are modelled here because the design is authority on structure, but NO
-- business rule, threshold, SLA, retention period or option domain is inferred
-- from that structure. Anything of that kind must arrive through change
-- control, not through this file.
--
-- Modelled verbatim on the already-governed incident_reports pattern
-- (20260720010000_incident_reports.sql), which resolved the identical problem:
-- a design-derived form whose option domains are uncaptured.
--
-- Every safety primitive below is REUSED, none is invented:
--   · guard_submitted_inspection()  (0002-era; already on checklist_responses,
--     evidence, findings, inspection_factory_checks, inspection_item_states)
--     — this is the design's "Final version — not editable" success state,
--     enforced in the database rather than asserted in the UI.
--   · audit_row_change()            (0002_rbac_audit.sql) — append-only audit.
--   · has_any_role(text[]) / is_assigned_inspector(uuid) — existing RLS guards.
--
-- Additive only. No existing table, policy, trigger or default is modified.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Governed option domains.
--
-- The design draws "Competent department" and "Document type" as required
-- <select> controls, i.e. governed option sets — but their VALUES are not
-- captured anywhere in the baseline. The three options each select shows
-- ("Customs exemption / Taxes / Commercial industry" and "Product test /
-- Quality certificate / Lab report") are illustrative design copy, exactly like
-- the EM-053..EM-058 incident values that 20260720010000 explicitly refused to
-- promote into an enum.
--
-- So the TYPE is registered and NO value is seeded. Registering the type states
-- honestly that the field is governed; leaving it empty makes the UI render the
-- governed empty state ("Not configured") instead of a plausible default. This
-- matches the live registry, where every type except `severity` currently holds
-- zero values. Seeding values here would be inventing policy.
--
-- HUMAN_DECISION: the authoritative option lists for both domains are owed by
-- the Product Owner. Until they are configured, both fields render empty.
-- ---------------------------------------------------------------------------
insert into compliance_lookup_types (lookup_type_key, label_en, label_ar, display_order, active)
values
  ('competent_departments', 'Competent Departments', 'الإدارات المختصة', 0, true),
  ('document_types',        'Document Types',        'أنواع الوثائق',    0, true)
on conflict (lookup_type_key) do nothing;


-- ---------------------------------------------------------------------------
-- Parent record — one per inspection.
-- ---------------------------------------------------------------------------
create table visit_result_reports (
  id uuid primary key default gen_random_uuid(),

  -- One results record per inspection. inspection_id is NOT NULL because
  -- guard_submitted_inspection() reads new.inspection_id / old.inspection_id.
  -- No ON DELETE action, matching every sibling (checklist_responses and
  -- findings are NO ACTION, inspection_item_states is RESTRICT): inspection
  -- content is never removed as a side effect of deleting its inspection, and a
  -- cascade would additionally trip the BEFORE DELETE immutability guard.
  inspection_id uuid not null unique references inspections(id),

  -- Optional denormalised anchor, mirroring evidence and incident_reports.
  visit_id uuid references visits(id),

  -- Card 1 · Specialty Details.
  -- NULL means unanswered and MUST render as nothing, not as "No". The design
  -- ships a Yes/No pair with neither pressed until the inspector chooses.
  specialty_visit_needed boolean,
  -- Option domain uncaptured → free text holding a compliance_lookup_values.code
  -- for lookup_type_key='competent_departments'. Deliberately NOT an enum and
  -- NOT a foreign key: no value set exists yet, and a FK to an empty table would
  -- make the field unusable rather than merely unconfigured.
  competent_department text,
  specialty_notes text,

  -- Card 2 / 3 gates. Tri-state on purpose: NULL = unanswered, false = answered
  -- "No", true = answered "Yes". "No rows exist" is not the same fact as
  -- "the inspector answered No", and the two must not be collapsed.
  samples_taken boolean,
  products_seized boolean,

  -- Card 4 · Documents Pending Review. Same governed-but-unconfigured position
  -- as competent_department, against lookup_type_key='document_types'.
  pending_document_type text,

  -- Card 5 · Inspector Notes. Free text by design (CR-258, Phase 2 deferred).
  inspector_notes text,

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Referenced by the child tables' composite foreign keys so a child row can
  -- never drift onto a different inspection than its parent.
  unique (id, inspection_id)
);

comment on table visit_result_reports is
  'Visit Report · Results (Step 3 of 4), designs/pwa/pwa/SAQEEL PWA-Field Visit
   Results.dc.html. Design-derived: REQUIREMENT_BASELINE.csv has zero rows for
   specialty/competent/sample/seizure. competent_department and
   pending_document_type hold compliance_lookup_values.code for the
   competent_departments / document_types types, both registered with NO values
   (HUMAN_DECISION) so the UI renders the governed empty state rather than a
   default. specialty_visit_needed / samples_taken / products_seized are
   tri-state: NULL means unanswered and must render as nothing.';


-- ---------------------------------------------------------------------------
-- Card 2 · Sample Details rows.
-- ---------------------------------------------------------------------------
create table visit_result_samples (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  -- Carried so guard_submitted_inspection() applies unchanged; pinned to the
  -- parent's inspection by the composite FK below.
  inspection_id uuid not null,

  -- The design labels rows "Sample 1", "Sample 2"… — display order is data.
  ordinal integer not null,
  sample_name text,

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (report_id, inspection_id)
    references visit_result_reports (id, inspection_id) on delete cascade,
  -- Deferrable so deleting a middle row and renumbering the survivors can be
  -- done in one transaction without tripping a transient collision.
  unique (report_id, ordinal) deferrable initially immediate
);

comment on table visit_result_samples is
  'Sample rows for Visit Report · Results card 2. The design''s "Sample photo"
   control stores an ordinary evidence row (linked_type=''visit_result_sample'',
   linked_id=visit_result_samples.id), reusing the existing evidence audit and
   immutability guards rather than adding a second attachment mechanism.';


-- ---------------------------------------------------------------------------
-- Card 3 · Seizure Details rows.
-- ---------------------------------------------------------------------------
create table visit_result_seized_products (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  inspection_id uuid not null,

  ordinal integer not null,
  product_name text,
  -- Kept text: the design renders a bare input with no unit, no numeric type
  -- and no range, and the baseline captures no quantity rule. Same position
  -- 20260720010000 took on incident_reports.number_of_cases — do not assume a
  -- numeric constraint or a unit that was never specified.
  quantity text,

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (report_id, inspection_id)
    references visit_result_reports (id, inspection_id) on delete cascade,
  unique (report_id, ordinal) deferrable initially immediate
);

comment on table visit_result_seized_products is
  'Seized product rows for Visit Report · Results card 3. quantity is text: the
   design specifies no unit, numeric type or range and the baseline captures no
   quantity rule (HUMAN_DECISION).';


-- ---------------------------------------------------------------------------
-- updated_at maintenance. Domain-local touch function, following the existing
-- per-domain convention (planning_set_updated_at, workflow_task_assignments_touch).
-- ---------------------------------------------------------------------------
create function visit_result_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger trg_visit_result_reports_touch
  before update on visit_result_reports
  for each row execute function visit_result_touch();

create trigger trg_visit_result_samples_touch
  before update on visit_result_samples
  for each row execute function visit_result_touch();

create trigger trg_visit_result_seized_products_touch
  before update on visit_result_seized_products
  for each row execute function visit_result_touch();


-- ---------------------------------------------------------------------------
-- Immutability after submission — the design's "Final version — not editable".
-- Reuses the canonical guard already protecting checklist_responses, evidence,
-- findings, inspection_factory_checks and inspection_item_states. It raises
-- IMMUTABLE for status in (submitted, under_review, approved, rejected), so
-- corrections go through review return (STM-REV-003), never a direct edit.
-- ---------------------------------------------------------------------------
create trigger trg_guard_visit_result_reports
  before insert or update or delete on visit_result_reports
  for each row execute function guard_submitted_inspection();

create trigger trg_guard_visit_result_samples
  before insert or update or delete on visit_result_samples
  for each row execute function guard_submitted_inspection();

create trigger trg_guard_visit_result_seized_products
  before insert or update or delete on visit_result_seized_products
  for each row execute function guard_submitted_inspection();


-- ---------------------------------------------------------------------------
-- Append-only audit. Generic existing trigger function; no new audit mechanism.
-- ---------------------------------------------------------------------------
create trigger trg_audit_visit_result_reports
  after insert or update or delete on visit_result_reports
  for each row execute function audit_row_change();

create trigger trg_audit_visit_result_samples
  after insert or update or delete on visit_result_samples
  for each row execute function audit_row_change();

create trigger trg_audit_visit_result_seized_products
  after insert or update or delete on visit_result_seized_products
  for each row execute function audit_row_change();


-- ---------------------------------------------------------------------------
-- RLS. Read mirrors inspection_item_states_read; write mirrors findings_rw —
-- the assigned inspector owns the content, oversight roles read it. No new
-- authorization primitive is introduced.
-- ---------------------------------------------------------------------------
alter table visit_result_reports enable row level security;
alter table visit_result_samples enable row level security;
alter table visit_result_seized_products enable row level security;

create policy visit_result_reports_read on visit_result_reports for select
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_reports.inspection_id
      and (is_assigned_inspector(i.visit_id)
           or has_any_role(array['reviewer','auditor','ops','planner','leadership']))
  ));

create policy visit_result_reports_write on visit_result_reports for all
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_reports.inspection_id and is_assigned_inspector(i.visit_id)
  ))
  with check (exists (
    select 1 from inspections i
    where i.id = visit_result_reports.inspection_id and is_assigned_inspector(i.visit_id)
  ));

create policy visit_result_samples_read on visit_result_samples for select
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_samples.inspection_id
      and (is_assigned_inspector(i.visit_id)
           or has_any_role(array['reviewer','auditor','ops','planner','leadership']))
  ));

create policy visit_result_samples_write on visit_result_samples for all
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_samples.inspection_id and is_assigned_inspector(i.visit_id)
  ))
  with check (exists (
    select 1 from inspections i
    where i.id = visit_result_samples.inspection_id and is_assigned_inspector(i.visit_id)
  ));

create policy visit_result_seized_products_read on visit_result_seized_products for select
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_seized_products.inspection_id
      and (is_assigned_inspector(i.visit_id)
           or has_any_role(array['reviewer','auditor','ops','planner','leadership']))
  ));

create policy visit_result_seized_products_write on visit_result_seized_products for all
  using (exists (
    select 1 from inspections i
    where i.id = visit_result_seized_products.inspection_id and is_assigned_inspector(i.visit_id)
  ))
  with check (exists (
    select 1 from inspections i
    where i.id = visit_result_seized_products.inspection_id and is_assigned_inspector(i.visit_id)
  ));


-- ---------------------------------------------------------------------------
-- Indexes.
-- ---------------------------------------------------------------------------
create index idx_visit_result_reports_visit on visit_result_reports(visit_id);
create index idx_visit_result_reports_created_by on visit_result_reports(created_by);
create index idx_visit_result_samples_report on visit_result_samples(report_id);
create index idx_visit_result_samples_inspection on visit_result_samples(inspection_id);
create index idx_visit_result_seized_products_report on visit_result_seized_products(report_id);
create index idx_visit_result_seized_products_inspection on visit_result_seized_products(inspection_id);
