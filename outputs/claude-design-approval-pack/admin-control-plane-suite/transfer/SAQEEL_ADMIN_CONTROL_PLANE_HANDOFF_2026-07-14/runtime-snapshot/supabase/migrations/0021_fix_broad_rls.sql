-- Migration 0021 — close three over-broad RLS policies (EXT-08 / NEW-DEC-B,
-- G5 external-assessment reconciliation 2026-07-12). All three currently
-- collapse to "any authenticated user" and contradict RBAC-011/RBAC-014:
--   reviews_insert   — any authenticated user could insert a review decision
--   vs_read          — any authenticated user could read any virtual session
--   vp_rw            — any authenticated user could read/write/delete any
--                       virtual session's participants
-- OTP request/verify (0009) run through SECURITY DEFINER functions and are
-- unaffected by this migration — they bypass table RLS entirely.

-- reviews_insert (RBAC-011: Level 2 Reviewer only). The `or auth.uid() is not
-- null` clause made the has_any_role() check meaningless; drop it. Row
-- creation is triggered by the reviewer opening the submission
-- (reviews/[id]/page.tsx) — no other caller needs this.
drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert with check (has_any_role(array['reviewer','ops']));

-- vs_read — staff who administer/monitor virtual sessions, plus the inspector
-- actually assigned to the underlying visit. Factory-representative
-- participant access does not depend on this policy: OTP verification runs
-- through vp_request_otp/vp_verify_otp (SECURITY DEFINER, bypasses RLS).
drop policy if exists vs_read on virtual_sessions;
create policy vs_read on virtual_sessions for select using (
  has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
  or is_assigned_inspector(visit_id)
);

-- vp_rw — same scope as vs_read, joined through the parent session's visit.
drop policy if exists vp_rw on virtual_participants;
create policy vp_rw on virtual_participants for all using (
  has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
  or exists (
    select 1 from virtual_sessions vs
    where vs.id = virtual_participants.session_id and is_assigned_inspector(vs.visit_id)
  )
) with check (
  has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
  or exists (
    select 1 from virtual_sessions vs
    where vs.id = virtual_participants.session_id and is_assigned_inspector(vs.visit_id)
  )
);
