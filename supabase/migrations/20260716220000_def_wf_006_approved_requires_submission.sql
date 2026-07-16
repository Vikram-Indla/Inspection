-- Cycle 2 Wave 0 · DEF-WF-006 — an inspection can never be transitioned to (or
-- inserted as) status='approved' without an immutable submitted version backing
-- it (M04-215/M06-018 integrity invariant). Forward-only, additive; does not
-- edit any applied migration or mutate existing data.
--
-- A plain AFTER trigger cannot be used here: legitimate seed/history writers
-- (e.g. 0011_factory360_gis_ksa_seed.sql) insert the inspections row before the
-- submission_versions row in the SAME transaction. A deferred constraint
-- trigger checks at commit time instead, so that ordering keeps working while
-- still refusing any transaction that reaches commit with an approved
-- inspection and zero submission_versions rows.

create or replace function guard_approved_requires_submission()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and not exists (
    select 1 from submission_versions where inspection_id = new.id
  ) then
    raise exception 'IMMUTABLE: inspection % cannot be approved without an immutable submitted version (DEF-WF-006)', new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_approved_requires_submission on inspections;
create constraint trigger trg_guard_approved_requires_submission
  after insert or update of status on inspections
  deferrable initially deferred
  for each row execute function guard_approved_requires_submission();

-- Arabic strings for the new report-page integrity banner (apps/web/src/app/reports/inspection/[id]/page.tsx).
-- Guarded upsert never clobbers a human-reviewed translation (status='draft' only).
insert into ui_strings (key, en, ar, status, context) values
  ('report.integrityBlocked.title',
   'Data-integrity defect — invalid approval',
   'خلل في سلامة البيانات — موافقة غير صالحة',
   'draft', 'DEF-WF-006 — report page invalid-approval banner title'),
  ('report.integrityBlocked.body',
   'This inspection is recorded as approved but has no immutable submitted version on file. The approval is not valid and must not be relied on as an official decision until an immutable submission exists (DEF-WF-006).',
   'هذا التفتيش مسجَّل كموافَق عليه لكن لا توجد نسخة مقدَّمة غير قابلة للتعديل مرتبطة به. الموافقة غير صالحة ولا يجوز الاعتماد عليها كقرار رسمي حتى يتم تسجيل نسخة مقدَّمة غير قابلة للتعديل (DEF-WF-006).',
   'draft', 'DEF-WF-006 — report page invalid-approval banner body'),
  ('report.integrityBlocked.status',
   'approval invalid — no immutable version',
   'موافقة غير صالحة — لا توجد نسخة غير قابلة للتعديل',
   'draft', 'DEF-WF-006 — report page header status label')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';
