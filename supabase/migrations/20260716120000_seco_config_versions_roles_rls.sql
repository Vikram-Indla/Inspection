-- ============================================================================
-- Migration 20260716120000 — TASK-G11-G12-RELEASE-001 (G11 hardening)
-- MVP1-SEC-001..006 · RBAC-001..014 · SCR-ADM-001..090
--
-- Closes two Row Level Security gaps found during the access-matrix
-- verification pass. Neither introduces new policy semantics: both encode
-- authorization the codebase already asserts (config_versions policies authored
-- in 0002_rbac_audit.sql but never activated; roles catalogue is read-only in
-- the app and seed-managed).
--
-- GAP 1 — config_versions
--   0002_rbac_audit.sql created config_read / config_write / config_update on
--   public.config_versions but never ran `alter table ... enable row level
--   security`, so all three policies are INERT. With RLS disabled the table
--   falls back to default grants: any authenticated (potentially anon) caller
--   could read, insert and update workflow/engine configuration versions via
--   PostgREST, bypassing the intended admin-only maker/checker path. The app
--   guard (requireConfigurationWriter / workflow actions) only protects the UI
--   path, not the REST surface. Enabling RLS activates the existing policies.
--
-- GAP 2 — roles (role catalogue: role_key, title, is_admin)
--   No RLS, no policies. Readable and tamperable via PostgREST by any caller.
--   The app only ever SELECTs this table (admin/access); it is populated by
--   seed migrations running as the table owner (RLS-exempt). We enable RLS,
--   allow authenticated read, and deliberately create NO write policy so REST
--   writes are denied by default while seeds/migrations remain unaffected.
--
-- Forward-only. Idempotent. No data mutation. No published-row immutability
-- trigger is altered. Contract/negative test: supabase/tests/0029_config_versions_roles_rls_probe.sql
-- ============================================================================

-- ---------- GAP 1: activate config_versions RLS (policies already exist) -----
alter table public.config_versions enable row level security;

-- Re-assert the authored policies idempotently so this migration is
-- self-contained even if applied against a branch where 0002 differs. Roles are
-- copied verbatim from 0002_rbac_audit.sql (config_read/config_write/config_update).
drop policy if exists config_read on public.config_versions;
create policy config_read on public.config_versions
  for select using (auth.uid() is not null);

drop policy if exists config_write on public.config_versions;
create policy config_write on public.config_versions
  for insert with check (
    has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));

drop policy if exists config_update on public.config_versions;
create policy config_update on public.config_versions
  for update using (
    has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));
-- No delete policy: config version history is retained (deny delete by default).

-- ---------- GAP 2: roles catalogue — authenticated read, no REST write -------
alter table public.roles enable row level security;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select using (auth.uid() is not null);
-- Intentionally no insert/update/delete policy. The catalogue is seed-managed
-- by migrations (table owner bypasses RLS); no application path writes it, so
-- every REST write is denied by default (RBAC-001).
