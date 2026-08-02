-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- reopening_notice_line_type_guard() is a trigger function and must never be
-- reachable as a PostgREST RPC. Supabase advisors 0028/0029 flagged it as
-- executable by anon and authenticated. The trigger itself fires under the
-- table owner and needs no EXECUTE grant, so revoking is non-breaking.
revoke execute on function public.reopening_notice_line_type_guard() from public, anon, authenticated;
