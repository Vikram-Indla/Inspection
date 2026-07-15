-- Repair for a partially-applied field-arrival evidence migration.
-- The arrival enum is already present in the shared project, but the
-- visit-linked evidence note column is not. Keep this forward-only and
-- idempotent so an approved deployment can safely run it whether the earlier
-- migration was fully or partially applied.
alter table evidence add column if not exists evidence_note text;

