-- ============================================================================
-- Summons Notice record — Jira INSP-558, Figma MIM iPad Inspector App,
-- Components > Reports > "Summons Notice" template (node 360:48214, states
-- Day/Reason/Signature file) — the CREATE-form scope. The Report Details read
-- view (node 369:127296) surfaces many additional fields (factory name,
-- licence number, licence expiry, region/city, required-attendance documents)
-- but those are joined from factories/licences at read time, not captured
-- fresh in this form — no column is duplicated here for data that already
-- lives elsewhere (CLAUDE.md rule 10: never invent a governed value).
--
-- Modeled on the already-governed incident_reports pattern
-- (20260720010000_incident_reports.sql): broad read by role, inspector-scoped
-- insert, generic append-only audit_row_change trigger (0002_rbac_audit.sql).
-- No new authorization primitive invented.
--
-- Attendance + signature reuses the exact SignaturePad "inspection" mode
-- shape already shipped for violation acknowledgement
-- (field/inspection/[id]/SignaturePad.tsx, SignatureAck type) — the Figma
-- states "لم يتم حضور ممثل المنشأة أو أعترض على التوقيع" (did not attend /
-- objected) and "تم حضور ممثل المنشأة وموافق على التوقيع" (attended and
-- agreed) map 1:1 to that component's existing present/absent/objected
-- attendance union. No new signature mechanism invented.
--
-- HUMAN_DECISION: 'subject' (الموضوع), 'department' (الإدارة) and
-- 'required_document_type' (نوع المستند المطلوب) are option-domain fields in
-- the design (each shows one sample value, e.g. "استدعاء لاستكمال نواقص
-- الترخيص" / "فرع الوزارة" / "الرخصة") whose full enumeration is not captured
-- anywhere in the source. Stored as free text; do NOT invent enum domains —
-- same discipline as incident_reports.report_source/incident_type.
-- ============================================================================

create table summons_notices (
  id uuid primary key default gen_random_uuid(),

  report_date              date,        -- تاريخ المحضر
  report_day               text,        -- يوم المحضر — day-of-week label as shown in the design, not derived (design renders it as its own field)
  subject                  text,        -- الموضوع — option domain UNCAPTURED / HUMAN_DECISION
  region                   text,        -- المنطقة
  department                text,        -- الإدارة — option domain UNCAPTURED / HUMAN_DECISION
  required_document_type   text,        -- نوع المستند المطلوب — option domain UNCAPTURED / HUMAN_DECISION
  reason                    text,        -- السبب

  -- Attendance + signature, same shape as SignatureAck (SignaturePad.tsx) —
  -- attendance is inspection-mode: present | absent | objected.
  attendance                text check (attendance in ('present','absent','objected')),
  attendance_reason         text,        -- reason text when absent/objected (SignaturePad "reasonLabel")
  signer_name                text,
  signature_data_url         text,        -- PNG dataURL from the canvas capture, same storage pattern as submission_versions.acknowledgement
  signed_at                  timestamptz,

  -- Optional workflow anchors, same pattern as incident_reports.
  factory_id    uuid references factories(id),
  visit_id      uuid references visits(id),
  inspection_id uuid references inspections(id),

  created_by uuid not null references profiles(user_id) default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table summons_notices is
  'Jira INSP-558. Figma MIM iPad Inspector App, Components > Reports > "Summons
   Notice" (node 360:48214) create-form scope. subject/department/
   required_document_type are free-text: their option domains are uncaptured
   (HUMAN_DECISION) and must not be invented as enums. Attendance/signature
   reuses the existing SignaturePad "inspection" mode shape.';

alter table summons_notices enable row level security;

create policy summons_notices_read on summons_notices for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

create policy summons_notices_insert on summons_notices for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

create trigger trg_audit_summons_notices
  after insert or update or delete on summons_notices
  for each row execute function audit_row_change();

create index idx_summons_notices_factory on summons_notices(factory_id);
create index idx_summons_notices_visit on summons_notices(visit_id);
create index idx_summons_notices_created_by on summons_notices(created_by);
