-- Forward-only field journey closure (M04-045).
-- Arrival evidence is visit-linked because check-in happens before an
-- inspections row exists. The existing visit-linked RLS policy remains the
-- authority; no inspector write permission is widened here.
alter type evidence_link add value if not exists 'arrival';
alter table evidence add column if not exists evidence_note text;
