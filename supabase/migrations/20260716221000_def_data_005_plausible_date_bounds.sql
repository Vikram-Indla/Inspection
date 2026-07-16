-- Cycle 2 Wave 0 · DEF-DATA-005 — implausible far-future years (observed:
-- 2193, 2325, 2055, 2033) reached visits.window_start/window_end and
-- virtual_sessions.appointment_at because no bound existed beyond
-- end-after-start ordering. This is a data-sanity guard against corrupted
-- input, not an invented business planning-horizon policy (DEC-003 SLA
-- calendar stays open and unaffected) — the bound is deliberately wide
-- (2020-2100) so it only rejects obviously wrong years. Forward-only,
-- additive; existing rows are not touched, so this cannot fail on apply
-- unless a row is already outside the bound (in which case it is exactly
-- the corrupted data this migration exists to catch, and applying it here
-- surfaces that fact rather than silently allowing more of it).

alter table visits add constraint window_plausible_years check (
  extract(year from window_start) between 2020 and 2100
  and extract(year from window_end) between 2020 and 2100
);

alter table virtual_sessions add constraint appointment_plausible_year check (
  extract(year from appointment_at) between 2020 and 2100
);
