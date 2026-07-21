-- TASK-EXECUTION-MODULE-001 · Phase 2A — admin execution control plane audit
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §27
--
-- The /admin/execution control plane writes governed keys on engine_settings.
-- engine_settings ALREADY carries the append-only row audit trigger
-- (trg_audit_engine_settings, attached by 0002_rbac_audit.sql alongside
-- visits/inspections/regulations). This migration only verifies that guard
-- and re-attaches it if a drifted environment lost it — idempotent, nothing
-- destructive, no existing trigger is dropped or replaced.
--
-- capabilities / role_capabilities deliberately get NO trigger here: the
-- original audit_row_change definition (0002_rbac_audit.sql) dereferences
-- new.id directly, which raises on tables without an id column, and these
-- catalogue tables are keyed on text pairs. The hardened redefinition
-- (20260716210000) tolerates id-less rows, but catalogue grant/revoke is a
-- later-phase governed flow; app-level audit_events rows are the record for
-- this phase (see decision log D-004).

do $$
begin
  if not exists (
    select 1
      from pg_trigger
     where tgname = 'trg_audit_engine_settings'
       and tgrelid = 'public.engine_settings'::regclass
       and not tgisinternal
  ) then
    create trigger trg_audit_engine_settings
      after insert or update or delete on public.engine_settings
      for each row execute function public.audit_row_change();
  end if;
end $$;
