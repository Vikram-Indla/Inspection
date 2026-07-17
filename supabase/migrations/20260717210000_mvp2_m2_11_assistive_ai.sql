-- ============================================================================
-- Migration 20260717210000 — TASK-MVP2-M2-11-ASSISTIVE-AI-001
-- MVP2-REQ-0056..0066, 0173..0175, 0194..0196, 0217..0223, 0123, 0193
-- Design CD-048 R2 (ai_dockets_v1, default OFF)
--
-- Additive AI-suggestion foundation. ai_events is append-only. Every suggestion
-- requires an explicit HUMAN disposition (proposed → accepted/rejected/superseded);
-- AI never writes a business decision and never generates legal source text — the
-- adapter is fail-closed when credentials/config are absent (provider_status).
--
-- Flag off = zero behaviour. No decide()/publication/selection/committee path is
-- altered. Forward-only, additive. Runtime DB_VALIDATION_PENDING (+ provider held).
-- ============================================================================

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  surface text not null,                  -- planning|inspection|review|regulation|package|operations
  target_type text,
  target_ref uuid,
  suggestion jsonb not null default '{}'::jsonb,   -- advisory content only (never legal text)
  disposition text not null default 'proposed'
    check (disposition in ('proposed','accepted','rejected','superseded')),
  provider_status text not null default 'unavailable'
    check (provider_status in ('configured','unavailable','degraded','failed','retrying')),
  disposed_by uuid references public.profiles(user_id),
  disposed_reason text,
  disposed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_suggestions_surface_idx on public.ai_suggestions(surface, disposition);

create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid references public.ai_suggestions(id),
  event_type text not null,               -- proposed|disposed|provider_state_changed
  actor uuid references public.profiles(user_id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.block_ai_event_mutation() returns trigger
language plpgsql as $$
begin raise exception 'ai_events is append-only' using errcode = '42501'; end $$;

do $$
declare t text;
begin
  foreach t in array array['ai_suggestions','ai_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($p$create policy %I_write on public.%I for insert with check (auth.uid() is not null)$p$, t, t);
  end loop;
  -- disposition update allowed on suggestions (human disposition); events append-only
  execute 'drop policy if exists ai_suggestions_update on public.ai_suggestions';
  execute $p$create policy ai_suggestions_update on public.ai_suggestions for update using (auth.uid() is not null) with check (auth.uid() is not null)$p$;
  execute 'drop trigger if exists trg_ai_events_append_only on public.ai_events';
  execute 'create trigger trg_ai_events_append_only before update or delete on public.ai_events for each row execute function public.block_ai_event_mutation()';
end $$;
