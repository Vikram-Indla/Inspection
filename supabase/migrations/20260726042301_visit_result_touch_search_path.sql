-- ============================================================================
-- Harden visit_result_touch() against a role-mutable search_path.
--
-- The Supabase security linter flagged public.visit_result_touch with
-- 0011_function_search_path_mutable after 20260726042050_visit_result_reports
-- was applied. The function body only assigns now() to new.updated_at, and
-- now() resolves from pg_catalog, which is always implicitly in scope — so
-- pinning search_path to the empty string is safe and removes the warning.
--
-- Corrective forward migration rather than an edit to the applied file:
-- 20260726042050 is already recorded in the remote ledger.
--
-- Additive only. Behaviour is unchanged.
-- ============================================================================

alter function public.visit_result_touch() set search_path = '';
