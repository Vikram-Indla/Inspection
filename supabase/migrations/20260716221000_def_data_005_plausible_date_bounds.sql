-- Cycle 2 Wave 0 · DEF-DATA-005 — implausible far-future years (observed:
-- 2193, 2325, 2055, 2033) reached visits.window_start/window_end and
-- virtual_sessions.appointment_at because no bound existed beyond
-- end-after-start ordering. This is a data-sanity guard against corrupted
-- input, not an invented business planning-horizon policy (DEC-003 SLA
-- calendar stays open and unaffected) — the bound is deliberately wide
-- (2020-2100) so it only rejects obviously wrong years.
--
-- NOT VALID: a live probe against iiozvqntawxfwbgffzqu found 503 existing
-- visits rows already outside this bound (years into the 2100s-2300s) — far
-- more than the 4 examples in the original defect report. Bulk-repairing or
-- deleting 503 production rows is not authorized by this task and is not
-- done here. NOT VALID enforces the check on every new insert/update from
-- this point forward (closing the defect going forward) without touching or
-- blocking on the pre-existing bad rows. VALIDATE CONSTRAINT (a separate,
-- explicitly authorized follow-up) is required to fully close this out.

alter table visits add constraint window_plausible_years check (
  extract(year from window_start) between 2020 and 2100
  and extract(year from window_end) between 2020 and 2100
) not valid;

alter table virtual_sessions add constraint appointment_plausible_year check (
  extract(year from appointment_at) between 2020 and 2100
) not valid;
