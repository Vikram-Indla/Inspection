-- ============================================================================
-- Migration 20260723110000 — TASK-FIELD-DAILY-BRIEFING-AUTOLOAD-001
-- Sponsor-owned deviation (verbatim, overrides Figma default): the "My daily
-- inspection briefing" card on the field dashboard must auto-generate on load
-- instead of requiring a manual button click, and must not re-call the AI
-- provider on every page view. This table is the real server-side cache that
-- makes that possible: one row per inspector per scope (daily/weekly) per
-- Riyadh calendar date. A cache hit is a plain SELECT; a miss regenerates via
-- Gemini and upserts here (see apps/web/src/lib/ai/briefing.ts).
--
-- Reuses the existing ai_suggestions/ai_events advisory log for the actual
-- generated content + human disposition trail (insight_id below); this table
-- only adds the (user_id, scope, period_date) lookup key ai_suggestions does
-- not have, so we are not duplicating the governed advisory-log pattern.
-- ============================================================================

create table if not exists public.inspector_briefing_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id),
  scope text not null check (scope in ('daily', 'weekly')),
  period_date date not null,               -- Riyadh calendar date this cache entry is valid for
  briefing_text text not null,
  insight_id uuid references public.ai_suggestions(id),
  provider_status text not null default 'configured'
    check (provider_status in ('configured', 'unavailable', 'degraded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope, period_date)
);

create index if not exists inspector_briefing_cache_lookup_idx
  on public.inspector_briefing_cache(user_id, scope, period_date);

alter table public.inspector_briefing_cache enable row level security;
revoke all on public.inspector_briefing_cache from anon;

drop policy if exists inspector_briefing_cache_read on public.inspector_briefing_cache;
create policy inspector_briefing_cache_read on public.inspector_briefing_cache
  for select using (auth.uid() = user_id);

drop policy if exists inspector_briefing_cache_insert on public.inspector_briefing_cache;
create policy inspector_briefing_cache_insert on public.inspector_briefing_cache
  for insert with check (auth.uid() = user_id);

drop policy if exists inspector_briefing_cache_update on public.inspector_briefing_cache;
create policy inspector_briefing_cache_update on public.inspector_briefing_cache
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
