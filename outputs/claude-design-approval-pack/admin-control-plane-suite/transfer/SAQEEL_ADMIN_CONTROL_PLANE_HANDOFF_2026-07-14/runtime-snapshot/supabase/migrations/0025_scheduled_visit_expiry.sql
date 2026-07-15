-- Migration 0025 — visit expiry runs on a schedule, not just opportunistically.
--
-- expire_lapsed_visits() (0024_fix2_ops_planning_visits.sql) is correct, atomic,
-- and audited, but only fires when a page happens to call it — a visit whose
-- window lapses while nobody loads /visits, /visits/calendar, /visits/workload,
-- or a plan detail page sits shown as "published" indefinitely. Excel row
-- "Automatic Visit Expiry" / "Expired Visit Management" names a Scheduler
-- Service as a dependency; none existed.
--
-- Gotcha this migration has to work around: expire_lapsed_visits()'s WHERE
-- clause scopes which visits a given PAGE LOAD is allowed to expire via
-- auth.uid()/has_any_role() — appropriate for that caller, but auth.uid()
-- resolves to NULL under pg_cron (no user session), so naively scheduling
-- the existing function would match zero rows and silently expire nothing.
-- A scheduled sweep has no "caller" to scope by — it should cover every
-- lapsed visit, which is exactly what the per-page-load version deliberately
-- does NOT do on its own. So this splits the shared UPDATE+notify logic into
-- an internal core, called by two entry points: the existing per-caller
-- function (untouched, still used by pages) and a new unscoped sweep that
-- pg_cron invokes directly, with no user-authorization filter, because pg_cron
-- runs as the system, not on behalf of any single user.

create extension if not exists pg_cron with schema extensions;

create or replace function _expire_lapsed_visits_core(p_scope_sql text) returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  expired_ids uuid[];
begin
  execute format($f$
    with lapsed as (
      update visits v
         set planning_status = 'expired'
       where v.planning_status = 'published'
         and v.window_end < now()
         and not exists (
           select 1 from inspections i
            where i.visit_id = v.id and i.status <> 'not_started')
         and (%s)
      returning v.id)
    select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
  $f$, p_scope_sql) into expired_ids;

  if array_length(expired_ids, 1) is null then
    return 0;
  end if;

  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', a.inspector_id,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end),
         'inapp', 'delivered', now()
    from visits v
    join assignments a on a.visit_id = v.id
   where v.id = any(expired_ids)
     and a.inspector_id is not null;

  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', p.created_by,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end, 'planner', true),
         'inapp', 'delivered', now()
    from visits v
    join visit_plans p on p.id = v.visit_plan_id
   where v.id = any(expired_ids)
     and p.created_by is not null;

  return array_length(expired_ids, 1);
end;
$$;
revoke all on function _expire_lapsed_visits_core(text) from public;

-- Per-page-load entry point — same signature and scoping behavior as before
-- (own assignments, or full coverage for ops/planner callers).
create or replace function expire_lapsed_visits() returns integer
language sql volatile security definer set search_path = public as $$
  select _expire_lapsed_visits_core(
    $sql$exists (select 1 from assignments a where a.visit_id = v.id and a.inspector_id = auth.uid())
         or has_any_role(array['ops','planner'])$sql$
  );
$$;
revoke all on function expire_lapsed_visits() from public;
grant execute on function expire_lapsed_visits() to authenticated;

-- Scheduled entry point — no caller to scope by, so it covers every lapsed
-- visit. Not exposed to `authenticated`; only pg_cron (running as the
-- database owner) calls this.
create or replace function expire_lapsed_visits_scheduled() returns integer
language sql volatile security definer set search_path = public as $$
  select _expire_lapsed_visits_core('true');
$$;
revoke all on function expire_lapsed_visits_scheduled() from public, authenticated;

select cron.schedule(
  'expire-lapsed-visits',
  '*/15 * * * *',
  $$select expire_lapsed_visits_scheduled();$$
);
