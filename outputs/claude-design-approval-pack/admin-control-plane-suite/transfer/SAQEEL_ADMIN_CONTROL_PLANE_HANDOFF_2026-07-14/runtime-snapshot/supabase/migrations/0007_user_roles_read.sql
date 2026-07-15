-- Planners/ops need to enumerate inspectors for assignment (ENG-05);
-- security admin manages; others see own grants only.
create policy user_roles_read on user_roles for select using (
  user_id = auth.uid() or has_any_role(array['planner','ops','security_admin','reviewer','auditor']));
create policy user_roles_admin on user_roles for insert with check (has_role('security_admin'));
