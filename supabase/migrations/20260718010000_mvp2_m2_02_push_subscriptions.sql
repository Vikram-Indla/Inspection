-- ============================================================================
-- Migration 20260718010000 — TASK-MVP2-M2-02 notification delivery, push channel
--
-- Web Push (VAPID) subscription storage. A user may have multiple subscriptions
-- (one per installed device/browser). Endpoint uniquely identifies a browser's
-- push registration; RLS scopes reads/writes to the owning user only — a
-- subscription is device credential material, never cross-user readable.
--
-- Forward-only, additive. No accepted object touched. Runtime DB_VALIDATION_PENDING
-- until applied. Rollback: drop table (no data dependency from accepted objects).
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;

-- A user manages only their own subscriptions.
drop policy if exists push_subscriptions_own_select on public.push_subscriptions;
create policy push_subscriptions_own_select on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists push_subscriptions_own_insert on public.push_subscriptions;
create policy push_subscriptions_own_insert on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists push_subscriptions_own_delete on public.push_subscriptions;
create policy push_subscriptions_own_delete on public.push_subscriptions
  for delete using (auth.uid() = user_id);
-- No update policy: a subscription is replaced (delete+insert on endpoint change),
-- never mutated in place.

-- Server-side delivery read across users. This repo has NO service-role client
-- anywhere (every server action runs as the authenticated actor under RLS via
-- supabase-server.ts) — a push subscription's endpoint/p256dh/auth are device
-- push CREDENTIALS (Web Push spec), not visible content, so this function must
-- prove authorization itself rather than trust the caller's p_user_id blindly
-- (an open grant to `authenticated` would let any user harvest any other
-- user's push credentials). Restricted to the same staff roles that already
-- legitimately trigger cross-user notifications today (see visits/actions.ts).
create or replace function public.get_push_subscriptions_for_user(p_user_id uuid)
returns table(endpoint text, p256dh text, auth text)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not has_any_role(array['planner','ops','workflow_admin','compliance_admin','security_admin','leadership']) then
    raise exception 'not authorized to resolve push subscriptions for another user' using errcode = '42501';
  end if;
  return query select ps.endpoint, ps.p256dh, ps.auth from public.push_subscriptions ps where ps.user_id = p_user_id;
end $$;
revoke all on function public.get_push_subscriptions_for_user(uuid) from public, anon;
grant execute on function public.get_push_subscriptions_for_user(uuid) to authenticated;
