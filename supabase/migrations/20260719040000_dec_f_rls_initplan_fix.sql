-- Performance-advisor remediation on the enforcement_recommendations_insert
-- policy added in 20260719010000 — same pattern the team already established
-- in 0029_cd023_rls_initplan.sql: wrap auth.uid() as (select auth.uid()) so
-- Postgres evaluates it once per statement instead of once per candidate row.
-- No behavior change — same predicate, just plan-cached.

drop policy if exists enforcement_recommendations_insert on enforcement_recommendations;
create policy enforcement_recommendations_insert on enforcement_recommendations for insert
  with check (
    has_any_role(array['inspector'])
    and recommended_by = (select auth.uid())
    and (visit_id is null or is_assigned_inspector(visit_id))
  );
