-- K-perf: dashboard load RCA traced a large share of query latency to
-- Postgres re-evaluating multiple permissive SELECT policies per row
-- (Supabase performance advisor: multiple_permissive_policies) on every
-- table the dashboard's nested selects touch. PERMISSIVE policies are OR'd
-- together at execution time, so N policies cost N predicate evaluations
-- per row with identical net access as one policy whose qual is the OR of
-- all of them. This migration merges each duplicated SELECT surface into a
-- single policy with an equivalent (OR'd) qual — access is unchanged,
-- evaluation cost drops from N policies to 1.
--
-- inspection_items / regulation_clauses / regulations / violation_codes:
-- the "_admin" policy was FOR ALL, so its qual (has_any_role(compliance_admin,
-- form_admin)) was also being OR'd into every SELECT alongside "_read"
-- (auth.uid() IS NOT NULL). Any compliance_admin/form_admin session is by
-- definition authenticated, so "_admin"'s SELECT contribution was already
-- fully subsumed by "_read" — narrowing "_admin" to INSERT/UPDATE/DELETE
-- removes a genuinely redundant policy with zero access change.

-- ── assignments: assignments_read OR assignments_read_capability ──────────
drop policy if exists assignments_read_capability on public.assignments;
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments
  for select
  using (
    (inspector_id = (select auth.uid()))
    or (select has_any_role(array['planner','ops','reviewer','auditor']))
    or (select has_planning_capability('planning.view'))
  );

-- ── visits: inspector_own_visits OR visits_read_capability ─────────────────
drop policy if exists visits_read_capability on public.visits;
drop policy if exists inspector_own_visits on public.visits;
create policy inspector_own_visits on public.visits
  for select
  using (
    (select has_any_role(array['planner','ops','reviewer','auditor','leadership','compliance_admin']))
    or exists (select 1 from public.assignments a where a.visit_id = visits.id and a.inspector_id = (select auth.uid()))
    or (select has_planning_capability('planning.view'))
  );

-- ── inspections: inspections_read OR inspections_read_prior_approved ──────
drop policy if exists inspections_read_prior_approved on public.inspections;
drop policy if exists inspections_read on public.inspections;
create policy inspections_read on public.inspections
  for select
  using (
    is_assigned_inspector(visit_id)
    or (select has_any_role(array['reviewer','auditor','ops','planner','leadership']))
    or (status = 'approved' and inspects_same_factory(visit_id))
  );

-- ── checklist_responses: responses_rw(ALL) OR responses_read_oversight OR
--    responses_read_prior_approved, on SELECT. Split responses_rw into a
--    write-only policy (same qual/with_check, scoped off SELECT) plus fold
--    its read qual into one merged SELECT policy.
drop policy if exists responses_read_oversight on public.checklist_responses;
drop policy if exists responses_read_prior_approved on public.checklist_responses;
drop policy if exists responses_rw on public.checklist_responses;

create policy responses_read on public.checklist_responses
  for select
  using (
    exists (
      select 1 from inspections i
      where i.id = checklist_responses.inspection_id
        and (is_assigned_inspector(i.visit_id) or (select has_any_role(array['reviewer','auditor'])))
    )
    or (select has_any_role(array['ops','leadership']))
    or exists (
      select 1 from inspections i
      where i.id = checklist_responses.inspection_id
        and i.status = 'approved'
        and inspects_same_factory(i.visit_id)
    )
  );

create policy responses_insert on public.checklist_responses
  for insert
  with check (
    exists (select 1 from inspections i where i.id = checklist_responses.inspection_id and is_assigned_inspector(i.visit_id))
  );

create policy responses_update on public.checklist_responses
  for update
  using (
    exists (
      select 1 from inspections i
      where i.id = checklist_responses.inspection_id
        and (is_assigned_inspector(i.visit_id) or (select has_any_role(array['reviewer','auditor'])))
    )
  )
  with check (
    exists (select 1 from inspections i where i.id = checklist_responses.inspection_id and is_assigned_inspector(i.visit_id))
  );

create policy responses_delete on public.checklist_responses
  for delete
  using (
    exists (
      select 1 from inspections i
      where i.id = checklist_responses.inspection_id
        and (is_assigned_inspector(i.visit_id) or (select has_any_role(array['reviewer','auditor'])))
    )
  );

-- ── inspection_items / regulation_clauses / regulations / violation_codes:
--    narrow "_admin" off SELECT — "_read"'s auth.uid() IS NOT NULL already
--    covers every admin session, so this drops a fully redundant policy.
drop policy if exists inspection_items_admin on public.inspection_items;
create policy inspection_items_admin_insert on public.inspection_items
  for insert with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy inspection_items_admin_update on public.inspection_items
  for update
  using ((select has_any_role(array['compliance_admin','form_admin'])))
  with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy inspection_items_admin_delete on public.inspection_items
  for delete using ((select has_any_role(array['compliance_admin','form_admin'])));

drop policy if exists regulation_clauses_admin on public.regulation_clauses;
create policy regulation_clauses_admin_insert on public.regulation_clauses
  for insert with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy regulation_clauses_admin_update on public.regulation_clauses
  for update
  using ((select has_any_role(array['compliance_admin','form_admin'])))
  with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy regulation_clauses_admin_delete on public.regulation_clauses
  for delete using ((select has_any_role(array['compliance_admin','form_admin'])));

drop policy if exists regulations_admin on public.regulations;
create policy regulations_admin_insert on public.regulations
  for insert with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy regulations_admin_update on public.regulations
  for update
  using ((select has_any_role(array['compliance_admin','form_admin'])))
  with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy regulations_admin_delete on public.regulations
  for delete using ((select has_any_role(array['compliance_admin','form_admin'])));

drop policy if exists violation_codes_admin on public.violation_codes;
create policy violation_codes_admin_insert on public.violation_codes
  for insert with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy violation_codes_admin_update on public.violation_codes
  for update
  using ((select has_any_role(array['compliance_admin','form_admin'])))
  with check ((select has_any_role(array['compliance_admin','form_admin'])));
create policy violation_codes_admin_delete on public.violation_codes
  for delete using ((select has_any_role(array['compliance_admin','form_admin'])));
