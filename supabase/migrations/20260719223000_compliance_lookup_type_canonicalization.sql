-- RECONSTRUCTION NOTICE — this is NOT the literal applied SQL.
-- schema_migrations.statements for version 20260719223000 was an empty
-- array (no statement text captured at all — applied via the Supabase
-- Management API). This file is reconstructed from live schema
-- introspection against project iiozvqntawxfwbgffzqu on 2026-08-02.
--
-- Evidence used: public.compliance_lookup_values carries a trigger named
-- trg_guard_compliance_lookup_value in addition to trg_compliance_lookup_value_guard
-- — both BEFORE DELETE OR UPDATE, both executing guard_compliance_lookup_value().
-- This duplicate is consistent with a follow-up migration that re-created
-- the guard trigger under a new name (e.g. as part of normalizing/renaming
-- compliance_lookup_types.lookup_type_key values to a canonical slug format)
-- without dropping the original trigger — i.e. this migration is itself the
-- likely SOURCE of that drift. No stronger signal (no check constraint on
-- lookup_type_key exists live, no seed rows remain in compliance_lookup_types
-- to compare against) was recoverable to pin down the exact canonicalization
-- logic. Treat this file as a plausible reconstruction, not verified fact —
-- if a real fix is later scoped, re-derive from any surviving admin UI code
-- under apps/web/src/app/(app)/admin that writes lookup_type_key values,
-- and consider dropping the duplicate trigger as unwanted drift rather than
-- reproducing it. Added 2026-08-02 during migration reconciliation.

-- Re-assert the guard trigger under a normalized name (superseding-name
-- migration artifact); left as trg_guard_compliance_lookup_value to match
-- what is actually live today so this file matches the current database
-- rather than inventing a cleanup that was never applied.
drop trigger if exists trg_guard_compliance_lookup_value on public.compliance_lookup_values;

create trigger trg_guard_compliance_lookup_value
  before delete or update on public.compliance_lookup_values
  for each row execute function public.guard_compliance_lookup_value();
