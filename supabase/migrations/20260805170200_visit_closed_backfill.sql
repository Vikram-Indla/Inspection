-- CC-VISIT-CLOSED-STATE-20260805 (part 3 — backfill)
--
-- The new trigger (20260805170100) only reacts to a future transition into
-- 'approved'. Every inspection that reached 'approved' before this rule
-- existed left its visit stranded, including the CC's own named case:
-- inspection db2450d2 (Madinah Dates Processing Co.), visit b7eec84d.
-- Live-verified before writing this: 7 approved inspections had a visit not
-- in 'closed'. One-time data correction, same rule the trigger enforces
-- going forward — approval closes the visit.

update public.visits v
   set operational_state = 'closed'
  from public.inspections i
 where i.visit_id = v.id
   and i.status = 'approved'
   and v.operational_state <> 'closed';
