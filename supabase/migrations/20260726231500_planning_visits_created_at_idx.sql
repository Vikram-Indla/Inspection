-- Migration 20260726231500 — index for the Planning row-query statement timeout.
-- queryPlanningVisits (src/lib/planning/visit-list.ts) defaults to
-- .order("created_at", { ascending: false }).order("id") with no filters
-- applied (the "all" tab, no search). visits.created_at had no index, so the
-- planner had to sort the full table before the range()/limit could apply —
-- observed in production as "canceling statement due to statement timeout"
-- on the row query itself (fatal per the fail-closed contract in
-- visit-list.ts, unlike the six tab-count queries which degrade gracefully).

create index if not exists visits_created_at_idx
  on public.visits (created_at desc, id);
