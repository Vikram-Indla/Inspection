-- ============================================================================
-- Migration 20260717230000 — TASK-MVP2-M2-05-AUDIT-REPLAY / drift reconciliation
-- Fixes an MVP1 regression exposed on staging by the M2-05 semantic trigger.
--
-- ROOT CAUSE: source 0001_foundation.sql defines
--   submission_versions.acknowledgement jsonb   (DEC-009 signature/refusal ref)
-- but the staging database `submission_versions` table had DRIFTED and was
-- missing this column. The M2-05 trigger emit_mvp2_m2_05_semantic_event (applied
-- in 20260717150000) correctly references new.acknowledgement in its
-- submission_versions branch; on the drifted staging table this raised
-- 42703 "record new has no field acknowledgement", aborting the atomic
-- publishSingleVisit (CD-022) transaction — a live MVP1 publish regression.
--
-- FIX: additively realign staging to the accepted source schema. Idempotent;
-- no data loss; no accepted object dropped or weakened. Existing rows get NULL
-- (unsigned), matching the source default. This restores MVP1 publish and lets
-- the M2-05 acknowledgement semantic fact record as designed.
-- ============================================================================

alter table public.submission_versions
  add column if not exists acknowledgement jsonb;

comment on column public.submission_versions.acknowledgement is
  'DEC-009 signature image ref/name/ts/geotag or refusal (source 0001; re-added after staging drift 20260717230000).';
