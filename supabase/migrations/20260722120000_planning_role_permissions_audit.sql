-- M9 / PLN-REQ-004 · PLN-CON-013 — audit coverage for role_permissions.
--
-- The governed permission map (role_key → permission_key, resolved by
-- has_planning_capability / has_permission) gains the SAME append-only row
-- audit that user_roles has had since 0002_rbac_audit.sql (+ the id-less
-- tolerance from 0004_fix_audit_trigger.sql). grant/revoke through the M9
-- admin surface is RLS-guarded (f360_role_permissions_admin, security_admin)
-- and capability-guarded (admin.access.manage); this trigger makes every such
-- change visible in audit_events with actor + before/after state.
--
-- Strictly additive and replay-safe: no table, policy, function or existing
-- trigger is altered. audit_row_change() (0004 shape) already tolerates
-- tables without an `id` column — object_id stays NULL for the
-- (role_key, permission_key) pair, which travels in before/after state,
-- matching the EXE-ACCESS precedent (D-004).

drop trigger if exists trg_audit_role_permissions on public.role_permissions;
create trigger trg_audit_role_permissions
  after insert or update or delete on public.role_permissions
  for each row execute function audit_row_change();
