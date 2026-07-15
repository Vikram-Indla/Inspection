-- Migration — fix reviews_read RLS: Level 2 Reviewer role missing from the
-- broad-access list (RBAC-011, DEC-012 independent audit finding, CD-028).
--
-- 0002_rbac_audit.sql's reviews_read policy granted broad read to
-- auditor/ops/leadership but omitted 'reviewer' — every sibling policy in
-- that file includes it; this one alone did not. A plain reviewer-role
-- account could only read review rows where reviewer_id = auth.uid(), i.e.
-- reviews they had already started. No trigger creates a reviews row on
-- inspection submit (the only insert path is the explicit startReview
-- action in reviews/[id]/actions.ts), and no other screen links a reviewer
-- to a not-yet-started submission. Net effect: a reviewer-only account had
-- no way to discover new work — /reviews would show "queue clear" while
-- submitted inspections sat unreviewed. Predates CD-028; the CD-028
-- scan-first redesign did not introduce it (page.tsx already queried
-- reviews unchanged) but made it consequential end-to-end.
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select using (
  reviewer_id = auth.uid() or has_any_role(array['reviewer','auditor','ops','leadership'])
  or exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id))
);
