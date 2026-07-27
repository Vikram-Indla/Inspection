-- SAQEEL demo data pack — 08 · analytics window
--
-- Synthetic, non-production.
--
-- Two problems made /analytics and /dashboard read as dead even though the
-- database held 1,491 visits:
--
--   1. 1,245 visits carried nonsense window_start values — up to the year 2381
--      — left behind by repeated automated test runs. The analytics read model
--      (public.analytics_metric_snapshot) scopes every metric to
--      `window_start between p_period_from and p_period_to`, and the page's
--      default period is the last 30 days, so those visits were invisible to
--      every tile while still polluting the planning and execution lists.
--
--   2. Only 36 checklist responses hung off approved inspections inside that
--      window, and all but one were compliant, so the compliance distribution
--      and the compliance percentage carried no signal.
--
-- Both are repaired deterministically below: the same input rows always land on
-- the same dates and the same responses, so this file is safe to re-run.

begin;

-- 1 · Re-date the out-of-range visits across 2026-05-15 .. 2026-08-25, weighted
-- so roughly 60% land inside the rolling 30-day analytics window ending
-- 2026-07-27. Duration is preserved; created_at is pulled back two weeks so
-- planning history still precedes the visit window; execution_date follows the
-- new window because `visits_execution_date_in_window` requires it.
--
-- Row-by-row with an exception handler on purpose: a handful of legacy
-- Playwright fixture rows already violate `visits_immediate_reason_contract`
-- and would abort a set-based UPDATE. Those rows are skipped, not repaired —
-- cleaning poisoned fixtures is a separate concern.
do $$
declare r record; base timestamptz; n_ok int := 0; n_skip int := 0;
begin
  for r in
    select id, (window_end - window_start) as dur, execution_date,
           row_number() over (order by id) as rn
    from public.visits
    where window_start > timestamptz '2027-01-01'
  loop
    base := case when (r.rn % 10) < 6
      then timestamptz '2026-06-28 05:00:00+00' + make_interval(days => ((r.rn * 7) % 30)::int, hours => (r.rn % 9)::int)
      else timestamptz '2026-05-15 05:00:00+00' + make_interval(days => ((r.rn * 13) % 100)::int, hours => (r.rn % 9)::int)
    end;
    begin
      update public.visits
      set window_start   = base,
          window_end     = base + r.dur,
          created_at     = base - interval '14 days',
          execution_date = case when r.execution_date is null then null else base::date end
      where id = r.id;
      n_ok := n_ok + 1;
    exception when others then
      n_skip := n_skip + 1;
    end;
  end loop;
  raise notice 'visits re-dated: % ok, % skipped', n_ok, n_skip;
end $$;

-- 2 · Give every inspection on an in-window visit a full checklist: up to 12
-- items each, mixed roughly 80% compliant / 18% non-compliant / 2% N/A. The
-- mix is derived from a hash of the inspection id and the item's ordinal, so it
-- varies per inspection but never changes between runs. The id is likewise
-- derived from (inspection, item), which makes ON CONFLICT DO NOTHING the whole
-- idempotency story.
--
-- INSERT only. `trg_guard_resp` blocks UPDATE and DELETE on responses belonging
-- to a submitted inspection, and that guard is left intact.
with tgt as (
  select i.id as inspection_id,
         (('x' || substr(md5(i.id::text), 1, 4))::bit(16)::int) as seed
  from public.inspections i
  join public.visits v on v.id = i.visit_id
  where v.window_start between timestamptz '2026-06-28' and timestamptz '2026-07-27 23:59:59+00'
),
it as (
  select id, row_number() over (order by code, id) as rn
  from public.inspection_items
  where active is not false
),
pairs as (
  select t.inspection_id, t.seed, it.id as item_id, it.rn,
         row_number() over (partition by t.inspection_id order by it.rn) as k
  from tgt t cross join it
)
insert into public.checklist_responses (id, inspection_id, item_id, response, is_complete, updated_at)
select md5(p.inspection_id::text || p.item_id::text)::uuid,
       p.inspection_id,
       p.item_id,
       case ((p.rn * 7 + p.seed) % 10)
         when 0 then jsonb_build_object('value', 'non_compliant', 'note', 'مخالفة موثقة أثناء الجولة الميدانية — documented during the site walk')
         when 3 then jsonb_build_object('value', 'non_compliant', 'note', 'لم تُستوفَ متطلبات السلامة عند نقطة الفحص — safety requirement not met at the checkpoint')
         when 7 then jsonb_build_object('value', 'na',            'note', 'لا ينطبق على نشاط المنشأة — not applicable to this activity class')
         else        jsonb_build_object('value', 'compliant')
       end,
       true,
       now()
from pairs p
where p.k <= 12
on conflict (inspection_id, item_id) do nothing;

commit;
