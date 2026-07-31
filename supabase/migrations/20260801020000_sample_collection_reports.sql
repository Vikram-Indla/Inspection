-- ============================================================================
-- Sample Collection Report — Jira INSP-573, Figma MIM iPad Inspector App,
-- Components > Reports > "Sample Collection Report" (node 361:32119, states
-- Signature file / Reason).
--
-- Modeled on 20260801010000_summons_notices.sql, which is itself modeled on
-- incident_reports (20260720010000): broad read by role, inspector-scoped
-- insert, generic append-only audit_row_change trigger. No new authorization
-- primitive invented. Attendance/signature reuses SignaturePad's existing
-- "inspection" mode shape — same reuse as summons_notices, no new mechanism.
--
-- HUMAN_DECISION: 'region' and 'department' are the same option-domain fields
-- already flagged uncaptured in summons_notices — same free-text treatment,
-- no enum invented. The design's "المرفقات" (attachments) section is NOT
-- modeled here: the existing generic evidence table requires a NOT NULL
-- inspection_id (see incident_reports precedent, which made the identical
-- call), and a sample collection report may be created without one. File
-- attachment support is deferred, not silently dropped — flag as follow-up.
-- ============================================================================

create table sample_collection_reports (
  id uuid primary key default gen_random_uuid(),

  collector_name  text,  -- اسم الشخص
  laboratory_name text,  -- اسم المختبر
  region          text,  -- المنطقة — option domain UNCAPTURED / HUMAN_DECISION
  department      text,  -- الإدارة — option domain UNCAPTURED / HUMAN_DECISION
  reason          text,  -- السبب

  attendance         text check (attendance in ('present','absent','objected')),
  attendance_reason  text,
  signer_name         text,
  signature_data_url  text,
  signed_at           timestamptz,

  factory_id    uuid references factories(id),
  visit_id      uuid references visits(id),
  inspection_id uuid references inspections(id),

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table sample_collection_reports is
  'Jira INSP-573. Figma MIM iPad Inspector App, Components > Reports > "Sample
   Collection Report" (node 361:32119). region/department free-text
   (HUMAN_DECISION, option domains uncaptured). Attachments deferred — see
   migration header. Attendance/signature reuses SignaturePad "inspection" mode.';

alter table sample_collection_reports enable row level security;

create policy sample_collection_reports_read on sample_collection_reports for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

create policy sample_collection_reports_insert on sample_collection_reports for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

create trigger trg_audit_sample_collection_reports
  after insert or update or delete on sample_collection_reports
  for each row execute function audit_row_change();

create index idx_sample_collection_reports_factory on sample_collection_reports(factory_id);
create index idx_sample_collection_reports_visit on sample_collection_reports(visit_id);
create index idx_sample_collection_reports_created_by on sample_collection_reports(created_by);
