-- display_names(uuid[]) — governed id→name resolver so any authenticated role can
-- render a user's display name without reading the profiles row directly. profiles
-- RLS (profiles_self) only lets self / security_admin / ops / planner / supervisor
-- read another user's row, which left admins showing raw UUIDs / "Unknown user".
-- This SECURITY DEFINER function exposes ONLY (user_id, full_name) — no email,
-- region or org_scope — without weakening profiles RLS.

create or replace function public.display_names(p_user_ids uuid[])
returns table(user_id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.full_name
  from public.profiles p
  where p.user_id = any(p_user_ids) and p.full_name is not null
$$;

revoke all on function public.display_names(uuid[]) from public, anon;
grant execute on function public.display_names(uuid[]) to authenticated;
