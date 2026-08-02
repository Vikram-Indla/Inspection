-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

create index if not exists visits_created_at_idx
  on public.visits (created_at desc, id);
