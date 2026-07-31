-- ============================================================================
-- Non-Compliant Products Destruction Report — Jira INSP-578, Figma MIM iPad
-- Inspector App, Components > Reports, canonical frame node 362:39096
-- ("محضر إتلاف منتجات مخالفة"). RESOLVED 2026-08-01 (Jira comment on
-- INSP-578): this frame was chosen over the 2 duplicate frames (362:21196,
-- 368:27879) because it is the only one with a distinct Report Date state.
--
-- On inspection this "frame" is actually a report-TYPE accordion menu, not a
-- single form — expanding the destruction-report line item shows a small,
-- real field set: رقم محضر (report number, required), تاريخ المحضر (report
-- date, in the Report Date state), and the same reused تأكيد الحضور والتوقيع
-- (attendance + signature) block. A "ملف التوقيع" (signature file upload,
-- PNG/JPG/PDF) button also appears — deferred here for the same reason
-- sample_collection_reports deferred attachments: the generic evidence table
-- needs a NOT NULL inspection_id this report may not have. Canvas signature
-- via the existing SignaturePad component covers the acknowledgement need
-- without it.
--
-- Modeled on summons_notices.sql / sample_collection_reports.sql: broad read
-- by role, inspector-scoped insert, generic append-only audit_row_change
-- trigger. No new authorization primitive invented.
-- ============================================================================

create table non_compliant_destruction_reports (
  id uuid primary key default gen_random_uuid(),

  report_number text not null,  -- رقم محضر — required in the design (red asterisk)
  report_date   date,           -- تاريخ المحضر

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
comment on table non_compliant_destruction_reports is
  'Jira INSP-578. Figma MIM iPad Inspector App, Components > Reports, canonical
   node 362:39096 ("محضر إتلاف منتجات مخالفة"). report_number is the only
   required field in the design. Signature-file upload deferred (see migration
   header); canvas signature via SignaturePad "inspection" mode covers
   acknowledgement.';

alter table non_compliant_destruction_reports enable row level security;

create policy non_compliant_destruction_reports_read on non_compliant_destruction_reports for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

create policy non_compliant_destruction_reports_insert on non_compliant_destruction_reports for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

create trigger trg_audit_non_compliant_destruction_reports
  after insert or update or delete on non_compliant_destruction_reports
  for each row execute function audit_row_change();

create index idx_ncdr_factory on non_compliant_destruction_reports(factory_id);
create index idx_ncdr_visit on non_compliant_destruction_reports(visit_id);
create index idx_ncdr_created_by on non_compliant_destruction_reports(created_by);
