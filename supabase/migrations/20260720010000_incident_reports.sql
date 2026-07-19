-- ============================================================================
-- Incident Report record — Figma FNS-033 / J-12 ("رصد حادث" / "Report an
-- Incident", node 1068:123721, screen "Incident fields").
--
-- Field labels are the captured, traceable strings from
-- TRANSLATION_REVIEW_REGISTER.csv (screen_name='Incident fields',
-- node_id=1068:123721): EM-046, EM-047, EM-048, EM-049, EM-050, EM-051,
-- EM-052, EM-054, EM-057, EM-059. The matching Arabic/English copy already
-- exists in ui_strings as figma.establishmentmanagement.em046..em059 (seeded
-- in 20260719000000_mim_ipad_figma_localization_seed.sql, DEC-H) — this
-- migration only adds the persistence table, it does NOT re-seed strings.
--
-- Additive only. Modeled on the already-governed enforcement_recommendations
-- pattern (20260719010000_dec_f_enforcement_recommendations.sql): broad read
-- by role, inspector-scoped insert, generic append-only audit_row_change
-- trigger (0002_rbac_audit.sql). No new authorization primitive invented.
--
-- HUMAN_DECISION: two labels are option-domain fields whose enumerations are
-- NOT captured anywhere in the register — 'Report Source' (EM-048) and
-- 'Incident Type' (EM-057). Their option values are uncaptured, so they are
-- stored as free-text here; do NOT invent enum domains. The register does show
-- sample incident *values* (EM-053/055/056/058 "Hazardous material leak",
-- "Environmental pollution", "Equipment incident", …) but those are illustrative
-- BRD samples, not an authoritative option set, so no CHECK constraint is added.
-- 'Report Time' (EM-051) and 'Number of Cases' (EM-052) are likewise kept as
-- text — the register captures only the label, not a datetime format or a
-- numeric constraint, so no format/range is assumed here.
-- ============================================================================

create table incident_reports (
  id uuid primary key default gen_random_uuid(),

  -- Captured Figma field labels → one nullable text column each (register cites
  -- in the comment; matching ui_strings key noted for the form layer).
  establishment_code               text,  -- EM-046 'Establishment Code'              · figma.establishmentmanagement.em046
  commercial_registration_number   text,  -- EM-047 'Commercial Registration Number'  · figma.establishmentmanagement.em047
  report_source                    text,  -- EM-048 'Report Source' — option domain UNCAPTURED / HUMAN_DECISION · em048
  reporter_name                    text,  -- EM-049 'Reporter Name'                   · figma.establishmentmanagement.em049
  reporter_contact_number          text,  -- EM-050 'Reporter Contact Number'         · figma.establishmentmanagement.em050
  report_time                      text,  -- EM-051 'Report Time' — kept text, no datetime format captured · em051
  number_of_cases                  text,  -- EM-052 'Number of Cases' — kept text, no numeric constraint captured · em052
  resulting_damage                 text,  -- EM-054 'Resulting Damage'                · figma.establishmentmanagement.em054
  incident_type                    text,  -- EM-057 'Incident Type' — option domain UNCAPTURED / HUMAN_DECISION · em057
  preliminary_incident_description text,  -- EM-059 'Preliminary Incident Description' · figma.establishmentmanagement.em059

  -- Optional workflow anchors. Both target tables exist (0001_foundation.sql);
  -- nullable so an incident may be recorded standalone or against a visit /
  -- inspection context. factory_id links the establishment when known.
  factory_id    uuid references factories(id),
  visit_id      uuid references visits(id),
  inspection_id uuid references inspections(id),

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table incident_reports is
  'Figma FNS-033/J-12 incident observation ("رصد حادث"). Field labels traced to
   TRANSLATION_REVIEW_REGISTER.csv EM-046..EM-059 (node 1068:123721). report_source
   (EM-048) and incident_type (EM-057) are free-text: their option domains are
   uncaptured (HUMAN_DECISION) and must not be invented as enums.';

alter table incident_reports enable row level security;

-- Read: broad by role, mirroring enforcement_recommendations_read — the record
-- itself is operational, not secret; row visibility is still RLS-scoped.
create policy incident_reports_read on incident_reports for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

-- Insert: inspector only, own row; if a visit context is given the inspector
-- must be the assigned inspector on it (reuses is_assigned_inspector,
-- 0002_rbac_audit.sql — same guard enforcement_recommendations_insert uses).
create policy incident_reports_insert on incident_reports for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

-- Append-only audit (reuses the existing generic audit_row_change trigger
-- function, 0002_rbac_audit.sql — no new audit mechanism invented).
create trigger trg_audit_incident_reports
  after insert or update or delete on incident_reports
  for each row execute function audit_row_change();

create index idx_incident_reports_factory on incident_reports(factory_id);
create index idx_incident_reports_visit on incident_reports(visit_id);
create index idx_incident_reports_created_by on incident_reports(created_by);
