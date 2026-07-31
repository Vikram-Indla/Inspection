-- ============================================================================
-- Facility Report — Jira INSP-583, Figma MIM iPad Inspector App, Components >
-- Reports > "Facility Report" (node 369:49024, states Signature file / Reason
-- / Reason 2 / Signature file 2). Distinct from field/reports/ReportsLibrary
-- .tsx, which is inspection-submission retrieval, not facility action logging
-- (see Jira INSP-583 Technical Baseline).
--
-- facility_action is a genuine captured 2-option domain (unlike the free-text
-- fields elsewhere in this report family): the design renders both options as
-- selectable radio choices — "إغلاق المنشأة" (close) / "إعادة فتح المنشأة"
-- (reopen) — not one sample value, so it is safe to constrain as an enum here
-- (CLAUDE.md rule 10 only forbids inventing an UNCAPTURED domain; this one is
-- captured in full).
--
-- The design's second Reason/Signature-file pair ("Reason 2" / "Signature
-- file 2" states) is NOT modeled — its purpose (second signer? open vs close
-- sign-off?) is not documented anywhere in the source. Single
-- attendance/signature block only, same shape as the other report tables in
-- this family; deferred, not silently dropped — flag as follow-up.
--
-- Modeled on summons_notices / sample_collection_reports /
-- non_compliant_destruction_reports: broad read by role, inspector-scoped
-- insert, generic append-only audit_row_change trigger.
-- ============================================================================

create table facility_reports (
  id uuid primary key default gen_random_uuid(),

  report_date   date,  -- تاريخ المحضر
  summons_date  date,  -- تاريخ الاستدعاء
  facility_action text check (facility_action in ('close','reopen')),  -- إجراء المنشأة: إغلاق المنشأة | إعادة فتح المنشأة — fully captured domain
  reason         text,  -- السبب

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
comment on table facility_reports is
  'Jira INSP-583. Figma MIM iPad Inspector App, Components > Reports >
   "Facility Report" (node 369:49024). facility_action is a captured 2-option
   domain (close|reopen), not invented. The design''s second Reason/Signature
   pair is deferred — see migration header.';

alter table facility_reports enable row level security;

create policy facility_reports_read on facility_reports for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

create policy facility_reports_insert on facility_reports for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

create trigger trg_audit_facility_reports
  after insert or update or delete on facility_reports
  for each row execute function audit_row_change();

create index idx_facility_reports_factory on facility_reports(factory_id);
create index idx_facility_reports_visit on facility_reports(visit_id);
create index idx_facility_reports_created_by on facility_reports(created_by);
