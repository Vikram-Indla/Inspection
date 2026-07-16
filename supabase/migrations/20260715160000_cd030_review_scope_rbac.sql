-- CD-030 / SCR-WEB-320 — keep the read surface aligned with the roles admitted
-- by inspections_read and the existing review decision boundary. The page is
-- read-only for planner/leadership/auditor; ops remains decision-capable via
-- reviews_insert/reviews_update. No write permission is added here.
drop policy if exists subs_read on submission_versions;
create policy subs_read on submission_versions for select using (
  has_any_role(array['reviewer','auditor','ops','planner','leadership'])
  or exists (
    select 1 from inspections i
    where i.id = inspection_id and is_assigned_inspector(i.visit_id)
  )
);

-- Section membership is package-defined and therefore remains validated by
-- the server action at submit time. The database still rejects malformed
-- non-array shapes so a future write path cannot silently store an object or
-- scalar as a returned scope.
alter table reviews
  add constraint reviews_returned_sections_array_check
  check (returned_sections is null or jsonb_typeof(returned_sections) = 'array');
