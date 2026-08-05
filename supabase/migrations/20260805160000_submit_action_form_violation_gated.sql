-- CC-SUBMIT-ACTION-FORM-VIOLATION-GATED-20260805
--
-- guard_submission_action_forms_and_config() enforced a package's
-- hard-blocking mandatory action form on every submission, whether or not
-- the inspection found anything wrong. A fully compliant inspection
-- (Rabigh Polymers Complex, visit ea32f474, inspection d70ac807, package
-- PKG-UAT-GOLDEN-FS101) recorded zero violations and was refused with
-- EXE-SUBMIT-ACTION-FORM-MISSING, permanently stuck in_progress. Confirmed
-- live before writing this migration: that inspection has 0 rows in
-- public.violations (not invalidated) and 0 checklist_responses with
-- response->>'value' = 'non_compliant' — exactly the reported case.
--
-- Product Owner ruling, verbatim: "the corrective form should only be
-- required when there's a violation." A hard-blocking corrective action
-- form is required only when the inspection recorded at least one
-- violation or non-compliant answer. Where a violation exists the form
-- remains mandatory and still blocks — this narrows when the requirement
-- applies, it does not soften the requirement itself.
--
-- "Violation or non-compliant answer" maps to two real, verified signals,
-- checked with OR per the ruling's own wording (not a case of one concept
-- with two readings — the rule explicitly names two distinct signals):
--   - public.violations: a row for this inspection with invalidated_at is
--     null (an invalidated violation was determined void and does not
--     count).
--   - public.checklist_responses: a row for this inspection with
--     response->>'value' = 'non_compliant' (the only two values present
--     in this column across the live project are 'compliant' and
--     'non_compliant' — verified directly, not assumed).
--
-- Only the EXE-SUBMIT-ACTION-FORM-MISSING check is touched. Every other
-- guard in this trigger is byte-identical to before: config version/
-- checksum matching, snapshot version matching, the administrative-mode
-- branch, and the separate EXE-SUBMIT-ACTION-FORM-INCOMPLETE check for
-- already-created blocking forms with missing required fields (that check
-- is orthogonal — it only fires when a blocking action_forms row already
-- exists, which a compliant inspection with no violation would have no
-- reason to have created). No edit to any package or its snapshot.

create or replace function private.guard_submission_action_forms_and_config()
returns trigger
language plpgsql
set search_path to ''
as $$
declare i public.inspections%rowtype; snap public.visit_package_snapshots%rowtype;
 mode public.execution_mode; incomplete int; has_violation boolean;
begin
  select * into i from public.inspections where id=new.inspection_id for key share;
  if not found then raise exception using errcode='23514',message='EXE-SUBMIT-NOT-FOUND'; end if;
  select execution_mode into mode from public.visits where id=i.visit_id;
  select * into snap from public.visit_package_snapshots where visit_id=i.visit_id
   order by preparation_version desc limit 1;
  if found then
    if snap.package_version_id<>i.package_version_id then raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-VERSION-MISMATCH'; end if;
    if snap.checksum<>encode(extensions.digest(snap.definition::text,'sha256'),'hex') then raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-CHECKSUM-MISMATCH'; end if;
    if new.snapshot?'package_version_id' and new.snapshot->>'package_version_id'<>snap.package_version_id::text then
      raise exception using errcode='23514',message='EXE-SUBMIT-SNAPSHOT-VERSION-MISMATCH'; end if;
    has_violation := exists(
      select 1 from public.violations v where v.inspection_id=new.inspection_id and v.invalidated_at is null
    ) or exists(
      select 1 from public.checklist_responses cr where cr.inspection_id=new.inspection_id and cr.response->>'value'='non_compliant'
    );
    if has_violation and exists(
      select 1 from jsonb_array_elements(coalesce(snap.definition->'action_forms','[]'))f
       where coalesce((f->>'mandatory')::boolean,(f->>'blocking')::boolean,false)
         and not exists(
           select 1 from public.action_forms af where af.inspection_id=new.inspection_id
             and af.is_blocking and af.form_type=f->>'key'
         )
    ) then
      raise exception using errcode='23514',message='EXE-SUBMIT-ACTION-FORM-MISSING'; end if;
  elsif mode is distinct from 'administrative' then
    raise exception using errcode='23514',message='EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED';
  end if;
  select count(*) into incomplete from public.action_forms where inspection_id=new.inspection_id and is_blocking
   and (nullif(btrim(owner_name),'') is null or nullif(btrim(owner_role),'') is null
     or due_at is null or nullif(btrim(required_correction),'') is null);
  if incomplete>0 then raise exception using errcode='23514',message='EXE-SUBMIT-ACTION-FORM-INCOMPLETE:'||incomplete; end if;
  return new;
end $$;
