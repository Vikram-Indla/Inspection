-- Compliance admin owns the Access & Roles screen (SCR-ADM roster) but was
-- omitted from user_roles_read (0007), so /admin/access rendered empty for
-- that role despite RLS otherwise working. Add it to the read policy.
drop policy if exists user_roles_read on user_roles;
create policy user_roles_read on user_roles for select using (
  user_id = auth.uid() or has_any_role(array['planner','ops','security_admin','reviewer','auditor','compliance_admin']));
