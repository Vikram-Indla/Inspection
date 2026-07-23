-- DEC-029 repair: submission_versions insert fails with PG 42883 because
-- public.capture_inspection_factory_snapshot() calls digest() (pgcrypto, in
-- the extensions schema) while its search_path is pinned to "public" only.
-- This blocked EVERY submission_versions insert environment-wide.
-- Repair: extend the function search_path to include extensions (and pg_temp),
-- matching the precedent set by mvp3_compile_inspection_package
-- (search_path=public, extensions, pg_temp). Function body is unchanged.
alter function public.capture_inspection_factory_snapshot()
  set search_path = public, extensions, pg_temp;
