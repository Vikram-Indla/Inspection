-- Planner/reviewer need read visibility of journey + geo for visit dossiers
-- (SCR-WEB-210 timeline; SB07 sync view). Write stays inspector/ops-only.
drop policy if exists geo_read on geo_events;
create policy geo_read on geo_events for select using (
  has_any_role(array['ops','auditor','reviewer','planner','leadership']) or is_assigned_inspector(visit_id));
drop policy if exists journeys_rw on journey_sessions;
create policy journeys_select on journey_sessions for select using (
  inspector_id = auth.uid() or has_any_role(array['ops','auditor','reviewer','planner','leadership']));
create policy journeys_write on journey_sessions for insert with check (inspector_id = auth.uid());
create policy journeys_update on journey_sessions for update using (inspector_id = auth.uid() or has_role('ops'));
