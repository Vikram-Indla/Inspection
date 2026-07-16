-- CD-030 DEC-012 audit follow-up (CODEX_AUDIT_CD-030_2026-07-15_R2.md, P1 #2):
-- reviews.decision was only allow-listed at the app layer (actions.ts decide()).
-- FLD-REV-002 already documents the enum (0001_foundation.sql:274); this closes
-- the gap at the database boundary so a write bypassing the app action cannot
-- persist a value the Version Comparison / decision UI does not understand.
alter table reviews
  add constraint reviews_decision_check
  check (decision is null or decision in ('approve', 'return', 'reject'));
