-- SAQEEL demo data pack — 10 · today's operational activity
--
-- Synthetic, non-production.
--
-- The Operations Center scopes to TODAY, not to the 30-day analytics window, so
-- spreading activity evenly across a month left it reading "1 inspector on the
-- way, 0 executing" while /analytics reported 138 active executions. This pulls
-- a working day's worth of visits onto 2026-07-27 across the 24 curated
-- factories and gives each in-flight visit a device position, so the live map
-- shows a workforce rather than a single pin.
--
-- The date is deliberately hard-coded rather than derived from now(): a seed
-- that silently re-dates itself on every run makes two environments disagree
-- about what "today" contained.
--
-- Idempotent: the visit UPDATE converges on the same target state, and the
-- geo_events id is derived from the visit id.

begin;

-- 1 · A day's caseload, mixed across the lifecycle. Row-by-row with a handler
-- because a few legacy fixture visits violate `visits_immediate_reason_contract`
-- and would abort a set-based UPDATE.
do $$
declare r record; base timestamptz; st text; n_ok int := 0; n_skip int := 0;
begin
  for r in
    select v.id, v.execution_date,
           row_number() over (order by f.region, f.factory_code, v.id) as rn
    from public.visits v
    join public.factories f on f.id = v.factory_id
    where f.factory_code like 'F-%'
      and v.planning_status::text = 'published'
      and v.operational_state::text in ('new','prepared','on_the_way','arrived','executing')
    order by f.region, f.factory_code, v.id
    limit 84
  loop
    -- 00:15..05:45 UTC = 03:15..08:45 Riyadh. Every in-flight visit must have
    -- already opened by the time anyone looks, because /operations/live filters
    -- on `window_start <= now()` — a visit scheduled for later today is simply
    -- absent from the map, which reads as missing data rather than as pending
    -- work. The nine-hour window keeps them open for the rest of the day.
    base := timestamptz '2026-07-27 00:15:00+00' + make_interval(mins => ((r.rn * 23) % 330)::int);
    st := case
      when (r.rn % 12) < 3  then 'on_the_way'
      when (r.rn % 12) < 6  then 'arrived'
      when (r.rn % 12) < 10 then 'executing'
      when (r.rn % 12) = 10 then 'submitted'
      else                       'prepared'
    end;
    begin
      update public.visits
      set window_start      = base,
          window_end        = base + interval '5 hours',
          execution_date    = case when r.execution_date is null then null else date '2026-07-27' end,
          operational_state = st::public.operational_state
      where id = r.id;
      n_ok := n_ok + 1;
    exception when others then
      n_skip := n_skip + 1;
    end;
  end loop;
  raise notice 'today activity: % ok, % skipped', n_ok, n_skip;
end $$;

-- 2 · One device position per in-flight visit. An inspector still travelling
-- sits a few kilometres out with a moving speed and no geofence verdict; one on
-- site sits inside the fence with handheld accuracy and zero speed.
with tv as (
  select v.id as vid, v.operational_state::text as os,
         f.official_lat as lat, f.official_lng as lng,
         row_number() over (order by v.id) as rn
  from public.visits v
  join public.factories f on f.id = v.factory_id
  where v.window_start >= date '2026-07-27' and v.window_start < date '2026-07-28'
    and v.operational_state::text in ('on_the_way','arrived','executing','submitted')
    and f.official_lat is not null
)
insert into public.geo_events
  (id, visit_id, kind, observed_lat, observed_lng, accuracy_m, geofence_result,
   occurred_at, speed_mps, heading_deg, device_id, gis_version, source)
select md5(tv.vid::text || ':today-position')::uuid,
       tv.vid,
       case when tv.os = 'on_the_way' then 'telemetry' else 'checkin' end,
       tv.lat + case when tv.os = 'on_the_way' then ((tv.rn % 7) - 3) * 0.011 else ((tv.rn % 5) - 2) * 0.0002 end,
       tv.lng + case when tv.os = 'on_the_way' then ((tv.rn % 5) - 2) * 0.013 else ((tv.rn % 7) - 3) * 0.0002 end,
       case when tv.os = 'on_the_way' then 18 + (tv.rn % 12) else 6 + (tv.rn % 5) end,
       case when tv.os = 'on_the_way' then null else 'inside'::public.geofence_result end,
       timestamptz '2026-07-27 05:30:00+00' + make_interval(mins => ((tv.rn * 13) % 210)::int),
       case when tv.os = 'on_the_way' then 14 + (tv.rn % 9) else 0 end,
       (tv.rn * 37) % 360,
       'ipad-' || lpad(((tv.rn % 24) + 1)::text, 3, '0'),
       'ksa-gis-2026.07',
       'device'
from tv
on conflict (id) do nothing;

commit;
