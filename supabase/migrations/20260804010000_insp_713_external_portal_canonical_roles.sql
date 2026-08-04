-- INSP-713 · INSP-239 / INSP-246,248..255
-- Converge the external-request policy family on the four canonical internal
-- roles without opening the held external-representative seam.

alter table public.external_requests
  drop constraint if exists external_requests_request_type_check;
alter table public.external_requests
  add constraint external_requests_request_type_check
  check (request_type in ('visit','correction','objection'));

alter table public.self_assessments
  add column if not exists review_reason text;
alter table public.self_assessments
  drop constraint if exists self_assessments_status_check;
alter table public.self_assessments
  add constraint self_assessments_status_check
  check (status in ('draft','submitted','accepted','rejected','returned'));

alter table public.objections
  add column if not exists decision_reason text;
alter table public.objections
  drop constraint if exists objections_status_check;
alter table public.objections
  add constraint objections_status_check
  check (status in ('filed','under_review','upheld','partially_upheld','dismissed','returned'));

-- Read is internal admin/supervisor only. Planner/Inspector and anon remain
-- denied; no factory representative grant is introduced while identity/MFA is held.
alter policy external_requests_internal_read on public.external_requests
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy self_assessments_internal_read on public.self_assessments
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy correction_evidence_internal_read on public.correction_evidence
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy objections_internal_read on public.objections
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));

-- Canonical Admin owns internal intake. Admin and Supervisor can perform the
-- guarded internal review transitions required by the assigned Stories.
alter policy external_requests_internal_write on public.external_requests
  with check ((select has_internal_role('admin')));
alter policy self_assessments_internal_write on public.self_assessments
  with check ((select has_internal_role('admin')));
alter policy correction_evidence_internal_write on public.correction_evidence
  with check ((select has_internal_role('admin')));
alter policy objections_internal_write on public.objections
  with check ((select has_internal_role('admin')));

alter policy external_requests_internal_update on public.external_requests
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')))
  with check ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy self_assessments_internal_update on public.self_assessments
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')))
  with check ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy correction_evidence_internal_update on public.correction_evidence
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')))
  with check ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));
alter policy objections_internal_update on public.objections
  using ((select has_internal_role('admin')) or (select has_internal_role('supervisor')))
  with check ((select has_internal_role('admin')) or (select has_internal_role('supervisor')));

-- Every persisted intake/evidence/decision mutation must be auditable.
drop trigger if exists trg_audit_external_requests on public.external_requests;
create trigger trg_audit_external_requests after insert or update or delete on public.external_requests
  for each row execute function public.audit_row_change();
drop trigger if exists trg_audit_self_assessments on public.self_assessments;
create trigger trg_audit_self_assessments after insert or update or delete on public.self_assessments
  for each row execute function public.audit_row_change();
drop trigger if exists trg_audit_correction_evidence on public.correction_evidence;
create trigger trg_audit_correction_evidence after insert or update or delete on public.correction_evidence
  for each row execute function public.audit_row_change();
drop trigger if exists trg_audit_objections on public.objections;
create trigger trg_audit_objections after insert or update or delete on public.objections
  for each row execute function public.audit_row_change();
